import type { NextFunction, Request, Response } from "express";
import { resolveTenantFromRequest } from "../modules/tenants/tenants.service.js";

export async function tenantMiddleware(req: Request, _res: Response, next: NextFunction) {
  req.tenant = await resolveTenantFromRequest(req);
  next();
}
