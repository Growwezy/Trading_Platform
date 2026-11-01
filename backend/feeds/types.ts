export interface RawTick {
  provider: "binance" | "twelvedata";
  symbolCode: string;
  price: number;
  ts: number;
}

export type TickHandler = (tick: RawTick) => void;

export interface FeedAdapter {
  subscribe(symbolCode: string, onTick: TickHandler): void;
}
