import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Infinity as InfinityIcon, Zap, Crown, ArrowRight, Gift } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { differenceInDays, differenceInHours } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

interface CreditUpgradeCardProps {
  currentUsage: number;
  monthlyLimit?: number | null;
  bonusCredits?: number;
  isUnlimited?: boolean;
  resetDate: string | null;
  currentTier?: string;
  userId?: string;
  onOpenFeedback?: () => void;
  rewardAmount?: number;
}

export const CreditUpgradeCard = ({
  currentUsage,
  monthlyLimit,
  bonusCredits = 0,
  isUnlimited = false,
  resetDate,
  currentTier = 'free',
  userId,
  onOpenFeedback,
  rewardAmount = 5
}: CreditUpgradeCardProps) => {
  const navigate = useNavigate();
  const [displayCount, setDisplayCount] = useState(currentUsage);
  const [hasSubmittedFeedback, setHasSubmittedFeedback] = useState<boolean | null>(null);
  const showUpgrade = currentTier === 'free' && !isUnlimited;

  // Total limit includes base monthly limit + bonus credits
  const baseLimit = monthlyLimit ?? 50;
  const totalLimit = baseLimit + bonusCredits;
  const creditsLeft = isUnlimited ? 999 : Math.max(0, totalLimit - currentUsage);

  // Check if user has already submitted feedback
  useEffect(() => {
    if (!userId) return;

    const checkFeedbackStatus = async () => {
      try {
        const { data, error } = await supabase.
        from('beta_feedback').
        select('id').
        eq('user_id', userId).
        limit(1);

        if (error) {
          console.error('Error checking feedback status:', error);
          return;
        }

        setHasSubmittedFeedback(data && data.length > 0);
      } catch (err) {
        console.error('Error checking feedback status:', err);
      }
    };

    checkFeedbackStatus();
  }, [userId]);

  // Animate count changes
  useEffect(() => {
    if (currentUsage !== displayCount) {
      const start = displayCount;
      const end = currentUsage;
      const duration = 300;
      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayCount(Math.round(start + (end - start) * eased));

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    }
  }, [currentUsage]);

  // Calculate reset time
  const formattedResetTime = useMemo(() => {
    if (!resetDate) return null;
    const reset = new Date(resetDate);
    const days = differenceInDays(reset, new Date());
    if (days > 0) return `${days}d`;
    const hours = differenceInHours(reset, new Date());
    return hours > 0 ? `${hours}h` : 'Soon';
  }, [resetDate]);

  const percentage = isUnlimited ? 100 : Math.min(currentUsage / totalLimit * 100, 100);
  const isLow = !isUnlimited && creditsLeft < totalLimit * 0.2;
  const showEarnButton = userId && onOpenFeedback && hasSubmittedFeedback === false;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "relative rounded-xl overflow-hidden",
        "bg-card/60 backdrop-blur-md",
        "border border-border/50",
        "p-3"
      )}>

      {/* Header Row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={cn(
            "p-1.5 rounded-lg",
            isLow ?
            "bg-destructive/20" :
            "bg-muted/50"
          )}>
            {isLow ?
            <Zap className="w-4 h-4 text-destructive" /> :

            <Sparkles className="w-4 h-4 text-foreground/70" />
            }
          </div>
          <span className="font-medium text-sm text-foreground">Credit</span>
        </div>
        <div className="flex items-baseline gap-1">
          <motion.span
            key={displayCount}
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-lg font-bold tabular-nums text-foreground">

            {isUnlimited ? '∞' : String(creditsLeft)}
          </motion.span>
          <span className="text-xs text-muted-foreground">left</span>
        </div>
      </div>

      {/* Status Row */}
      <div className="flex items-center gap-2">
        {isUnlimited ?
        <div className={cn(
          "px-2.5 py-1 rounded-lg",
          "bg-primary/10 border border-primary/20",
          "flex items-center gap-1.5"
        )}>
            <Crown className="w-3 h-3 text-amber-500" />
            <InfinityIcon className="w-3 h-3 text-primary" />
            <span className="text-xs font-medium text-primary">Unlimited</span>
          </div> :

        <div className="flex-1">
            <Progress
            value={100 - percentage}
            className={cn(
              "h-1.5",
              isLow && "[&>div]:bg-destructive"
            )} />

          </div>
        }
        {formattedResetTime &&
        <span className="text-xs text-muted-foreground whitespace-nowrap">
            Resets {formattedResetTime}
          </span>
        }
      </div>

      {/* Earn Credits Button */}
      <AnimatePresence>
        {showEarnButton &&
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}>

            <Button
            onClick={onOpenFeedback}
            size="sm"
            className={cn(
              "w-full mt-2.5 h-9 rounded-lg gap-2",
              "bg-gradient-to-r from-purple-500 via-fuchsia-500 to-pink-500",
              "hover:from-purple-600 hover:via-fuchsia-600 hover:to-pink-600",
              "text-white font-medium",
              "shadow-sm hover:shadow-md shadow-purple-500/20",
              "transition-all duration-150"
            )}>

              <Gift className="w-4 h-4" />
              <span>Earn +{rewardAmount} Credits</span>
              <Sparkles className="w-3.5 h-3.5 text-yellow-200" />
            </Button>
          </motion.div>
        }
      </AnimatePresence>

      {/* Upgrade Link for Free Tier */}
      {showUpgrade && !showEarnButton &&
      <motion.button
        onClick={() => navigate('/pricing')}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className={cn(
          "mt-2 w-full flex items-center justify-center gap-1.5",
          "text-xs font-medium text-primary",
          "hover:text-primary/80 transition-colors",
          "group"
        )}>

          <span>Upgrade to Pro</span>
          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </motion.button>
      }
    </motion.div>);

};