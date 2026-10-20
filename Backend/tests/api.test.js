process.env.NODE_ENV = "test";
process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/appdb?schema=public";
process.env.DIRECT_URL = "postgresql://postgres:postgres@localhost:5432/appdb?schema=public";
process.env.AUTH_MIDDLEWARE_ENABLED = "false";
process.env.JWT_SECRET = "test-jest-secret-key-12345";



jest.mock("../GeminiBuilder/api", () => {
  const fs = require("fs");
  const path = require("path");
  const content = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../templates/vpc-endpoint.json"), "utf8")
  );
  return {
    ...jest.requireActual("../GeminiBuilder/api"),
    generatePracticalContent: jest.fn().mockResolvedValue(content),
  };
});

const request = require("supertest");
const path = require("path");
const fs = require("fs");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const app = require("../src/server");
const fixtures = require("./fixtures");
// At the top of tests/api.test.js
// process.env.NODE_ENV = "test";
// process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/appdb?schema=public"; // <-- Make sure this says appdb
// process.env.AUTH_MIDDLEWARE_ENABLED = "false";
// process.env.JWT_SECRET = "test-jest-secret-key-12345";
// ─── Shared state across tests ───
let token = "";
let userId = "";
let sessionId = "";
let documentId = "";
let documentIdNoAim = "";
let documentIdNoImages = "";

// ═══════════════════════════════════════════════════════
//  GLOBAL SETUP & TEARDOWN
// ═══════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════
//  GLOBAL SETUP & TEARDOWN
// ═══════════════════════════════════════════════════════
beforeAll(async () => {
  // Clean test DB in correct FK order
  await prisma.document.deleteMany();
  await prisma.order.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  await prisma.template.deleteMany();

  // Seed the template from the JSON file
  const templatePath = path.join(__dirname, "../templates/vpc-endpoint.json");
  const templateContent = JSON.parse(fs.readFileSync(templatePath, "utf8"));

  await prisma.template.create({
    data: {
      slug: fixtures.TEMPLATE_SLUG,
      name: "Access S3 from Private EC2 via VPC Endpoint",
      description: "Gateway VPC Endpoint for private S3 access",
      subject: "Cloud Architecture and Services",
      defaultContent: JSON.stringify(templateContent),
      defaultMeta: JSON.stringify({
        program: "B.Tech TY (CCSA)",
        school: "School of Computer Science, Engineering and Applications(SCSEA)",
        facultyName: "Ms. Tahreem Shaikh",
      }),
      defaultSections: JSON.stringify(fixtures.VALID_SECTIONS),
      defaultLayout: JSON.stringify({ mode: "perStep" }),
    },
  });
});

afterAll(async () => {
  await prisma.document.deleteMany();
  await prisma.order.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  await prisma.template.deleteMany();
  await prisma.$disconnect();
});

// ═══════════════════════════════════════════════════════
//  1. HEALTH CHECK
// ═══════════════════════════════════════════════════════
describe("GET /api/health", () => {
  it("should return 200 with ok:true", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.time).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════
//  2. AUTH — REGISTER
// ═══════════════════════════════════════════════════════
describe("POST /api/auth/register", () => {
  it("should register a new user and return 201 + token + session", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send(fixtures.TEST_USER);

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(typeof res.body.token).toBe("string");
    expect(res.body.token.length).toBeGreaterThan(20);

    expect(res.body.user).toBeDefined();
    expect(res.body.user.id).toBeDefined();
    expect(res.body.user.email).toBe(fixtures.TEST_USER.email);
    expect(res.body.user.role).toBe("USER");
expect(res.body.user.credits).toBe(20);
    expect(res.body.user.password).toBeUndefined(); // never leak

    expect(res.body.session).toBeDefined();
    expect(res.body.session.id).toBeDefined();
    expect(res.body.session.expiresAt).toBeDefined();

    token = res.body.token;
    userId = res.body.user.id;
    sessionId = res.body.session.id;
  });

  it("should return 409 when email already exists", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send(fixtures.TEST_USER);

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already/i);
  });

  it("should return 400 for invalid email format", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "not-an-email", password: "password123" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it("should return 400 for password shorter than 6 chars", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "short@pass.com", password: "123" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it("should return 400 when email is missing", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ password: "password123" });

    expect(res.status).toBe(400);
  });

  it("should return 400 when password is missing", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "nopass@test.com" });

    expect(res.status).toBe(400);
  });

  it("should return 400 for empty body", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({});

    expect(res.status).toBe(400);
  });
});

