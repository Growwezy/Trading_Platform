import { useAccountSummary } from "@growwezy/api-client";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-900 p-4">
      <p className="text-xs uppercase text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

export function DashboardPage() {
  const { data, isLoading } = useAccountSummary();

  if (isLoading || !data) {
    return <div className="p-4 text-slate-500">Loading…</div>;
  }

  return (
    <div className="grid grid-cols-2 gap-4 p-4 md:grid-cols-3">
      <StatCard label="Balance" value={data.balance} />
      <StatCard label="Equity" value={data.equity} />
      <StatCard label="Margin in use" value={data.marginInUse} />
      <StatCard label="Free margin" value={data.freeMargin} />
      <StatCard label="Margin level" value={data.marginLevel ? `${Number(data.marginLevel).toFixed(1)}%` : "—"} />
      <StatCard label="Open positions" value={String(data.openPositionsCount)} />
    </div>
  );
}
