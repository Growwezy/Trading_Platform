// DataFeed adapter for openalgo-charts, fed by our own backend only — the
// chart never talks to Binance/Twelve Data directly (ARCHITECTURE.md §7).
// Fresh implementation; Test_Terminal/client/src/feed/BackendDataFeed.js was
// read as reference for the proven shape (getBars/subscribeBars), not copied.

export interface Bar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface GetBarsRequest {
  symbol: string;
  interval?: string;
  countBack?: number;
  from?: number;
  to?: number;
  signal?: AbortSignal;
}

interface SubscribeBarsRequest {
  symbol: string;
  interval?: string;
}

type OnBar = (bar: Bar) => void;
type UnsubscribeFn = () => void;

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";
const DEV_TENANT_SUBDOMAIN = import.meta.env.VITE_DEV_TENANT_SUBDOMAIN as string | undefined;

export class TraderDataFeed {
  private ws: WebSocket | null = null;
  private wsReady: Promise<WebSocket> | null = null;
  private subscriptions = new Map<string, OnBar>(); // key: "symbol:interval"
  private destroyed = false;

  async getBars(req: GetBarsRequest): Promise<Bar[]> {
    if (this.destroyed) return [];

    const params = new URLSearchParams({
      symbol: req.symbol,
      interval: req.interval ?? "1m",
      limit: String(req.countBack ?? 500),
    });

    const res = await fetch(`${API_BASE_URL}/api/trader/market/history?${params.toString()}`, {
      credentials: "include",
      signal: req.signal,
      headers: DEV_TENANT_SUBDOMAIN ? { "X-Tenant-Subdomain": DEV_TENANT_SUBDOMAIN } : undefined,
    });

    if (!res.ok) throw new Error(`Failed to load history for ${req.symbol}: HTTP ${res.status}`);
    const data = await res.json();
    return data.bars as Bar[];
  }

  subscribeBars(req: SubscribeBarsRequest, onBar: OnBar): UnsubscribeFn {
    if (this.destroyed) return () => {};

    const interval = req.interval ?? "1m";
    const key = `${req.symbol}:${interval}`;
    this.subscriptions.set(key, onBar);

    this.getWebSocket()
      .then((ws) => {
        if (this.destroyed || ws.readyState !== WebSocket.OPEN) return;
        ws.send(JSON.stringify({ type: "subscribeBars", symbol: req.symbol, interval }));
      })
      .catch((err) => console.error("[TraderDataFeed] subscribeBars failed", err));

    return () => {
      this.subscriptions.delete(key);
    };
  }

  destroy() {
    this.destroyed = true;
    this.subscriptions.clear();
    this.ws?.close();
    this.ws = null;
  }

  private getWebSocket(): Promise<WebSocket> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return Promise.resolve(this.ws);
    if (this.wsReady) return this.wsReady;

    this.wsReady = new Promise((resolve, reject) => {
      const wsBase = API_BASE_URL.replace(/^http/, "ws");
      const url = new URL(`${wsBase}/ws`);
      if (DEV_TENANT_SUBDOMAIN) url.searchParams.set("tenant", DEV_TENANT_SUBDOMAIN);

      const ws = new WebSocket(url.toString());
      this.ws = ws;

      ws.onopen = () => {
        this.wsReady = null;
        for (const key of this.subscriptions.keys()) {
          const [symbol, interval] = key.split(":");
          ws.send(JSON.stringify({ type: "subscribeBars", symbol, interval }));
        }
        resolve(ws);
      };

      ws.onmessage = (event) => {
        if (this.destroyed) return;
        try {
          const data = JSON.parse(event.data);
          if (data.type !== "bar") return;
          const key = `${data.symbol}:${data.interval}`;
          this.subscriptions.get(key)?.(data.bar);
        } catch (err) {
          console.error("[TraderDataFeed] failed to parse WS message", err);
        }
      };

      ws.onerror = () => reject(new Error("WebSocket connection error"));

      ws.onclose = () => {
        this.ws = null;
        this.wsReady = null;
        if (!this.destroyed && this.subscriptions.size > 0) {
          setTimeout(() => this.getWebSocket().catch(() => {}), 2000);
        }
      };
    });

    return this.wsReady;
  }
}
