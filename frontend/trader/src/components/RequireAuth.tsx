import { Navigate, Outlet } from "react-router-dom";
import { useMe } from "@growwezy/api-client";

export function RequireAuth() {
  const { data, isLoading, isError } = useMe();

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center text-slate-400">Loading…</div>;
  }

  if (isError || !data?.user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
