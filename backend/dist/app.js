"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
const authRoutes_1 = require("./routes/authRoutes");
const expenseRoutes_1 = require("./routes/expenseRoutes");
const analyticsRoutes_1 = require("./routes/analyticsRoutes");
dotenv_1.default.config();
exports.app = (0, express_1.default)();
exports.app.disable("x-powered-by");
exports.app.use((0, helmet_1.default)());
exports.app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGIN?.split(",").map((s) => s.trim()) ?? true,
    credentials: true,
}));
exports.app.use((0, morgan_1.default)("dev"));
exports.app.use(express_1.default.json({ limit: "1mb" }));
exports.app.use((0, cookie_parser_1.default)());
exports.app.get("/healthz", (_req, res) => res.status(200).json({ ok: true }));
exports.app.use("/api/auth", authRoutes_1.authRouter);
exports.app.use("/api/expenses", expenseRoutes_1.expenseRouter);
exports.app.use("/api/analytics", analyticsRoutes_1.analyticsRouter);
// Centralized JSON error responses.
exports.app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
});
//# sourceMappingURL=app.js.map