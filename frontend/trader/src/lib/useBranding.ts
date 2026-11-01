import { useEffect } from "react";
import { useTenantConfig } from "@growwezy/api-client";
import { applyBranding } from "./applyBranding.js";

export function useBranding() {
  const { data } = useTenantConfig();
  const tenant = data?.tenant ?? null;

  useEffect(() => {
    applyBranding(tenant);
    document.title = tenant ? `${tenant.companyName} — Trading Terminal` : "Trading Terminal";
  }, [tenant]);

  return tenant;
}
