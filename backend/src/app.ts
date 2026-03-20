import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

import { authRouter } from "./routes/authRoutes";
import { expenseRouter } from "./routes/expenseRoutes";
import { analyticsRouter } from "./routes/analyticsRoutes";

dotenv.config();

export const app = express();

app.disable("x-powered-by");

app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",").map((s) => s.trim()) ?? true,
    credentials: true,
  })
);
app.use(morgan("dev"));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.get("/healthz", (_req, res) => res.status(200).json({ ok: true }));

app.use("/api/auth", authRouter);
app.use("/api/expenses", expenseRouter);
app.use("/api/analytics", analyticsRouter);

// Centralized JSON error responses.
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal Server Error" });
});

