const request = require("supertest");

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
  // Ensure the contacts table exists
  await pool.query(`
    CREATE TABLE IF NOT EXISTS contacts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id VARCHAR(128) NOT NULL,
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(50) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
});

beforeEach(async () => {
  // Clean and seed test data for each test
  await pool.query("DELETE FROM contacts WHERE user_id = $1", [TEST_USER_ID]);
  await pool.query(
    `INSERT INTO contacts (user_id, name, phone) VALUES
     ($1, 'Jane Smith', '(555) 234-5678'),
     ($1, 'Alice Johnson', '(555) 345-6789'),
     ($1, 'Bob Williams', '(555) 456-7890')`,
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
  it("should return all contacts for the authenticated user", async () => {
    const res = await request(app)
      .get("/contacts")
      .set("Authorization", TEST_TOKEN);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(3);
  });

  it("should return contacts with id, name, and phone fields", async () => {
    const res = await request(app)
      .get("/contacts")
      .set("Authorization", TEST_TOKEN);
    const contact = res.body[0];
    expect(contact).toHaveProperty("id");
    expect(contact).toHaveProperty("name");
    expect(contact).toHaveProperty("phone");
  });

  it("should not include user_id in the response", async () => {
    const res = await request(app)
      .get("/contacts")
      .set("Authorization", TEST_TOKEN);
    const contact = res.body[0];
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
});

// --- GET /contacts/:id ---

describe("GET /contacts/:id", () => {
  it("should return a single contact by ID", async () => {
    const listRes = await request(app)
      .get("/contacts")
      .set("Authorization", TEST_TOKEN);
    const firstId = listRes.body[0].id;

    const res = await request(app)
      .get(`/contacts/${firstId}`)
      .set("Authorization", TEST_TOKEN);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(firstId);
    expect(res.body).toHaveProperty("name");
    expect(res.body).toHaveProperty("phone");
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
      .send({ name: "Test User", phone: "(555) 000-1111" });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Test User");
    expect(res.body.phone).toBe("(555) 000-1111");
    expect(res.body).toHaveProperty("id");
  });

  it("should persist the contact to the database", async () => {
    const res = await request(app)
      .post("/contacts")
      .set("Authorization", TEST_TOKEN)
      .send({ name: "Persist Test", phone: "(555) 111-2222" });

    const { rows } = await pool.query(
      "SELECT * FROM contacts WHERE id = $1",
      [res.body.id],
    );
    expect(rows.length).toBe(1);
    expect(rows[0].name).toBe("Persist Test");
    expect(rows[0].user_id).toBe(TEST_USER_ID);
  });

  it("should return 400 when name is missing", async () => {
    const res = await request(app)
      .post("/contacts")
      .set("Authorization", TEST_TOKEN)
      .send({ phone: "(555) 000-1111" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Name and phone are required");
  });

  it("should return 400 when phone is missing", async () => {
    const res = await request(app)
      .post("/contacts")
      .set("Authorization", TEST_TOKEN)
      .send({ name: "No Phone" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Name and phone are required");
  });

  it("should return 400 when body is empty", async () => {
    const res = await request(app)
      .post("/contacts")
      .set("Authorization", TEST_TOKEN)
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Name and phone are required");
  });

  it("should return 400 when name is not a string", async () => {
    const res = await request(app)
      .post("/contacts")
      .set("Authorization", TEST_TOKEN)
      .send({ name: 123, phone: "(555) 000-1111" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Name and phone are required");
  });

  it("should return 400 when phone is not a string", async () => {
    const res = await request(app)
      .post("/contacts")
      .set("Authorization", TEST_TOKEN)
      .send({ name: "Type Test", phone: 5550001111 });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Name and phone are required");
  });

  it("should only store name and phone (field whitelisting)", async () => {
    const res = await request(app)
      .post("/contacts")
      .set("Authorization", TEST_TOKEN)
      .send({
        name: "Whitelist Test",
        phone: "(555) 333-4444",
        role: "admin",
        isAdmin: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Whitelist Test");
    expect(res.body.phone).toBe("(555) 333-4444");
    expect(res.body.role).toBeUndefined();
    expect(res.body.isAdmin).toBeUndefined();
    expect(Object.keys(res.body)).toEqual(["id", "name", "phone"]);
  });
});

// --- DELETE /contacts/:id ---

describe("DELETE /contacts/:id", () => {
  it("should delete a contact and return 200", async () => {
    const listRes = await request(app)
      .get("/contacts")
      .set("Authorization", TEST_TOKEN);
    const target = listRes.body[0];

    const res = await request(app)
      .delete(`/contacts/${target.id}`)
      .set("Authorization", TEST_TOKEN);
    expect(res.status).toBe(200);

    // Verify removed from database
    const { rows } = await pool.query(
      "SELECT * FROM contacts WHERE id = $1",
      [target.id],
    );
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
    const largePayload = { name: "x".repeat(15000), phone: "(555) 000-0000" };
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
