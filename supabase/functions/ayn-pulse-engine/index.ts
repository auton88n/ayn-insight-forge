// Deno.serve() used instead of deprecated std/http/server.ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ─── FRED API ────────────────────────────────────────────────────────────────
async function fetchFREDData(apiKey: string): Promise<Record<string, unknown>> {
  const series = [
    { id: 'FEDFUNDS', label: 'fed_funds_rate', name: 'Fed Funds Rate' },
    { id: 'CPIAUCSL', label: 'inflation_cpi', name: 'CPI Inflation' },
    { id: 'M2SL', label: 'm2_money_supply', name: 'M2 Money Supply' },
    { id: 'UNRATE', label: 'unemployment_rate', name: 'Unemployment Rate' },
    { id: 'DGS10', label: 'treasury_10yr', name: '10-Year Treasury Yield' },
    { id: 'DGS2', label: 'treasury_2yr', name: '2-Year Treasury Yield' },
    { id: 'DEXUSEU', label: 'usd_eur', name: 'USD/EUR Exchange Rate' },
  ];

  const results: Record<string, unknown> = {};

  await Promise.all(series.map(async (s) => {
    try {
      const url = `https://api.stlouisfed.org/fred/series/observations?series_id=${s.id}&api_key=${apiKey}&limit=2&sort_order=desc&file_type=json`;
      const res = await fetch(url);
      if (!res.ok) return;
      const data = await res.json();
      const observations = data.observations || [];
      if (observations.length > 0) {
        const latest = observations[0];
        const previous = observations[1];
        const value = parseFloat(latest.value);
        const prevValue = previous ? parseFloat(previous.value) : null;
        const change = prevValue ? value - prevValue : null;
        results[s.label] = {
          name: s.name,
          value,
          change,
          date: latest.date,
          trend: change ? (change > 0 ? 'rising' : 'falling') : 'stable'
        };
      }
    } catch (err) {
      console.error(`[FRED] Error fetching ${s.id}:`, err);
    }
  }));

  // Yield curve analysis — critical signal
  const t10 = results.treasury_10yr as any;
  const t2 = results.treasury_2yr as any;
  if (t10?.value && t2?.value) {
    const spread = t10.value - t2.value;
    results.yield_curve = {
      spread: spread.toFixed(2),
      inverted: spread < 0,
      signal: spread < 0 
        ? 'INVERTED — historically precedes recession within 12-18 months'
        : spread < 0.5 
          ? 'FLAT — economic slowdown signal'
          : 'NORMAL — economy expanding'
    };
  }

  return results;
}

// ─── ALPHA VANTAGE ───────────────────────────────────────────────────────────
async function fetchAlphaVantageData(apiKey: string): Promise<Record<string, unknown>> {
  const results: Record<string, unknown> = {};

  try {
    // Global market overview — top movers
    const url = `https://www.alphavantage.co/query?function=TOP_GAINERS_LOSERS&apikey=${apiKey}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      results.top_gainers = (data.top_gainers || []).slice(0, 3).map((s: any) => ({
        ticker: s.ticker,
        price: s.price,
        change_percent: s.change_percentage
      }));
      results.top_losers = (data.top_losers || []).slice(0, 3).map((s: any) => ({
        ticker: s.ticker,
        price: s.price,
        change_percent: s.change_percentage
      }));
      results.most_active = (data.most_actively_traded || []).slice(0, 3).map((s: any) => ({
        ticker: s.ticker,
        price: s.price,
        change_percent: s.change_percentage
      }));
    }
  } catch (err) {
    console.error('[AlphaVantage] Error:', err);
  }

  // Commodity prices — gold and oil as key macro signals
  try {
    const goldUrl = `https://www.alphavantage.co/query?function=COMMODITY&symbol=GOLD&interval=monthly&apikey=${apiKey}`;
    const goldRes = await fetch(goldUrl);
    if (goldRes.ok) {
      const goldData = await goldRes.json();
      const goldObs = goldData.data || [];
      if (goldObs.length >= 2) {
        const latest = parseFloat(goldObs[0].value);
        const prev = parseFloat(goldObs[1].value);
        const change = ((latest - prev) / prev * 100).toFixed(2);
        results.gold = {
          price: latest,
          monthly_change_pct: change,
          signal: parseFloat(change) > 2 ? 'RISING — safe haven demand increasing, risk-off sentiment' :
                  parseFloat(change) < -2 ? 'FALLING — risk appetite returning' : 'STABLE'
        };
      }
    }
  } catch (err) {
    console.error('[AlphaVantage] Gold error:', err);
  }

  return results;
}

