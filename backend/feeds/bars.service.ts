export interface Bar {
  time: number; // UTC seconds
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const BINANCE_INTERVALS = new Set(["1m", "5m", "15m", "30m", "1h", "4h", "1d", "1w"]);

function normalizeBinanceInterval(interval: string) {
  const norm = interval.toLowerCase();
  if (norm === "1d" || norm === "d") return "1d";
  if (norm === "1w" || norm === "w") return "1w";
  return BINANCE_INTERVALS.has(norm) ? norm : "1m";
}

async function fetchBinanceKlines(symbolCode: string, interval: string, limit: number): Promise<Bar[]> {
  const params = new URLSearchParams({
    symbol: symbolCode.toUpperCase(),
    interval: normalizeBinanceInterval(interval),
    limit: String(Math.min(Math.max(limit, 1), 1000)),
  });

  const res = await fetch(`https://api.binance.com/api/v3/klines?${params.toString()}`);
  if (!res.ok) throw new Error(`Binance klines request failed: HTTP ${res.status}`);

  const rows = (await res.json()) as number[][];
  return rows
    .map((row) => ({
      time: Math.floor(Number(row[0]) / 1000),
      open: Number(row[1]),
      high: Number(row[2]),
      low: Number(row[3]),
      close: Number(row[4]),
      volume: Number(row[5]),
    }))
    .sort((a, b) => a.time - b.time);
}

const TWELVE_DATA_INTERVAL_MAP: Record<string, string> = {
  "1m": "1min",
  "5m": "5min",
  "15m": "15min",
  "30m": "30min",
  "1h": "1h",
  "4h": "4h",
  "1d": "1day",
  "d": "1day",
  "1w": "1week",
  "w": "1week",
};

function normalizeTwelveDataInterval(interval: string) {
  return TWELVE_DATA_INTERVAL_MAP[interval.toLowerCase()] ?? "1min";
}

/** "EURUSD" -> "EUR/USD" — same convention as backend/feeds/twelvedata.feed.ts. */
function toTwelveDataSymbol(code: string) {
  return `${code.slice(0, -3)}/${code.slice(-3)}`;
}

function parseTwelveDataTime(dt: string) {
  const trimmed = dt.trim();
  const iso = trimmed.length === 10 ? `${trimmed}T00:00:00Z` : `${trimmed.replace(" ", "T")}Z`;
  return Math.floor(Date.parse(iso) / 1000);
}

async function fetchTwelveDataSeries(symbolCode: string, interval: string, limit: number): Promise<Bar[]> {
  const apiKey = process.env.TWELVE_DATA_API_KEY;
  if (!apiKey) throw new Error("TWELVE_DATA_API_KEY is not set");

  const params = new URLSearchParams({
    symbol: toTwelveDataSymbol(symbolCode),
    interval: normalizeTwelveDataInterval(interval),
    outputsize: String(Math.min(Math.max(limit, 1), 5000)),
    apikey: apiKey,
    format: "JSON",
  });

  const res = await fetch(`https://api.twelvedata.com/time_series?${params.toString()}`);
  if (!res.ok) throw new Error(`Twelve Data time_series request failed: HTTP ${res.status}`);

  const data = (await res.json()) as { status?: string; message?: string; values?: Record<string, string>[] };
  if (data.status === "error") throw new Error(data.message ?? "Twelve Data error");
  if (!Array.isArray(data.values)) throw new Error(`No data for ${symbolCode}`);

  return data.values
    .map((v: Record<string, string>) => ({
      time: parseTwelveDataTime(v.datetime),
      open: Number(v.open),
      high: Number(v.high),
      low: Number(v.low),
      close: Number(v.close),
      volume: v.volume ? Number(v.volume) : 0,
    }))
    .filter((b: Bar) => Number.isFinite(b.time) && Number.isFinite(b.close))
    .sort((a: Bar, b: Bar) => a.time - b.time);
}

/**
 * History comes straight from the provider's own REST API, not our own tick
 * cache — same approach proven in Test_Terminal/server/services. Since
 * pricing.service.ts's markup is symmetric around the raw price, these raw
 * candles are already consistent with the tenant-adjusted mid — no further
 * transformation needed for display purposes.
 */
export async function fetchHistoricalBars(
  provider: "binance" | "twelvedata",
  symbolCode: string,
  interval: string,
  limit: number,
): Promise<Bar[]> {
  return provider === "binance"
    ? fetchBinanceKlines(symbolCode, interval, limit)
    : fetchTwelveDataSeries(symbolCode, interval, limit);
}

export { normalizeBinanceInterval, normalizeTwelveDataInterval, toTwelveDataSymbol };
