import { useMemo, useRef, useEffect, useState } from 'react';
import { Sparkles, Zap, Infinity as InfinityIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { differenceInDays, format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';

interface UsageCardProps {
  // All props optional — component fetches its own live data
  remaining?: number;
  totalLimit?: number;
  allowed?: boolean;
  resetsAt?: string | null;
  tier?: string;
  isFree?: boolean;
  isUnlimited?: boolean;
  userId?: string;
}

interface CreditState {
  remaining: number;
  totalLimit: number;
  allowed: boolean;
  resetsAt: string | null;
  tier: string;
  isFree: boolean;
  isUnlimited: boolean;
  loaded: boolean;
}

export const UsageCard = ({
  userId,
  remaining: propRemaining,
  totalLimit: propTotalLimit,
  allowed: propAllowed,
  resetsAt: propResetsAt,
  tier: propTier,
  isFree: propIsFree,
  isUnlimited: propIsUnlimited,
}: UsageCardProps) => {
  const prevRemainingRef = useRef(0);
  const [showPulse, setShowPulse] = useState(false);
  const [displayCount, setDisplayCount] = useState(0);

  const [credits, setCredits] = useState<CreditState>({
    remaining: propRemaining ?? 0,
    totalLimit: propTotalLimit ?? 5,
    allowed: propAllowed ?? true,
    resetsAt: propResetsAt ?? null,
    tier: propTier ?? 'free',
    isFree: propIsFree ?? true,
    isUnlimited: propIsUnlimited ?? false,
    loaded: false,
  });

  // Fetch live data directly from Supabase
  useEffect(() => {
    if (!userId) return;

    const fetchCredits = async () => {
      try {
        const { data: limitsData, error } = await supabase
          .from('user_ai_limits')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        const { data: subData } = await supabase
          .from('user_subscriptions')
          .select('subscription_tier')
          .eq('user_id', userId)
          .maybeSingle();

        if (error || !limitsData) return;

        const tier = subData?.subscription_tier || 'free';
        const isFree = tier === 'free';
        const isUnlimited = limitsData.is_unlimited === true;

        if (isUnlimited) {
          setCredits(prev => ({ ...prev, isUnlimited: true, loaded: true }));
          return;
        }

        let remaining: number;
        let totalLimit: number;
        let resetsAt: string | null;
        let allowed: boolean;

        if (isFree) {
          const dailyResetAt = limitsData.daily_reset_at
            ? new Date(limitsData.daily_reset_at)
            : null;
          const isExpired = !dailyResetAt || dailyResetAt <= new Date();
          const used = isExpired ? 0 : (limitsData.current_daily_messages || 0);
          const limit = limitsData.daily_messages || 5;
          remaining = Math.max(0, limit - used);
          totalLimit = limit;
          resetsAt = isExpired
            ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            : limitsData.daily_reset_at;
          allowed = remaining > 0;
        } else {
          const monthlyResetAt = limitsData.monthly_reset_at
            ? new Date(limitsData.monthly_reset_at)
            : null;
          const isExpired = !monthlyResetAt || monthlyResetAt <= new Date();
          const used = isExpired ? 0 : (limitsData.current_monthly_messages || 0);
          const limit =
            (limitsData.monthly_messages || 1000) + (limitsData.bonus_credits || 0);
          remaining = Math.max(0, limit - used);
          totalLimit = limit;
          resetsAt = limitsData.monthly_reset_at;
          allowed = remaining > 0;
        }

        setCredits({
          remaining,
          totalLimit,
          allowed,
          resetsAt,
          tier,
          isFree,
          isUnlimited: false,
          loaded: true,
        });
      } catch {
        setCredits(prev => ({ ...prev, loaded: true }));
      }
    };

    fetchCredits();
    const interval = setInterval(fetchCredits, 60000);
    return () => clearInterval(interval);
  }, [userId]);

  // Animate counter on change
  useEffect(() => {
    const target = credits.remaining;
    if (target !== prevRemainingRef.current) {
      setShowPulse(true);
      const timeout = setTimeout(() => setShowPulse(false), 600);
      const start = prevRemainingRef.current;
      const duration = 400;
      const startTime = Date.now();
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayCount(Math.round(start + (target - start) * eased));
        if (progress < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
      prevRemainingRef.current = target;
      return () => clearTimeout(timeout);
    }
  }, [credits.remaining]);

  // Sync displayCount on first load
  useEffect(() => {
    if (credits.loaded) {
      setDisplayCount(credits.remaining);
      prevRemainingRef.current = credits.remaining;
    }
  }, [credits.loaded]);

  const { remaining, totalLimit, allowed, isFree, isUnlimited, resetsAt } = credits;
  const used = totalLimit - remaining;
  const percentage = totalLimit > 0 ? Math.min((used / totalLimit) * 100, 100) : 0;
  const isLow = !isUnlimited && remaining < totalLimit * 0.2;

  const { formattedResetTime } = useMemo(() => {
    let formattedTime = '';
    if (resetsAt) {
      const reset = new Date(resetsAt);
      const diffDays = differenceInDays(reset, new Date());
      formattedTime =
        diffDays > 7
          ? format(reset, 'MMM d')
          : diffDays > 0
          ? `${diffDays}d`
          : 'today';
    }
    return { formattedResetTime: formattedTime };
  }, [resetsAt]);

  // Unlimited users
  if (isUnlimited) {
    return (
      <motion.div
        className={cn(
          'p-5 rounded-2xl space-y-3 relative overflow-hidden',
          'bg-card dark:bg-neutral-900 border border-border/50 dark:border-white/10'
        )}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-base font-semibold text-foreground">Unlimited Plan</p>
            <div className="flex items-center gap-1.5">
              <InfinityIcon className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs text-primary font-medium">Unlimited messages</span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  const periodLabel = isFree ? 'today' : 'this month';
  const periodType = isFree ? 'Daily' : 'Monthly';

  return (
    <motion.div
      className={cn(
        'p-5 rounded-2xl space-y-4 relative overflow-hidden',
        'bg-card dark:bg-neutral-900 border border-border/50 dark:border-white/10',
        'shadow-sm dark:shadow-none'
      )}
      animate={showPulse ? { scale: [1, 1.01, 1] } : {}}
    >
      <AnimatePresence>
        {showPulse && (
          <motion.div
            initial={{ opacity: 0.3 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 bg-primary/5"
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'w-10 h-10 rounded-full flex items-center justify-center',
            isLow ? 'bg-destructive/10' : 'bg-muted dark:bg-neutral-800'
          )}
        >
          <Zap
            className={cn(
              'w-5 h-5',
              isLow ? 'text-destructive' : 'text-primary dark:text-white'
            )}
          />
        </div>
        <div>
          <p className="text-base font-semibold text-foreground">{periodType} Messages</p>
          {resetsAt && (
            <p className="text-xs text-muted-foreground">
              Resets in {formattedResetTime}
            </p>
          )}
        </div>
      </div>

      {/* Limit reached banner */}
      {!allowed && (
        <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20">
          <p className="text-sm font-medium text-destructive mb-1">Limit Reached</p>
          <p className="text-xs text-muted-foreground">
            {isFree
              ? "You've used all 5 messages for today. Come back tomorrow."
              : "You've reached your monthly limit. Top up or wait for renewal."}
          </p>
        </div>
      )}

      {/* Usage Row */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {remaining} of {totalLimit} remaining {periodLabel}
          </span>
        </div>

        {/* Progress Bar */}
        <div
          className={`h-2 rounded-full bg-muted dark:bg-neutral-800 overflow-hidden ${
            isLow ? 'animate-pulse' : ''
          }`}
        >
          <motion.div
            className={`h-full rounded-full ${
              isLow
                ? 'bg-gradient-to-r from-red-500 via-red-400 to-amber-500'
                : 'bg-gradient-to-r from-blue-500 via-purple-500 to-purple-600'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${100 - percentage}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Stats Boxes */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-muted/80 dark:bg-neutral-800/80 text-center">
          <p className="text-2xl font-bold text-foreground tabular-nums">
            {displayCount}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Remaining</p>
        </div>
        <div className="p-3 rounded-xl bg-muted/80 dark:bg-neutral-800/80 text-center">
          <div
            className={cn(
              'w-6 h-6 rounded-full flex items-center justify-center mx-auto',
              allowed ? 'bg-emerald-500/20' : 'bg-destructive/20'
            )}
          >
            <div
              className={cn(
                'w-3 h-3 rounded-full',
                allowed ? 'bg-emerald-500' : 'bg-destructive'
              )}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">
            {allowed ? 'Active' : 'Paused'}
          </p>
        </div>
      </div>
    </motion.div>
  );
};