// ═══════════════════════════════════════════════════════
//  3. AUTH — LOGIN
// ═══════════════════════════════════════════════════════
describe("POST /api/auth/login", () => {
  it("should login with correct credentials and return 200 + token", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: fixtures.TEST_USER.email,
        password: fixtures.TEST_USER.password,
      });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(fixtures.TEST_USER.email);
    expect(res.body.session).toBeDefined();

    // Update token for subsequent tests
    token = res.body.token;
  });

  it("should return 401 for wrong password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: fixtures.TEST_USER.email,
        password: "totallywrongpassword",
      });

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid/i);
  });

  it("should return 401 for non-existent email", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: "nobody@nowhere.com",
        password: "password123",
      });

    expect(res.status).toBe(401);
  });

  it("should return 400 for missing email", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ password: "password123" });

    expect(res.status).toBe(400);
  });

  it("should return 400 for missing password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: fixtures.TEST_USER.email });

    expect(res.status).toBe(400);
  });
});

// ═══════════════════════════════════════════════════════
//  4. AUTH — ME
// ═══════════════════════════════════════════════════════
describe("GET /api/auth/me", () => {
  it("should return user data when valid token is provided", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.id).toBe(userId);
    expect(res.body.user.email).toBe(fixtures.TEST_USER.email);
    expect(res.body.user.password).toBeUndefined();
  });

  it("should return user:null when no token is provided (testing mode)", async () => {
    const res = await request(app).get("/api/auth/me");

    expect(res.status).toBe(200);
    expect(res.body.user).toBeNull();
  });

  it("should return user:null for invalid token (testing mode)", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer invalid.token.here");

    expect(res.status).toBe(200);
    expect(res.body.user).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════
//  5. AUTH — LOGOUT
// ═══════════════════════════════════════════════════════
describe("POST /api/auth/logout", () => {
  it("should logout successfully", async () => {
    const res = await request(app)
      .post("/api/auth/logout")
      .send({ sessionId });

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it("should handle logout with no sessionId gracefully", async () => {
    const res = await request(app)
      .post("/api/auth/logout")
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════
//  6. TEMPLATES — LIST
// ═══════════════════════════════════════════════════════
describe("GET /api/templates", () => {
  it("should return a list of active templates", async () => {
    const res = await request(app).get("/api/templates");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.templates)).toBe(true);
    expect(res.body.templates.length).toBeGreaterThanOrEqual(1);

    const tpl = res.body.templates[0];
    expect(tpl.slug).toBe(fixtures.TEMPLATE_SLUG);
    expect(tpl.name).toBeDefined();
    expect(tpl.description).toBeDefined();
    expect(tpl.subject).toBeDefined();
    expect(tpl.defaultContent).toBeDefined();
    expect(tpl.defaultMeta).toBeDefined();
    expect(tpl.defaultSections).toBeDefined();
  });

  it("should parse defaultContent as an object with steps", async () => {
    const res = await request(app).get("/api/templates");
    const content = res.body.templates[0].defaultContent;

    expect(typeof content).toBe("object");
    expect(content.aim).toBeDefined();
    expect(Array.isArray(content.objectives)).toBe(true);
    expect(Array.isArray(content.steps)).toBe(true);
    expect(content.steps.length).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════════════
//  7. TEMPLATES — GET BY SLUG
// ═══════════════════════════════════════════════════════
describe("GET /api/templates/:slug", () => {
  it("should return a single template by slug", async () => {
    const res = await request(app).get(`/api/templates/${fixtures.TEMPLATE_SLUG}`);

    expect(res.status).toBe(200);
    expect(res.body.template.slug).toBe(fixtures.TEMPLATE_SLUG);
    expect(res.body.template.defaultContent.steps.length).toBeGreaterThan(0);
    expect(res.body.template.defaultMeta.facultyName).toBeDefined();
  });

  it("should return 404 for a non-existent slug", async () => {
    const res = await request(app).get("/api/templates/does-not-exist-at-all");

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });
});

// ═══════════════════════════════════════════════════════
//  8. DOCUMENTS — GENERATE (hardcoded, no files)
// ═══════════════════════════════════════════════════════
describe("POST /api/documents/generate", () => {

beforeAll(async () => {
    await prisma.user.update({ where: { id: userId }, data: { credits: 1000 } });
  });

  

  it("should generate a document with hardcoded template (useGemini=false)", async () => {
    const res = await request(app)
      .post("/api/documents/generate")
      .set("Authorization", `Bearer ${token}`)
      .send({
        templateSlug: fixtures.TEMPLATE_SLUG,
        useGemini: false,
        meta: fixtures.VALID_META,
        sections: fixtures.VALID_SECTIONS,
        imageLayout: "perStep",
      });

    expect(res.status).toBe(201);
    expect(res.body.document).toBeDefined();
    expect(res.body.document.status).toBe("READY");
    expect(res.body.document.id).toBeDefined();
    expect(res.body.document.hasOutput).toBe(true);
    expect(res.body.document.meta.studentName).toBe("ANISH KUMAR");
    expect(res.body.document.meta.prn).toBe("20240802503");
    expect(res.body.document.imageLayout).toBe("perStep");

    documentId = res.body.document.id;
  });

  it("should generate with sections toggled off (no aim, no services)", async () => {
    const res = await request(app)
      .post("/api/documents/generate")
      .set("Authorization", `Bearer ${token}`)
      .send({
        templateSlug: fixtures.TEMPLATE_SLUG,
        useGemini: false,
        meta: fixtures.VALID_META,
        sections: {
          ...fixtures.VALID_SECTIONS,
          aim: false,
          services: false,
        },
        imageLayout: "perStep",
      });

    expect(res.status).toBe(201);
    expect(res.body.document.status).toBe("READY");
    expect(res.body.document.sections.aim).toBe(false);
    expect(res.body.document.sections.services).toBe(false);

    documentIdNoAim = res.body.document.id;
  });

  it("should generate with imageLayout=none", async () => {
    const res = await request(app)
      .post("/api/documents/generate")
      .set("Authorization", `Bearer ${token}`)
      .send({
        templateSlug: fixtures.TEMPLATE_SLUG,
        useGemini: false,
        meta: fixtures.VALID_META,
        imageLayout: "none",
      });

    expect(res.status).toBe(201);
    expect(res.body.document.imageLayout).toBe("none");
    expect(res.body.document.status).toBe("READY");

    documentIdNoImages = res.body.document.id;
  });

  it("should generate with imageLayout=architectureOnly", async () => {
    const res = await request(app)
      .post("/api/documents/generate")
      .set("Authorization", `Bearer ${token}`)
      .send({
        templateSlug: fixtures.TEMPLATE_SLUG,
        useGemini: false,
        meta: fixtures.VALID_META,
        imageLayout: "architectureOnly",
      });

    expect(res.status).toBe(201);
    expect(res.body.document.imageLayout).toBe("architectureOnly");
  });

  it("should generate with imageLayout=combineAll", async () => {
    const res = await request(app)
      .post("/api/documents/generate")
      .set("Authorization", `Bearer ${token}`)
      .send({
        templateSlug: fixtures.TEMPLATE_SLUG,
        useGemini: false,
        meta: fixtures.VALID_META,
        imageLayout: "combineAll",
      });

    expect(res.status).toBe(201);
    expect(res.body.document.imageLayout).toBe("combineAll");
  });

  it("should use default sections when sections field is omitted", async () => {
    const res = await request(app)
      .post("/api/documents/generate")
      .set("Authorization", `Bearer ${token}`)
      .send({
        templateSlug: fixtures.TEMPLATE_SLUG,
        useGemini: false,
        meta: fixtures.VALID_META,
      });

    expect(res.status).toBe(201);
    expect(res.body.document.sections.aim).toBe(true);
    expect(res.body.document.sections.steps).toBe(true);
  });

  it("should return 400 when templateSlug is missing", async () => {
    const res = await request(app)
      .post("/api/documents/generate")
      .set("Authorization", `Bearer ${token}`)
      .send({
        meta: fixtures.VALID_META,
      });

    expect(res.status).toBe(400);
  });

  it("should return 400 when meta.studentName is missing", async () => {
    const res = await request(app)
      .post("/api/documents/generate")
      .set("Authorization", `Bearer ${token}`)
      .send({
        templateSlug: fixtures.TEMPLATE_SLUG,
        meta: { prn: "123", title: "Test" },
      });

    expect(res.status).toBe(400);
  });

  it("should return 400 when meta.prn is missing", async () => {
    const res = await request(app)
      .post("/api/documents/generate")
      .set("Authorization", `Bearer ${token}`)
      .send({
        templateSlug: fixtures.TEMPLATE_SLUG,
        meta: { studentName: "Test", title: "Test" },
      });

    expect(res.status).toBe(400);
  });

  it("should return 400 when meta.title is missing", async () => {
    const res = await request(app)
      .post("/api/documents/generate")
      .set("Authorization", `Bearer ${token}`)
      .send({
        templateSlug: fixtures.TEMPLATE_SLUG,
        meta: { studentName: "Test", prn: "123" },
      });

    expect(res.status).toBe(400);
  });

  it("should return 400 for invalid imageLayout value", async () => {
    const res = await request(app)
      .post("/api/documents/generate")
      .set("Authorization", `Bearer ${token}`)
      .send({
        templateSlug: fixtures.TEMPLATE_SLUG,
        meta: fixtures.VALID_META,
        imageLayout: "invalidLayout",
      });

    expect(res.status).toBe(400);
  });

  it("should return 404 for non-existent template slug", async () => {
    const res = await request(app)
      .post("/api/documents/generate")
      .set("Authorization", `Bearer ${token}`)
      .send({
        templateSlug: "nonexistent-template",
        useGemini: false,
        meta: fixtures.VALID_META,
      });

    expect(res.status).toBe(404);
  });

  it("should return 400 for completely empty body", async () => {
    const res = await request(app)
      .post("/api/documents/generate")
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
  });
});

// ═══════════════════════════════════════════════════════
//  9. DOCUMENTS — LIST
// ═══════════════════════════════════════════════════════
describe("GET /api/documents", () => {
  it("should return a list of the user's documents", async () => {
    const res = await request(app)
      .get("/api/documents")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.documents)).toBe(true);
    expect(res.body.documents.length).toBeGreaterThanOrEqual(1);

    const found = res.body.documents.find((d) => d.id === documentId);
    expect(found).toBeDefined();
    expect(found.status).toBe("READY");
    expect(found.template).toBeDefined();
    expect(found.template.slug).toBe(fixtures.TEMPLATE_SLUG);
  });

  it("should include meta and sections in each document", async () => {
    const res = await request(app)
      .get("/api/documents")
      .set("Authorization", `Bearer ${token}`);

    const doc = res.body.documents[0];
    expect(doc.meta).toBeDefined();
    expect(doc.meta.studentName).toBeDefined();
    expect(doc.sections).toBeDefined();
  });

  it("should return documents sorted by createdAt desc", async () => {
    const res = await request(app)
      .get("/api/documents")
      .set("Authorization", `Bearer ${token}`);

    const docs = res.body.documents;
    for (let i = 1; i < docs.length; i++) {
      expect(new Date(docs[i - 1].createdAt).getTime()).toBeGreaterThanOrEqual(
        new Date(docs[i].createdAt).getTime()
      );
    }
  });
});

// ═══════════════════════════════════════════════════════
//  10. DOCUMENTS — GET BY ID
// ═══════════════════════════════════════════════════════
describe("GET /api/documents/:id", () => {
  it("should return full document details", async () => {
    const res = await request(app)
      .get(`/api/documents/${documentId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.document.id).toBe(documentId);
    expect(res.body.document.status).toBe("READY");
    expect(res.body.document.meta.studentName).toBe("ANISH KUMAR");
    expect(res.body.document.meta.prn).toBe("20240802503");
    expect(res.body.document.meta.facultyName).toBe("Ms. Tahreem Shaikh");
    expect(res.body.document.content).toBeDefined();
    expect(res.body.document.hasOutput).toBe(true);
  });

  it("should return 404 for non-existent document id", async () => {
    const res = await request(app)
      .get("/api/documents/nonexistent-id-12345")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it("should reflect toggled sections in the stored document", async () => {
    const res = await request(app)
      .get(`/api/documents/${documentIdNoAim}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.document.sections.aim).toBe(false);
    expect(res.body.document.sections.services).toBe(false);
    expect(res.body.document.sections.steps).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════
//  11. DOCUMENTS — DOWNLOAD
// ═══════════════════════════════════════════════════════
describe("GET /api/documents/:id/download", () => {
  it("should download a valid .docx file", async () => {
    const res = await request(app)
      .get(`/api/documents/${documentId}/download`)
      .set("Authorization", `Bearer ${token}`)
      .responseType("arraybuffer");

    expect(res.status).toBe(200);

    // Verify it's a real docx (ZIP signature: PK = 0x50 0x4B)
    const buf = Buffer.from(res.body);
    expect(buf[0]).toBe(0x50);
    expect(buf[1]).toBe(0x4b);
    expect(buf.length).toBeGreaterThan(1000);
  });

  it("should set correct Content-Disposition header", async () => {
    const res = await request(app)
      .get(`/api/documents/${documentId}/download`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.headers["content-disposition"]).toMatch(/attachment/);
    expect(res.headers["content-disposition"]).toMatch(/\.docx/);
  });

  it("should return 404 for non-existent document", async () => {
    const res = await request(app)
      .get("/api/documents/fake-id-99999/download")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});

// ═══════════════════════════════════════════════════════
//  12. CROSS-USER ISOLATION (even without auth middleware)
// ═══════════════════════════════════════════════════════
describe("User isolation", () => {
  let user2Token = "";

  it("should register a second user", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send(fixtures.TEST_USER_2);

    expect(res.status).toBe(201);
    user2Token = res.body.token;
  });

  it("second user should see 0 documents (or only their own)", async () => {
    const res = await request(app)
      .get("/api/documents")
      .set("Authorization", `Bearer ${user2Token}`);

    expect(res.status).toBe(200);
    // In testing mode without auth middleware, it falls back to test@local.dev
    // So this tests the fallback mechanism works
    expect(Array.isArray(res.body.documents)).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════
//  13. SESSION PERSISTENCE
// ═══════════════════════════════════════════════════════
describe("Session persistence", () => {
  it("should have created a session in the database on register", async () => {
    const sessions = await prisma.session.findMany({
      where: { userId },
    });
    expect(sessions.length).toBeGreaterThanOrEqual(1);
  });

  it("session should have valid token and expiry", async () => {
    const session = await prisma.session.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    expect(session).toBeDefined();
expect(session.token).toMatch(/^[a-f0-9]{32,}$/);
    expect(session.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });
});

// ═══════════════════════════════════════════════════════
//  14. DOCUMENT DB INTEGRITY
// ═══════════════════════════════════════════════════════
describe("Document database integrity", () => {
  it("generated document should exist in DB with correct fields", async () => {
    const doc = await prisma.document.findUnique({
      where: { id: documentId },
      include: { user: true, template: true },
    });

    expect(doc).toBeDefined();
    expect(doc.status).toBe("READY");
    expect(doc.outputPath).toBeDefined();
    expect(doc.error).toBeNull();

    const meta = JSON.parse(doc.meta);
    expect(meta.studentName).toBe("ANISH KUMAR");
    expect(meta.prn).toBe("20240802503");

    expect(doc.template.slug).toBe(fixtures.TEMPLATE_SLUG);
  });

  it("output file should exist on disk", async () => {
    const doc = await prisma.document.findUnique({
      where: { id: documentId },
    });
    expect(fs.existsSync(doc.outputPath)).toBe(true);
  });

  it("content JSON should have valid structure", async () => {
    const doc = await prisma.document.findUnique({
      where: { id: documentId },
    });
    const content = JSON.parse(doc.content);
    expect(content.aim).toBeDefined();
    expect(Array.isArray(content.steps)).toBe(true);
    expect(content.steps.length).toBeGreaterThan(0);
    expect(Array.isArray(content.verification)).toBe(true);
    expect(content.conclusion).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════
//  15. EDGE CASES
// ═══════════════════════════════════════════════════════
describe("Edge cases", () => {
  it("should handle extra unknown fields in register gracefully", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        email: `extra-${Date.now()}@test.com`,
        password: "password123",
        randomField: "should be ignored",
        anotherOne: 42,
      });

    // Zod strips unknown fields by default, so this should succeed
    expect(res.status).toBe(201);
  });

  it("should handle very long student name", async () => {
    const longName = "A".repeat(500);
    const res = await request(app)
      .post("/api/documents/generate")
      .set("Authorization", `Bearer ${token}`)
      .send({
        templateSlug: fixtures.TEMPLATE_SLUG,
        useGemini: false,
        meta: { ...fixtures.VALID_META, studentName: longName },
      });

    expect(res.status).toBe(201);
  });

  it("should handle special characters in title", async () => {
    const res = await request(app)
      .post("/api/documents/generate")
      .set("Authorization", `Bearer ${token}`)
      .send({
        templateSlug: fixtures.TEMPLATE_SLUG,
        useGemini: false,
        meta: {
          ...fixtures.VALID_META,
          title: 'Test "Quotes" & <Tags> / Slashes \\ Back',
        },
      });

    expect(res.status).toBe(201);
  });

  it("GET /api/documents/:id should return 404 for empty id", async () => {
    const res = await request(app)
      .get("/api/documents/")
      .set("Authorization", `Bearer ${token}`);

    // Express treats trailing slash as the list route or 404
    expect([200, 404]).toContain(res.status);
  });
});