import { FormEvent, useState } from "react";
import { usePlaceOrder } from "@growwezy/api-client";
import { useTicks } from "../lib/useTicks.js";

interface OrderPanelProps {
  symbol: string;
  canTrade: boolean;
}

export function OrderPanel({ symbol, canTrade }: OrderPanelProps) {
  const [lots, setLots] = useState("0.1");
  const [leverage, setLeverage] = useState("10");
  const [stopLoss, setStopLoss] = useState("");
  const [takeProfit, setTakeProfit] = useState("");
  const placeOrder = usePlaceOrder();
  const prices = useTicks([symbol]);
  const tick = prices[symbol];

  async function submit(side: "buy" | "sell") {
    try {
      await placeOrder.mutateAsync({
        symbolCode: symbol,
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

  function onSubmit(e: FormEvent) {
    e.preventDefault();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-lg bg-slate-900 p-4">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold">{symbol}</span>
        {tick && (
          <span className="font-mono text-xs text-slate-400">
            <span className="text-red-400">{tick.bid}</span> / <span className="text-emerald-400">{tick.ask}</span>
          </span>
        )}
      </div>

      {!canTrade && (
        <p className="rounded bg-amber-950 px-3 py-2 text-xs text-amber-300">
          Trading is disabled until your KYC is approved. You can still view charts and markets.
        </p>
      )}

      <label className="block text-xs text-slate-400">
        Lots
        <input
          type="number"
          step="0.01"
          min="0"
          value={lots}
          onChange={(e) => setLots(e.target.value)}
          className="mt-1 w-full rounded bg-slate-800 px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-sky-500"
        />
      </label>

      <label className="block text-xs text-slate-400">
        Leverage
        <input
          type="number"
          step="1"
          min="1"
          value={leverage}
          onChange={(e) => setLeverage(e.target.value)}
          className="mt-1 w-full rounded bg-slate-800 px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-sky-500"
        />
      </label>

      <div className="grid grid-cols-2 gap-2">
        <label className="block text-xs text-slate-400">
          Stop loss
          <input
            type="number"
            step="any"
            value={stopLoss}
            onChange={(e) => setStopLoss(e.target.value)}
            className="mt-1 w-full rounded bg-slate-800 px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-sky-500"
          />
        </label>
        <label className="block text-xs text-slate-400">
          Take profit
          <input
            type="number"
            step="any"
            value={takeProfit}
            onChange={(e) => setTakeProfit(e.target.value)}
            className="mt-1 w-full rounded bg-slate-800 px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-sky-500"
          />
        </label>
      </div>

      {placeOrder.isError && <p className="text-xs text-red-400">{(placeOrder.error as Error).message}</p>}

      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          type="button"
          disabled={!canTrade || placeOrder.isPending}
          onClick={() => submit("sell")}
          className="rounded bg-red-600 py-2 text-sm font-medium hover:bg-red-500 disabled:opacity-40"
        >
          Sell
        </button>
        <button
          type="button"
          disabled={!canTrade || placeOrder.isPending}
          onClick={() => submit("buy")}
          className="rounded bg-emerald-600 py-2 text-sm font-medium hover:bg-emerald-500 disabled:opacity-40"
        >
          Buy
        </button>
      </div>
    </form>
  );
}
