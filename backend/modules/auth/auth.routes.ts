import { Router } from "express";
import { requireTraderSession } from "../../middleware/require-trader-session.middleware.js";
import * as authController from "./auth.controller.js";

export const traderAuthRouter = Router();

traderAuthRouter.post("/signup", authController.signup);
traderAuthRouter.post("/verify-email", authController.verifyEmail);
traderAuthRouter.post("/login", authController.login);
traderAuthRouter.post("/forgot-password", authController.forgotPassword);
traderAuthRouter.post("/reset-password", authController.resetPassword);
traderAuthRouter.post("/logout", authController.logout);
traderAuthRouter.get("/me", requireTraderSession, authController.me);
