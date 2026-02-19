import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";
import { detectResponseEmotion, detectUserEmotion, detectLanguage } from "./emotionDetector.ts";
import { detectIntent } from "./intentDetector.ts";
import { buildSystemPrompt } from "./systemPrompts.ts";
import { sanitizeUserPrompt, detectInjectionAttempt, INJECTION_GUARD } from "../_shared/sanitizePrompt.ts";
import { activateMaintenanceMode } from "../_shared/maintenanceGuard.ts";
import { uploadImageToStorage } from "../_shared/storageUpload.ts";
import { analyzeKlines, calculateEnhancedScore, fetchKlines, fetchFundingRates } from "./marketScanner.ts";

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
  'trading-coach': [
    { id: 'lovable-gemini-3-flash', provider: 'lovable', model_id: 'google/gemini-3-flash-preview', display_name: 'Gemini 3 Flash' },
    { id: 'lovable-gemini-flash', provider: 'lovable', model_id: 'google/gemini-2.5-flash', display_name: 'Gemini 2.5 Flash' },
    { id: 'lovable-gemini-flash-lite', provider: 'lovable', model_id: 'google/gemini-2.5-flash-lite', display_name: 'Gemini 2.5 Flash Lite' }
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

    // PARALLEL DB OPERATIONS - Critical for 30K user scale (saves 200-300ms)
    // Performance keywords to detect if user is asking about paper trading account
    const performanceKeywords = [
      'performance', 'win rate', 'balance', 'trades', 'p&l', 'profit', 'loss',
      'portfolio', 'how are you doing', "how's your account", 'paper trading',
      'track record', 'open positions', 'how many trades', 'account'
    ];
    const isPerformanceQuery = intent === 'trading-coach';

    // Autonomous trading detection (with typo-tolerant matching)
    const autonomousTradingKeywords = [
      'find best token', 'scan market', 'look for trade', 'find opportunity',
      'paper testing', 'pepar testing', 'peper testing', 'papar testing',
      'start trading', 'trade for me', 'what should i buy',
      'find best setup', 'hunt for trades', 'scan for opportunities',
      'do paper testing', 'find winning trade', 'find me a trade',
      'scan pairs', 'best crypto', 'what to buy', 'best token',
      'chose the best', 'choose the best', 'pick the best', 'pick a token',
      'make money', 'making money', 'open a trade', 'execute trade',
      'ابحث عن', 'تداول لي', 'افضل عملة',
    ];
    const msgLower = lastMessage.toLowerCase();
    const wantsAutonomousTrading = intent === 'trading-coach' &&
      autonomousTradingKeywords.some(kw => msgLower.includes(kw));

    const [limitCheck, userContext, chartHistory, accountPerformance, scanResults] = await Promise.all([
      isInternalCall ? Promise.resolve({ allowed: true }) : checkUserLimit(supabase, userId, intent),
      isInternalCall ? Promise.resolve({}) : getUserContext(supabase, userId),
      supabase.from('chart_analyses')
        .select('ticker, asset_type, timeframe, prediction_signal, confidence, sentiment_score, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5),
      // Fetch real paper trading data when relevant
      isPerformanceQuery ? (async () => {
        try {
          const [accountRes, openRes, recentRes] = await Promise.all([
            supabase.from('ayn_account_state').select('*').maybeSingle(),
            supabase.from('ayn_paper_trades').select('*').in('status', ['OPEN', 'PARTIAL_CLOSE']),
            supabase.from('ayn_paper_trades').select('*').in('status', ['CLOSED_WIN', 'CLOSED_LOSS', 'STOPPED_OUT']).order('exit_time', { ascending: false }).limit(5),
          ]);
          return {
            account: accountRes.data,
            openPositions: openRes.data || [],
            recentTrades: recentRes.data || [],
          };
        } catch (err) {
          console.error('[ayn-unified] Failed to fetch account performance:', err);
          return null;
        }
      })() : Promise.resolve(null),
      // Scan market for autonomous trading
      wantsAutonomousTrading ? scanMarketOpportunities() : Promise.resolve(null)
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

    // Build chart history context for AYN
    const chartSection = chartHistory?.data?.length
      ? `\n\nUSER'S RECENT CHART ANALYSES (reference when they ask about their trading history):\n${chartHistory.data.map((c: Record<string, unknown>) =>
          `- ${c.ticker || 'Unknown'} (${c.asset_type || 'N/A'}): ${c.prediction_signal} signal, ${c.confidence}% confidence, ${c.timeframe} timeframe (${new Date(c.created_at as string).toLocaleDateString()})`
        ).join('\n')}`
      : '';

    // Inject real paper trading performance data into context if available
    let performanceContext = '';
    if (accountPerformance?.account) {
      const acct = accountPerformance.account;
      const openPos = accountPerformance.openPositions;
      const recentTrades = accountPerformance.recentTrades;
      
      performanceContext = `\n\nREAL PAPER TRADING DATA (FROM DATABASE — USE THIS, DO NOT FABRICATE):
Balance: $${Number(acct.current_balance).toFixed(2)}
Starting: $${Number(acct.starting_balance).toFixed(2)}
Total P&L: $${Number(acct.total_pnl_dollars).toFixed(2)} (${Number(acct.total_pnl_percent).toFixed(2)}%)
Total Trades: ${acct.total_trades}
Win Rate: ${Number(acct.win_rate).toFixed(1)}%
Winning: ${acct.winning_trades} | Losing: ${acct.losing_trades}
Open Positions: ${openPos.length}${openPos.length > 0 ? '\n' + openPos.map((t: Record<string, unknown>) => `  - ${t.ticker} ${t.signal} @ $${t.entry_price} (size: $${Number(t.position_size_dollars).toFixed(2)})`).join('\n') : ''}
Recent Closed Trades: ${recentTrades.length}${recentTrades.length > 0 ? '\n' + recentTrades.map((t: Record<string, unknown>) => `  - ${t.ticker} ${t.signal}: entry $${t.entry_price} → exit $${t.exit_price} | P&L: $${Number(t.pnl_dollars as number).toFixed(2)} (${Number(t.pnl_percent as number).toFixed(2)}%) | ${t.status}`).join('\n') : ''}`;
      
      console.log('[ayn-unified] Injected real performance data into trading context');
    } else if (isPerformanceQuery) {
      // Performance query but no account data found
      performanceContext = `\n\nREAL PAPER TRADING DATA — INJECTED FROM DATABASE:
Balance: $10,000.00 | Starting: $10,000.00 | P&L: $0.00 (0.00%)
Total Trades: 0 | Win Rate: N/A
Open Positions: NONE
Closed Trades: NONE
STATUS: Account launched. Zero trades executed.

MANDATORY RESPONSE FOR THIS STATE:
Your answer MUST say: "My paper trading account is live with $10,000. No trades yet — I'm being selective and waiting for a 65%+ confidence setup."
DO NOT DEVIATE. DO NOT ADD FICTIONAL TRADES. DO NOT ADD FICTIONAL PRICES. DO NOT INVENT BALANCES OTHER THAN $10,000.`;
      
      console.log('[ayn-unified] No account data found, injected default state');
    }

    // Inject market scan results for autonomous trading
    let scanContext = '';
    if (scanResults && scanResults.opportunities.length > 0) {
      scanContext = `\n\nMARKET SCAN RESULTS (LIVE FROM PIONEX API — USE THIS DATA):
Scanned: ${scanResults.scannedPairs} pairs
Top Opportunities: ${scanResults.opportunities.length}

${scanResults.opportunities.map((opp: any, i: number) => `${i + 1}. ${opp.ticker}
   Score: ${opp.score}/100
   Price: $${opp.price}
   24h Change: ${opp.priceChange24h > 0 ? '+' : ''}${opp.priceChange24h.toFixed(2)}%
   Volume: $${(opp.volume24h / 1e6).toFixed(1)}M
   Signals: ${opp.signals.join(', ')}`).join('\n\n')}

You are AUTHORIZED to pick the best one and open a trade. Include EXECUTE_TRADE JSON at the end of your response.`;
      console.log(`[ayn-unified] Injected scan results: ${scanResults.opportunities.length} opportunities from ${scanResults.scannedPairs} pairs`);
    } else if (wantsAutonomousTrading) {
      scanContext = `\n\nMARKET SCAN RESULTS: Scanned ${scanResults?.scannedPairs || 'all'} pairs. NO opportunities scored above threshold.
You MUST tell the user: "I scanned ${scanResults?.scannedPairs || 'the market'} pairs — no high-conviction setups right now. I won't force a trade."
DO NOT fabricate or invent any trade. DO NOT make up prices. DO NOT suggest a specific coin with a specific price. Just report the scan result honestly.`;
      console.log('[ayn-unified] Market scan found no qualifying opportunities');
    } else if (intent === 'trading-coach') {
      // ANTI-FABRICATION: When NOT in autonomous mode, prevent the AI from inventing trades
      scanContext += `\n\nCRITICAL ANTI-FABRICATION RULE:
You do NOT have live market data right now. DO NOT invent specific prices, entry points, or trade recommendations with made-up numbers.
If the user asks you to trade or pick a token, tell them to say "do paper testing" or "find best token" so you can scan real Pionex market data first.
NEVER say "I'm buying X at $Y" unless you have MARKET SCAN RESULTS above with real prices from Pionex.
You may discuss trading concepts, strategy, and education freely — just don't fabricate specific prices.`;
    }

    // Build system prompt with user message for language detection AND user memories
    let systemPrompt = buildSystemPrompt(intent, language, context, lastMessage, userContext) + performanceContext + chartSection + scanContext + INJECTION_GUARD;

    // === FIRECRAWL + LIVE PIONEX INTEGRATION FOR TRADING COACH ===
    if (intent === 'trading-coach') {
      const { scrapeUrl: urlToScrape, searchQuery, ticker: ctxTicker, assetType: ctxAssetType, timeframe: ctxTimeframe } = context;

      const firecrawlTasks: Promise<void>[] = [];

      // --- Ticker detection from user message ---
      const CRYPTO_MAP: Record<string, string> = {
        'bitcoin': 'BTC', 'btc': 'BTC',
        'ethereum': 'ETH', 'eth': 'ETH', 'ether': 'ETH',
        'solana': 'SOL', 'sol': 'SOL',
        'xrp': 'XRP', 'ripple': 'XRP',
        'dogecoin': 'DOGE', 'doge': 'DOGE',
        'cardano': 'ADA', 'ada': 'ADA',
        'polkadot': 'DOT', 'dot': 'DOT',
        'avalanche': 'AVAX', 'avax': 'AVAX',
        'chainlink': 'LINK', 'link': 'LINK',
        'polygon': 'POL', 'matic': 'POL', 'pol': 'POL',
        'litecoin': 'LTC', 'ltc': 'LTC',
        'uniswap': 'UNI', 'uni': 'UNI',
        'shiba': 'SHIB', 'shib': 'SHIB',
        'tron': 'TRX', 'trx': 'TRX',
        'cosmos': 'ATOM', 'atom': 'ATOM',
        'near': 'NEAR', 'near protocol': 'NEAR',
        'aptos': 'APT', 'apt': 'APT',
        'sui': 'SUI',
        'arbitrum': 'ARB', 'arb': 'ARB',
        'optimism': 'OP', 'op': 'OP',
        'filecoin': 'FIL', 'fil': 'FIL',
        'pepe': 'PEPE',
        'bonk': 'BONK',
        'render': 'RENDER',
        'injective': 'INJ', 'inj': 'INJ',
        'sei': 'SEI',
        'celestia': 'TIA', 'tia': 'TIA',
        'jupiter': 'JUP', 'jup': 'JUP',
        'bnb': 'BNB', 'binance coin': 'BNB',
        'ton': 'TON', 'toncoin': 'TON',
      };

      function detectTickerFromMessage(msg: string): string | null {
        const lower = msg.toLowerCase();
        // Check longer names first to avoid partial matches
        const sorted = Object.entries(CRYPTO_MAP).sort((a, b) => b[0].length - a[0].length);
        for (const [name, symbol] of sorted) {
          // Use word boundary matching
          const regex = new RegExp(`\\b${name}\\b`, 'i');
          if (regex.test(lower)) return symbol;
        }
        return null;
      }

      const mentionedSymbol = detectTickerFromMessage(lastMessage);
      const cleanCtxTicker = ctxTicker ? ctxTicker.replace(/\/USDT|\/USD|\/BUSD/i, '').toUpperCase() : null;
      
      // Determine which tickers to fetch
      const tickersToFetch = new Set<string>();
      if (cleanCtxTicker && ctxAssetType === 'crypto' && ctxTicker !== 'UNKNOWN') {
        tickersToFetch.add(cleanCtxTicker);
      }
      if (mentionedSymbol && mentionedSymbol !== cleanCtxTicker) {
        tickersToFetch.add(mentionedSymbol);
      }

      // Anti-hallucination guard
      systemPrompt += `\n\nCRITICAL RULE: NEVER fabricate, guess, or hallucinate any price, market data, or statistics. If you do NOT have live data for a specific coin or asset provided below, you MUST say "I don't have live data for that coin right now." Do NOT make up numbers.`;

      // Fetch live Pionex data for all detected tickers
      for (const ticker of tickersToFetch) {
        firecrawlTasks.push((async () => {
          try {
            const apiKey = Deno.env.get('PIONEX_API_KEY');
            const apiSecret = Deno.env.get('PIONEX_API_SECRET');
            if (!apiKey || !apiSecret) return;

            const symbol = `${ticker}_USDT`;
            console.log('[DEBUG ayn-unified] Ticker mapping:', ticker, '->', symbol);
            const intervalMap: Record<string, string> = {
              '1m': '1M', '5m': '5M', '15m': '15M', '30m': '30M',
              '1H': '60M', '4H': '4H', '8H': '8H', '12H': '12H',
              'Daily': '1D', 'Weekly': '1D', 'Monthly': '1D', 'unknown': '60M',
            };
            const interval = intervalMap[ctxTimeframe || 'unknown'] || '60M';

            async function signReq(qs: string): Promise<string> {
              const enc = new TextEncoder();
              const key = await crypto.subtle.importKey('raw', enc.encode(apiSecret!), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
              const sig = await crypto.subtle.sign('HMAC', key, enc.encode(qs));
              return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
            }

            const ts = Date.now().toString();
            const baseUrl = 'https://api.pionex.com';

            // Fetch ticker 24h stats
            const tickerPath = `/api/v1/market/tickers?symbol=${symbol}&timestamp=${ts}`;
            const tickerSig = await signReq(tickerPath);
            const tickerRes = await fetch(`${baseUrl}${tickerPath}`, {
              headers: { 'PIONEX-KEY': apiKey, 'PIONEX-SIGNATURE': tickerSig },
            });

            let liveBlock = '';
            if (tickerRes.ok) {
              const tickerData = await tickerRes.json();
              console.log('[DEBUG ayn-unified] Raw ticker response for', symbol, ':', JSON.stringify(tickerData).slice(0, 500));
              const t = tickerData?.data?.tickers?.[0];
              if (t) {
                const price = parseFloat(t.close || t.last || '0');
                console.log('[DEBUG ayn-unified] Price extracted:', price, 'from fields close:', t.close, 'last:', t.last, 'open:', t.open);
                const open = parseFloat(t.open || '0');
                const change = open > 0 ? ((price - open) / open * 100).toFixed(2) : 'N/A';
                liveBlock = `\n\n📊 LIVE MARKET DATA for ${ticker} (Pionex, just fetched):\nSymbol: ${symbol}\nCurrent Price: ${price}\n24h Change: ${change}%\n24h High: ${t.high || 'N/A'}\n24h Low: ${t.low || 'N/A'}\n24h Volume: ${t.amount ? parseFloat(t.amount).toLocaleString() + ' USDT' : 'N/A'}\n\nUse this live data to give accurate answers about ${ticker}. Reference these numbers when the user asks about ${ticker}.`;
              }
            } else {
              await tickerRes.text();
            }

            // Fetch last 10 candles
            const klinesPath = `/api/v1/market/klines?symbol=${symbol}&interval=${interval}&limit=10&timestamp=${ts}`;
            const klinesSig = await signReq(klinesPath);
            const klinesRes = await fetch(`${baseUrl}${klinesPath}`, {
              headers: { 'PIONEX-KEY': apiKey, 'PIONEX-SIGNATURE': klinesSig },
            });

            if (klinesRes.ok) {
              const klinesData = await klinesRes.json();
              console.log('[DEBUG ayn-unified] Raw klines response for', symbol, ':', JSON.stringify(klinesData).slice(0, 500));
              const klines = klinesData?.data?.klines || [];
              if (klines.length > 0) {
                const candles = klines.slice(-5).map((k: any) => `O:${k.open} H:${k.high} L:${k.low} C:${k.close}`).join(' | ');
                liveBlock += `\nRecent ${interval} candles for ${ticker}: ${candles}`;
              }
            } else {
              await klinesRes.text();
            }

            if (liveBlock) {
              systemPrompt += liveBlock;
              console.log(`[ayn-unified] Injected live Pionex data for ${symbol}`);
            }
          } catch (err) {
            console.warn(`[ayn-unified] Pionex fetch error for ${ticker}:`, err);
          }
        })());
      }

      if (urlToScrape && typeof urlToScrape === 'string') {
        firecrawlTasks.push((async () => {
          try {
            const { scrapeUrl: scrapeUrlFn } = await import("../_shared/firecrawlHelper.ts");
            const { sanitizeForPrompt, FIRECRAWL_CONTENT_GUARD } = await import("../_shared/sanitizeFirecrawl.ts");
            const scraped = await scrapeUrlFn(urlToScrape);
            if (scraped.success && scraped.markdown) {
              const title = scraped.metadata?.title || 'Article';
              const safeContent = sanitizeForPrompt(scraped.markdown, 3000);
              systemPrompt += `\n\n${FIRECRAWL_CONTENT_GUARD}\nARTICLE CONTENT (user shared this URL - "${title}"):\n${safeContent}`;
              console.log(`[ayn-unified] Scraped URL for trading coach: ${urlToScrape.substring(0, 60)}`);
            }
          } catch (err) {
            console.error('[ayn-unified] Firecrawl scrape error:', err);
          }
        })());
      }

      // Backend fallback: generate searchQuery if frontend didn't send one but we have context
      let effectiveSearchQuery = (searchQuery && typeof searchQuery === 'string') ? searchQuery : null;
      if (!effectiveSearchQuery && mentionedSymbol) {
        // Check if the message is asking a market/price question
        const marketQuestion = /\b(price|buy|sell|hold|dump|pump|crash|surge|news|happening|analysis|forecast|prediction|why|should|worth|bullish|bearish)\b/i;
        if (marketQuestion.test(lastMessage) || lastMessage.includes('?')) {
          effectiveSearchQuery = `${mentionedSymbol} crypto latest price analysis today`;
          console.log(`[ayn-unified] Backend fallback search query: "${effectiveSearchQuery}"`);
        }
      }

      if (effectiveSearchQuery) {
        firecrawlTasks.push((async () => {
          try {
            const { searchWeb } = await import("../_shared/firecrawlHelper.ts");
            const { sanitizeForPrompt, FIRECRAWL_CONTENT_GUARD } = await import("../_shared/sanitizeFirecrawl.ts");
            const results = await searchWeb(effectiveSearchQuery!, { limit: 5 });
            if (results.success && results.data?.length) {
              const newsLines = results.data.map((r: { title: string; description: string; url: string }) =>
                `- ${sanitizeForPrompt(r.title, 200)}: ${sanitizeForPrompt(r.description, 300)} (${r.url})`
              ).join('\n');
              systemPrompt += `\n\n${FIRECRAWL_CONTENT_GUARD}\nLIVE MARKET NEWS (from web search for "${effectiveSearchQuery}"):\n${newsLines}\n\nUse this info naturally. Cite sources when relevant. Never reveal you used Firecrawl or web search tools.`;
              console.log(`[ayn-unified] Web search for trading coach: "${effectiveSearchQuery}" - ${results.data.length} results`);
            }
          } catch (err) {
            console.error('[ayn-unified] Firecrawl search error:', err);
          }
        })());
      }

      if (firecrawlTasks.length > 0) {
        await Promise.all(firecrawlTasks);
      }
    }

    // Handle image generation intent (LAB mode)
    if (intent === 'image') {
      try {
        const { imageUrl: rawImageUrl, revisedPrompt } = await generateImage(lastMessage);
        
        // Upload to storage for permanent URL
        const imageUrl = await uploadImageIfDataUrl(rawImageUrl, userId);
        
        // Log usage
        try {
          await supabase.from('llm_usage_logs').insert({
            user_id: userId,
            intent_type: 'image',
            was_fallback: false
          });
        } catch (logError) {
          console.error('Failed to log image usage:', logError);
        }

        return new Response(JSON.stringify({
          content: revisedPrompt,
          imageUrl,
          revisedPrompt,
          model: 'Gemini Image',
          wasFallback: false,
          intent: 'image'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (imageError) {
        console.error('[ayn-unified] Image generation failed:', imageError);
        return new Response(JSON.stringify({
          content: "sorry, couldn't generate that image right now. try describing it differently?",
          error: imageError instanceof Error ? imageError.message : 'Image generation failed',
          intent: 'image'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Handle document generation intent
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

    // Call with fallback — force non-streaming for autonomous trading (need to parse EXECUTE_TRADE)
    const effectiveStream = wantsAutonomousTrading ? false : stream;
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
    
    // === AUTO-EXECUTE TRADE: Parse EXECUTE_TRADE from AI response ===
    const tradeMatch = responseContent.match(/EXECUTE_TRADE:\s*(\{[\s\S]*?\})\s*$/m);
    let tradeResult = null;
    if (tradeMatch) {
      try {
        const tradeParams = JSON.parse(tradeMatch[1]);
        // Enrich with scan context if AI didn't include marketContext
        if (!tradeParams.marketContext && scanResults?.opportunities?.length > 0) {
          const matchedOpp = scanResults.opportunities.find((o: any) => o.ticker === tradeParams.ticker);
          if (matchedOpp) {
            tradeParams.marketContext = {
              score: matchedOpp.score,
              signals: matchedOpp.signals,
              volume24h: matchedOpp.volume24h,
              priceChange24h: matchedOpp.priceChange24h,
            };
          }
        }
        console.log('[AUTO-TRADE] AI wants to execute:', JSON.stringify(tradeParams));
        
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const tradeRes = await fetch(`${supabaseUrl}/functions/v1/ayn-open-trade`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(tradeParams),
        });
        
        if (tradeRes.ok) {
          tradeResult = await tradeRes.json();
          if (tradeResult.opened) {
            // Remove the raw EXECUTE_TRADE line and append confirmation
            responseContent = responseContent.replace(/EXECUTE_TRADE:\s*\{[\s\S]*?\}\s*$/m, '').trim();
            responseContent += `\n\n✅ Position opened successfully. Trade ID: ${tradeResult.trade?.id?.substring(0, 8) || 'confirmed'}\nTracking live on Performance tab.`;
            console.log('[AUTO-TRADE] ✅ Trade opened:', tradeResult.summary);
          } else {
            responseContent = responseContent.replace(/EXECUTE_TRADE:\s*\{[\s\S]*?\}\s*$/m, '').trim();
            responseContent += `\n\n⚠️ Trade not opened: ${tradeResult.reason}`;
            console.log('[AUTO-TRADE] Trade skipped:', tradeResult.reason);
          }
        } else {
          const errText = await tradeRes.text();
          console.error('[AUTO-TRADE] Trade function error:', errText);
          responseContent = responseContent.replace(/EXECUTE_TRADE:\s*\{[\s\S]*?\}\s*$/m, '').trim();
          responseContent += `\n\n⚠️ Could not execute trade right now. Try again.`;
        }
      } catch (e) {
        console.error('[AUTO-TRADE] Failed to parse/execute:', e);
        responseContent = responseContent.replace(/EXECUTE_TRADE:\s*\{[\s\S]*?\}\s*$/m, '').trim();
      }
    }

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
      ...(scanResults?.opportunities ? { scanResults: scanResults.opportunities } : {}),
      ...(tradeResult?.opened ? { tradeOpened: true, tradeId: tradeResult.trade?.id } : {})
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
