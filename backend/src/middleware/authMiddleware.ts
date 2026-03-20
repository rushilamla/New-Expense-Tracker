import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { sendError } from "../utils/apiError";

type JwtPayload = { userId: number };

export const signAccessToken = (userId: number) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("Missing JWT_SECRET");

  const expiresIn = process.env.JWT_EXPIRES_IN ?? "7d";
  // Work around strict typings mismatch by explicitly shaping payload/options.
  const payload: JwtPayload = { userId };
  const options = { expiresIn } as jwt.SignOptions;
  return jwt.sign(payload, secret, options);
};

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const token = req.cookies?.token as string | undefined;
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) return res.status(500).json({ error: "Server misconfigured" });

    const payload = jwt.verify(token, secret) as JwtPayload;
    if (!payload?.userId) return res.status(401).json({ error: "Unauthorized" });

    req.user = { id: payload.userId };
    return next();
  } catch (_err) {
    return res.status(401).json({ error: "Unauthorized" });
  }
};

// Used for CSRF protection of state-changing routes.
// Implemented fully in the CSRF todo; for now we allow requests through.
export const requireCsrfForStateChange = (_req: Request, res: Response, next: NextFunction) => {
  const req = _req as Request;

  const cookieToken = req.cookies?.csrfToken as string | undefined;
  const headerTokenRaw = req.header("x-csrf-token");
  const headerToken = typeof headerTokenRaw === "string" ? headerTokenRaw : undefined;

  if (!cookieToken || !headerToken) {
    return sendError(res, 403, { message: "CSRF token missing" });
  }

  // Timing-safe comparison.
  const a = Buffer.from(cookieToken, "utf8");
  const b = Buffer.from(headerToken, "utf8");
  if (a.length !== b.length) {
    return sendError(res, 403, { message: "Invalid CSRF token" });
  }

  const isValid = crypto.timingSafeEqual(a, b);
  if (!isValid) {
    return sendError(res, 403, { message: "Invalid CSRF token" });
  }

  return next();
};

