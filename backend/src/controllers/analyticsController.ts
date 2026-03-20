import type { Request, Response } from "express";
import { z } from "zod";
import prisma from "../prisma";
import { sendError } from "../utils/apiError";

const dateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/;
const dateOnlySchema = z.string().regex(dateOnlyRegex);

const parseDateOnly = (dateStr: string) => {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
};

const formatDateOnly = (date: Date) => date.toISOString().slice(0, 10);
const formatMonthKey = (date: Date) => date.toISOString().slice(0, 7); // YYYY-MM
const formatMonthLabel = (key: string) => {
  const [y, m] = key.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1, 1));
  return d.toLocaleString("en-US", { month: "short", year: "2-digit", timeZone: "UTC" });
};

const toAmount = (decimal: any) => {
  // Prisma Decimal has `toNumber()`. Use Number(...) as fallback.
  if (typeof decimal?.toNumber === "function") return decimal.toNumber();
  return Number(decimal);
};

export const getDashboardSummary = async (_req: Request, res: Response) => {
  const userId = _req.user?.id;
  if (!userId) return sendError(res, 401, { message: "Unauthorized" });

  const querySchema = z.object({
    from: dateOnlySchema.optional(),
    to: dateOnlySchema.optional(),
    category: z.string().trim().min(1).max(60).optional(),
  });

  const parsedQuery = querySchema.safeParse(_req.query);
  if (!parsedQuery.success) {
    return sendError(res, 400, { message: "Invalid query parameters", details: parsedQuery.error.flatten() });
  }

  const { from, to, category } = parsedQuery.data;

  const where: any = { userId };
  if (from || to) {
    where.date = {
      ...(from ? { gte: parseDateOnly(from) } : {}),
      ...(to ? { lte: parseDateOnly(to) } : {}),
    };
  }
  if (category) where.category = category;

  const [totalAgg, topAgg, recent] = await Promise.all([
    prisma.expense.aggregate({ where, _sum: { amount: true } }),
    prisma.expense
      .groupBy({
        by: ["category"],
        where,
        _sum: { amount: true },
      })
      .then((rows) => rows.sort((a, b) => toAmount(b._sum.amount) - toAmount(a._sum.amount))[0]),
    prisma.expense.findMany({
      where,
      orderBy: { date: "desc" },
      take: 5,
      select: { id: true, category: true, amount: true, date: true },
    }),
  ]);

  const totalSpent = toAmount(totalAgg._sum.amount ?? 0);
  const topRow = topAgg;

  return res.json({
    totalSpent,
    topCategory: topRow ? topRow.category : null,
    recentTransactions: recent.map((e) => ({
      id: e.id,
      category: e.category,
      amount: toAmount(e.amount),
      date: formatDateOnly(e.date),
    })),
  });
};

export const getCategoriesDistribution = async (_req: Request, res: Response) => {
  const userId = _req.user?.id;
  if (!userId) return sendError(res, 401, { message: "Unauthorized" });

  const querySchema = z.object({
    from: dateOnlySchema.optional(),
    to: dateOnlySchema.optional(),
    category: z.string().trim().min(1).max(60).optional(),
  });

  const parsedQuery = querySchema.safeParse(_req.query);
  if (!parsedQuery.success) {
    return sendError(res, 400, { message: "Invalid query parameters", details: parsedQuery.error.flatten() });
  }

  const { from, to, category } = parsedQuery.data;

  const where: any = { userId };
  if (from || to) {
    where.date = {
      ...(from ? { gte: parseDateOnly(from) } : {}),
      ...(to ? { lte: parseDateOnly(to) } : {}),
    };
  }
  if (category) where.category = category;

  const rows = await prisma.expense.groupBy({
    by: ["category"],
    where,
    _sum: { amount: true },
  });

  const sorted = rows
    .map((r) => ({ category: r.category, amount: toAmount(r._sum.amount ?? 0) }))
    .sort((a, b) => b.amount - a.amount);

  return res.json({
    categories: sorted.map((r) => r.category),
    amounts: sorted.map((r) => r.amount),
  });
};

