"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportExpenses = exports.deleteExpense = exports.updateExpense = exports.listExpenses = exports.createExpense = void 0;
const zod_1 = require("zod");
const prisma_1 = __importDefault(require("../prisma"));
const apiError_1 = require("../utils/apiError");
const categorySchema = zod_1.z.string().trim().min(1, "Category is required").max(60, "Category is too long");
const amountSchema = zod_1.z
    .number()
    .finite()
    .refine((n) => n > 0, { message: "Amount must be greater than 0" })
    .refine((n) => n < 1_000_000_000, { message: "Amount is too large" });
const dateOnlySchema = zod_1.z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format");
const expenseCreateSchema = zod_1.z.object({
    category: categorySchema,
    amount: amountSchema,
    date: dateOnlySchema,
});
const expenseUpdateSchema = expenseCreateSchema;
const parseDateOnly = (dateStr) => {
    // Avoid timezone drift by using UTC components.
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
};
const formatDateOnly = (date) => date.toISOString().slice(0, 10);
const createExpense = async (req, res) => {
    const userId = req.user?.id;
    if (!userId)
        return (0, apiError_1.sendError)(res, 401, { message: "Unauthorized" });
    const parsed = expenseCreateSchema.safeParse(req.body);
    if (!parsed.success) {
        return (0, apiError_1.sendError)(res, 400, { message: "Invalid input", details: parsed.error.flatten() });
    }
    const { category, amount, date } = parsed.data;
    const dateValue = parseDateOnly(date);
    try {
        const expense = await prisma_1.default.expense.create({
            data: { userId, category, amount, date: dateValue },
            select: { id: true, category: true, amount: true, date: true },
        });
        return res.status(201).json({
            expense: {
                id: expense.id,
                category: expense.category,
                amount: expense.amount.toNumber(),
                date: formatDateOnly(expense.date),
            },
        });
    }
    catch (err) {
        return (0, apiError_1.sendError)(res, 500, { message: "Failed to create expense" });
    }
};
exports.createExpense = createExpense;
const listExpenses = async (req, res) => {
    const userId = req.user?.id;
    if (!userId)
        return (0, apiError_1.sendError)(res, 401, { message: "Unauthorized" });
    const querySchema = zod_1.z.object({
        from: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        to: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        category: zod_1.z.string().trim().min(1).max(60).optional(),
        page: zod_1.z
            .string()
            .transform((s) => Number(s))
            .pipe(zod_1.z.number().int().min(1).max(100))
            .optional(),
        limit: zod_1.z
            .string()
            .transform((s) => Number(s))
            .pipe(zod_1.z.number().int().min(1).max(100))
            .optional(),
    });
    const parsedQuery = querySchema.safeParse(req.query);
    if (!parsedQuery.success) {
        return (0, apiError_1.sendError)(res, 400, { message: "Invalid query parameters", details: parsedQuery.error.flatten() });
    }
    const { from, to, category } = parsedQuery.data;
    const page = parsedQuery.data.page ?? 1;
    const limit = parsedQuery.data.limit ?? 20;
    const where = { userId };
    if (from || to) {
        where.date = {
            ...(from ? { gte: parseDateOnly(from) } : {}),
            ...(to ? { lte: parseDateOnly(to) } : {}),
        };
    }
    if (category) {
        where.category = category;
    }
    const [items, total] = await Promise.all([
        prisma_1.default.expense.findMany({
            where,
            orderBy: { date: "desc" },
            skip: (page - 1) * limit,
            take: limit,
            select: { id: true, category: true, amount: true, date: true },
        }),
        prisma_1.default.expense.count({ where }),
    ]);
    return res.json({
        items: items.map((e) => ({
            id: e.id,
            category: e.category,
            amount: e.amount.toNumber(),
            date: formatDateOnly(e.date),
        })),
        page,
        limit,
        total,
    });
};
exports.listExpenses = listExpenses;
const updateExpense = async (req, res) => {
    const userId = req.user?.id;
    if (!userId)
        return (0, apiError_1.sendError)(res, 401, { message: "Unauthorized" });
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0)
        return (0, apiError_1.sendError)(res, 400, { message: "Invalid expense id" });
    const parsed = expenseUpdateSchema.safeParse(req.body);
    if (!parsed.success) {
        return (0, apiError_1.sendError)(res, 400, { message: "Invalid input", details: parsed.error.flatten() });
    }
    const { category, amount, date } = parsed.data;
    const dateValue = parseDateOnly(date);
    const existing = await prisma_1.default.expense.findFirst({
        where: { id, userId },
        select: { id: true },
    });
    if (!existing)
        return (0, apiError_1.sendError)(res, 404, { message: "Expense not found" });
    const updated = await prisma_1.default.expense.update({
        where: { id },
        data: { category, amount, date: dateValue },
        select: { id: true, category: true, amount: true, date: true },
    });
    return res.json({
        expense: {
            id: updated.id,
            category: updated.category,
            amount: updated.amount.toNumber(),
            date: formatDateOnly(updated.date),
        },
    });
};
exports.updateExpense = updateExpense;
const deleteExpense = async (req, res) => {
    const userId = req.user?.id;
    if (!userId)
        return (0, apiError_1.sendError)(res, 401, { message: "Unauthorized" });
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0)
        return (0, apiError_1.sendError)(res, 400, { message: "Invalid expense id" });
    const deleted = await prisma_1.default.expense.deleteMany({
        where: { id, userId },
    });
    if (deleted.count === 0)
        return (0, apiError_1.sendError)(res, 404, { message: "Expense not found" });
    return res.json({ ok: true });
};
exports.deleteExpense = deleteExpense;
const exportExpenses = async (req, res) => {
    const userId = req.user?.id;
    if (!userId)
        return (0, apiError_1.sendError)(res, 401, { message: "Unauthorized" });
    // Reuse the same query validation as list.
    const querySchema = zod_1.z.object({
        from: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        to: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        category: zod_1.z.string().trim().min(1).max(60).optional(),
    });
    const parsedQuery = querySchema.safeParse(req.query);
    if (!parsedQuery.success) {
        return (0, apiError_1.sendError)(res, 400, { message: "Invalid query parameters", details: parsedQuery.error.flatten() });
    }
    const { from, to, category } = parsedQuery.data;
    const where = { userId };
    if (from || to) {
        where.date = {
            ...(from ? { gte: parseDateOnly(from) } : {}),
            ...(to ? { lte: parseDateOnly(to) } : {}),
        };
    }
    if (category)
        where.category = category;
    const items = await prisma_1.default.expense.findMany({
        where,
        orderBy: { date: "desc" },
        select: { category: true, amount: true, date: true },
    });
    const rows = [
        ["Category", "Amount", "Date"],
        ...items.map((e) => [e.category, e.amount.toNumber().toString(), formatDateOnly(e.date)]),
    ];
    const csv = rows
        .map((r) => r
        .map((cell) => {
        const s = String(cell);
        // Minimal CSV escaping
        if (s.includes(",") || s.includes('"') || s.includes("\n"))
            return `"${s.replaceAll('"', '""')}"`;
        return s;
    })
        .join(","))
        .join("\n");
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="expenses.csv"');
    return res.status(200).send(csv);
};
exports.exportExpenses = exportExpenses;
//# sourceMappingURL=expenseController.js.map