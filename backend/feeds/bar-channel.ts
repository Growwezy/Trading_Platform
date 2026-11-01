export function barChannelName(symbolCode: string, interval: string) {
  return `bars:${symbolCode}:${interval}`;
}

const INTERVAL_SECONDS: Record<string, number> = {
  "1m": 60,
  "5m": 300,
  "15m": 900,
  "30m": 1800,
  "1h": 3600,
  "4h": 14400,
  "1d": 86400,
  "1w": 604800,
};

export function intervalToSeconds(interval: string): number {
  return INTERVAL_SECONDS[interval.toLowerCase()] ?? 60;
}
