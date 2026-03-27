const express = require("express");
const pool = require("./config/db");
const corsMiddleware = require("./middleware/cors");
const { globalLimiter } = require("./middleware/rateLimiter");
const setupSwagger = require("./config/swagger");
const healthRouter = require("./routes/health");
const contactsRouter = require("./routes/contacts");

const app = express();
const PORT = process.env.PORT || 3001;

// --- Middleware ---
app.use(corsMiddleware);
app.use(express.json({ limit: "10kb" }));

// --- Swagger ---
setupSwagger(app);

/**
 * @openapi
 * /api-docs:
 *   get:
 *     summary: OpenAPI documentation UI
 *     responses:
 *       200:
 *         description: Swagger UI
 */

// --- Health (before rate limiter) ---
app.use("/healthz", healthRouter);

// --- Rate limiting ---
app.use(globalLimiter);

// --- Routes ---
app.use("/contacts", contactsRouter);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(
      `Rate limits: 100 req/15min (global), 10 writes/min (POST/DELETE)`,
    );
    console.log(`Database: PostgreSQL`);
    console.log(`Auth: Firebase Admin SDK`);
    console.log(`Cache: Redis`);
  });
}

module.exports = { app, pool };
