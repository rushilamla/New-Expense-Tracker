"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const authMiddleware_1 = require("../middleware/authMiddleware");
exports.authRouter = (0, express_1.Router)();
exports.authRouter.get("/csrf", authController_1.getCsrfToken);
exports.authRouter.post("/register", authController_1.register);
exports.authRouter.post("/login", authController_1.login);
exports.authRouter.post("/logout", authMiddleware_1.requireAuth, authMiddleware_1.requireCsrfForStateChange, authController_1.logout);
exports.authRouter.get("/me", authMiddleware_1.requireAuth, authController_1.me);
// If you add more authenticated state-changing auth routes later,
// wrap them with requireCsrfForStateChange.
//# sourceMappingURL=authRoutes.js.map