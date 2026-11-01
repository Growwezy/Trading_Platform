import { Router } from "express";
import { getTenantConfig } from "./tenants.controller.js";

export const tenantsRouter = Router();

// GET /api/tenant/config — public, per API_SPEC.md.
tenantsRouter.get("/config", getTenantConfig);
