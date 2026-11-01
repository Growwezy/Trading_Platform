import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../lib/app-error.js";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorMiddleware(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: { code: "validation_error", message: err.issues.map((i) => i.message).join(", ") },
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.status).json({ error: { code: "app_error", message: err.message } });
    return;
  }

  console.error(err);
  res.status(500).json({ error: { code: "internal_error", message: "Something went wrong." } });
}
