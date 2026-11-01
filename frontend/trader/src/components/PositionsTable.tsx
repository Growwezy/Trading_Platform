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
    return <p className="px-3 py-3 text-xs text-muted">No open positions.</p>;
  }

  return (
    <table className="w-full font-mono font-tabular text-[11px]">
      <thead className="sticky top-0 bg-panel text-left text-[10px] uppercase tracking-wide text-muted">
        <tr>
          <th className="px-3 py-1.5 font-medium">Symbol</th>
          <th className="px-3 py-1.5 font-medium">Side</th>
          <th className="px-3 py-1.5 text-right font-medium">Lots</th>
          <th className="px-3 py-1.5 text-right font-medium">Entry</th>
          <th className="px-3 py-1.5 font-medium">SL / TP</th>
          <th className="px-3 py-1.5 text-right font-medium">PnL</th>
          <th className="px-3 py-1.5"></th>
        </tr>
      </thead>
      <tbody>
        {positions.map((p) => (
          <tr key={p.id} className="border-t border-edge/60 hover:bg-elevated/40">
            <td className="px-3 py-1.5">
              <span className="rounded bg-elevated px-1.5 py-0.5 text-primary">{p.symbolCode ?? p.symbolId}</span>
            </td>
            <td className={`px-3 py-1.5 uppercase ${p.side === "buy" ? "text-up" : "text-down"}`}>{p.side}</td>
            <td className="px-3 py-1.5 text-right text-primary">{p.lots}</td>
            <td className="px-3 py-1.5 text-right text-primary">{p.entryPrice}</td>
            <td className="px-3 py-1.5">
              {editingId === p.id ? (
                <div className="flex gap-1">
                  <input
                    value={slDraft}
                    onChange={(e) => setSlDraft(e.target.value)}
                    placeholder="SL"
                    className="w-16 rounded border border-edge bg-elevated px-1 py-0.5 text-[10px]"
                  />
                  <input
                    value={tpDraft}
                    onChange={(e) => setTpDraft(e.target.value)}
                    placeholder="TP"
                    className="w-16 rounded border border-edge bg-elevated px-1 py-0.5 text-[10px]"
                  />
                  <button onClick={() => saveEdit(p.id)} className="text-[10px] text-accent">
                    Save
                  </button>
                </div>
              ) : (
                <button onClick={() => startEdit(p)} className="text-muted hover:text-primary">
                  {p.stopLoss ?? "—"} / {p.takeProfit ?? "—"}
                </button>
              )}
            </td>
            <td className={`px-3 py-1.5 text-right ${Number(p.unrealizedPnl ?? 0) >= 0 ? "text-up" : "text-down"}`}>
              {p.unrealizedPnl ?? "—"}
            </td>
            <td className="px-3 py-1.5">
              <button
                onClick={() => closePosition.mutate(p.id)}
                disabled={closePosition.isPending}
                className="rounded border border-edge px-2 py-0.5 text-[10px] text-primary hover:bg-elevated disabled:opacity-50"
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