// ─── PIONEX ──────────────────────────────────────────────────────────────────
async function fetchPionexData(apiKey: string, apiSecret: string): Promise<Record<string, unknown>> {
  const results: Record<string, unknown> = {};

  try {
    const enc = new TextEncoder();
    const ts = Date.now().toString();
    
    async function sign(method: string, path: string, params: Record<string, string>) {
      const sortedKeys = Object.keys(params).sort();
      const qs = sortedKeys.map(k => `${k}=${params[k]}`).join('&');
      const message = `${method}${path}?${qs}`;
      const key = await crypto.subtle.importKey('raw', enc.encode(apiSecret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
      const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
      const signature = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
      return { signature, qs };
    }

    const { signature, qs } = await sign('GET', '/api/v1/market/tickers', { timestamp: ts });
    const res = await fetch(`https://api.pionex.com/api/v1/market/tickers?${qs}`, {
      headers: { 'PIONEX-KEY': apiKey, 'PIONEX-SIGNATURE': signature }
    });

    if (!res.ok) return results;
    const data = await res.json();
    const tickers = data?.data?.tickers || [];

    // Key crypto prices
    const targets = ['BTC_USDT', 'ETH_USDT', 'SOL_USDT', 'BNB_USDT'];
    const prices: Record<string, unknown> = {};
    let btcDominanceProxy = 0;
    let totalVolume = 0;
    let btcVolume = 0;

    for (const t of tickers) {
      if (targets.includes(t.symbol)) {
        const price = parseFloat(t.close || t.last || '0');
        const open = parseFloat(t.open || '0');
        const change = open > 0 ? ((price - open) / open * 100).toFixed(2) : '0';
        const volume = parseFloat(t.amount || '0');
        prices[t.symbol.replace('_USDT', '')] = {
          price,
          change_24h_pct: change,
          volume_24h: volume
        };
        if (t.symbol === 'BTC_USDT') btcVolume = volume;
      }
      totalVolume += parseFloat(t.amount || '0');
    }

    // BTC dominance proxy from volume
    if (totalVolume > 0) {
      btcDominanceProxy = (btcVolume / totalVolume * 100);
    }

    results.crypto_prices = prices;
    results.btc_dominance_proxy = btcDominanceProxy.toFixed(1);
    results.crypto_signal = btcDominanceProxy > 50 
      ? 'BTC dominance HIGH — market in risk-off, altcoins bleeding, smart money consolidating'
      : btcDominanceProxy > 40
        ? 'BTC dominance MODERATE — cautious market, selective altcoin strength'
        : 'BTC dominance LOW — altseason conditions, risk appetite high';

    // Market-wide momentum
    const gainers = tickers.filter((t: any) => {
      const open = parseFloat(t.open || '0');
      const close = parseFloat(t.close || '0');
      return open > 0 && ((close - open) / open) > 0.03;
    }).length;

    const losers = tickers.filter((t: any) => {
      const open = parseFloat(t.open || '0');
      const close = parseFloat(t.close || '0');
      return open > 0 && ((close - open) / open) < -0.03;
    }).length;

    results.market_breadth = {
      gainers_above_3pct: gainers,
      losers_above_3pct: losers,
      signal: gainers > losers * 1.5 ? 'BULLISH breadth' : 
               losers > gainers * 1.5 ? 'BEARISH breadth' : 'NEUTRAL breadth'
    };

  } catch (err) {
    console.error('[Pionex] Error:', err);
  }

  return results;
}

// ─── FEAR & GREED INDEX ──────────────────────────────────────────────────────
async function fetchFearGreed(): Promise<Record<string, unknown>> {
  try {
    const res = await fetch('https://api.alternative.me/fng/?limit=2');
    if (!res.ok) return {};
    const data = await res.json();
    const items = data.data || [];
    const current = items[0];
    const previous = items[1];
    
    const value = parseInt(current.value);
    const prevValue = previous ? parseInt(previous.value) : null;
    
    return {
      value,
      classification: current.value_classification,
      previous_value: prevValue,
      trend: prevValue ? (value > prevValue ? 'improving' : 'deteriorating') : 'unknown',
      signal: value <= 25 ? 'EXTREME FEAR — historically strong buy signal, smart money accumulating'
             : value <= 45 ? 'FEAR — cautious market, retail selling, institutions watching'
             : value <= 55 ? 'NEUTRAL — no strong directional signal'
             : value <= 75 ? 'GREED — market getting optimistic, watch for correction'
             : 'EXTREME GREED — historically strong sell signal, euphoria phase'
    };
  } catch (err) {
    console.error('[FearGreed] Error:', err);
    return {};
  }
}

// ─── POLYMARKET ──────────────────────────────────────────────────────────────
async function fetchPolymarket(): Promise<Record<string, unknown>> {
  try {
    const res = await fetch('https://gamma-api.polymarket.com/markets?limit=10&active=true&closed=false');
    if (!res.ok) return {};
    const markets = await res.json();
    
    // Filter for economically relevant markets
    const relevantKeywords = ['recession', 'fed', 'rate', 'inflation', 'gdp', 'bitcoin', 'crypto', 'election', 'war', 'oil', 'gold', 'market'];
    
    const relevant = (Array.isArray(markets) ? markets : markets.markets || [])
      .filter((m: any) => {
        const q = (m.question || m.title || '').toLowerCase();
        return relevantKeywords.some(kw => q.includes(kw));
      })
      .slice(0, 5)
      .map((m: any) => ({
        question: m.question || m.title,
        yes_probability: m.outcomePrices ? parseFloat(m.outcomePrices[0]) * 100 : null,
        volume: m.volume || m.liquidityNum || null
      }));

    return { prediction_markets: relevant };
  } catch (err) {
    console.error('[Polymarket] Error:', err);
    return {};
  }
}

// ─── GDELT GEOPOLITICAL ──────────────────────────────────────────────────────
async function fetchGDELT(): Promise<Record<string, unknown>> {
  try {
    // GDELT summary API — global conflict and tension index
    const res = await fetch('https://api.gdeltproject.org/api/v2/summary/summary?TIMESPAN=24H&FORMAT=json');
    if (!res.ok) return {};
    const data = await res.json();
    
    return {
      global_tension_summary: data,
      signal: 'Live geopolitical monitoring active'
    };
  } catch (err) {
    // GDELT can be unreliable — use Firecrawl fallback
    console.error('[GDELT] Error — will use Firecrawl for geopolitical signals:', err);
    return { gdelt_unavailable: true };
  }
}

// ─── INSTITUTIONAL SIGNALS via Firecrawl ─────────────────────────────────────
async function fetchInstitutionalSignals(): Promise<Record<string, unknown>> {
  const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
  if (!FIRECRAWL_API_KEY) return {};

  const results: Record<string, unknown> = {};
  
  // Sources that reveal what powerful institutions are DOING vs SAYING
  const sources = [
    {
      label: 'wef_agenda',
      url: 'https://www.weforum.org/agenda/',
      description: 'WEF current agenda — what Davos is focused on'
    },
    {
      label: 'fed_speeches',
      url: 'https://www.federalreserve.gov/newsevents/speeches.htm',
      description: 'Fed governor speeches — what they say in obscure venues'
    },
    {
      label: 'bis_research',
      url: 'https://www.bis.org/publ/work.htm',
      description: 'Bank for International Settlements — central banks of central banks'
    }
  ];

  await Promise.all(sources.map(async (source) => {
    try {
      const res = await fetch('https://api.firecrawl.dev/v1/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: source.url,
          formats: ['markdown'],
          onlyMainContent: true,
          waitFor: 2000
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data?.markdown) {
          // Take first 1500 chars — enough to capture headlines and key themes
          results[source.label] = data.data.markdown.substring(0, 1500);
        }
      }
    } catch (err) {
      console.error(`[Firecrawl] Error scraping ${source.label}:`, err);
    }
  }));

  // Also search for recent major institutional moves
  try {
    const searchRes = await fetch('https://api.firecrawl.dev/v1/search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: 'institutional investors major moves hedge fund positioning this week',
        limit: 5
      })
    });

    if (searchRes.ok) {
      const searchData = await searchRes.json();
      results.institutional_news = (searchData.data || []).slice(0, 5).map((r: any) => ({
        title: r.title,
        description: r.description,
        url: r.url
      }));
    }
  } catch (err) {
    console.error('[Firecrawl] Search error:', err);
  }

  return results;
}

