"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireCsrfForStateChange = exports.requireAuth = exports.signAccessToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const apiError_1 = require("../utils/apiError");
const signAccessToken = (userId) => {
    const secret = process.env.JWT_SECRET;
    if (!secret)
        throw new Error("Missing JWT_SECRET");
    const expiresIn = process.env.JWT_EXPIRES_IN ?? "7d";
    // Work around strict typings mismatch by explicitly shaping payload/options.
    const payload = { userId };
    const options = { expiresIn };
    return jsonwebtoken_1.default.sign(payload, secret, options);
};
exports.signAccessToken = signAccessToken;
const requireAuth = (req, res, next) => {
    const token = req.cookies?.token;
    if (!token)
        return res.status(401).json({ error: "Unauthorized" });
    try {
        const secret = process.env.JWT_SECRET;
        if (!secret)
            return res.status(500).json({ error: "Server misconfigured" });
        const payload = jsonwebtoken_1.default.verify(token, secret);
        if (!payload?.userId)
            return res.status(401).json({ error: "Unauthorized" });
        req.user = { id: payload.userId };
        return next();
    }
    catch (_err) {
        return res.status(401).json({ error: "Unauthorized" });
    }
};
exports.requireAuth = requireAuth;
// Used for CSRF protection of state-changing routes.
// Implemented fully in the CSRF todo; for now we allow requests through.
const requireCsrfForStateChange = (_req, res, next) => {
    const req = _req;
    const cookieToken = req.cookies?.csrfToken;
    const headerTokenRaw = req.header("x-csrf-token");
    const headerToken = typeof headerTokenRaw === "string" ? headerTokenRaw : undefined;
    if (!cookieToken || !headerToken) {
        return (0, apiError_1.sendError)(res, 403, { message: "CSRF token missing" });
    }
    // Timing-safe comparison.
    const a = Buffer.from(cookieToken, "utf8");
    const b = Buffer.from(headerToken, "utf8");
    if (a.length !== b.length) {
        return (0, apiError_1.sendError)(res, 403, { message: "Invalid CSRF token" });
    }
    const isValid = crypto_1.default.timingSafeEqual(a, b);
    if (!isValid) {
        return (0, apiError_1.sendError)(res, 403, { message: "Invalid CSRF token" });
    }
    return next();
};
exports.requireCsrfForStateChange = requireCsrfForStateChange;
//# sourceMappingURL=authMiddleware.js.map