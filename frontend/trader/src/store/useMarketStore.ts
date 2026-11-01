import { create } from "zustand";

interface PriceTick {
  bid: string;
  ask: string;
  ts: number;
}

interface MarketState {
  prices: Record<string, PriceTick>;
  setPrice: (symbol: string, tick: PriceTick) => void;
}

export const useMarketStore = create<MarketState>((set) => ({
  prices: {},
  setPrice: (symbol, tick) =>
    set((state) => ({ prices: { ...state.prices, [symbol]: tick } })),
}));
