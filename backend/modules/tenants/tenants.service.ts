import type { Request } from "express";
import { prisma } from "../../lib/prisma.js";
import { RESERVED_SUBDOMAINS } from "../../config/reserved-subdomains.js";

const PLATFORM_DOMAIN = process.env.PLATFORM_DOMAIN ?? "localhost";

/**
 * Resolves the tenant for a request's hostname (ARCHITECTURE.md §2).
 * - hostname === PLATFORM_DOMAIN            -> master site, no tenant (null)
 * - hostname === "<sub>.PLATFORM_DOMAIN"    -> look up tenant by subdomain
 * - dev fallback (PLATFORM_DOMAIN=localhost, no real subdomain DNS locally):
 *   an `x-tenant-subdomain` header or `?tenant=` query param stands in for
 *   the subdomain. Documented as dev-only — real wildcard DNS replaces this.
 */
export async function resolveTenantFromRequest(req: Request) {
  const hostname = req.hostname;

  let subdomain: string | null = null;

  if (hostname === PLATFORM_DOMAIN) {
    const devOverride =
      (req.headers["x-tenant-subdomain"] as string | undefined) ??
      (req.query.tenant as string | undefined);
    if (PLATFORM_DOMAIN === "localhost" && devOverride) {
      subdomain = devOverride;
    } else {
      return null; // master site / Super Admin
    }
  } else if (hostname.endsWith(`.${PLATFORM_DOMAIN}`)) {
    subdomain = hostname.slice(0, -(PLATFORM_DOMAIN.length + 1));
  } else {
    return null;
  }

  if (!subdomain || RESERVED_SUBDOMAINS.includes(subdomain)) {
    return null;
  }

  return prisma.tenant.findUnique({ where: { subdomain } });
}
