import { useMemo, useState } from "react";
import { usePlaceOrder, type MarketSymbol } from "@growwezy/api-client";
import { useTicks } from "../lib/useTicks.js";

interface OrderPanelProps {
  symbol: MarketSymbol;
  canTrade: boolean;
}

export function OrderPanel({ symbol, canTrade }: OrderPanelProps) {
  const [lots, setLots] = useState("0.1");
  const [leverage, setLeverage] = useState(symbol.leverageCap);
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const placeOrder = usePlaceOrder();
  const prices = useTicks([symbol.code]);
  const tick = prices[symbol.code] ?? { bid: symbol.bid, ask: symbol.ask };

  const preview = useMemo(() => {
    const lotsNum = Number(lots);
    const leverageNum = Number(leverage);
    const price = Number(tick.ask ?? 0);
    if (!lotsNum || !leverageNum || !price) return null;
    const units = lotsNum * Number(symbol.contractSize);
    const notional = units * price;
    return { notional, margin: notional / leverageNum };
  }, [lots, leverage, tick.ask, symbol.contractSize]);

  async function submit(side: "buy" | "sell") {
    try {
      await placeOrder.mutateAsync({
        symbolCode: symbol.code,
        side,
        lots: Number(lots),
        leverage: Number(leverage),
        stopLoss: stopLoss ? Number(stopLoss) : undefined,
        takeProfit: takeProfit ? Number(takeProfit) : undefined,
      });
      setStopLoss("");
      setTakeProfit("");
    } catch {
      // error surfaced below
    }
  }

  return (
    <div className="flex h-full flex-col gap-3 bg-panel p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted">Place order</div>

      {!canTrade && (
        <p className="rounded border border-amber-900 bg-amber-950/60 px-2 py-1.5 text-[11px] text-amber-300">
          KYC approval required before trading. Charts and markets are view-only.
        </p>
      )}

      <div className="grid grid-cols-2 gap-1.5">
        <button
          type="button"
          disabled={!canTrade || placeOrder.isPending}
          onClick={() => submit("sell")}
          className="flex flex-col items-center rounded bg-down/15 py-2 text-down hover:bg-down/25 disabled:opacity-40"
        >
          <span className="text-[10px] font-semibold uppercase tracking-wide">Sell</span>
          <span className="font-mono font-tabular text-sm">{tick.bid ?? "—"}</span>
        </button>
        <button
          type="button"
          disabled={!canTrade || placeOrder.isPending}
          onClick={() => submit("buy")}
          className="flex flex-col items-center rounded bg-up/15 py-2 text-up hover:bg-up/25 disabled:opacity-40"
        >
          <span className="text-[10px] font-semibold uppercase tracking-wide">Buy</span>
          <span className="font-mono font-tabular text-sm">{tick.ask ?? "—"}</span>
        </button>
      </div>

      <label className="block text-[11px] text-muted">
        Lots <span className="text-[10px]">({symbol.minLot}–{symbol.maxLot})</span>
        <input
          type="number"
          step="0.01"
          min={symbol.minLot}
          max={symbol.maxLot}
          value={lots}
          onChange={(e) => setLots(e.target.value)}
          className="mt-1 w-full rounded border border-edge bg-elevated px-2 py-1.5 font-mono text-sm outline-none focus:border-accent"
        />
      </label>

      <label className="block text-[11px] text-muted">
        Leverage <span className="text-[10px]">(max {symbol.leverageCap}x)</span>
        <input
          type="number"
          step="1"
          min="1"
          max={symbol.leverageCap}
          value={leverage}
          onChange={(e) => setLeverage(e.target.value)}
          className="mt-1 w-full rounded border border-edge bg-elevated px-2 py-1.5 font-mono text-sm outline-none focus:border-accent"
        />
      </label>

      <div className="grid grid-cols-2 gap-2">
        <label className="block text-[11px] text-muted">
          Stop loss
          <input
            type="number"
            step="any"
            value={stopLoss}
            onChange={(e) => setStopLoss(e.target.value)}
            className="mt-1 w-full rounded border border-edge bg-elevated px-2 py-1.5 font-mono text-sm outline-none focus:border-accent"
          />
        </label>
        <label className="block text-[11px] text-muted">
          Take profit
          <input
            type="number"
            step="any"
            value={takeProfit}
            onChange={(e) => setTakeProfit(e.target.value)}
            className="mt-1 w-full rounded border border-edge bg-elevated px-2 py-1.5 font-mono text-sm outline-none focus:border-accent"
          />
        </label>
      </div>

      {preview && (
        <div className="space-y-0.5 rounded border border-edge bg-elevated/50 px-2 py-1.5 font-mono font-tabular text-[11px] text-muted">
          <div className="flex justify-between">
            <span>Notional</span>
            <span className="text-primary">{preview.notional.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between">
            <span>Est. margin</span>
            <span className="text-primary">{preview.margin.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
          </div>
        </div>
      )}

      {placeOrder.isError && <p className="text-[11px] text-down">{(placeOrder.error as Error).message}</p>}
    </div>
  );
}
