"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.me = exports.logout = exports.login = exports.register = exports.getCsrfToken = void 0;
const crypto_1 = __importDefault(require("crypto"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const zod_1 = require("zod");
const prisma_1 = __importDefault(require("../prisma"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const apiError_1 = require("../utils/apiError");
const csrfCookieName = "csrfToken";
const usernameSchema = zod_1.z
    .string()
    .trim()
    .min(3, "Username is too short")
    .max(30, "Username is too long")
    .regex(/^[a-zA-Z0-9_]+$/, "Username may only contain letters, numbers, underscore");
const passwordSchema = zod_1.z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password is too long");
const registerSchema = zod_1.z.object({
    username: usernameSchema,
    password: passwordSchema,
});
const loginSchema = registerSchema;
const getCookieSameSite = () => {
    const v = (process.env.COOKIE_SAMESITE ?? "lax").toLowerCase();
    if (v === "none" || v === "lax" || v === "strict")
        return v;
    return "lax";
};
// Browsers require `Secure` when `SameSite=None`.
const cookieSecure = getCookieSameSite() === "none" ? true : process.env.NODE_ENV === "production";
const setCsrfCookie = (res, token) => {
    res.cookie(csrfCookieName, token, {
        httpOnly: true, // CSRF cookie is not readable by the browser; frontend uses the token from /csrf response.
        sameSite: getCookieSameSite(),
        secure: cookieSecure,
        path: "/",
    });
};
const getCsrfToken = async (_req, res) => {
    const token = crypto_1.default.randomBytes(32).toString("hex");
    setCsrfCookie(res, token);
    return res.json({ csrfToken: token });
};
exports.getCsrfToken = getCsrfToken;
const register = async (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
        return (0, apiError_1.sendError)(res, 400, {
            message: "Invalid input",
            details: parsed.error.flatten(),
        });
    }
    const { username, password } = parsed.data;
    const passwordHash = await bcrypt_1.default.hash(password, 12);
    try {
        const user = await prisma_1.default.user.create({
            data: { username, passwordHash },
            select: { id: true, username: true },
        });
        // Issue a CSRF token so the frontend can safely call state-changing endpoints.
        const token = crypto_1.default.randomBytes(32).toString("hex");
        setCsrfCookie(res, token);
        return res.status(201).json({ user });
    }
    catch (err) {
        // Prisma unique constraint violation
        return (0, apiError_1.sendError)(res, 409, { message: "Username already exists" });
    }
};
exports.register = register;
const login = async (req, res) => {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
        return (0, apiError_1.sendError)(res, 400, {
            message: "Invalid input",
            details: parsed.error.flatten(),
        });
    }
    const { username, password } = parsed.data;
    const user = await prisma_1.default.user.findUnique({
        where: { username: username },
        select: { id: true, username: true, passwordHash: true },
    });
    if (!user)
        return (0, apiError_1.sendError)(res, 401, { message: "Invalid credentials" });
    const ok = await bcrypt_1.default.compare(password, user.passwordHash);
    if (!ok)
        return (0, apiError_1.sendError)(res, 401, { message: "Invalid credentials" });
    const accessToken = (0, authMiddleware_1.signAccessToken)(user.id);
    res.cookie("token", accessToken, {
        httpOnly: true,
        sameSite: getCookieSameSite(),
        secure: cookieSecure,
        path: "/",
        // Consider rotating tokens later if you add refresh tokens
    });
    // Rotate CSRF token on login.
    const token = crypto_1.default.randomBytes(32).toString("hex");
    setCsrfCookie(res, token);
    return res.json({ user: { id: user.id, username: user.username } });
};
exports.login = login;
const logout = async (req, res) => {
    // Clear auth cookie regardless of DB state.
    res.clearCookie("token", { httpOnly: true, sameSite: getCookieSameSite(), secure: cookieSecure, path: "/" });
    return res.json({ ok: true });
};
exports.logout = logout;
const me = async (req, res) => {
    const userId = req.user?.id;
    if (!userId)
        return (0, apiError_1.sendError)(res, 401, { message: "Unauthorized" });
    const user = await prisma_1.default.user.findUnique({
        where: { id: userId },
        select: { id: true, username: true },
    });
    if (!user)
        return (0, apiError_1.sendError)(res, 401, { message: "Unauthorized" });
    return res.json({ user });
};
exports.me = me;
//# sourceMappingURL=authController.js.map