export const getMonthlyTrends = async (_req: Request, res: Response) => {
  const userId = _req.user?.id;
  if (!userId) return sendError(res, 401, { message: "Unauthorized" });

  const querySchema = z.object({
    months: z
      .string()
      .optional()
      .transform((s) => (typeof s === "string" ? Number(s) : undefined))
      .pipe(z.number().int().min(1).max(60).optional()),
    from: dateOnlySchema.optional(),
    to: dateOnlySchema.optional(),
    category: z.string().trim().min(1).max(60).optional(),
  });

  const parsedQuery = querySchema.safeParse(_req.query);
  if (!parsedQuery.success) {
    return sendError(res, 400, { message: "Invalid query parameters", details: parsedQuery.error.flatten() });
  }

  const { months: monthsRaw, from, to, category } = parsedQuery.data;
  const months = monthsRaw ?? 12;

  const addDays = (d: Date, days: number) => new Date(d.getTime() + days * 24 * 60 * 60 * 1000);
  const startOfMonth = (d: Date) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, 0, 0, 0, 0));
  const firstOfNextMonth = (d: Date) =>
    new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1, 0, 0, 0, 0));

  const now = new Date();
  const defaultEndExclusive = firstOfNextMonth(now);

  let rangeStart: Date;
  let rangeEndExclusive: Date;

  if (from && to) {
    rangeStart = parseDateOnly(from);
    rangeEndExclusive = addDays(parseDateOnly(to), 1);
  } else if (from && !to) {
    rangeStart = parseDateOnly(from);
    // End at the first day of the month after `months` window.
    rangeEndExclusive = firstOfNextMonth(startOfMonth(rangeStart));
    rangeEndExclusive = new Date(Date.UTC(rangeStart.getUTCFullYear(), rangeStart.getUTCMonth() + months, 1, 0, 0, 0, 0));
  } else if (!from && to) {
    const toDate = parseDateOnly(to);
    const toMonthStart = startOfMonth(toDate);
    rangeStart = new Date(Date.UTC(toMonthStart.getUTCFullYear(), toMonthStart.getUTCMonth() - (months - 1), 1, 0, 0, 0, 0));
    rangeEndExclusive = addDays(toDate, 1);
  } else {
    rangeEndExclusive = defaultEndExclusive;
    rangeStart = new Date(rangeEndExclusive);
    rangeStart.setUTCMonth(rangeStart.getUTCMonth() - (months - 1));
    rangeStart.setUTCDate(1);
    rangeStart.setUTCHours(0, 0, 0, 0);
  }

  const where: any = {
    userId,
    date: { gte: rangeStart, lt: rangeEndExclusive },
  };
  if (category) where.category = category;

  const expenses = await prisma.expense.findMany({
    where,
    select: { date: true, amount: true },
  });

  const totalsByMonth: Record<string, number> = {};
  const labels: string[] = [];

  const labelStart = startOfMonth(rangeStart);
  const labelEndExclusive = firstOfNextMonth(new Date(rangeEndExclusive.getUTCFullYear(), rangeEndExclusive.getUTCMonth(), rangeEndExclusive.getUTCDate(), 0, 0, 0, 0));

  let cursor = new Date(labelStart);
  while (cursor < labelEndExclusive) {
    const key = formatMonthKey(cursor);
    labels.push(formatMonthLabel(key));
    totalsByMonth[key] = 0;
    cursor = firstOfNextMonth(cursor);
  }

  for (const e of expenses) {
    const key = formatMonthKey(e.date);
    if (totalsByMonth[key] !== undefined) totalsByMonth[key] += toAmount(e.amount);
  }

  const amounts: number[] = [];
  cursor = new Date(labelStart);
  while (cursor < labelEndExclusive) {
    const key = formatMonthKey(cursor);
    amounts.push(totalsByMonth[key] ?? 0);
    cursor = firstOfNextMonth(cursor);
  }

  return res.json({ labels, amounts });
};

