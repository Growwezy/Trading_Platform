import { useState } from "react";
import { useMe, useOpenPositions, useSymbols } from "@growwezy/api-client";
import { ChartWidget } from "../components/ChartWidget.js";
import { OrderPanel } from "../components/OrderPanel.js";
import { PositionsTable } from "../components/PositionsTable.js";
import { Watchlist } from "../components/Watchlist.js";

export function TradingTerminalPage() {
  const { data: me } = useMe();
  const { data: symbolsData } = useSymbols();
  const { data: positionsData } = useOpenPositions();
  const [symbolCode, setSymbolCode] = useState("BTCUSDT");

  const symbols = symbolsData?.symbols ?? [];
  const selectedSymbol = symbols.find((s) => s.code === symbolCode) ?? symbols[0];

  return (
    <div className="flex h-full">
      <Watchlist selected={symbolCode} onSelect={setSymbolCode} />

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="min-h-0 flex-1">
          {selectedSymbol && <ChartWidget symbol={selectedSymbol.code} interval="1m" />}
        </div>
        <div className="h-44 shrink-0 overflow-auto border-t border-edge bg-panel">
          <div className="border-b border-edge px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
            Open positions
          </div>
          <PositionsTable positions={positionsData?.positions ?? []} />
        </div>
      </div>

      <div className="w-72 shrink-0 overflow-y-auto border-l border-edge">
        {selectedSymbol && <OrderPanel symbol={selectedSymbol} canTrade={me?.user.canTrade ?? false} />}
      </div>
    </div>
  );
}
