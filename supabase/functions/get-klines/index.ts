const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Interval mapping: frontend short-hand → Pionex API format
const INTERVAL_MAP: Record<string, string> = {
  '1m': '1M',
  '5m': '5M',
  '15m': '15M',
  '1h': '60M',
};

async function signPionexRequest(path: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(path));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol, interval = '1m', limit = 100 } = await req.json();

    if (!symbol) {
      return new Response(JSON.stringify({ error: 'symbol is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('PIONEX_API_KEY');
    const apiSecret = Deno.env.get('PIONEX_API_SECRET');

    if (!apiKey || !apiSecret) {
      return new Response(JSON.stringify({ error: 'Pionex API credentials not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const pionexInterval = INTERVAL_MAP[interval] ?? '1MIN';
    const timestamp = Date.now().toString();
    const path = `/api/v1/market/klines?symbol=${symbol}&interval=${pionexInterval}&limit=${limit}&timestamp=${timestamp}`;
    const signature = await signPionexRequest(path, apiSecret);

    const res = await fetch(`https://api.pionex.com${path}`, {
      headers: {
        'PIONEX-KEY': apiKey,
        'PIONEX-SIGNATURE': signature,
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[get-klines] Pionex API error:', errText);
      return new Response(JSON.stringify({ error: `Pionex API error: ${res.status}`, detail: errText }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await res.json();

    interface PionexKline {
      time: number;
      open: string;
      high: string;
      low: string;
      close: string;
      volume: string;
    }

    const rawKlines: PionexKline[] = data?.data?.klines ?? [];

    // Map Pionex kline objects { time, open, high, low, close, volume }
    // to { time (seconds), open, high, low, close }
    const klines = rawKlines
      .map((k) => ({
        time: Math.floor(k.time / 1000),
        open: parseFloat(k.open),
        high: parseFloat(k.high),
        low: parseFloat(k.low),
        close: parseFloat(k.close),
      }))
      .sort((a, b) => a.time - b.time);

    return new Response(JSON.stringify({ klines }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('[get-klines] Error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
