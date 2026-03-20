import type { Request, Response } from "express";
import crypto from "crypto";
import bcrypt from "bcrypt";
import { z } from "zod";
import prisma from "../prisma";
import { signAccessToken } from "../middleware/authMiddleware";
import { sendError } from "../utils/apiError";

const csrfCookieName = "csrfToken";

const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username is too short")
  .max(30, "Username is too long")
  .regex(/^[a-zA-Z0-9_]+$/, "Username may only contain letters, numbers, underscore");

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password is too long");

const registerSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
});

const loginSchema = registerSchema;

const getCookieSameSite = () => {
  const v = (process.env.COOKIE_SAMESITE ?? "lax").toLowerCase();
  if (v === "none" || v === "lax" || v === "strict") return v;
  return "lax";
};

// Browsers require `Secure` when `SameSite=None`.
const cookieSecure = getCookieSameSite() === "none" ? true : process.env.NODE_ENV === "production";

const setCsrfCookie = (res: Response, token: string) => {
  res.cookie(csrfCookieName, token, {
    httpOnly: true, // CSRF cookie is not readable by the browser; frontend uses the token from /csrf response.
    sameSite: getCookieSameSite(),
    secure: cookieSecure,
    path: "/",
  });
};

export const getCsrfToken = async (_req: Request, res: Response) => {
  const token = crypto.randomBytes(32).toString("hex");
  setCsrfCookie(res, token);

  return res.json({ csrfToken: token });
};

export const register = async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 400, {
      message: "Invalid input",
      details: parsed.error.flatten(),
    });
  }

  const { username, password } = parsed.data;
  const passwordHash = await bcrypt.hash(password, 12);

  try {
    const user = await prisma.user.create({
      data: { username, passwordHash },
      select: { id: true, username: true },
    });

    // Issue a CSRF token so the frontend can safely call state-changing endpoints.
    const token = crypto.randomBytes(32).toString("hex");
    setCsrfCookie(res, token);

    return res.status(201).json({ user });
  } catch (err: unknown) {
    // Prisma unique constraint violation
    return sendError(res, 409, { message: "Username already exists" });
  }
};

export const login = async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 400, {
      message: "Invalid input",
      details: parsed.error.flatten(),
    });
  }

  const { username, password } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { username: username },
    select: { id: true, username: true, passwordHash: true },
  });

  if (!user) return sendError(res, 401, { message: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return sendError(res, 401, { message: "Invalid credentials" });

  const accessToken = signAccessToken(user.id);

  res.cookie("token", accessToken, {
    httpOnly: true,
    sameSite: getCookieSameSite(),
    secure: cookieSecure,
    path: "/",
    // Consider rotating tokens later if you add refresh tokens
  });

  // Rotate CSRF token on login.
  const token = crypto.randomBytes(32).toString("hex");
  setCsrfCookie(res, token);

  return res.json({ user: { id: user.id, username: user.username } });
};

export const logout = async (req: Request, res: Response) => {
  // Clear auth cookie regardless of DB state.
  res.clearCookie("token", { httpOnly: true, sameSite: getCookieSameSite(), secure: cookieSecure, path: "/" });
  return res.json({ ok: true });
};

export const me = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) return sendError(res, 401, { message: "Unauthorized" });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true },
  });

  if (!user) return sendError(res, 401, { message: "Unauthorized" });
  return res.json({ user });
};

