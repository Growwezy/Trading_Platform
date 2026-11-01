import { useOpenPositions, usePositionHistory } from "@growwezy/api-client";
import { PositionsTable } from "../components/PositionsTable.js";

export function HoldingsPage() {
  const { data: open } = useOpenPositions();
  const { data: history } = usePositionHistory();

  return (
    <div className="space-y-4 overflow-auto p-4">
      <section>
        <h2 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted">Open positions</h2>
        <div className="rounded border border-edge bg-panel">
          <PositionsTable positions={open?.positions ?? []} />
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted">History</h2>
        <div className="overflow-auto rounded border border-edge bg-panel">
          <table className="w-full font-mono font-tabular text-[11px]">
            <thead className="text-left text-[10px] uppercase tracking-wide text-muted">
              <tr>
                <th className="px-3 py-1.5 font-medium">Symbol</th>
                <th className="px-3 py-1.5 font-medium">Side</th>
                <th className="px-3 py-1.5 text-right font-medium">Lots</th>
                <th className="px-3 py-1.5 text-right font-medium">Entry</th>
                <th className="px-3 py-1.5 text-right font-medium">Close</th>
                <th className="px-3 py-1.5 font-medium">Reason</th>
                <th className="px-3 py-1.5 text-right font-medium">Realized PnL</th>
              </tr>
            </thead>
            <tbody>
              {(history?.positions ?? []).map((p) => (
                <tr key={p.id} className="border-t border-edge/60">
                  <td className="px-3 py-1.5">
                    <span className="rounded bg-elevated px-1.5 py-0.5 text-primary">{p.symbolCode}</span>
                  </td>
                  <td className={`px-3 py-1.5 uppercase ${p.side === "buy" ? "text-up" : "text-down"}`}>{p.side}</td>
                  <td className="px-3 py-1.5 text-right text-primary">{p.lots}</td>
                  <td className="px-3 py-1.5 text-right text-primary">{p.entryPrice}</td>
                  <td className="px-3 py-1.5 text-right text-primary">{p.closePrice}</td>
                  <td className="px-3 py-1.5 text-muted">{p.closeReason}</td>
                  <td className={`px-3 py-1.5 text-right ${Number(p.realizedPnl ?? 0) >= 0 ? "text-up" : "text-down"}`}>
                    {p.realizedPnl}
                  </td>
                </tr>
              ))}
              {(history?.positions ?? []).length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-4 text-center text-muted">
                    No closed trades yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
