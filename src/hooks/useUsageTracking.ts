import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UsageData {
  /** Messages remaining in current period */
  remaining: number;
  /** Total limit for the period */
  totalLimit: number;
  /** Whether the user is allowed to send messages */
  allowed: boolean;
  /** ISO timestamp when limits reset */
  resetsAt: string | null;
  /** User's subscription tier */
  tier: string;
  /** True if user is on the free (daily) plan */
  isFree: boolean;
  /** True if user has unlimited messages */
  isUnlimited: boolean;
  /** Loading state */
  isLoading: boolean;
}

const DEFAULT_STATE: UsageData = {
  remaining: 5,
  totalLimit: 5,
  allowed: true,
  resetsAt: null,
  tier: 'free',
  isFree: true,
  isUnlimited: false,
  isLoading: true,
};

export const useUsageTracking = (userId: string | null): UsageData & { refreshUsage: () => void } => {
  const [usageData, setUsageData] = useState<UsageData>(DEFAULT_STATE);

  const fetchUsage = useCallback(async () => {
    if (!userId) {
      setUsageData(prev => ({ ...prev, isLoading: false }));
      return;
    }
    
    try {
      const { data, error } = await supabase.rpc('check_user_ai_limit', {
        _user_id: userId,
      });

      if (error) {
        if (import.meta.env.DEV) {
          console.error('[useUsageTracking] RPC error:', error);
        }
        setUsageData(prev => ({ ...prev, isLoading: false }));
        return;
      }

      // The RPC returns a JSON object
      const result = typeof data === 'string' ? JSON.parse(data) : data;

      setUsageData({
        remaining: result.remaining ?? 0,
        totalLimit: result.total_limit ?? 5,
        allowed: result.allowed ?? true,
        resetsAt: result.resets_at ?? null,
        tier: result.tier ?? 'free',
        isFree: result.is_free ?? true,
        isUnlimited: result.is_unlimited ?? false,
        isLoading: false,
      });
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('[useUsageTracking] Error fetching usage:', err);
      }
      setUsageData(prev => ({ ...prev, isLoading: false }));
    }
  }, [userId]);

  // Initial fetch
  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  // Real-time subscription for usage updates
  useEffect(() => {
    if (!userId) return;

    const channelName = `usage-${userId.slice(0, 8)}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_ai_limits',
          filter: `user_id=eq.${userId}`
        },
        () => {
          // Re-fetch from the RPC to get computed values
          fetchUsage();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchUsage]);

  return {
    ...usageData,
    refreshUsage: fetchUsage,
  };
};
