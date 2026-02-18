import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";
import { detectResponseEmotion, detectUserEmotion, detectLanguage } from "./emotionDetector.ts";
import { detectIntent } from "./intentDetector.ts";
import { buildSystemPrompt } from "./systemPrompts.ts";
import { sanitizeUserPrompt, detectInjectionAttempt, INJECTION_GUARD } from "../_shared/sanitizePrompt.ts";
import { activateMaintenanceMode } from "../_shared/maintenanceGuard.ts";
import { uploadImageToStorage } from "../_shared/storageUpload.ts";


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// LLM Provider configs
interface LLMModel {
  id: string;
  provider: 'lovable' | 'openrouter';
  model_id: string;
  display_name: string;
}

// Credit costs (premium features)
const DOCUMENT_CREDIT_COST = {
  pdf: 30,
  excel: 25
};


const FALLBACK_CHAINS: Record<string, LLMModel[]> = {
  chat: [
    { id: 'lovable-gemini-3-flash', provider: 'lovable', model_id: 'google/gemini-3-flash-preview', display_name: 'Gemini 3 Flash' },
    { id: 'lovable-gemini-flash', provider: 'lovable', model_id: 'google/gemini-2.5-flash', display_name: 'Gemini 2.5 Flash' },
    { id: 'lovable-gemini-flash-lite', provider: 'lovable', model_id: 'google/gemini-2.5-flash-lite', display_name: 'Gemini 2.5 Flash Lite' }
  ],
  engineering: [
    { id: 'lovable-gemini-3-flash', provider: 'lovable', model_id: 'google/gemini-3-flash-preview', display_name: 'Gemini 3 Flash' },
    { id: 'lovable-gemini-3-pro', provider: 'lovable', model_id: 'google/gemini-3-pro-preview', display_name: 'Gemini 3 Pro' },
    { id: 'lovable-gemini-flash', provider: 'lovable', model_id: 'google/gemini-2.5-flash', display_name: 'Gemini 2.5 Flash' }
  ],
  files: [
    { id: 'lovable-gemini-3-flash', provider: 'lovable', model_id: 'google/gemini-3-flash-preview', display_name: 'Gemini 3 Flash' },
    { id: 'lovable-gemini-flash', provider: 'lovable', model_id: 'google/gemini-2.5-flash', display_name: 'Gemini 2.5 Flash' }
  ],
  search: [
    { id: 'lovable-gemini-3-flash', provider: 'lovable', model_id: 'google/gemini-3-flash-preview', display_name: 'Gemini 3 Flash' }
  ],
  image: [
    { id: 'lovable-gemini-image', provider: 'lovable', model_id: 'google/gemini-2.5-flash-image', display_name: 'Gemini Image' }
  ],
};
// Generate image using Lovable AI (DALL-E 3 primary, Gemini fallback)
async function generateImage(prompt: string): Promise<{ imageUrl: string; revisedPrompt: string }> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');

  console.log('[ayn-unified] Generating image with prompt:', prompt.substring(0, 100));

  // Primary: DALL-E 3 via /v1/images/generations
  try {
    const response = await fetch('https://ai.gateway.lovable.dev/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size: '1024x1024',
        quality: 'hd',
      }),
    });

    if (response.ok) {
      const data = await response.json();
      const imageUrl = data.data?.[0]?.url || '';
      const revisedPrompt = data.data?.[0]?.revised_prompt || prompt;
      if (imageUrl) {
        console.log('[ayn-unified] Image generated via DALL-E 3');
        return { imageUrl, revisedPrompt };
      }
    } else {
      const errText = await response.text();
      console.warn('[ayn-unified] DALL-E 3 failed, trying Gemini fallback:', response.status, errText);
    }
  } catch (err) {
    console.warn('[ayn-unified] DALL-E 3 error, trying Gemini fallback:', err);
  }

  // Fallback: Gemini image model via /v1/chat/completions
  const fallbackResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${LOVABLE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash-image',
      messages: [{ role: 'user', content: `Generate an image: ${prompt}` }],
      modalities: ['image', 'text'],
    }),
  });

  if (!fallbackResponse.ok) {
    const errorText = await fallbackResponse.text();
    console.error('[ayn-unified] Gemini image fallback also failed:', fallbackResponse.status, errorText);
    throw new Error(`Image generation failed: ${fallbackResponse.status}`);
  }

  const fallbackData = await fallbackResponse.json();
  const imageUrl = fallbackData.choices?.[0]?.message?.images?.[0]?.image_url?.url || '';
  const revisedPrompt = fallbackData.choices?.[0]?.message?.content || prompt;

  if (!imageUrl) {
    throw new Error('No image generated');
  }

  console.log('[ayn-unified] Image generated via Gemini fallback');
  return { imageUrl, revisedPrompt };
}

// Helper: upload image to storage if it's a data URL, return public URL
async function uploadImageIfDataUrl(imageUrl: string, userId: string): Promise<string> {
  if (!imageUrl.startsWith('data:image/')) return imageUrl;
  try {
    const publicUrl = await uploadImageToStorage(imageUrl, userId);
    console.log('[ayn-unified] Image uploaded to storage:', publicUrl.substring(0, 80));
    return publicUrl;
  } catch (err) {
    console.error('[ayn-unified] Storage upload failed, falling back to data URL:', err);
    return imageUrl;
  }
}

