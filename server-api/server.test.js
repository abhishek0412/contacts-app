const request = require("supertest");

// --- Mock Redis (ioredis) ---
const mockRedisInstance = {
  get: jest.fn().mockResolvedValue(null),
  set: jest.fn().mockResolvedValue("OK"),
  del: jest.fn().mockResolvedValue(1),
  call: jest.fn().mockResolvedValue(null),
  on: jest.fn(),
};
jest.mock("ioredis", () => {
  return jest.fn(() => mockRedisInstance);
});

// --- Mock rate-limit-redis ---
jest.mock("rate-limit-redis", () => ({
  RedisStore: jest.fn().mockImplementation(() => ({
    init: jest.fn(),
    increment: jest
      .fn()
      .mockResolvedValue({ totalHits: 1, resetTime: new Date() }),
    decrement: jest.fn().mockResolvedValue(),
    resetKey: jest.fn().mockResolvedValue(),
    resetAll: jest.fn().mockResolvedValue(),
    get: jest.fn().mockResolvedValue(undefined),
  })),
}));

// --- Mock Firebase Admin ---
const TEST_USER_ID = "test-firebase-uid-123";
jest.mock("firebase-admin", () => {
  const mockAuth = {
    verifyIdToken: jest.fn().mockResolvedValue({ uid: TEST_USER_ID }),
  };
  return {
    apps: [],
    initializeApp: jest.fn(),
    auth: () => mockAuth,
  };
});

const TEST_TOKEN = "Bearer test-token";

let app, pool;

