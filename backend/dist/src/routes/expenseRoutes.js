"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expenseRouter = void 0;
const express_1 = require("express");
const expenseController_1 = require("../controllers/expenseController");
const authMiddleware_1 = require("../middleware/authMiddleware");
exports.expenseRouter = (0, express_1.Router)();
exports.expenseRouter.get("/", authMiddleware_1.requireAuth, expenseController_1.listExpenses);
exports.expenseRouter.post("/", authMiddleware_1.requireAuth, authMiddleware_1.requireCsrfForStateChange, expenseController_1.createExpense);
exports.expenseRouter.put("/:id", authMiddleware_1.requireAuth, authMiddleware_1.requireCsrfForStateChange, expenseController_1.updateExpense);
exports.expenseRouter.delete("/:id", authMiddleware_1.requireAuth, authMiddleware_1.requireCsrfForStateChange, expenseController_1.deleteExpense);
exports.expenseRouter.get("/export", authMiddleware_1.requireAuth, expenseController_1.exportExpenses);
//# sourceMappingURL=expenseRoutes.js.map