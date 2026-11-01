import { useEffect, useRef } from "react";
import { createWidget } from "openalgo-charts/widget";
import "openalgo-charts/indicators";
import "openalgo-charts/draw";
import { TraderDataFeed } from "@growwezy/chart-feed";

interface ChartWidgetProps {
  symbol: string;
  interval?: string;
}

// Fresh component (not ported from Test_Terminal/client/src/components/Terminal.jsx),
// but the createWidget call shape is the same proven one, read from that file
// and the package's own types rather than guessed.
export function ChartWidget({ symbol, interval = "1m" }: ChartWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<ReturnType<typeof createWidget> | null>(null);
  const feedRef = useRef<TraderDataFeed | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const feed = new TraderDataFeed();
    feedRef.current = feed;

    const widget = createWidget(container, {
      feed,
      symbol,
      interval,
      theme: "dark",
      persist: false,
      topbar: true,
      rail: true,
      mobile: "never",
      drawingToolbar: true,
      indicators: true,
      statusline: true,
    });
    widgetRef.current = widget;

    return () => {
      try {
        widget.destroy();
      } catch {
        // widget may already be torn down
      }
      feed.destroy();
      container.innerHTML = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (widgetRef.current && symbol) {
      widgetRef.current.setSymbol(symbol);
    }
  }, [symbol]);

  useEffect(() => {
    if (widgetRef.current && interval) {
      widgetRef.current.setInterval(interval);
    }
  }, [interval]);

  return <div ref={containerRef} className="h-full w-full" />;
}
