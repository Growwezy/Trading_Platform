import type { NextFunction, Request, Response } from "express";

export function requireTraderSession(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId || req.session.tenantId !== (req.tenant?.id ?? null)) {
    res.status(401).json({ error: { code: "no_session", message: "Not logged in." } });
    return;
  }
  next();
}
