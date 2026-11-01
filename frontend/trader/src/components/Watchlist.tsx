import { useEffect, useRef, useState } from "react";
import { useSymbols } from "@growwezy/api-client";
import { useTicks } from "../lib/useTicks.js";

interface WatchlistProps {
  selected: string;
  onSelect: (symbol: string) => void;
}

function PriceCell({ symbol, field, value }: { symbol: string; field: "bid" | "ask"; value: string | null | undefined }) {
  const prevRef = useRef<number | null>(null);
  const [direction, setDirection] = useState<"up" | "down" | null>(null);

  useEffect(() => {
    if (value === null || value === undefined) return;
    const num = Number(value);
    if (prevRef.current !== null && num !== prevRef.current) {
      setDirection(num > prevRef.current ? "up" : "down");
    }
    prevRef.current = num;
  }, [value]);

  return (
    <span className={`font-mono font-tabular ${direction === "up" ? "text-up" : direction === "down" ? "text-down" : "text-muted"}`}>
      {value ?? "—"}
    </span>
  );
}

export function Watchlist({ selected, onSelect }: WatchlistProps) {
  const { data } = useSymbols();
  const symbols = data?.symbols ?? [];
  const codes = symbols.map((s) => s.code);
  const liveTicks = useTicks(codes);

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-edge bg-panel">
      <div className="border-b border-edge px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted">
        Watchlist
      </div>
      <div className="flex-1 overflow-auto">
        {symbols.map((s) => {
          const tick = liveTicks[s.code];
          const bid = tick?.bid ?? s.bid;
          const ask = tick?.ask ?? s.ask;
          const isSelected = s.code === selected;
          return (
            <button
              key={s.code}
              onClick={() => onSelect(s.code)}
              className={`flex w-full items-center justify-between border-b border-edge/50 px-3 py-2 text-left text-xs transition-colors ${
                isSelected ? "bg-elevated" : "hover:bg-elevated/50"
              }`}
            >
              <div>
                <div className={`font-medium ${isSelected ? "text-accent" : "text-primary"}`}>{s.code}</div>
                <div className="text-[10px] uppercase text-muted">{s.assetClass}</div>
              </div>
              <div className="text-right text-[11px] leading-tight">
                <div>
                  <PriceCell symbol={s.code} field="ask" value={ask} />
                </div>
                <div>
                  <PriceCell symbol={s.code} field="bid" value={bid} />
                </div>
              </div>
            </button>
          );
        })}
        {symbols.length === 0 && <p className="p-3 text-xs text-muted">No symbols enabled.</p>}
      </div>
    </aside>
  );
}