// Extract and save memories from conversation
async function extractAndSaveMemories(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  userMessage: string
): Promise<void> {
  const patterns = [
    { regex: /my name is (\w+)/i, type: 'profile', key: 'name' },
    { regex: /i'm (\w+), /i, type: 'profile', key: 'name' },
    { regex: /call me (\w+)/i, type: 'profile', key: 'preferred_name' },
    { regex: /i'm (?:a |an )?(\w+(?:\s+\w+)?)\s*(?:engineer|developer|designer|architect|manager)/i, type: 'profile', key: 'profession' },
    { regex: /i work (?:at|for|with) (.+?)(?:\.|,|$)/i, type: 'profile', key: 'company' },
    { regex: /i (?:prefer|use|follow) (.+?) code/i, type: 'preference', key: 'building_code' },
    { regex: /i (?:usually|always|prefer to) use (.+?) units/i, type: 'preference', key: 'units' },
    { regex: /i'm (?:from|based in|located in) (.+?)(?:\.|,|$)/i, type: 'profile', key: 'location' },
  ];

  for (const pattern of patterns) {
    const match = userMessage.match(pattern.regex);
    if (match && match[1]) {
      try {
        await supabase.rpc('upsert_user_memory', {
          _user_id: userId,
          _memory_type: pattern.type,
          _memory_key: pattern.key,
          _memory_data: { value: match[1].trim(), source: 'conversation', extracted_at: new Date().toISOString() },
          _priority: 1
        });
        console.log(`[ayn-unified] Saved memory: ${pattern.type}/${pattern.key} = ${match[1]}`);
      } catch (err) {
        console.error(`[ayn-unified] Failed to save memory:`, err);
      }
    }
  }
}

// Call LLM with specific provider - optimized with max_tokens and smart follow-up
async function callLLM(
  model: LLMModel,
  messages: Array<{ role: string; content: any }>,
  stream: boolean = false
): Promise<Response | { content: string; wasIncomplete?: boolean; usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number } }> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');

  // Optimized LLM parameters for speed at scale (30K users)
  const llmParams = {
    max_tokens: 1024,  // Faster responses, smart follow-up handles continuation
    temperature: 0.7,  // Slightly faster, more focused generation
  };

  if (model.provider === 'lovable') {
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY not configured');
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model.model_id,
        messages,
        stream,
        ...llmParams,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      const err = new Error(`Lovable API error ${response.status}: ${errorText}`);
      (err as any).status = response.status;
      throw err;
    }

    if (stream) {
      return response;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    const finishReason = data.choices?.[0]?.finish_reason;
    const usage = data.usage || null;
    
    // Smart follow-up detection: if truncated, invite user to continue
    if (finishReason === 'length') {
      return { 
        content: content + "\n\n---\n*want me to continue? just say 'continue' or ask a follow-up!*",
        wasIncomplete: true,
        usage 
      };
    }
    
    return { content, wasIncomplete: false, usage };
  }

  if (model.provider === 'openrouter') {
    if (!OPENROUTER_API_KEY) throw new Error('OPENROUTER_API_KEY not configured');
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://ayn.sa',
        'X-Title': 'AYN AI Assistant'
      },
      body: JSON.stringify({
        model: model.model_id,
        messages,
        stream,
        ...llmParams,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      const err = new Error(`OpenRouter API error ${response.status}: ${errorText}`);
      (err as any).status = response.status;
      throw err;
    }

    if (stream) {
      return response;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    const finishReason = data.choices?.[0]?.finish_reason;
    const usage = data.usage || null;
    
    // Smart follow-up detection
    if (finishReason === 'length') {
      return { 
        content: content + "\n\n---\n*want me to continue? just say 'continue' or ask a follow-up!*",
        wasIncomplete: true,
        usage 
      };
    }
    
    return { content, wasIncomplete: false, usage };
  }

  throw new Error(`Unknown provider: ${model.provider}`);
}

// Call with fallback chain
async function callWithFallback(
  intent: string,
  messages: Array<{ role: string; content: any }>,
  stream: boolean,
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<{ response: Response | { content: string }; modelUsed: LLMModel; wasFallback: boolean }> {
  const chain = FALLBACK_CHAINS[intent] || FALLBACK_CHAINS.chat;
  
  for (let i = 0; i < chain.length; i++) {
    const model = chain[i];
    try {
      console.log(`Trying ${model.display_name} for ${intent}...`);
      const startTime = Date.now();
      const response = await callLLM(model, messages, stream);
      const responseTimeMs = Date.now() - startTime;
      
      // Extract token usage from non-streaming responses
      const usage = (response && typeof response === 'object' && 'usage' in response) ? (response as any).usage : null;
      
      // Log successful usage with token counts and response time
      try {
        await supabase.from('llm_usage_logs').insert({
          user_id: userId,
          intent_type: intent,
          was_fallback: i > 0,
          fallback_reason: i > 0 ? `Primary model failed, used ${model.display_name}` : null,
          model_name: model.model_id,
          input_tokens: usage?.prompt_tokens || 0,
          output_tokens: usage?.completion_tokens || 0,
          response_time_ms: responseTimeMs,
        });
        
        if (usage) {
          console.log(`[ayn-unified] Token usage - input: ${usage.prompt_tokens}, output: ${usage.completion_tokens}, time: ${responseTimeMs}ms, model: ${model.model_id}`);
        }
        
        // Check if user has crossed 90% credit usage - send warning email
        if (userId !== 'internal-evaluator') {
          checkAndSendCreditWarning(supabase, userId).catch(err => 
            console.error('[ayn-unified] Credit warning check failed:', err)
          );
        }
      } catch (logError) {
        console.error('Failed to log usage:', logError);
      }
      
      return { response, modelUsed: model, wasFallback: i > 0 };
    } catch (error) {
      console.error(`${model.display_name} failed:`, error);
      
      // Log failure
      try {
        await supabase.from('llm_failures').insert({
          error_type: error instanceof Error && error.message.includes('429') ? '429' : 
                      error instanceof Error && error.message.includes('402') ? '402' : 'error',
          error_message: error instanceof Error ? error.message : 'Unknown error'
        });
      } catch (logError) {
        console.error('Failed to log failure:', logError);
      }
      
      if (i === chain.length - 1) {
        // All models failed - check if any was a 402 (credits exhausted)
        const is402 = (error as any)?.status === 402 || (error instanceof Error && error.message.includes('402'));
        if (is402) {
          await activateMaintenanceMode(supabase, `All AI models failed with 402 (credits exhausted) for intent: ${intent}`);
        }
        throw new Error(`All models failed for ${intent}. Last error: ${error instanceof Error ? error.message : 'Unknown'}`);
      }
    }
  }
  
  throw new Error('No models available');
}

// Perform web search using Brave API
async function performWebSearch(query: string): Promise<string> {
  const BRAVE_API_KEY = Deno.env.get('BRAVE_API_KEY');
  if (!BRAVE_API_KEY) {
    return 'Web search is not available at the moment.';
  }

  try {
    const response = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5`, {
      headers: {
        'Accept': 'application/json',
        'X-Subscription-Token': BRAVE_API_KEY
      }
    });

    if (!response.ok) {
      console.error('Brave search failed:', response.status);
      return 'Could not perform web search right now.';
    }

    const data = await response.json();
    const results = data.web?.results || [];
    
    if (results.length === 0) {
      return 'No search results found.';
    }

    return results.slice(0, 5).map((r: { title: string; description: string; url: string }, i: number) => 
      `${i + 1}. ${r.title}\n   ${r.description}\n   Source: ${r.url}`
    ).join('\n\n');
  } catch (error) {
    console.error('Search error:', error);
    return 'Search failed, but I\'ll try to help without it.';
  }
}

// Get user context from memory
async function getUserContext(supabase: ReturnType<typeof createClient>, userId: string): Promise<Record<string, unknown>> {
  try {
    const { data, error } = await supabase.rpc('get_user_context', { _user_id: userId });
    if (error) {
      console.error('Error getting user context:', error);
      return {};
    }
    return data || {};
  } catch (error) {
    console.error('Error in getUserContext:', error);
    return {};
  }
}

// Check and send credit warning email if user crossed 90% threshold
async function checkAndSendCreditWarning(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<void> {
  try {
    // Get user's current usage
    const { data: limits, error: limitsError } = await supabase
      .from('user_ai_limits')
      .select('current_monthly_messages, monthly_messages')
      .eq('user_id', userId)
      .single();

    if (limitsError || !limits) {
      console.log('[ayn-unified] Could not fetch limits for credit warning check');
      return;
    }

    const { current_monthly_messages, monthly_messages } = limits;
    const percentage = (current_monthly_messages / monthly_messages) * 100;

    // Only proceed if between 90% and 100%
    if (percentage < 90 || percentage >= 100) {
      return;
    }

    // Check if we already sent a warning this month (30-day window)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: existingAlert } = await supabase
      .from('email_logs')
      .select('id')
      .eq('user_id', userId)
      .eq('email_type', 'credit_warning')
      .gte('sent_at', thirtyDaysAgo)
      .maybeSingle();

    if (existingAlert) {
      console.log('[ayn-unified] Credit warning already sent this period for user:', userId);
      return;
    }

    // Get user email and profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('user_id', userId)
      .single();

    const { data: authUser } = await supabase.auth.admin.getUserById(userId);
    const userEmail = authUser?.user?.email;

    if (!userEmail) {
      console.log('[ayn-unified] No email found for user:', userId);
      return;
    }

    const creditsLeft = monthly_messages - current_monthly_messages;
    const userName = profile?.full_name || 'there';

    // Send credit warning email via send-email function
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const response = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
      },
      body: JSON.stringify({
        to: userEmail,
        emailType: 'credit_warning',
        data: {
          userName,
          creditsLeft,
          totalCredits: monthly_messages
        },
        userId
      })
    });

    if (response.ok) {
      console.log('[ayn-unified] Credit warning email sent to:', userEmail);
    } else {
      console.error('[ayn-unified] Failed to send credit warning:', await response.text());
    }
  } catch (error) {
    console.error('[ayn-unified] Error in checkAndSendCreditWarning:', error);
  }
}

// Check user AI limits
async function checkUserLimit(supabase: ReturnType<typeof createClient>, userId: string, intent: string): Promise<{ allowed: boolean; reason?: string }> {
  try {
    const { data, error } = await supabase.rpc('check_user_ai_limit', { 
      _user_id: userId, 
      _intent_type: intent 
    });
    
    if (error) {
      console.error('Error checking limit:', error);
      return { allowed: true }; // Allow on error to not block users
    }
    
    return data || { allowed: true };
  } catch (error) {
    console.error('Error in checkUserLimit:', error);
    return { allowed: true };
  }
}

// Scan Pionex market for autonomous trading opportunities (enhanced with technical indicators)
async function scanMarketOpportunities(): Promise<{ opportunities: any[]; scannedPairs: number } | null> {
  const apiKey = Deno.env.get('PIONEX_API_KEY');
  const apiSecret = Deno.env.get('PIONEX_API_SECRET');
  if (!apiKey || !apiSecret) {
    console.warn('[SCAN] Pionex credentials not configured');
    return null;
  }

  try {
    const enc = new TextEncoder();
    async function signReq(qs: string): Promise<string> {
      const key = await crypto.subtle.importKey('raw', enc.encode(apiSecret!), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
      const sig = await crypto.subtle.sign('HMAC', key, enc.encode(qs));
      return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    const ts = Date.now().toString();
    const tickerPath = `/api/v1/market/tickers?timestamp=${ts}`;
    const tickerSig = await signReq(tickerPath);

    const res = await fetch(`https://api.pionex.com${tickerPath}`, {
      headers: { 'PIONEX-KEY': apiKey, 'PIONEX-SIGNATURE': tickerSig },
    });

    if (!res.ok) {
      console.error('[SCAN] Pionex tickers fetch failed:', res.status);
      return null;
    }

    const data = await res.json();
    const tickers = data?.data?.tickers || [];
    console.log(`[SCAN] Fetched ${tickers.length} tickers from Pionex`);

    // ── Phase 1: basic momentum filter (narrows to ~30–50 candidates) ─────────
    const phase1Candidates: any[] = [];

    for (const t of tickers) {
      const symbol = t.symbol || '';
      if (!symbol.endsWith('_USDT')) continue;
      if (symbol.startsWith('USDC_') || symbol.startsWith('USDT_') || symbol.startsWith('DAI_') || symbol.startsWith('TUSD_')) continue;

      const volume = parseFloat(t.amount || '0');
      if (volume < 100000) continue;

      const open = parseFloat(t.open || '0');
      const price = parseFloat(t.close || t.last || '0');
      const priceChange = open > 0 ? ((price - open) / open) * 100 : 0;

      // Quick basic score — keep anything ≥ 55 for phase 2
      let basicScore = 50;
      if (priceChange > 0 && priceChange <= 5) basicScore += 10;
      else if (priceChange > 5 && priceChange <= 15) basicScore += 15;
      if (volume > 1000000) basicScore += 8;
      if (Math.abs(priceChange) < 2) basicScore += 5;
      if (priceChange < -15) basicScore += 10;
      if (priceChange > 20) basicScore -= 15;

      if (basicScore >= 55) {
        phase1Candidates.push({ symbol, price, volume, priceChange, t });
      }
    }

    console.log(`[SCAN] Phase 1: ${phase1Candidates.length} candidates for kline analysis`);

    // ── Phase 2: fetch klines and score with technical indicators ─────────────
    const opportunities: any[] = [];

    for (const candidate of phase1Candidates) {
      const klines = await fetchKlines(candidate.symbol, '60M', 100, apiKey, apiSecret);

      let score: number;
      let signals: string[];

      if (!klines || klines.length < 20) {
        // Fallback: use basic score if klines unavailable
        score = 50 + (candidate.priceChange > 0 && candidate.priceChange <= 15 ? 15 : 0)
               + (candidate.volume > 1000000 ? 8 : 0);
        signals = [`Momentum ${candidate.priceChange.toFixed(1)}%`, candidate.volume > 1000000 ? 'High liquidity' : ''];
      } else {
        const technicals = analyzeKlines(klines, candidate.price, []);
        score = calculateEnhancedScore(candidate.priceChange, candidate.volume, technicals);
        signals = technicals.summary;
      }

      if (score >= 70) {
        opportunities.push({
          ticker: candidate.symbol,
          score,
          price: candidate.price,
          volume24h: candidate.volume,
          priceChange24h: candidate.priceChange,
          signals,
        });
      }
    }

    opportunities.sort((a, b) => b.score - a.score);

    // ── Phase 3.5: Funding rate adjustment ──────────────────────────────────
    try {
      const fundingRates = await fetchFundingRates(apiKey, apiSecret);
      if (Object.keys(fundingRates).length > 0) {
        for (const opp of opportunities) {
          const rate = fundingRates[opp.ticker];
          if (rate == null) continue;
          if (rate < -0.0001) {
            opp.score += 8;
            opp.signals.push(`Negative funding ${(rate * 100).toFixed(3)}% (bullish)`);
          } else if (rate > 0.0005) {
            opp.score -= 5;
            opp.signals.push(`High funding ${(rate * 100).toFixed(3)}% (caution)`);
          }
        }
        opportunities.sort((a, b) => b.score - a.score);
      }
    } catch (frErr) {
      console.warn('[SCAN] Funding rate adjustment skipped:', frErr);
    }

    const top = opportunities.slice(0, 3);
    console.log(`[SCAN] Phase 2: ${opportunities.length} qualified opportunities (score≥70), returning top ${top.length}`);
    return { opportunities: top, scannedPairs: tickers.length };
  } catch (err) {
    console.error('[SCAN] Market scan error:', err);
    return null;
  }
}


serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    // Service client for DB operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from token
    const token = authHeader.replace('Bearer ', '');
    
    // Check if this is an internal service call (using service role key)
    let userId: string;
    let isInternalCall = false;

    console.log('[ayn-unified] Request received, checking auth...');

    if (token === supabaseServiceKey) {
      // Internal service call (from evaluator, tests, etc.) - use synthetic user ID
      userId = 'internal-evaluator';
      isInternalCall = true;
      console.log('[ayn-unified] Internal service call detected - bypassing user auth');
    } else {
      // Normal user call - validate JWT using getClaims (recommended for signing-keys)
      const authClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
      });
      
      const { data, error: claimsError } = await authClient.auth.getClaims(token);
      
      if (claimsError || !data?.claims?.sub) {
        console.log('[ayn-unified] Auth failed:', claimsError?.message || 'no claims');
        return new Response(JSON.stringify({ error: 'Invalid token' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      userId = data.claims.sub as string;
      console.log('[ayn-unified] User authenticated:', userId.substring(0, 8) + '...');
    }

    const { messages: rawMessages, intent: forcedIntent, context = {}, stream = true, sessionId } = await req.json();

    if (!rawMessages || !Array.isArray(rawMessages)) {
      return new Response(JSON.stringify({ error: 'Messages array required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Trim conversation history to avoid exceeding token limits (~1M tokens)
    // 1. Keep only last 10 messages
    const MAX_CONTEXT_MESSAGES = 10;
    let messages = rawMessages;
    if (rawMessages.length > MAX_CONTEXT_MESSAGES) {
      const systemMsgs = rawMessages.filter((m: any) => m.role === 'system');
      const nonSystemMsgs = rawMessages.filter((m: any) => m.role !== 'system');
      messages = [...systemMsgs, ...nonSystemMsgs.slice(-MAX_CONTEXT_MESSAGES)];
      console.log(`[ayn-unified] Trimmed messages from ${rawMessages.length} to ${messages.length}`);
    }
    // 2. Truncate individual messages that are too long (e.g. base64 images, large files)
    const MAX_CHARS_PER_MESSAGE = 50000; // ~12K tokens
    messages = messages.map((m: any) => {
      if (typeof m.content === 'string' && m.content.length > MAX_CHARS_PER_MESSAGE) {
        console.log(`[ayn-unified] Truncating message (role=${m.role}) from ${m.content.length} to ${MAX_CHARS_PER_MESSAGE} chars`);
        return { ...m, content: m.content.substring(0, MAX_CHARS_PER_MESSAGE) + '\n[...truncated for length]' };
      }
      // Handle array content (vision messages with images)
      if (Array.isArray(m.content)) {
        return { ...m, content: m.content.filter((part: any) => part.type === 'text').slice(0, 2) };
      }
      return m;
    });

    // Detect intent from last message or use forced intent
    const lastMessage = messages[messages.length - 1]?.content || '';
    const fileContext = context?.fileContext;
    const hasImageFile = !!(fileContext && fileContext.type && fileContext.type.startsWith('image/'));
    const intent = (forcedIntent && forcedIntent !== 'chat') ? forcedIntent : detectIntent(lastMessage, hasImageFile);
    console.log(`Detected intent: ${intent}`);

    // === PROMPT INJECTION DEFENSE ===
    if (detectInjectionAttempt(lastMessage)) {
      supabase
        .from('security_logs')
        .insert({
          action: 'prompt_injection_attempt',
          user_id: userId === 'internal-evaluator' ? null : userId,
          details: { input_preview: lastMessage.slice(0, 200), function: 'ayn-unified' },
          severity: 'high'
        })
        .then(() => {})
        .catch(() => {});
    }

    // === SERVER-SIDE CHAT LIMIT ENFORCEMENT ===
    // Enforce 100 messages per chat session to prevent abuse and manage context
    const MAX_MESSAGES_PER_CHAT = 100;
    
    if (sessionId && !isInternalCall) {
      const { count, error: countError } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('session_id', sessionId)
        .eq('user_id', userId);
      
      if (!countError && count !== null && count >= MAX_MESSAGES_PER_CHAT) {
        console.log(`[ayn-unified] Chat limit reached: ${count}/${MAX_MESSAGES_PER_CHAT} for session ${sessionId}`);
        return new Response(JSON.stringify({ 
          error: 'Chat limit reached',
          message: 'This chat has reached the 100 message limit. Please start a new chat to continue.',
          chatLimitExceeded: true,
          messageCount: count,
          limit: MAX_MESSAGES_PER_CHAT
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // PARALLEL DB OPERATIONS
    const [limitCheck, userContext] = await Promise.all([
      isInternalCall ? Promise.resolve({ allowed: true }) : checkUserLimit(supabase, userId, intent),
      isInternalCall ? Promise.resolve({}) : getUserContext(supabase, userId),
    ]);

    // Check user limits
    if (!limitCheck.allowed) {
      return new Response(JSON.stringify({ 
        error: 'Daily limit reached',
        reason: (limitCheck as { reason?: string }).reason,
        limitExceeded: true
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const language = (userContext as { preferences?: { language?: string } })?.preferences?.language || 'en';

    // Extract and save any memories from the user's message (async, don't block) - skip for internal calls
    if (!isInternalCall) {
      extractAndSaveMemories(supabase, userId, lastMessage).catch(err => 
        console.error('[ayn-unified] Memory extraction failed:', err)
      );
    }


    // Build system prompt with user message for language detection AND user memories
    let systemPrompt = buildSystemPrompt(intent, language, context, lastMessage, userContext) + INJECTION_GUARD;


    // Handle image generation intent (LAB mode)
    if (intent === 'document') {
      try {
        console.log('[ayn-unified] Document generation requested');
        
        // === PREMIUM FEATURE: Check subscription tier AND admin role ===
        const [{ data: subscription }, { data: adminRole }] = await Promise.all([
          supabase
            .from('user_subscriptions')
            .select('tier')
            .eq('user_id', userId)
            .maybeSingle(),
          supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', userId)
            .eq('role', 'admin')
            .maybeSingle()
        ]);
        
        const userTier = subscription?.tier || 'free';
        const isAdmin = !!adminRole;
        
        // Block free tier users (unless they're admin or internal call)
        if (userTier === 'free' && !isInternalCall && !isAdmin) {
          console.log('[ayn-unified] Free user blocked from document generation');
          const upgradeMessages: Record<string, string> = {
            ar: '📄 إنشاء المستندات هو ميزة مدفوعة.\nقم بالترقية لإنشاء ملفات PDF و Excel احترافية!\n\n[ترقية الآن](/pricing)',
            fr: '📄 La génération de documents est une fonctionnalité premium.\nPassez à un forfait payant pour créer des PDF et Excel professionnels!\n\n[Mettre à niveau](/pricing)',
            en: '📄 Document generation is a premium feature.\nUpgrade to create professional PDF and Excel documents!\n\n[Upgrade Now](/pricing)'
          };
          return new Response(JSON.stringify({
            content: upgradeMessages[language] || upgradeMessages.en,
            intent: 'document',
            requiresUpgrade: true
          }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        
        if (isAdmin) {
          console.log('[ayn-unified] Admin user bypassing premium check for document generation');
        }
        
        // Get structured content from LLM (non-streaming for JSON parsing)
        const docMessages = [
          { role: 'system', content: systemPrompt },
          ...messages
        ];
        
        const llmResult = await callWithFallback('chat', docMessages, false, supabase, userId);
        const llmContent = (llmResult.response as { content: string }).content;
        
        // Parse JSON from response
        let documentData;
        try {
          // Try to extract JSON from response - handle markdown code blocks too
          let jsonStr = llmContent;
          
          // Strip markdown code fences if present
          const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
          if (codeBlockMatch) {
            jsonStr = codeBlockMatch[1].trim();
          }
          
          // Try direct parse first
          try {
            documentData = JSON.parse(jsonStr);
          } catch {
            // Fallback: extract first JSON object from the text
            const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error('No JSON found in response');
            documentData = JSON.parse(jsonMatch[0]);
          }
          
          // Validate required fields
          if (!documentData.sections || !Array.isArray(documentData.sections)) {
            throw new Error('Missing or invalid sections array');
          }
        } catch (parseError) {
          console.error('[ayn-unified] Failed to parse document JSON:', parseError, 'Raw:', llmContent.substring(0, 500));
          
          // Retry once with a more explicit prompt
          try {
            const retryMessages = [
              { role: 'system', content: `You MUST respond with ONLY valid JSON. No markdown, no explanation, no code fences. Just raw JSON in this format: {"type":"pdf","language":"${language}","title":"...","sections":[{"heading":"...","content":"..."}]}` },
              ...messages,
              { role: 'assistant', content: llmContent },
              { role: 'user', content: 'Please convert your response above into the required JSON format. Respond with ONLY the JSON object, nothing else.' }
            ];
            const retryResult = await callWithFallback('chat', retryMessages, false, supabase, userId);
            const retryContent = (retryResult.response as { content: string }).content;
            
            let retryJson = retryContent;
            const retryCodeBlock = retryJson.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (retryCodeBlock) retryJson = retryCodeBlock[1].trim();
            
            try {
              documentData = JSON.parse(retryJson);
            } catch {
              const retryMatch = retryJson.match(/\{[\s\S]*\}/);
              if (!retryMatch) throw new Error('Retry also failed');
              documentData = JSON.parse(retryMatch[0]);
            }
            
            console.log('[ayn-unified] Document JSON retry succeeded');
          } catch (retryError) {
            console.error('[ayn-unified] Document JSON retry also failed:', retryError);
            const clarifyMessages: Record<string, string> = {
              ar: 'أحتاج مزيد من التفاصيل لإنشاء المستند. ماذا تريد أن يتضمن بالضبط؟',
              fr: "J'ai besoin de plus de détails pour créer le document. Que souhaitez-vous y inclure exactement?",
              en: "I need more details to create the document. What exactly would you like it to include?"
            };
            return new Response(JSON.stringify({
              content: clarifyMessages[language] || clarifyMessages.en,
              intent: 'document'
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
        }
        
        // Determine document type and credit cost
        const docType = documentData.type || 'pdf';
        const creditCost = docType === 'excel' ? DOCUMENT_CREDIT_COST.excel : DOCUMENT_CREDIT_COST.pdf;
        
        // === CHECK CREDITS: Ensure user has enough (admins bypass) ===
        let creditsRemaining = 999;
        let currentUsage = 0;
        let monthlyLimit = 50;
        
        if (!isAdmin && !isInternalCall) {
          const { data: userLimits } = await supabase
            .from('user_ai_limits')
            .select('monthly_messages, current_monthly_messages')
            .eq('user_id', userId)
            .maybeSingle();
          
          currentUsage = userLimits?.current_monthly_messages || 0;
          monthlyLimit = userLimits?.monthly_messages || 50;
          creditsRemaining = monthlyLimit - currentUsage;
          
          if (creditsRemaining < creditCost) {
            console.log(`[ayn-unified] Insufficient credits: ${creditsRemaining} < ${creditCost}`);
            const insufficientMessages: Record<string, string> = {
              ar: `❌ رصيدك غير كافٍ. مستندات ${docType === 'excel' ? 'Excel' : 'PDF'} تكلف ${creditCost} رصيد، لديك ${creditsRemaining} متبقي.`,
              fr: `❌ Crédits insuffisants. Les ${docType === 'excel' ? 'Excel' : 'PDF'} coûtent ${creditCost} crédits, il vous reste ${creditsRemaining}.`,
              en: `❌ Not enough credits. ${docType === 'excel' ? 'Excel' : 'PDF'} documents cost ${creditCost} credits, you have ${creditsRemaining} remaining.`
            };
            return new Response(JSON.stringify({
              content: insufficientMessages[language] || insufficientMessages.en,
              intent: 'document',
              notEnoughCredits: true,
              creditsRequired: creditCost,
              creditsRemaining
            }), {
              status: 429,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }
        }
        
        // Call generate-document function
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const docResponse = await fetch(`${supabaseUrl}/functions/v1/generate-document`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...documentData,
            userId
          })
        });
        
        if (!docResponse.ok) {
          const errorText = await docResponse.text();
          throw new Error(`Document generation failed: ${errorText}`);
        }
        
        const { downloadUrl, filename } = await docResponse.json();
        
        // === DEDUCT CREDITS after successful generation (skip for admins) ===
        if (!isAdmin && !isInternalCall) {
          await supabase
            .from('user_ai_limits')
            .update({ current_monthly_messages: currentUsage + creditCost })
            .eq('user_id', userId);
        }
        
        console.log(`[ayn-unified] Deducted ${creditCost} credits for ${docType} document`);
        
        // Log usage
        try {
          await supabase.from('llm_usage_logs').insert({
            user_id: userId,
            intent_type: 'document',
            was_fallback: false
          });
        } catch (logError) {
          console.error('Failed to log document usage:', logError);
        }
        
        // Return friendly response with inline download link
        const docLang = documentData.language || language;
        const emoji = docType === 'excel' ? '📊' : '📄';
        const newCreditsRemaining = creditsRemaining - creditCost;
        const docTypeName = docType === 'excel' ? 'Excel' : 'PDF';
        const dlFilename = filename || `${documentData.title}.${docType === 'excel' ? 'xls' : 'pdf'}`;
        
        const successMessages: Record<string, string> = {
          ar: `تم إنشاء المستند بنجاح! ${emoji}\n\n**${documentData.title}**\n\n📥 [اضغط هنا لتحميل الملف](${downloadUrl})\n\n_(${creditCost} رصيد مخصوم • ${newCreditsRemaining} متبقي)_`,
          fr: `Document créé avec succès! ${emoji}\n\n**${documentData.title}**\n\n📥 [Cliquez ici pour télécharger](${downloadUrl})\n\n_(${creditCost} crédits déduits • ${newCreditsRemaining} restants)_`,
          en: `Document created successfully! ${emoji}\n\n**${documentData.title}**\n\n📥 [Click here to download your ${docTypeName}](${downloadUrl})\n\n_(${creditCost} credits used • ${newCreditsRemaining} remaining)_`
        };
        
        return new Response(JSON.stringify({
          content: successMessages[docLang] || successMessages.en,
          model: llmResult.modelUsed.display_name,
          wasFallback: llmResult.wasFallback,
          intent: 'document',
          documentUrl: downloadUrl,
          documentType: docType,
          documentName: filename || `${documentData.title}.${docType === 'excel' ? 'xlsx' : 'pdf'}`
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
        
      } catch (docError) {
        console.error('[ayn-unified] Document generation failed:', docError);
        const errorMessages: Record<string, string> = {
          ar: 'عذراً، حدث خطأ أثناء إنشاء المستند. حاول مرة أخرى؟',
          fr: 'Désolé, une erreur est survenue lors de la création du document. Réessayer?',
          en: "Sorry, couldn't create that document right now. Try again?"
        };
        return new Response(JSON.stringify({
          content: errorMessages[language] || errorMessages.en,
          error: docError instanceof Error ? docError.message : 'Document generation failed',
          intent: 'document'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Handle floor plan generation intent (DISABLED - rebuilding with staged pipeline)
    /*
    if (intent === 'floor_plan') {
      // ... floor plan handler commented out for rebuild
    }
    */
    if (intent === 'floor_plan') {
      // Temporarily disabled - treat as regular chat
      intent = 'chat';
      systemPrompt = buildSystemPrompt('chat', language, context, userMessage, userContext);
    }


    // Sanitize user messages before passing to LLM
    const sanitizedMessages = messages.map((msg: { role: string; content: any }) => ({
      ...msg,
      content: msg.role === 'user' && typeof msg.content === 'string' 
        ? sanitizeUserPrompt(msg.content) 
        : msg.content
    }));

    // If search intent, perform search first
    let enrichedMessages = [...sanitizedMessages];
    if (intent === 'search') {
      const searchResults = await performWebSearch(lastMessage);
      enrichedMessages = [
        ...sanitizedMessages.slice(0, -1),
        {
          role: 'user',
          content: `${sanitizeUserPrompt(lastMessage)}\n\n[Search Results]\n${searchResults}`
        }
      ];
    }

    // Add system prompt
    const fullMessages: Array<{ role: string; content: any }> = [
      { role: 'system', content: systemPrompt },
      ...enrichedMessages
    ];

    // === MULTIMODAL FILE SUPPORT ===
    // If fileContext is present, build multimodal content for the last user message
    const fileCtx = context?.fileContext as { name?: string; type?: string; url?: string } | undefined;
    if (fileCtx?.url && fileCtx?.type) {
      const lastIdx = fullMessages.length - 1;
      const lastTextContent = typeof fullMessages[lastIdx].content === 'string' 
        ? fullMessages[lastIdx].content 
        : '';

      if (fileCtx.type.startsWith('image/')) {
        // For images: use image_url content part so the model can SEE the image
        console.log('[ayn-unified] Building multimodal message with image:', fileCtx.name);
        fullMessages[lastIdx] = {
          role: 'user',
          content: [
            { type: 'text', text: lastTextContent },
            { type: 'image_url', image_url: { url: fileCtx.url } }
          ]
        };
      } else if (fileCtx.type === 'application/pdf' || fileCtx.type.startsWith('text/') || 
                 ['application/json', 'text/csv', 'application/xml'].includes(fileCtx.type)) {
        // For text-based files: fetch and inline the content
        try {
          console.log('[ayn-unified] Fetching file content:', fileCtx.name);
          const fileResponse = await fetch(fileCtx.url);
          if (fileResponse.ok) {
            const fileText = await fileResponse.text();
            const truncatedContent = fileText.substring(0, 15000); // Limit to ~15k chars
            fullMessages[lastIdx] = {
              role: 'user',
              content: `${lastTextContent}\n\n--- File Content: ${fileCtx.name} ---\n${truncatedContent}${fileText.length > 15000 ? '\n\n[Content truncated...]' : ''}`
            };
          }
        } catch (fetchErr) {
          console.error('[ayn-unified] Failed to fetch file content:', fetchErr);
        }
      }
    }

    // Call with fallback
    const effectiveStream = stream;
    const { response, modelUsed, wasFallback } = await callWithFallback(
      intent,
      fullMessages,
      effectiveStream,
      supabase,
      userId
    );

    if (effectiveStream && response instanceof Response) {
      // Return streaming response
      return new Response(response.body, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'X-Model-Used': modelUsed.display_name,
          'X-Was-Fallback': wasFallback.toString()
        }
      });
    }

    // Non-streaming response
    let responseContent = (response as { content: string }).content;

    // === SAFETY NET: Intercept hallucinated tool calls ===
    if (responseContent && /["']?action["']?\s*:\s*["']generate_image["']/.test(responseContent)) {
      console.log('[ayn-unified] Safety net: intercepted hallucinated image tool call');
      try {
        const promptMatch = responseContent.match(/["'](?:prompt|action_input|text)["']\s*:\s*["']([^"']+)["']/);
        const imagePrompt = promptMatch?.[1] || lastMessage;
        const { imageUrl: rawImgUrl, revisedPrompt } = await generateImage(imagePrompt);
        const imageUrl = await uploadImageIfDataUrl(rawImgUrl, userId);
        return new Response(JSON.stringify({
          content: revisedPrompt,
          imageUrl,
          revisedPrompt,
          model: modelUsed.display_name,
          wasFallback,
          intent: 'image'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (imgErr) {
        console.error('[ayn-unified] Safety net image generation failed:', imgErr);
      }
    }
    
    const detectedEmotion = detectResponseEmotion(responseContent);
    const userEmotion = detectUserEmotion(lastMessage);
    
    return new Response(JSON.stringify({
      content: responseContent,
      model: modelUsed.display_name,
      wasFallback,
      intent,
      emotion: detectedEmotion,
      userEmotion,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('AYN Unified error:', error);
    
    // Return friendly fallback message
    return new Response(JSON.stringify({
      content: "sorry, having some issues right now. try again in a sec?",
      error: error instanceof Error ? error.message : 'Unknown error',
      fallback: true
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