// ─── SYNTHESIZE ALL DATA INTO INTELLIGENCE SUMMARY ───────────────────────────
function synthesizeSnapshot(data: {
  fred: Record<string, unknown>;
  alpha: Record<string, unknown>;
  pionex: Record<string, unknown>;
  fearGreed: Record<string, unknown>;
  polymarket: Record<string, unknown>;
  gdelt: Record<string, unknown>;
  institutional: Record<string, unknown>;
}): Record<string, unknown> {
  
  const snapshot: Record<string, unknown> = {
    fetched_at: new Date().toISOString(),
    macro: data.fred,
    markets: {
      stocks: data.alpha,
      crypto: data.pionex,
      sentiment: data.fearGreed
    },
    geopolitical: data.gdelt,
    prediction_markets: data.polymarket,
    institutional_signals: data.institutional,
  };

  // Build a human-readable intelligence brief for AYN to use
  const brief: string[] = [];

  // Macro signals
  const fred = data.fred as any;
  if (fred.fed_funds_rate?.value) {
    brief.push(`Fed rate: ${fred.fed_funds_rate.value}% (${fred.fed_funds_rate.trend})`);
  }
  if (fred.inflation_cpi?.value) {
    brief.push(`Inflation CPI: ${fred.inflation_cpi.value} (${fred.inflation_cpi.trend})`);
  }
  if (fred.yield_curve?.signal) {
    brief.push(`Yield curve: ${fred.yield_curve.signal}`);
  }
  if (fred.unemployment_rate?.value) {
    brief.push(`Unemployment: ${fred.unemployment_rate.value}%`);
  }

  // Market sentiment
  const fg = data.fearGreed as any;
  if (fg.value !== undefined) {
    brief.push(`Market sentiment: Fear & Greed at ${fg.value} — ${fg.signal}`);
  }

  // Crypto
  const pionex = data.pionex as any;
  if (pionex.crypto_signal) {
    brief.push(`Crypto: ${pionex.crypto_signal}`);
  }

  // Gold as safe haven signal
  const alpha = data.alpha as any;
  if (alpha.gold?.signal) {
    brief.push(`Gold: ${alpha.gold.signal}`);
  }

  snapshot.intelligence_brief = brief;
  snapshot.brief_generated_at = new Date().toISOString();

  return snapshot;
}

