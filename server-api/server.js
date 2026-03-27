const express = require("express");
const rateLimit = require("express-rate-limit");
const { Pool } = require("pg");
const admin = require("firebase-admin");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const Redis = require("ioredis");
const { RedisStore } = require("rate-limit-redis");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3001;

// --- Redis ---
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");
redis.on("connect", () => console.log("Redis connected"));
redis.on("error", (err) => console.error("Redis error:", err.message));

// --- Database ---
const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    "postgresql://contacts_user:contacts_pass@localhost:5432/contacts",
});

// --- Firebase Admin ---
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID || "learn-oauth-25",
  });
}

// --- Auth Middleware (with Redis token cache) ---
async function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const token = header.split("Bearer ")[1];
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const cacheKey = `auth:token:${tokenHash}`;

    const cached = await redis.get(cacheKey);
    if (cached) {
      req.userId = JSON.parse(cached).uid;
      return next();
    }

    const decoded = await admin.auth().verifyIdToken(token);
    await redis.set(cacheKey, JSON.stringify({ uid: decoded.uid }), "EX", 300);
    req.userId = decoded.uid;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

// CORS — allow frontend on localhost
const ALLOWED_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && origin.match(/^http:\/\/localhost:\d+$/)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// Body parser with size limit (prevents payload flooding — STRIDE D-4)
app.use(express.json({ limit: "10kb" }));

// --- Swagger / OpenAPI ---
const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Contacts API",
      version: "1.0.0",
      description: "REST API for managing contacts",
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        Contact: {
          type: "object",
          required: ["name", "phone"],
          properties: {
            id: { type: "string", format: "uuid", readOnly: true },
            name: { type: "string", minLength: 2, example: "Jane Doe" },
            phone: {
              type: "string",
              minLength: 10,
              pattern: "^[\\d\\s()+-]+$",
              example: "(555) 123-4567",
            },
          },
        },
        Error: {
          type: "object",
          properties: {
            error: { type: "string" },
          },
        },
      },
    },
  },
  apis: ["./server.js"],
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @openapi
 * /api-docs:
 *   get:
 *     summary: OpenAPI documentation UI
 *     responses:
 *       200:
 *         description: Swagger UI
 */

// --- Health check (before rate limiters) ---

/**
 * @openapi
 * /healthz:
 *   get:
 *     summary: Health check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *       503:
 *         description: Service unhealthy
 */
app.get("/healthz", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok" });
  } catch {
    res.status(503).json({ status: "error" });
  }
});

// --- Rate Limiters ---

// Global: 100 requests per 15 minutes per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args),
    prefix: "rl:global:",
  }),
});

// Write operations: 10 requests per minute per IP
const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many write requests. Please try again later." },
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args),
    prefix: "rl:write:",
  }),
});

app.use(globalLimiter);

// --- Routes (all protected by authMiddleware) ---

/**
 * @openapi
 * /contacts:
 *   get:
 *     summary: List all contacts for the authenticated user
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Array of contacts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Contact'
 *       401:
 *         description: Unauthorized
 */
// GET /contacts
app.get("/contacts", authMiddleware, async (req, res) => {
  const cacheKey = `cache:contacts:${req.userId}`;
  const cached = await redis.get(cacheKey);
  if (cached) return res.json(JSON.parse(cached));

  const { rows } = await pool.query(
    "SELECT id, name, phone FROM contacts WHERE user_id = $1 ORDER BY created_at DESC",
    [req.userId],
  );
  await redis.set(cacheKey, JSON.stringify(rows), "EX", 60);
  res.json(rows);
});

/**
 * @openapi
 * /contacts/{id}:
 *   get:
 *     summary: Get a contact by ID
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Contact found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Contact'
 *       404:
 *         description: Contact not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// GET /contacts/:id
app.get("/contacts/:id", authMiddleware, async (req, res) => {
  const cacheKey = `cache:contact:${req.userId}:${req.params.id}`;
  const cached = await redis.get(cacheKey);
  if (cached) return res.json(JSON.parse(cached));

  const { rows } = await pool.query(
    "SELECT id, name, phone FROM contacts WHERE id = $1 AND user_id = $2",
    [req.params.id, req.userId],
  );
  if (rows.length === 0)
    return res.status(404).json({ error: "Contact not found" });
  await redis.set(cacheKey, JSON.stringify(rows[0]), "EX", 60);
  res.json(rows[0]);
});

/**
 * @openapi
 * /contacts:
 *   post:
 *     summary: Create a new contact
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, phone]
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 example: Jane Doe
 *               phone:
 *                 type: string
 *                 minLength: 10
 *                 example: "(555) 123-4567"
 *     responses:
 *       201:
 *         description: Contact created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Contact'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Rate limit exceeded
 */
// POST /contacts (rate-limited)
app.post("/contacts", authMiddleware, writeLimiter, async (req, res) => {
  const { name, phone } = req.body;

  if (
    !name ||
    !phone ||
    typeof name !== "string" ||
    typeof phone !== "string"
  ) {
    return res.status(400).json({ error: "Name and phone are required" });
  }

  const { rows } = await pool.query(
    "INSERT INTO contacts (user_id, name, phone) VALUES ($1, $2, $3) RETURNING id, name, phone",
    [req.userId, name, phone],
  );
  // Invalidate contacts list cache for this user
  await redis.del(`cache:contacts:${req.userId}`);
  res.status(201).json(rows[0]);
});

/**
 * @openapi
 * /contacts/{id}:
 *   delete:
 *     summary: Delete a contact
 *     tags: [Contacts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Contact deleted
 *       404:
 *         description: Contact not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Rate limit exceeded
 */
// DELETE /contacts/:id (rate-limited)
app.delete("/contacts/:id", authMiddleware, writeLimiter, async (req, res) => {
  const { rowCount } = await pool.query(
    "DELETE FROM contacts WHERE id = $1 AND user_id = $2",
    [req.params.id, req.userId],
  );
  if (rowCount === 0)
    return res.status(404).json({ error: "Contact not found" });
  // Invalidate both list and detail caches for this user
  await redis.del(`cache:contacts:${req.userId}`);
  await redis.del(`cache:contact:${req.userId}:${req.params.id}`);
  res.json({});
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(
      `Rate limits: 100 req/15min (global), 10 writes/min (POST/DELETE)`,
    );
    console.log(`Database: PostgreSQL`);
    console.log(`Auth: Firebase Admin SDK`);
  });
}

module.exports = { app, pool };
