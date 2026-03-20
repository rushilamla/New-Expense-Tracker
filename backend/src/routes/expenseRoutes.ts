import { Router } from "express";
import {
  createExpense,
  deleteExpense,
  exportExpenses,
  listExpenses,
  updateExpense,
} from "../controllers/expenseController";
import { requireAuth, requireCsrfForStateChange } from "../middleware/authMiddleware";

export const expenseRouter = Router();

expenseRouter.get("/", requireAuth, listExpenses);
expenseRouter.post("/", requireAuth, requireCsrfForStateChange, createExpense);
expenseRouter.put("/:id", requireAuth, requireCsrfForStateChange, updateExpense);
expenseRouter.delete("/:id", requireAuth, requireCsrfForStateChange, deleteExpense);
expenseRouter.get("/export", requireAuth, exportExpenses);

