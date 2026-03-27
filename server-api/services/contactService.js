const contactRepo = require("../repositories/contactRepo");
const redis = require("../config/redis");

// ─── Cache helpers ─────────────────────────────────────────

const CACHE_TTL = 60; // seconds

function cacheKey(scope, userId, suffix = "") {
  return `cache:${scope}:${userId}${suffix ? `:${suffix}` : ""}`;
}

async function cached(key, fetchFn) {
  const hit = await redis.get(key);
  if (hit) return JSON.parse(hit);
  const data = await fetchFn();
  await redis.set(key, JSON.stringify(data), "EX", CACHE_TTL);
  return data;
}

async function invalidateUserCache(userId) {
  return Promise.all([
    redis.del(cacheKey("contacts", userId)),
    redis.del(cacheKey("stats", userId)),
  ]);
}

// ─── Validation ────────────────────────────────────────────

const ALLOWED_SEARCH_FIELDS = [
  "all",
  "name",
  "email",
  "phone",
  "company",
  "city",
];
const SEARCH_SANITIZE_RE = /[^\w\s@.+\-]/g;

function validateCreateInput(body) {
  let { first_name, last_name, phone } = body;

  // Backward compat: accept "name" and split into first/last
  if (!first_name && body.name) {
    const parts = body.name.trim().split(/\s+/);
    first_name = parts[0];
    last_name = parts.slice(1).join(" ") || "";
  }

  if (
    !first_name ||
    !phone ||
    typeof first_name !== "string" ||
    typeof phone !== "string"
  ) {
    return { error: "first_name and phone are required" };
  }

  return {
    first_name,
    last_name: last_name || body.last_name || "",
    email: body.email,
    phone,
    company: body.company,
    personal: body.personal,
    address: body.address,
    professional: body.professional,
    profile_photo_url: body.profile_photo_url,
    is_favorite: body.is_favorite,
  };
}

function validateSearchInput(query) {
  const { q, field = "all" } = query;
  if (!q || typeof q !== "string" || q.trim().length === 0) {
    return { error: "Search query (q) is required" };
  }
  return {
    term: q.trim().replace(SEARCH_SANITIZE_RE, ""),
    field: ALLOWED_SEARCH_FIELDS.includes(field) ? field : "all",
  };
}

function parsePagination(query) {
  return {
    page: Math.max(1, parseInt(query.page, 10) || 1),
    limit: Math.min(50, Math.max(1, parseInt(query.limit, 10) || 6)),
  };
}

// ─── Service methods ───────────────────────────────────────

async function listContacts(userId, query) {
  const { page, limit } = parsePagination(query);
  const offset = (page - 1) * limit;
  const key = cacheKey("contacts", userId, `p${page}:l${limit}`);

  return cached(key, async () => {
    const { rows, total } = await contactRepo.findByUser(userId, {
      limit,
      offset,
    });
    return {
      contacts: rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  });
}

async function getContact(userId, contactId) {
  const key = cacheKey("contact", userId, contactId);
  return cached(key, () => contactRepo.findById(userId, contactId));
}

async function getStats(userId) {
  const key = cacheKey("stats", userId);
  return cached(key, () => contactRepo.getStats(userId));
}

async function searchContacts(userId, query) {
  const input = validateSearchInput(query);
  if (input.error) return { error: input.error };
  return { results: await contactRepo.search(userId, input) };
}

async function createContact(userId, body) {
  const input = validateCreateInput(body);
  if (input.error) return { error: input.error };

  const contact = await contactRepo.create(userId, input);
  await invalidateUserCache(userId);
  return { contact };
}

async function updateContact(userId, contactId, body) {
  const contact = await contactRepo.update(userId, contactId, body);
  if (!contact) return null;

  await invalidateUserCache(userId);
  await redis.del(cacheKey("contact", userId, contactId));
  return contact;
}

async function deleteContact(userId, contactId) {
  const deleted = await contactRepo.remove(userId, contactId);
  if (!deleted) return false;

  await invalidateUserCache(userId);
  await redis.del(cacheKey("contact", userId, contactId));
  return true;
}

module.exports = {
  listContacts,
  getContact,
  getStats,
  searchContacts,
  createContact,
  updateContact,
  deleteContact,
};
