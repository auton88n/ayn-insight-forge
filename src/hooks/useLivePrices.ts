import { useEffect, useState, useRef } from 'react';

interface LivePrice {
  price: number;
  timestamp: number;
}

export function useLivePrices(tickers: string[]): {
  prices: Record<string, LivePrice>;
  connected: boolean;
} {
  const [prices, setPrices] = useState<Record<string, LivePrice>>({});
  const [connected, setConnected] = useState(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const tickersKey = JSON.stringify(tickers);

  useEffect(() => {
    if (tickers.length === 0) return;

    let ws: WebSocket;
    let reconnectTimeout: ReturnType<typeof setTimeout>;
    let attempts = 0;
    let destroyed = false;

    function connect() {
      ws = new WebSocket('wss://dfkoxuokfkttjhfjcecx.supabase.co/functions/v1/ws-relay');

      ws.onopen = () => {
        if (destroyed) { ws.close(); return; }
        setConnected(true);
        attempts = 0;
        for (const ticker of tickers) {
          ws.send(JSON.stringify({ op: 'SUBSCRIBE', topic: 'TRADE', symbol: ticker }));
        }
        console.log('[useLivePrices] Connected, subscribed to:', tickers);
      };

      ws.onmessage = async (event) => {
        try {
          const text = event.data instanceof Blob
            ? await event.data.text()
            : (event.data as string);
          const msg = JSON.parse(text);

          // Respond to server heartbeat to keep connection alive
          if (msg.op === 'PING') {
            ws.send(JSON.stringify({ op: 'PONG', timestamp: msg.timestamp }));
            return;
          }

          if (msg.topic === 'TRADE' && msg.symbol && Array.isArray(msg.data) && msg.data.length > 0) {
            const latestTrade = msg.data[0];
            const price = parseFloat(latestTrade.price);
            if (!isNaN(price)) {
              setPrices(prev => ({
                ...prev,
                [msg.symbol]: { price, timestamp: latestTrade.timestamp ?? Date.now() },
              }));
            }
          }
        } catch (e) {
          console.error('[useLivePrices] parse error', e);
        }
      };

      ws.onerror = () => {
        setConnected(false);
      };

      ws.onclose = () => {
        setConnected(false);
        if (!destroyed && attempts < 5) {
          const delay = Math.min(1000 * Math.pow(2, attempts), 30000);
          attempts++;
          console.log(`[useLivePrices] Reconnecting in ${delay}ms (attempt ${attempts})`);
          reconnectTimeout = setTimeout(connect, delay);
        }
      };
    }

    connect();

    return () => {
      destroyed = true;
      clearTimeout(reconnectTimeout);
      if (ws && ws.readyState === WebSocket.OPEN) {
        for (const ticker of tickers) {
          ws.send(JSON.stringify({ op: 'UNSUBSCRIBE', topic: 'TRADE', symbol: ticker }));
        }
        ws.close();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tickersKey]);

  return { prices, connected };
}
