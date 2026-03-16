const express = require("express");
const rateLimit = require("express-rate-limit");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");

const app = express();
const PORT = process.env.PORT || 3001;
const DB_PATH = path.join(__dirname, "db.json");

// CORS — allow frontend on localhost
const ALLOWED_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && origin.match(/^http:\/\/localhost:\d+$/)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header("Access-Control-Allow-Headers", "Content-Type");
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
app.get("/healthz", (req, res) => {
  try {
    readDb();
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
});

// Write operations: 10 requests per minute per IP
const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many write requests. Please try again later." },
});

app.use(globalLimiter);

// --- Helpers ---

function readDb() {
  return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
}

function writeDb(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// --- Routes ---

/**
 * @openapi
 * /contacts:
 *   get:
 *     summary: List all contacts
 *     tags: [Contacts]
 *     responses:
 *       200:
 *         description: Array of contacts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Contact'
 */
// GET /contacts
app.get("/contacts", (req, res) => {
  const db = readDb();
  res.json(db.contacts);
});

/**
 * @openapi
 * /contacts/{id}:
 *   get:
 *     summary: Get a contact by ID
 *     tags: [Contacts]
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
app.get("/contacts/:id", (req, res) => {
  const db = readDb();
  const contact = db.contacts.find((c) => String(c.id) === req.params.id);
  if (!contact) return res.status(404).json({ error: "Contact not found" });
  res.json(contact);
});

/**
 * @openapi
 * /contacts:
 *   post:
 *     summary: Create a new contact
 *     tags: [Contacts]
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
app.post("/contacts", writeLimiter, (req, res) => {
  const { name, phone } = req.body;

  if (
    !name ||
    !phone ||
    typeof name !== "string" ||
    typeof phone !== "string"
  ) {
    return res.status(400).json({ error: "Name and phone are required" });
  }

  const db = readDb();
  const id = crypto.randomUUID();
  const contact = { id, name, phone };
  db.contacts.push(contact);
  writeDb(db);
  res.status(201).json(contact);
});

/**
 * @openapi
 * /contacts/{id}:
 *   delete:
 *     summary: Delete a contact
 *     tags: [Contacts]
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
app.delete("/contacts/:id", writeLimiter, (req, res) => {
  const db = readDb();
  const index = db.contacts.findIndex((c) => String(c.id) === req.params.id);
  if (index === -1) return res.status(404).json({ error: "Contact not found" });
  db.contacts.splice(index, 1);
  writeDb(db);
  res.json({});
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(
      `Rate limits: 100 req/15min (global), 10 writes/min (POST/DELETE)`,
    );
  });
}

module.exports = app;
