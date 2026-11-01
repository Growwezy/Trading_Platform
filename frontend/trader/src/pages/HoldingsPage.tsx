import { useOpenPositions, usePositionHistory } from "@growwezy/api-client";
import { PositionsTable } from "../components/PositionsTable.js";

export function HoldingsPage() {
  const { data: open } = useOpenPositions();
  const { data: history } = usePositionHistory();

  return (
    <div className="space-y-6 p-4">
      <section>
        <h2 className="mb-2 text-sm font-semibold text-slate-300">Open positions</h2>
        <div className="rounded-lg bg-slate-900">
          <PositionsTable positions={open?.positions ?? []} />
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-slate-300">History</h2>
        <div className="overflow-auto rounded-lg bg-slate-900">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2">Symbol</th>
                <th className="px-3 py-2">Side</th>
                <th className="px-3 py-2">Lots</th>
                <th className="px-3 py-2">Entry</th>
                <th className="px-3 py-2">Close</th>
                <th className="px-3 py-2">Reason</th>
                <th className="px-3 py-2">Realized PnL</th>
              </tr>
            </thead>
            <tbody>
              {(history?.positions ?? []).map((p) => (
                <tr key={p.id} className="border-t border-slate-800">
                  <td className="px-3 py-2">{p.symbolCode}</td>
                  <td className={`px-3 py-2 ${p.side === "buy" ? "text-emerald-400" : "text-red-400"}`}>{p.side}</td>
                  <td className="px-3 py-2">{p.lots}</td>
                  <td className="px-3 py-2">{p.entryPrice}</td>
                  <td className="px-3 py-2">{p.closePrice}</td>
                  <td className="px-3 py-2 text-slate-400">{p.closeReason}</td>
                  <td
                    className={`px-3 py-2 ${Number(p.realizedPnl ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}
                  >
                    {p.realizedPnl}
                  </td>
                </tr>
              ))}
              {(history?.positions ?? []).length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-4 text-center text-slate-500">
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