// ─── MAIN HANDLER ─────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const FRED_API_KEY = Deno.env.get('FRED_API_KEY');
    const ALPHA_VANTAGE_API_KEY = Deno.env.get('ALPHA_VANTAGE_API_KEY');
    const PIONEX_API_KEY = Deno.env.get('PIONEX_API_KEY');
    const PIONEX_API_SECRET = Deno.env.get('PIONEX_API_SECRET');

    console.log('[ayn-pulse-engine] Starting data fetch...');
    const startTime = Date.now();

    // Fetch all sources in parallel
    const [fred, alpha, pionex, fearGreed, polymarket, gdelt, institutional] = await Promise.allSettled([
      FRED_API_KEY ? fetchFREDData(FRED_API_KEY) : Promise.resolve({}),
      ALPHA_VANTAGE_API_KEY ? fetchAlphaVantageData(ALPHA_VANTAGE_API_KEY) : Promise.resolve({}),
      PIONEX_API_KEY && PIONEX_API_SECRET ? fetchPionexData(PIONEX_API_KEY, PIONEX_API_SECRET) : Promise.resolve({}),
      fetchFearGreed(),
      fetchPolymarket(),
      fetchGDELT(),
      fetchInstitutionalSignals()
    ]);

    const sourcesUsed: string[] = [];
    const fetchErrors: string[] = [];

    const getData = (result: PromiseSettledResult<any>, name: string) => {
      if (result.status === 'fulfilled') {
        sourcesUsed.push(name);
        return result.value;
      } else {
        fetchErrors.push(`${name}: ${result.reason}`);
        return {};
      }
    };

    const snapshot = synthesizeSnapshot({
      fred: getData(fred, 'FRED'),
      alpha: getData(alpha, 'AlphaVantage'),
      pionex: getData(pionex, 'Pionex'),
      fearGreed: getData(fearGreed, 'FearGreed'),
      polymarket: getData(polymarket, 'Polymarket'),
      gdelt: getData(gdelt, 'GDELT'),
      institutional: getData(institutional, 'Firecrawl/Institutional')
    });

    const duration = Date.now() - startTime;
    console.log(`[ayn-pulse-engine] Fetch complete in ${duration}ms. Sources: ${sourcesUsed.join(', ')}`);

    // Upsert — always one row, singleton_key = 1
    const { error } = await supabase
      .from('ayn_market_snapshot')
      .upsert({
        singleton_key: 1,
        snapshot,
        fetched_at: new Date().toISOString(),
        sources_used: sourcesUsed,
        fetch_errors: fetchErrors
      }, {
        onConflict: 'singleton_key'
      });

    if (error) {
      console.error('[ayn-pulse-engine] DB upsert error:', error);
      throw error;
    }

    console.log('[ayn-pulse-engine] Snapshot stored successfully');

    return new Response(JSON.stringify({
      success: true,
      sources_used: sourcesUsed,
      fetch_errors: fetchErrors,
      duration_ms: duration,
      brief_items: (snapshot.intelligence_brief as string[]).length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[ayn-pulse-engine] Fatal error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
