import { useAccountSummary } from "@growwezy/api-client";

function fmt(value: string | null | undefined, suffix = "") {
  if (value === null || value === undefined) return "—";
  return `${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })}${suffix}`;
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "up" | "down" }) {
  return (
    <div className="rounded border border-edge bg-panel px-4 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">{label}</p>
      <p className={`mt-1 font-mono font-tabular text-xl ${tone === "up" ? "text-up" : tone === "down" ? "text-down" : "text-primary"}`}>
        {value}
      </p>
    </div>
  );
}

export function DashboardPage() {
  const { data, isLoading } = useAccountSummary();

  if (isLoading || !data) {
    return <div className="p-4 text-sm text-muted">Loading…</div>;
  }

  const marginLevel = data.marginLevel ? Number(data.marginLevel) : null;
  const marginTone = marginLevel === null ? undefined : marginLevel < 100 ? "down" : marginLevel < 150 ? undefined : "up";

  return (
    <div className="grid grid-cols-2 gap-3 p-4 md:grid-cols-3 lg:grid-cols-6">
      <Stat label="Balance" value={fmt(data.balance)} />
      <Stat label="Equity" value={fmt(data.equity)} />
      <Stat label="Margin in use" value={fmt(data.marginInUse)} />
      <Stat label="Free margin" value={fmt(data.freeMargin)} />
      <Stat label="Margin level" value={fmt(data.marginLevel, "%")} tone={marginTone as "up" | "down" | undefined} />
      <Stat label="Open positions" value={String(data.openPositionsCount)} />
    </div>
  );
}
