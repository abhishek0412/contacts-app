const express = require("express");
const authMiddleware = require("../middleware/auth");
const { writeLimiter } = require("../middleware/rateLimiter");
const contactService = require("../services/contactService");

const router = express.Router();

// ─── GET /contacts/stats ───────────────────────────────────
router.get("/stats", authMiddleware, async (req, res) => {
  const stats = await contactService.getStats(req.userId);
  res.json(stats);
});

// ─── GET /contacts/search ──────────────────────────────────
router.get("/search", authMiddleware, async (req, res) => {
  const result = await contactService.searchContacts(req.userId, req.query);
  if (result.error) return res.status(400).json({ error: result.error });
  res.json(result.results);
});

// ─── GET /contacts ─────────────────────────────────────────
router.get("/", authMiddleware, async (req, res) => {
  const result = await contactService.listContacts(req.userId, req.query);
  res.json(result);
});

// ─── GET /contacts/:id ────────────────────────────────────
router.get("/:id", authMiddleware, async (req, res) => {
  const contact = await contactService.getContact(req.userId, req.params.id);
  if (!contact) return res.status(404).json({ error: "Contact not found" });
  res.json(contact);
});

// ─── POST /contacts ───────────────────────────────────────
router.post("/", authMiddleware, writeLimiter, async (req, res) => {
  const result = await contactService.createContact(req.userId, req.body);
  if (result.error) return res.status(400).json({ error: result.error });
  res.status(201).json(result.contact);
});

// ─── PUT /contacts/:id ───────────────────────────────────
router.put("/:id", authMiddleware, writeLimiter, async (req, res) => {
  const contact = await contactService.updateContact(
    req.userId,
    req.params.id,
    req.body,
  );
  if (contact === null)
    return res.status(404).json({ error: "Contact not found" });
  res.json(contact);
});

// ─── DELETE /contacts/:id ─────────────────────────────────
router.delete("/:id", authMiddleware, writeLimiter, async (req, res) => {
  const deleted = await contactService.deleteContact(req.userId, req.params.id);
  if (!deleted) return res.status(404).json({ error: "Contact not found" });
  res.json({});
});

module.exports = router;
