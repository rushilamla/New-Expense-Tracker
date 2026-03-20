import { Router } from "express";
import {
  getCsrfToken,
  login,
  logout,
  me,
  register,
} from "../controllers/authController";
import { requireAuth, requireCsrfForStateChange } from "../middleware/authMiddleware";

export const authRouter = Router();

authRouter.get("/csrf", getCsrfToken);
authRouter.post("/register", register);
authRouter.post("/login", login);
authRouter.post("/logout", requireAuth, requireCsrfForStateChange, logout);
authRouter.get("/me", requireAuth, me);

// If you add more authenticated state-changing auth routes later,
// wrap them with requireCsrfForStateChange.

