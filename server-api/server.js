const express = require("express");
const rateLimit = require("express-rate-limit");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

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

// --- Health check (before rate limiters) ---
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

// GET /contacts
app.get("/contacts", (req, res) => {
  const db = readDb();
  res.json(db.contacts);
});

// GET /contacts/:id
app.get("/contacts/:id", (req, res) => {
  const db = readDb();
  const contact = db.contacts.find((c) => String(c.id) === req.params.id);
  if (!contact) return res.status(404).json({ error: "Contact not found" });
  res.json(contact);
});

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
