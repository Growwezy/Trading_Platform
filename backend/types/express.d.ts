import type { Tenant } from "@prisma/client";
import "express-session";

declare global {
  namespace Express {
    interface Request {
      tenant: Tenant | null;
    }
  }
}

declare module "express-session" {
  interface SessionData {
    userId?: string;
    tenantId?: string | null;
    role?: string;
  }
}