beforeAll(async () => {
  ({ app, pool } = require("./server"));
  // Drop and recreate with the new schema for tests
  await pool.query(`DROP TABLE IF EXISTS contacts`);
  await pool.query(`
    CREATE TABLE contacts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id VARCHAR(128) NOT NULL,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL DEFAULT '',
      name VARCHAR(201) GENERATED ALWAYS AS (TRIM(first_name || ' ' || last_name)) STORED,
      email VARCHAR(255),
      phone VARCHAR(50) NOT NULL,
      company VARCHAR(255),
      is_favorite BOOLEAN DEFAULT false,
      personal JSONB DEFAULT '{}',
      address JSONB DEFAULT '{}',
      professional JSONB DEFAULT '{}',
      profile_photo_url TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
});

beforeEach(async () => {
  // Reset Redis mocks between tests
  mockRedisInstance.get.mockResolvedValue(null);
  mockRedisInstance.set.mockClear();
  mockRedisInstance.del.mockClear();

  // Clean and seed test data for each test
  await pool.query("DELETE FROM contacts WHERE user_id = $1", [TEST_USER_ID]);
  await pool.query(
    `INSERT INTO contacts (user_id, first_name, last_name, phone, email, company) VALUES
     ($1, 'Jane', 'Smith', '(555) 234-5678', 'jane@test.com', 'TestCorp'),
     ($1, 'Alice', 'Johnson', '(555) 345-6789', 'alice@test.com', 'DevStudio'),
     ($1, 'Bob', 'Williams', '(555) 456-7890', 'bob@test.com', 'CloudNine')`,
    [TEST_USER_ID],
  );
});

afterAll(async () => {
  await pool.query("DELETE FROM contacts WHERE user_id = $1", [TEST_USER_ID]);
  await pool.end();
});

// --- Auth ---

describe("Authentication", () => {
  it("should return 401 when no token is provided", async () => {
    const res = await request(app).get("/contacts");
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Unauthorized");
  });

  it("should return 401 for invalid token format", async () => {
    const res = await request(app)
      .get("/contacts")
      .set("Authorization", "InvalidFormat");
    expect(res.status).toBe(401);
    expect(res.body.error).toBe("Unauthorized");
  });
});

// --- GET /contacts ---

describe("GET /contacts", () => {
  it("should return paginated contacts for the authenticated user", async () => {
    const res = await request(app)
      .get("/contacts")
      .set("Authorization", TEST_TOKEN);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("contacts");
    expect(res.body).toHaveProperty("total", 3);
    expect(res.body).toHaveProperty("page", 1);
    expect(res.body).toHaveProperty("totalPages");
    expect(Array.isArray(res.body.contacts)).toBe(true);
    expect(res.body.contacts.length).toBe(3);
  });

  it("should return contacts with required fields", async () => {
    const res = await request(app)
      .get("/contacts")
      .set("Authorization", TEST_TOKEN);
    const contact = res.body.contacts[0];
    expect(contact).toHaveProperty("id");
    expect(contact).toHaveProperty("first_name");
    expect(contact).toHaveProperty("last_name");
    expect(contact).toHaveProperty("name");
    expect(contact).toHaveProperty("phone");
    expect(contact).toHaveProperty("email");
    expect(contact).toHaveProperty("company");
  });

  it("should not include user_id in the response", async () => {
    const res = await request(app)
      .get("/contacts")
      .set("Authorization", TEST_TOKEN);
    const contact = res.body.contacts[0];
    expect(contact.user_id).toBeUndefined();
  });

  it("should include rate limit headers", async () => {
    const res = await request(app)
      .get("/contacts")
      .set("Authorization", TEST_TOKEN);
    expect(res.headers).toHaveProperty("ratelimit-limit");
    expect(res.headers).toHaveProperty("ratelimit-remaining");
    expect(res.headers).toHaveProperty("ratelimit-reset");
  });

  it("should respect page and limit query params", async () => {
    const res = await request(app)
      .get("/contacts?page=1&limit=2")
      .set("Authorization", TEST_TOKEN);
    expect(res.status).toBe(200);
    expect(res.body.contacts.length).toBe(2);
    expect(res.body.total).toBe(3);
    expect(res.body.totalPages).toBe(2);
  });
});

// --- GET /contacts/:id ---

describe("GET /contacts/:id", () => {
  it("should return a single contact by ID with all fields", async () => {
    const listRes = await request(app)
      .get("/contacts")
      .set("Authorization", TEST_TOKEN);
    const firstId = listRes.body.contacts[0].id;

    const res = await request(app)
      .get(`/contacts/${firstId}`)
      .set("Authorization", TEST_TOKEN);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(firstId);
    expect(res.body).toHaveProperty("first_name");
    expect(res.body).toHaveProperty("last_name");
    expect(res.body).toHaveProperty("name");
    expect(res.body).toHaveProperty("phone");
    expect(res.body).toHaveProperty("email");
    expect(res.body).toHaveProperty("personal");
    expect(res.body).toHaveProperty("address");
    expect(res.body).toHaveProperty("professional");
  });

  it("should return 404 for non-existent ID", async () => {
    const res = await request(app)
      .get("/contacts/00000000-0000-0000-0000-000000000000")
      .set("Authorization", TEST_TOKEN);
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Contact not found");
  });
});

// --- POST /contacts ---

describe("POST /contacts", () => {
  it("should create a new contact with 201 status", async () => {
    const res = await request(app)
      .post("/contacts")
      .set("Authorization", TEST_TOKEN)
      .send({
        first_name: "Test",
        last_name: "User",
        phone: "(555) 000-1111",
        email: "test@example.com",
      });

    expect(res.status).toBe(201);
    expect(res.body.first_name).toBe("Test");
    expect(res.body.last_name).toBe("User");
    expect(res.body.name).toBe("Test User");
    expect(res.body.phone).toBe("(555) 000-1111");
    expect(res.body).toHaveProperty("id");
  });

  it("should support backward-compat name field", async () => {
    const res = await request(app)
      .post("/contacts")
      .set("Authorization", TEST_TOKEN)
      .send({ name: "Persist Test", phone: "(555) 111-2222" });

    expect(res.status).toBe(201);
    const { rows } = await pool.query("SELECT * FROM contacts WHERE id = $1", [
      res.body.id,
    ]);
    expect(rows.length).toBe(1);
    expect(rows[0].first_name).toBe("Persist");
    expect(rows[0].last_name).toBe("Test");
    expect(rows[0].user_id).toBe(TEST_USER_ID);
  });

  it("should return 400 when first_name is missing", async () => {
    const res = await request(app)
      .post("/contacts")
      .set("Authorization", TEST_TOKEN)
      .send({ phone: "(555) 000-1111" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("first_name and phone are required");
  });

  it("should return 400 when phone is missing", async () => {
    const res = await request(app)
      .post("/contacts")
      .set("Authorization", TEST_TOKEN)
      .send({ first_name: "No Phone" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("first_name and phone are required");
  });

  it("should return 400 when body is empty", async () => {
    const res = await request(app)
      .post("/contacts")
      .set("Authorization", TEST_TOKEN)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("first_name and phone are required");
  });

  it("should store JSONB fields", async () => {
    const res = await request(app)
      .post("/contacts")
      .set("Authorization", TEST_TOKEN)
      .send({
        first_name: "JSON",
        last_name: "Test",
        phone: "(555) 333-4444",
        company: "TestCorp",
        personal: { nickname: "JT", gender: "Male" },
        address: { city: "Pune", state: "MH" },
        professional: { role: "Engineer" },
      });

    expect(res.status).toBe(201);
    expect(res.body.company).toBe("TestCorp");
    expect(res.body.personal).toEqual({ nickname: "JT", gender: "Male" });
    expect(res.body.address).toEqual({ city: "Pune", state: "MH" });
    expect(res.body.professional).toEqual({ role: "Engineer" });
  });

  it("should not leak unexpected fields", async () => {
    const res = await request(app)
      .post("/contacts")
      .set("Authorization", TEST_TOKEN)
      .send({
        first_name: "Whitelist",
        phone: "(555) 333-4444",
        isAdmin: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.isAdmin).toBeUndefined();
  });
});

// --- DELETE /contacts/:id ---

describe("PUT /contacts/:id", () => {
  it("should update a contact", async () => {
    const listRes = await request(app)
      .get("/contacts")
      .set("Authorization", TEST_TOKEN);
    const target = listRes.body.contacts[0];

    const res = await request(app)
      .put(`/contacts/${target.id}`)
      .set("Authorization", TEST_TOKEN)
      .send({ company: "UpdatedCorp", email: "updated@test.com" });
    expect(res.status).toBe(200);
    expect(res.body.company).toBe("UpdatedCorp");
    expect(res.body.email).toBe("updated@test.com");
  });

  it("should return 404 for non-existent ID", async () => {
    const res = await request(app)
      .put("/contacts/00000000-0000-0000-0000-000000000000")
      .set("Authorization", TEST_TOKEN)
      .send({ company: "NoContact" });
    expect(res.status).toBe(404);
  });
});

describe("DELETE /contacts/:id", () => {
  it("should delete a contact and return 200", async () => {
    const listRes = await request(app)
      .get("/contacts")
      .set("Authorization", TEST_TOKEN);
    const target = listRes.body.contacts[0];

    const res = await request(app)
      .delete(`/contacts/${target.id}`)
      .set("Authorization", TEST_TOKEN);
    expect(res.status).toBe(200);

    // Verify removed from database
    const { rows } = await pool.query("SELECT * FROM contacts WHERE id = $1", [
      target.id,
    ]);
    expect(rows.length).toBe(0);
  });

  it("should return 404 for non-existent ID", async () => {
    const res = await request(app)
      .delete("/contacts/00000000-0000-0000-0000-000000000000")
      .set("Authorization", TEST_TOKEN);
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Contact not found");
  });
});

// --- CORS ---

describe("CORS headers", () => {
  it("should include Access-Control-Allow-Origin for localhost origins", async () => {
    const res = await request(app)
      .get("/contacts")
      .set("Origin", "http://localhost:3000")
      .set("Authorization", TEST_TOKEN);
    expect(res.headers["access-control-allow-origin"]).toBe(
      "http://localhost:3000",
    );
  });

  it("should handle OPTIONS preflight request", async () => {
    const res = await request(app).options("/contacts");
    expect(res.status).toBe(204);
    expect(res.headers["access-control-allow-methods"]).toContain("POST");
    expect(res.headers["access-control-allow-methods"]).toContain("DELETE");
  });

  it("should allow Authorization header", async () => {
    const res = await request(app).options("/contacts");
    expect(res.headers["access-control-allow-headers"]).toContain(
      "Authorization",
    );
  });
});

// --- Body Size Limit ---

describe("Body size limit", () => {
  it("should reject payloads larger than 10KB", async () => {
    const largePayload = {
      first_name: "x".repeat(15000),
      phone: "(555) 000-0000",
    };
    const res = await request(app)
      .post("/contacts")
      .set("Authorization", TEST_TOKEN)
      .send(largePayload);

    expect(res.status).toBe(413);
  });
});

// --- Health Check ---

describe("Health check", () => {
  it("should return ok status", async () => {
    const res = await request(app).get("/healthz");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});

// --- GET /contacts/stats ---

describe("GET /contacts/stats", () => {
  it("should return stats for the authenticated user", async () => {
    const res = await request(app)
      .get("/contacts/stats")
      .set("Authorization", TEST_TOKEN);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("total", 3);
    expect(res.body).toHaveProperty("recentlyAdded");
    expect(res.body).toHaveProperty("favorites");
    expect(res.body).toHaveProperty("companies");
  });
});

// --- GET /contacts/search ---

describe("GET /contacts/search", () => {
  it("should search contacts by name", async () => {
    const res = await request(app)
      .get("/contacts/search?q=Jane&field=name")
      .set("Authorization", TEST_TOKEN);
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].first_name).toBe("Jane");
  });

  it("should search contacts across all fields", async () => {
    const res = await request(app)
      .get("/contacts/search?q=TestCorp")
      .set("Authorization", TEST_TOKEN);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("should return 400 when q is missing", async () => {
    const res = await request(app)
      .get("/contacts/search")
      .set("Authorization", TEST_TOKEN);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Search query (q) is required");
  });
});
