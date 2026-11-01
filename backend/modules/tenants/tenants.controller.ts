import type { Request, Response } from "express";

export function getTenantConfig(req: Request, res: Response) {
  if (!req.tenant) {
    res.json({ tenant: null });
    return;
  }

  const { companyName, logoUrl, brandColors, subdomain } = req.tenant;
  res.json({
    tenant: { subdomain, companyName, logoUrl, brandColors },
  });
}
