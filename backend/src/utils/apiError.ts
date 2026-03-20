import type { Response } from "express";

export type ApiErrorPayload = {
  message: string;
  code?: string;
  details?: unknown;
};

export const sendError = (res: Response, status: number, payload: ApiErrorPayload) => {
  return res.status(status).json({ error: payload });
};

