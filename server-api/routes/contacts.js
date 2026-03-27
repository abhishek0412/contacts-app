const express = require("express");
const pool = require("../config/db");
const redis = require("../config/redis");
const authMiddleware = require("../middleware/auth");
const { writeLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

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
router.get("/", authMiddleware, async (req, res) => {
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
router.get("/:id", authMiddleware, async (req, res) => {
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
router.post("/", authMiddleware, writeLimiter, async (req, res) => {
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
router.delete("/:id", authMiddleware, writeLimiter, async (req, res) => {
  const { rowCount } = await pool.query(
    "DELETE FROM contacts WHERE id = $1 AND user_id = $2",
    [req.params.id, req.userId],
  );
  if (rowCount === 0)
    return res.status(404).json({ error: "Contact not found" });
  await redis.del(`cache:contacts:${req.userId}`);
  await redis.del(`cache:contact:${req.userId}:${req.params.id}`);
  res.json({});
});

module.exports = router;
