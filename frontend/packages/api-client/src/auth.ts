import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "./http.js";

export interface TraderMe {
  id: string;
  email: string;
  role: string;
  balance: string;
  kycStatus: string;
  canTrade: boolean;
}

export const ME_QUERY_KEY = ["trader", "me"] as const;

export function useMe(enabled = true) {
  return useQuery({
    queryKey: ME_QUERY_KEY,
    queryFn: () => apiGet<{ user: TraderMe }>("/api/auth/trader/me"),
    enabled,
    retry: false,
  });
}

export function useSignup() {
  return useMutation({
    mutationFn: (input: { email: string; password: string; referralCode?: string }) =>
      apiPost<{ user: { id: string; email: string } }>("/api/auth/trader/signup", input),
  });
}

export function useVerifyEmail() {
  return useMutation({
    mutationFn: (input: { email: string; code: string }) =>
      apiPost<{ ok: true }>("/api/auth/trader/verify-email", input),
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { email: string; password: string }) =>
      apiPost<{ user: unknown }>("/api/auth/trader/login", input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY }),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiPost<{ ok: true }>("/api/auth/trader/logout"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ME_QUERY_KEY }),
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (input: { email: string }) => apiPost<{ ok: true }>("/api/auth/trader/forgot-password", input),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (input: { email: string; code: string; newPassword: string }) =>
      apiPost<{ ok: true }>("/api/auth/trader/reset-password", input),
  });
}
