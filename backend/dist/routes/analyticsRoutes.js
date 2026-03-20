"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyticsRouter = void 0;
const express_1 = require("express");
const analyticsController_1 = require("../controllers/analyticsController");
const authMiddleware_1 = require("../middleware/authMiddleware");
exports.analyticsRouter = (0, express_1.Router)();
exports.analyticsRouter.get("/dashboard/summary", authMiddleware_1.requireAuth, analyticsController_1.getDashboardSummary);
exports.analyticsRouter.get("/categories", authMiddleware_1.requireAuth, analyticsController_1.getCategoriesDistribution);
exports.analyticsRouter.get("/monthly", authMiddleware_1.requireAuth, analyticsController_1.getMonthlyTrends);
//# sourceMappingURL=analyticsRoutes.js.map