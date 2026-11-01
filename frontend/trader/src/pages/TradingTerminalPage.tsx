import { useState } from "react";
import { useMe, useOpenPositions, useSymbols } from "@growwezy/api-client";
import { ChartWidget } from "../components/ChartWidget.js";
import { OrderPanel } from "../components/OrderPanel.js";
import { PositionsTable } from "../components/PositionsTable.js";

export function TradingTerminalPage() {
  const { data: me } = useMe();
  const { data: symbolsData } = useSymbols();
  const { data: positionsData } = useOpenPositions();
  const [symbol, setSymbol] = useState("BTCUSDT");

  const symbols = symbolsData?.symbols ?? [];

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-slate-800 bg-slate-900 px-3 py-2">
        {symbols.map((s) => (
          <button
            key={s.code}
            onClick={() => setSymbol(s.code)}
            className={`rounded px-3 py-1 text-sm ${
              symbol === s.code ? "bg-sky-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            {s.code}
          </button>
        ))}
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1">
          <ChartWidget symbol={symbol} interval="1m" />
        </div>
        <div className="w-72 shrink-0 border-l border-slate-800 p-3">
          <OrderPanel symbol={symbol} canTrade={me?.user.canTrade ?? false} />
        </div>
      </div>

      <div className="h-48 shrink-0 overflow-auto border-t border-slate-800">
        <PositionsTable positions={positionsData?.positions ?? []} />
      </div>
    </div>
  );
}
