import { Router } from "express";
import {
  getCategoriesDistribution,
  getDashboardSummary,
  getMonthlyTrends,
} from "../controllers/analyticsController";
import { requireAuth } from "../middleware/authMiddleware";

export const analyticsRouter = Router();

analyticsRouter.get("/dashboard/summary", requireAuth, getDashboardSummary);
analyticsRouter.get("/categories", requireAuth, getCategoriesDistribution);
analyticsRouter.get("/monthly", requireAuth, getMonthlyTrends);

