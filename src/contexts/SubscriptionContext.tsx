import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { getErrorMessage, ErrorCodes } from '@/lib/errorMessages';

// Tier configuration
export const SUBSCRIPTION_TIERS = {
  free: {
    name: 'Free',
    price: 0,
    priceId: null,
    productId: null,
    limits: { monthlyCredits: 5, monthlyEngineering: 1, isDaily: true },
    features: ['5 messages/day', 'Resets daily', 'Basic support'],
  },
  starter: {
    name: 'Starter',
    price: 9,
    priceId: 'price_1SsEOZDBJlSjDe8ADVHgJugk',
    productId: 'prod_TpuCGCGKRjz1QR',
    limits: { monthlyCredits: 1000, monthlyEngineering: 10 },
    features: ['1,000 messages/month', 'PDF & Excel generation', 'Email support'],
  },
  pro: {
    name: 'Pro',
    price: 49,
    priceId: 'price_1SsEP3DBJlSjDe8AednfTBY4',
    productId: 'prod_TpuDZjjDGHOFfO',
    limits: { monthlyCredits: 5000, monthlyEngineering: 50 },
    features: ['5,000 messages/month', 'PDF & Excel generation', 'Priority support'],
  },
  business: {
    name: 'Business',
    price: 99,
    priceId: 'price_1SsEPKDBJlSjDe8AoLaqnZYP',
    productId: 'prod_TpuDQFgkmlTXAH',
    limits: { monthlyCredits: 15000, monthlyEngineering: 100 },
    features: ['15,000 messages/month', 'PDF & Excel generation', 'Priority support'],
  },
  enterprise: {
    name: 'Enterprise',
    price: -1,
    priceId: null,
    productId: null,
    limits: { monthlyCredits: -1, monthlyEngineering: -1 },
    features: ['Custom message allocation', 'Tailored AI solutions', '24/7 priority support'],
  },
   unlimited: {
     name: 'Unlimited',
     price: 0, // Admin-granted, no Stripe billing
     priceId: null,
     productId: null,
     limits: { monthlyCredits: -1, monthlyEngineering: -1 },
     features: ['Unlimited credits', 'Unlimited engineering calcs', 'Full access'],
   },
} as const;

export type SubscriptionTier = keyof typeof SUBSCRIPTION_TIERS;
export type TierKey = SubscriptionTier;

interface SubscriptionState {
  isLoading: boolean;
  isSubscribed: boolean;
  tier: SubscriptionTier;
  productId: string | null;
  subscriptionEnd: string | null;
  limits: {
    monthlyCredits: number;
    monthlyEngineering: number;
    isDaily?: boolean;
  };
}

interface SubscriptionContextType extends SubscriptionState {
  checkSubscription: () => Promise<void>;
  startCheckout: (tier: SubscriptionTier) => Promise<void>;
  openCustomerPortal: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

interface SubscriptionProviderProps {
  children: ReactNode;
}

export const SubscriptionProvider = ({ children }: SubscriptionProviderProps) => {
  const [state, setState] = useState<SubscriptionState>({
    isLoading: true,
    isSubscribed: false,
    tier: 'free',
    productId: null,
    subscriptionEnd: null,
    limits: SUBSCRIPTION_TIERS.free.limits,
  });

  const checkSubscription = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          isSubscribed: false,
          tier: 'free',
          limits: SUBSCRIPTION_TIERS.free.limits,
        }));
        return;
      }

      // Check sessionStorage cache (5 min TTL)
      const cached = sessionStorage.getItem('subscription_cache');
      if (cached) {
        try {
          const { data, timestamp } = JSON.parse(cached);
          if (Date.now() - timestamp < 5 * 60 * 1000) {
            const tier = (data?.tier || 'free') as SubscriptionTier;
            setState({
              isLoading: false,
              isSubscribed: data?.subscribed || false,
              tier,
              productId: data?.product_id || null,
              subscriptionEnd: data?.subscription_end || null,
              limits: SUBSCRIPTION_TIERS[tier]?.limits || SUBSCRIPTION_TIERS.free.limits,
            });
            return;
          }
        } catch {
          sessionStorage.removeItem('subscription_cache');
        }
      }

      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        if (import.meta.env.DEV) {
          console.error('[SubscriptionContext] Error checking subscription:', error);
        }
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      // Cache the response
      sessionStorage.setItem('subscription_cache', JSON.stringify({
        data,
        timestamp: Date.now(),
      }));

      const tier = (data?.tier || 'free') as SubscriptionTier;
      setState({
        isLoading: false,
        isSubscribed: data?.subscribed || false,
        tier,
        productId: data?.product_id || null,
        subscriptionEnd: data?.subscription_end || null,
        limits: SUBSCRIPTION_TIERS[tier]?.limits || SUBSCRIPTION_TIERS.free.limits,
      });
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('[SubscriptionContext] Error:', err);
      }
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const startCheckout = useCallback(async (tier: SubscriptionTier) => {
    if (tier === 'free' || tier === 'enterprise') {
      if (tier === 'free') toast.info('Free tier does not require checkout');
      return;
    }

    const priceId = SUBSCRIPTION_TIERS[tier].priceId;
    if (!priceId) {
      toast.error(getErrorMessage(ErrorCodes.INVALID_TIER).description);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('[SubscriptionContext] Checkout error:', err);
      }
      toast.error(getErrorMessage(ErrorCodes.CHECKOUT_FAILED).description);
    }
  }, []);

  const openCustomerPortal = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('[SubscriptionContext] Portal error:', err);
      }
      toast.error(getErrorMessage(ErrorCodes.PORTAL_FAILED).description);
    }
  }, []);

  // Check subscription on mount and auth state change
  useEffect(() => {
    checkSubscription();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkSubscription();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [checkSubscription]);

  // Realtime listener for subscription changes
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;

    const setupRealtime = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return;

      channel = supabase
        .channel(`sub-${session.user.id.slice(0, 8)}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'user_subscriptions',
            filter: `user_id=eq.${session.user.id}`
          },
          () => {
            sessionStorage.removeItem('subscription_cache');
            checkSubscription();
          }
        )
        .subscribe();
    };

    setupRealtime();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [checkSubscription]);

  return (
    <SubscriptionContext.Provider
      value={{
        ...state,
        checkSubscription,
        startCheckout,
        openCustomerPortal,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};
