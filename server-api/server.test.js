const request = require("supertest");
const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "db.json");

// Backup and restore db.json around tests
let originalDb;

beforeAll(() => {
  originalDb = fs.readFileSync(DB_PATH, "utf-8");
});

afterAll(() => {
  fs.writeFileSync(DB_PATH, originalDb);
});

// Fresh app import per test suite to reset rate limiter state
function getApp() {
  // Clear require cache so rate limiters reset
  delete require.cache[require.resolve("./server")];
  return require("./server");
}

// --- GET /contacts ---

describe("GET /contacts", () => {
  let app;
  beforeAll(() => {
    app = getApp();
  });

  it("should return all contacts", async () => {
    const res = await request(app).get("/contacts");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it("should return contacts with id, name, and phone fields", async () => {
    const res = await request(app).get("/contacts");
    const contact = res.body[0];
    expect(contact).toHaveProperty("id");
    expect(contact).toHaveProperty("name");
    expect(contact).toHaveProperty("phone");
  });

  it("should include rate limit headers", async () => {
    const res = await request(app).get("/contacts");
    expect(res.headers).toHaveProperty("ratelimit-limit");
    expect(res.headers).toHaveProperty("ratelimit-remaining");
    expect(res.headers).toHaveProperty("ratelimit-reset");
  });
});

// --- GET /contacts/:id ---

describe("GET /contacts/:id", () => {
  let app;
  beforeAll(() => {
    app = getApp();
  });

  it("should return a single contact by ID", async () => {
    const listRes = await request(app).get("/contacts");
    const firstId = listRes.body[0].id;

    const res = await request(app).get(`/contacts/${firstId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(firstId);
    expect(res.body).toHaveProperty("name");
    expect(res.body).toHaveProperty("phone");
  });

  it("should return 404 for non-existent ID", async () => {
    const res = await request(app).get("/contacts/nonexistent-999");
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Contact not found");
  });
});

// --- POST /contacts ---

describe("POST /contacts", () => {
  let app;
  beforeAll(() => {
    app = getApp();
  });

  afterEach(() => {
    // Restore db after each POST test
    fs.writeFileSync(DB_PATH, originalDb);
  });

  it("should create a new contact with 201 status", async () => {
    const res = await request(app)
      .post("/contacts")
      .send({ name: "Test User", phone: "(555) 000-1111" });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Test User");
    expect(res.body.phone).toBe("(555) 000-1111");
    expect(res.body).toHaveProperty("id");
  });

  it("should persist the contact to db.json", async () => {
    const res = await request(app)
      .post("/contacts")
      .send({ name: "Persist Test", phone: "(555) 111-2222" });

    const db = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
    const found = db.contacts.find((c) => c.id === res.body.id);
    expect(found).toBeDefined();
    expect(found.name).toBe("Persist Test");
  });

  it("should return 400 when name is missing", async () => {
    const res = await request(app)
      .post("/contacts")
      .send({ phone: "(555) 000-1111" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Name and phone are required");
  });

  it("should return 400 when phone is missing", async () => {
    const res = await request(app).post("/contacts").send({ name: "No Phone" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Name and phone are required");
  });

  it("should return 400 when body is empty", async () => {
    const res = await request(app).post("/contacts").send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Name and phone are required");
  });

  it("should return 400 when name is not a string", async () => {
    const res = await request(app)
      .post("/contacts")
      .send({ name: 123, phone: "(555) 000-1111" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Name and phone are required");
  });

  it("should return 400 when phone is not a string", async () => {
    const res = await request(app)
      .post("/contacts")
      .send({ name: "Type Test", phone: 5550001111 });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Name and phone are required");
  });

  it("should only store name and phone (field whitelisting)", async () => {
    const res = await request(app)
      .post("/contacts")
      .send({
        name: "Whitelist Test",
        phone: "(555) 333-4444",
        role: "admin",
        isAdmin: true,
        __proto__: { polluted: true },
      });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Whitelist Test");
    expect(res.body.phone).toBe("(555) 333-4444");
    expect(res.body.role).toBeUndefined();
    expect(res.body.isAdmin).toBeUndefined();

    // Verify in db.json as well
    const db = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
    const stored = db.contacts.find((c) => c.id === res.body.id);
    expect(Object.keys(stored)).toEqual(["id", "name", "phone"]);
  });
});

// --- DELETE /contacts/:id ---

describe("DELETE /contacts/:id", () => {
  let app;
  beforeAll(() => {
    app = getApp();
  });

  afterEach(() => {
    fs.writeFileSync(DB_PATH, originalDb);
  });

  it("should delete a contact and return 200", async () => {
    const listRes = await request(app).get("/contacts");
    const target = listRes.body[0];

    const res = await request(app).delete(`/contacts/${target.id}`);
    expect(res.status).toBe(200);

    // Verify removed from db
    const db = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
    const found = db.contacts.find((c) => String(c.id) === String(target.id));
    expect(found).toBeUndefined();
  });

  it("should return 404 for non-existent ID", async () => {
    const res = await request(app).delete("/contacts/nonexistent-999");
    expect(res.status).toBe(404);
    expect(res.body.error).toBe("Contact not found");
  });
});

// --- CORS ---

describe("CORS headers", () => {
  let app;
  beforeAll(() => {
    app = getApp();
  });

  it("should include Access-Control-Allow-Origin for localhost origins", async () => {
    const res = await request(app)
      .get("/contacts")
      .set("Origin", "http://localhost:3000");
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
});

// --- Body Size Limit ---

describe("Body size limit", () => {
  let app;
  beforeAll(() => {
    app = getApp();
  });

  it("should reject payloads larger than 10KB", async () => {
    const largePayload = { name: "x".repeat(15000), phone: "(555) 000-0000" };
    const res = await request(app).post("/contacts").send(largePayload);

    expect(res.status).toBe(413);
  });
});

// --- Rate Limiting ---

describe("Rate limiting", () => {
  it("should return 429 after exceeding write limit (10 req/min)", async () => {
    const app = getApp();
    let lastStatus;

    // Send 11 POST requests — the 11th should be rate-limited
    for (let i = 0; i <= 10; i++) {
      const res = await request(app)
        .post("/contacts")
        .send({
          name: `Rate ${i}`,
          phone: `(555) 000-${String(i).padStart(4, "0")}`,
        });
      lastStatus = res.status;
    }

    expect(lastStatus).toBe(429);

    // Restore db
    fs.writeFileSync(DB_PATH, originalDb);
  });

  it("should include rate limit policy headers on write endpoints", async () => {
    const app = getApp();
    const res = await request(app)
      .post("/contacts")
      .send({ name: "Header Test", phone: "(555) 999-8888" });

    expect(res.headers).toHaveProperty("ratelimit-limit");
    expect(res.headers["ratelimit-limit"]).toBe("10");

    // Restore db
    fs.writeFileSync(DB_PATH, originalDb);
  });
});
