import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Tier configuration - MUST match frontend SUBSCRIPTION_TIERS
const TIER_LIMITS: Record<string, Record<string, number | boolean>> = {
  free: { dailyCredits: 5, dailyEngineering: 1, isDaily: true },
  starter: { monthlyCredits: 1000, monthlyEngineering: 10 },
  pro: { monthlyCredits: 5000, monthlyEngineering: 50 },
  business: { monthlyCredits: 15000, monthlyEngineering: 100 },
  enterprise: { monthlyCredits: -1, monthlyEngineering: -1 },
  unlimited: { monthlyCredits: -1, monthlyEngineering: -1 },
};

// Mapping for access_grants.monthly_limit
const TIER_ACCESS_LIMITS: Record<string, number> = {
  free: 5,
  starter: 1000,
  pro: 5000,
  business: 15000,
  enterprise: 999999,
  unlimited: 999999,
};

const PRODUCT_TO_TIER: Record<string, string> = {
  "prod_TpuCGCGKRjz1QR": "starter",
  "prod_TpuDZjjDGHOFfO": "pro",
  "prod_TpuDQFgkmlTXAH": "business",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-SUBSCRIPTION] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Check if user has admin-assigned tier (enterprise/unlimited) - don't overwrite
    const { data: existingSub } = await supabaseClient
      .from('user_subscriptions')
      .select('subscription_tier')
      .eq('user_id', user.id)
      .single();

    if (existingSub?.subscription_tier === 'unlimited' || existingSub?.subscription_tier === 'enterprise') {
      logStep("Preserving admin-assigned tier", { tier: existingSub.subscription_tier });
      return new Response(JSON.stringify({
        subscribed: true,
        tier: existingSub.subscription_tier,
        product_id: null,
        subscription_end: null,
        limits: TIER_LIMITS[existingSub.subscription_tier],
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Find Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
      logStep("No Stripe customer found, setting free tier");

      // Set free tier
      await supabaseClient
        .from('user_ai_limits')
        .upsert({
          user_id: user.id,
          daily_messages: 5,
          daily_engineering: 1,
          monthly_messages: 5,
          monthly_engineering: 1,
        }, { onConflict: 'user_id' });

      await supabaseClient
        .from('access_grants')
        .upsert({
          user_id: user.id,
          is_active: true,
          monthly_limit: TIER_ACCESS_LIMITS.free,
          requires_approval: false,
          granted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });

      return new Response(JSON.stringify({
        subscribed: false,
        tier: 'free',
        product_id: null,
        subscription_end: null,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const customerId = customers.data[0].id;
    logStep("Found Stripe customer", { customerId });

    // Check for active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });

    const hasActiveSub = subscriptions.data.length > 0;
    let tier = 'free';
    let productId: string | null = null;
    let subscriptionEnd: string | null = null;
    let subscriptionId: string | null = null;

    if (hasActiveSub) {
      const subscription = subscriptions.data[0];
      subscriptionId = subscription.id;
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toISOString();
      productId = subscription.items.data[0].price.product as string;
      tier = PRODUCT_TO_TIER[productId] || 'free';
      logStep("Active subscription found", { subscriptionId, productId, tier, endDate: subscriptionEnd });
    } else {
      logStep("No active subscription found");
    }

    const limits = TIER_LIMITS[tier];
    const isDaily = !!limits.isDaily;

    // Update user_subscriptions table
    await supabaseClient
      .from('user_subscriptions')
      .upsert({
        user_id: user.id,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        subscription_tier: tier,
        status: hasActiveSub ? 'active' : 'inactive',
        current_period_end: subscriptionEnd,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    // Update user_ai_limits with correct tier limits
    if (isDaily) {
      await supabaseClient
        .from('user_ai_limits')
        .upsert({
          user_id: user.id,
          daily_messages: limits.dailyCredits as number,
          daily_engineering: limits.dailyEngineering as number,
          monthly_messages: limits.dailyCredits as number,
          monthly_engineering: limits.dailyEngineering as number,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
    } else {
      await supabaseClient
        .from('user_ai_limits')
        .upsert({
          user_id: user.id,
          monthly_messages: limits.monthlyCredits as number,
          monthly_engineering: limits.monthlyEngineering as number,
          daily_messages: limits.monthlyCredits as number,
          daily_engineering: limits.monthlyEngineering as number,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
    }

    // Sync access_grants
    const accessLimit = TIER_ACCESS_LIMITS[tier] ?? TIER_ACCESS_LIMITS.free;
    await supabaseClient
      .from('access_grants')
      .upsert({
        user_id: user.id,
        is_active: true,
        monthly_limit: accessLimit,
        requires_approval: false,
        granted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

    logStep("Database updated", { tier, limits, accessLimit });

    return new Response(JSON.stringify({
      subscribed: hasActiveSub,
      tier,
      product_id: productId,
      subscription_end: subscriptionEnd,
      limits,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
