const pool = require("../config/db");

// ─── Column sets ───────────────────────────────────────────
const LIST_COLUMNS = `id, first_name, last_name, name, email, phone, company, is_favorite, profile_photo_url, created_at`;
const ALL_COLUMNS = `id, first_name, last_name, name, email, phone, company, is_favorite, personal, address, professional, profile_photo_url, created_at, updated_at`;

// ─── Read ──────────────────────────────────────────────────

async function findByUser(userId, { limit, offset }) {
  const [dataResult, countResult] = await Promise.all([
    pool.query(
      `SELECT ${LIST_COLUMNS} FROM contacts WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
      [userId, limit, offset],
    ),
    pool.query(
      `SELECT COUNT(*)::int AS total FROM contacts WHERE user_id = $1`,
      [userId],
    ),
  ]);
  return { rows: dataResult.rows, total: countResult.rows[0].total };
}

async function findById(userId, contactId) {
  const { rows } = await pool.query(
    `SELECT ${ALL_COLUMNS} FROM contacts WHERE id = $1 AND user_id = $2`,
    [contactId, userId],
  );
  return rows[0] || null;
}

async function getStats(userId) {
  const { rows } = await pool.query(
    `SELECT
       COUNT(*)::int AS total,
       COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days')::int AS "recentlyAdded",
       COUNT(*) FILTER (WHERE is_favorite)::int AS favorites,
       COUNT(DISTINCT company) FILTER (WHERE company IS NOT NULL)::int AS companies
     FROM contacts WHERE user_id = $1`,
    [userId],
  );
  return rows[0];
}

async function search(userId, { term, field }) {
  const params = [userId, `%${term}%`];
  let whereClause;

  switch (field) {
    case "name":
      whereClause = `user_id = $1 AND (first_name ILIKE $2 OR last_name ILIKE $2)`;
      break;
    case "city":
      whereClause = `user_id = $1 AND address->>'city' ILIKE $2`;
      break;
    case "all":
      whereClause = `user_id = $1 AND (
        first_name ILIKE $2 OR last_name ILIKE $2 OR email ILIKE $2 OR
        phone ILIKE $2 OR company ILIKE $2 OR address->>'city' ILIKE $2
      )`;
      break;
    default:
      // field is pre-validated in the service layer to be one of: email, phone, company
      whereClause = `user_id = $1 AND ${field} ILIKE $2`;
      break;
  }

  const { rows } = await pool.query(
    `SELECT ${LIST_COLUMNS} FROM contacts WHERE ${whereClause} ORDER BY created_at DESC LIMIT 50`,
    params,
  );
  return rows;
}

// ─── Write ─────────────────────────────────────────────────

async function create(userId, data) {
  const { rows } = await pool.query(
    `INSERT INTO contacts (user_id, first_name, last_name, email, phone, company, personal, address, professional, profile_photo_url, is_favorite)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING ${ALL_COLUMNS}`,
    [
      userId,
      data.first_name,
      data.last_name,
      data.email || null,
      data.phone,
      data.company || null,
      JSON.stringify(data.personal || {}),
      JSON.stringify(data.address || {}),
      JSON.stringify(data.professional || {}),
      data.profile_photo_url || null,
      data.is_favorite || false,
    ],
  );
  return rows[0];
}

async function update(userId, contactId, data) {
  const ALLOWED_COLUMNS = [
    "first_name",
    "last_name",
    "email",
    "phone",
    "company",
    "is_favorite",
    "profile_photo_url",
  ];
  const JSON_COLUMNS = ["personal", "address", "professional"];

  const setClauses = [];
  const values = [];
  let idx = 1;

  for (const col of ALLOWED_COLUMNS) {
    if (data[col] !== undefined) {
      setClauses.push(`${col} = $${idx}`);
      values.push(data[col]);
      idx++;
    }
  }

  for (const col of JSON_COLUMNS) {
    if (data[col] !== undefined) {
      setClauses.push(`${col} = $${idx}`);
      values.push(JSON.stringify(data[col]));
      idx++;
    }
  }

  if (setClauses.length === 0) return null;

  values.push(contactId, userId);
  const { rows } = await pool.query(
    `UPDATE contacts SET ${setClauses.join(", ")} WHERE id = $${idx} AND user_id = $${idx + 1} RETURNING ${ALL_COLUMNS}`,
    values,
  );
  return rows[0] || null;
}

async function remove(userId, contactId) {
  const { rowCount } = await pool.query(
    "DELETE FROM contacts WHERE id = $1 AND user_id = $2",
    [contactId, userId],
  );
  return rowCount > 0;
}

module.exports = {
  findByUser,
  findById,
  getStats,
  search,
  create,
  update,
  remove,
};
