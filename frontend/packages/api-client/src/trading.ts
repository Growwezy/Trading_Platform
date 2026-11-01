import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPatch, apiPost } from "./http.js";

export interface Position {
  id: string;
  symbolId: string;
  symbolCode?: string;
  side: "buy" | "sell";
  lots: string;
  units: string;
  leverage: string;
  entryPrice: string;
  stopLoss: string | null;
  takeProfit: string | null;
  requiredMargin: string;
  openedAt: string;
  unrealizedPnl?: string;
  currentClosePrice?: string;
  // Present only on closed positions (GET /positions/history).
  closePrice?: string;
  realizedPnl?: string;
  closeReason?: string;
  closedAt?: string;
}

export interface AccountSummary {
  balance: string;
  equity: string;
  marginInUse: string;
  freeMargin: string;
  marginLevel: string | null;
  openPositionsCount: number;
}

export interface MarketSymbol {
  code: string;
  assetClass: string;
  bid: string | null;
  ask: string | null;
}

const POSITIONS_KEY = ["trader", "positions", "open"] as const;
const HISTORY_KEY = ["trader", "positions", "history"] as const;
const SUMMARY_KEY = ["trader", "account", "summary"] as const;
const SYMBOLS_KEY = ["trader", "symbols"] as const;

export function useSymbols() {
  return useQuery({ queryKey: SYMBOLS_KEY, queryFn: () => apiGet<{ symbols: MarketSymbol[] }>("/api/trader/symbols") });
}

export function useOpenPositions() {
  return useQuery({
    queryKey: POSITIONS_KEY,
    queryFn: () => apiGet<{ positions: Position[] }>("/api/trader/positions/open"),
    refetchInterval: 3000,
  });
}

export function usePositionHistory() {
  return useQuery({
    queryKey: HISTORY_KEY,
    queryFn: () => apiGet<{ positions: Position[] }>("/api/trader/positions/history"),
  });
}

export function useAccountSummary() {
  return useQuery({
    queryKey: SUMMARY_KEY,
    queryFn: () => apiGet<AccountSummary>("/api/trader/account/summary"),
    refetchInterval: 3000,
  });
}

function useInvalidateTradingQueries() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: POSITIONS_KEY });
    queryClient.invalidateQueries({ queryKey: HISTORY_KEY });
    queryClient.invalidateQueries({ queryKey: SUMMARY_KEY });
  };
}

export function usePlaceOrder() {
  const invalidate = useInvalidateTradingQueries();
  return useMutation({
    mutationFn: (input: {
      symbolCode: string;
      side: "buy" | "sell";
      lots: number;
      leverage: number;
      stopLoss?: number;
      takeProfit?: number;
    }) => apiPost<{ position: Position }>("/api/trader/orders", input),
    onSuccess: invalidate,
  });
}

export function useModifyPosition() {
  const invalidate = useInvalidateTradingQueries();
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string; stopLoss?: number | null; takeProfit?: number | null }) =>
      apiPatch<{ position: Position }>(`/api/trader/positions/${id}`, input),
    onSuccess: invalidate,
  });
}

export function useClosePosition() {
  const invalidate = useInvalidateTradingQueries();
  return useMutation({
    mutationFn: (id: string) => apiPost<{ position: Position }>(`/api/trader/positions/${id}/close`),
    onSuccess: invalidate,
  });
}
