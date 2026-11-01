import { useQuery } from "@tanstack/react-query";
import { apiGet } from "./http.js";

export interface TenantConfig {
  subdomain: string;
  companyName: string;
  logoUrl: string | null;
  brandColors: { accent?: string } | null;
}

export function useTenantConfig() {
  return useQuery({
    queryKey: ["tenant", "config"],
    queryFn: () => apiGet<{ tenant: TenantConfig | null }>("/api/tenant/config"),
    staleTime: 60_000,
  });
}
