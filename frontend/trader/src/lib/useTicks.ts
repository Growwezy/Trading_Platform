import { useEffect } from "react";
import { useMarketStore } from "../store/useMarketStore.js";
import { subscribeTicks } from "./tickSocket.js";

export function useTicks(symbols: string[]) {
  const key = symbols.join(",");

  useEffect(() => {
    if (symbols.length > 0) subscribeTicks(symbols);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return useMarketStore((state) => state.prices);
}
