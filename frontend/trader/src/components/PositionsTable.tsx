import { useState } from "react";
import { useClosePosition, useModifyPosition, type Position } from "@growwezy/api-client";

interface PositionsTableProps {
  positions: Position[];
}

export function PositionsTable({ positions }: PositionsTableProps) {
  const closePosition = useClosePosition();
  const modifyPosition = useModifyPosition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [slDraft, setSlDraft] = useState("");
  const [tpDraft, setTpDraft] = useState("");

  function startEdit(p: Position) {
    setEditingId(p.id);
    setSlDraft(p.stopLoss ?? "");
    setTpDraft(p.takeProfit ?? "");
  }

  async function saveEdit(id: string) {
    await modifyPosition.mutateAsync({
      id,
      stopLoss: slDraft ? Number(slDraft) : null,
      takeProfit: tpDraft ? Number(tpDraft) : null,
    });
    setEditingId(null);
  }

  if (positions.length === 0) {
    return <p className="p-4 text-sm text-slate-500">No open positions.</p>;
  }

  return (
    <table className="w-full text-sm">
      <thead className="text-left text-xs uppercase text-slate-500">
        <tr>
          <th className="px-3 py-2">Symbol</th>
          <th className="px-3 py-2">Side</th>
          <th className="px-3 py-2">Lots</th>
          <th className="px-3 py-2">Entry</th>
          <th className="px-3 py-2">SL / TP</th>
          <th className="px-3 py-2">PnL</th>
          <th className="px-3 py-2"></th>
        </tr>
      </thead>
      <tbody>
        {positions.map((p) => (
          <tr key={p.id} className="border-t border-slate-800">
            <td className="px-3 py-2">{p.symbolCode ?? p.symbolId}</td>
            <td className={`px-3 py-2 ${p.side === "buy" ? "text-emerald-400" : "text-red-400"}`}>{p.side}</td>
            <td className="px-3 py-2">{p.lots}</td>
            <td className="px-3 py-2">{p.entryPrice}</td>
            <td className="px-3 py-2">
              {editingId === p.id ? (
                <div className="flex gap-1">
                  <input
                    value={slDraft}
                    onChange={(e) => setSlDraft(e.target.value)}
                    placeholder="SL"
                    className="w-16 rounded bg-slate-800 px-1 py-0.5 text-xs"
                  />
                  <input
                    value={tpDraft}
                    onChange={(e) => setTpDraft(e.target.value)}
                    placeholder="TP"
                    className="w-16 rounded bg-slate-800 px-1 py-0.5 text-xs"
                  />
                  <button onClick={() => saveEdit(p.id)} className="text-xs text-sky-400">
                    Save
                  </button>
                </div>
              ) : (
                <button onClick={() => startEdit(p)} className="text-xs text-slate-400 hover:text-slate-200">
                  {p.stopLoss ?? "—"} / {p.takeProfit ?? "—"}
                </button>
              )}
            </td>
            <td className={`px-3 py-2 ${Number(p.unrealizedPnl ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}>
              {p.unrealizedPnl ?? "—"}
            </td>
            <td className="px-3 py-2">
              <button
                onClick={() => closePosition.mutate(p.id)}
                disabled={closePosition.isPending}
                className="rounded bg-slate-800 px-2 py-1 text-xs hover:bg-slate-700 disabled:opacity-50"
              >
                Close
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
