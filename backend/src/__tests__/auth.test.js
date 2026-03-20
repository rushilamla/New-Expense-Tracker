const request = require("supertest");
const jwt = require("jsonwebtoken");

const mockPrisma = {
  user: {
    create: jest.fn(),
    findUnique: jest.fn(),
  },
};

jest.mock("../../dist/prisma", () => ({
  __esModule: true,
  default: mockPrisma,
}));

const { app } = require("../../dist/app");

describe("Auth API", () => {
  beforeAll(() => {
    process.env.JWT_SECRET = "test_secret";
    process.env.JWT_EXPIRES_IN = "7d";
    process.env.NODE_ENV = "test";
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("register rejects invalid input", async () => {
    const res = await request(app).post("/api/auth/register").send({ username: "ab", password: "12345678" });
    expect(res.status).toBe(400);
  });

  it("register creates user and issues CSRF cookie", async () => {
    mockPrisma.user.create.mockResolvedValue({ id: 1, username: "user_1" });

    const res = await request(app).post("/api/auth/register").send({ username: "user_1", password: "12345678" });
    expect(res.status).toBe(201);
    expect(res.body.user.username).toBe("user_1");
    const setCookie = res.headers["set-cookie"] || [];
    expect(setCookie.some((c) => c.startsWith("csrfToken="))).toBe(true);
  });

  it("logout requires matching CSRF token", async () => {
    const token = jwt.sign({ userId: 1 }, process.env.JWT_SECRET, { expiresIn: "7d" });

    // Mismatch tokens => 403
    const res = await request(app)
      .post("/api/auth/logout")
      .set("Cookie", [`token=${token}`, `csrfToken=abc123`].join("; "))
      .set("x-csrf-token", "def456");

    expect(res.status).toBe(403);

    // Match tokens => 200
    const res2 = await request(app)
      .post("/api/auth/logout")
      .set("Cookie", [`token=${token}`, `csrfToken=abc123`].join("; "))
      .set("x-csrf-token", "abc123");

    expect(res2.status).toBe(200);
    expect(res2.body.ok).toBe(true);
  });
});

