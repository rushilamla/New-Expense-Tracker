const request = require("supertest");
const jwt = require("jsonwebtoken");

const mockPrisma = {
  expense: {
    create: jest.fn(),
  },
};

jest.mock("../../dist/prisma", () => ({
  __esModule: true,
  default: mockPrisma,
}));

const { app } = require("../../dist/app");

const decimal = (n) => ({
  toNumber: () => n,
});

describe("Expenses API", () => {
  beforeAll(() => {
    process.env.JWT_SECRET = "test_secret";
    process.env.JWT_EXPIRES_IN = "7d";
    process.env.NODE_ENV = "test";
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates an expense with auth + CSRF", async () => {
    mockPrisma.expense.create.mockResolvedValue({
      id: 10,
      category: "Food",
      amount: decimal(123.45),
      date: new Date("2026-03-20T00:00:00.000Z"),
    });

    const token = jwt.sign({ userId: 1 }, process.env.JWT_SECRET, { expiresIn: "7d" });

    const res = await request(app)
      .post("/api/expenses")
      .set("Cookie", [`token=${token}`, `csrfToken=csrf_1`].join("; "))
      .set("x-csrf-token", "csrf_1")
      .send({ category: "Food", amount: 123.45, date: "2026-03-20" });

    expect(res.status).toBe(201);
    expect(res.body.expense.category).toBe("Food");
    expect(mockPrisma.expense.create).toHaveBeenCalledTimes(1);
  });
});

