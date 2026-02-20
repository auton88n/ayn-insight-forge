import { useMemo, useRef, useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Sparkles, Zap, Infinity as InfinityIcon, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, differenceInDays } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

interface UsageCardProps {
  currentUsage: number;
  monthlyLimit?: number | null; // null = unlimited
  dailyLimit?: number | null; // deprecated, use monthlyLimit
  isUnlimited?: boolean;
  resetDate: string | null; // ISO date string
  compact?: boolean;
}

export const UsageCard = ({
  currentUsage,
  monthlyLimit,
  dailyLimit,
  isUnlimited: isUnlimitedProp = false,
  resetDate,
  compact = false
}: UsageCardProps) => {
  // Support both props during migration (prefer monthlyLimit)
  const limit = monthlyLimit ?? dailyLimit ?? null;
  const prevUsageRef = useRef(currentUsage);
  const [showPulse, setShowPulse] = useState(false);
  const [displayCount, setDisplayCount] = useState(currentUsage);

  // Animate counter on usage change
  useEffect(() => {
    if (currentUsage !== prevUsageRef.current) {
      setShowPulse(true);
      const timeout = setTimeout(() => setShowPulse(false), 600);
      
      // Animate counter
      const start = prevUsageRef.current;
      const end = currentUsage;
      const duration = 400;
      const startTime = Date.now();
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        setDisplayCount(Math.round(start + (end - start) * eased));
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      requestAnimationFrame(animate);
      
      prevUsageRef.current = currentUsage;
      return () => clearTimeout(timeout);
    }
  }, [currentUsage]);

  const isUnlimited = isUnlimitedProp || !limit;
  const creditsLeft = limit ? Math.max(0, limit - currentUsage) : null;

  const {
    percentage,
    hoursUntilReset,
    formattedResetTime,
    statusColor,
    statusBg,
    isLow
  } = useMemo(() => {
    const pct = limit ? Math.min(currentUsage / limit * 100, 100) : 0;
    let days = 0;
    let formattedTime = '';
    
    if (resetDate) {
      const reset = new Date(resetDate);
      const now = new Date();
      const diffDays = differenceInDays(reset, now);
      days = Math.max(0, diffDays);
      formattedTime = days > 7 ? format(reset, 'MMM d') : `${days}d`;
    }

    // Color based on usage percentage
    let color = 'text-emerald-500';
    let bg = 'bg-emerald-500';
    if (limit) {
      if (pct >= 90) {
        color = 'text-red-500';
        bg = 'bg-red-500';
      } else if (pct >= 75) {
        color = 'text-amber-500';
        bg = 'bg-amber-500';
      }
    }

    // Check if credits are running low (less than 20% remaining)
    const remainingPct = limit ? ((limit - currentUsage) / limit) * 100 : 100;
    
    return {
      percentage: pct,
      hoursUntilReset: days, // now actually days
      formattedResetTime: formattedTime,
      statusColor: color,
      statusBg: bg,
      isLow: limit ? remainingPct < 20 : false
    };
  }, [currentUsage, limit, resetDate]);

  // Determine status level for legend (must be before any early return)
  const statusLevel = useMemo(() => {
    if (!limit) return 'normal';
    if (percentage >= 90) return 'low';
    if (percentage >= 75) return 'warning';
    return 'normal';
  }, [percentage, limit]);

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div 
              className={cn(
                "w-full px-3 py-3 rounded-xl cursor-pointer relative overflow-hidden",
                "bg-gradient-to-r from-muted/60 to-muted/40",
                "border border-border/50 backdrop-blur-sm",
                "hover:border-border/80 transition-all duration-300",
                showPulse && "ring-2 ring-primary/20"
              )}
              animate={showPulse ? { scale: [1, 1.02, 1] } : {}}
              transition={{ duration: 0.3 }}
            >
              {/* Pulse effect */}
              <AnimatePresence>
                {showPulse && (
                  <motion.div 
                    initial={{ opacity: 0.4, scale: 0.8 }}
                    animate={{ opacity: 0, scale: 1.5 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0 bg-primary/10 rounded-xl"
                  />
                )}
              </AnimatePresence>
              
              {/* Main content */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {isUnlimited ? (
                    <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                    </div>
                  ) : (
                    <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center", 
                      percentage >= 90 ? "bg-red-500/10" : percentage >= 75 ? "bg-amber-500/10" : "bg-emerald-500/10"
                    )}>
                      <Zap className={cn("w-3.5 h-3.5", statusColor)} />
                    </div>
                  )}
                  <span className="text-sm font-medium text-foreground">HOO Credit</span>
                </div>
                
                <div className="flex items-center gap-1.5">
                  <motion.span 
                    key={displayCount}
                    className="text-sm font-semibold text-foreground tabular-nums"
                  >
                    {displayCount}
                  </motion.span>
                  <span className="text-xs text-muted-foreground">
                    {isUnlimited ? 'credits' : `/ ${limit}`}
                  </span>
                </div>
              </div>
              
              {/* Progress or Unlimited indicator */}
              {isUnlimited ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/10">
                    <InfinityIcon className="w-3 h-3 text-primary" />
                    <span className="text-xs font-medium text-primary">Unlimited</span>
                  </div>
                  {resetDate && (
                    <span className="text-[10px] text-muted-foreground">
                      Resets in {formattedResetTime}
                    </span>
                  )}
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Progress 
                    value={percentage} 
                    className="h-1.5 w-full bg-muted/60" 
                    indicatorClassName={statusBg}
                  />
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>{creditsLeft} left</span>
                    {resetDate && <span>Resets in {formattedResetTime}</span>}
                  </div>
                </div>
              )}
            </motion.div>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-[200px]">
            <div className="space-y-1">
              <p className="font-medium">{isUnlimited ? 'Unlimited Plan' : 'Daily HOO Credits'}</p>
              <p className="text-xs text-muted-foreground">
                {currentUsage} messages sent
                {resetDate && ` • Resets in ${hoursUntilReset}h`}
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Full size card (non-compact)
  return (
    <motion.div 
      className={cn(
        "p-5 rounded-2xl space-y-4 relative overflow-hidden",
        "bg-card dark:bg-neutral-900 border border-border/50 dark:border-white/10",
        "shadow-sm dark:shadow-none"
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
        <div className="w-10 h-10 rounded-full bg-muted dark:bg-neutral-800 flex items-center justify-center">
          <Zap className="w-5 h-5 text-primary dark:text-white" />
        </div>
        <div>
          <p className="text-base font-semibold text-foreground">Daily HOO Credits</p>
          {resetDate && (
            <p className="text-xs text-muted-foreground">Resets in {formattedResetTime}</p>
          )}
        </div>
      </div>

      {/* Usage Row */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Used</span>
          <span className="text-base font-semibold text-foreground tabular-nums">
            <motion.span key={displayCount}>{displayCount}</motion.span>
            <span className="text-muted-foreground mx-1">/</span>
            <span className="text-foreground">{isUnlimited ? '∞' : limit}</span>
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className={`h-2 rounded-full bg-muted dark:bg-neutral-800 overflow-hidden ${isLow ? 'animate-pulse' : ''}`}>
          <motion.div 
            className={`h-full rounded-full ${isLow ? 'bg-gradient-to-r from-red-500 via-red-400 to-amber-500' : 'bg-gradient-to-r from-blue-500 via-purple-500 to-purple-600'}`}
            initial={{ width: 0 }}
            animate={{ width: isUnlimited ? '100%' : `${percentage}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Stats Boxes */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 rounded-xl bg-muted/80 dark:bg-neutral-800/80 text-center">
          <p className="text-2xl font-bold text-foreground tabular-nums">
            {isUnlimited ? '∞' : creditsLeft}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Remaining</p>
        </div>
        <div className="p-3 rounded-xl bg-muted/80 dark:bg-neutral-800/80 text-center">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">Active</p>
        </div>
      </div>

      {/* Status Legend */}
      <div className="flex items-center justify-center gap-4 pt-1">
        <div className="flex items-center gap-1.5">
          <div className={cn(
            "w-2 h-2 rounded-full",
            statusLevel === 'normal' ? "bg-muted-foreground ring-2 ring-muted-foreground/30" : "bg-muted-foreground/40"
          )} />
          <span className={cn(
            "text-xs",
            statusLevel === 'normal' ? "text-foreground" : "text-muted-foreground"
          )}>Normal</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className={cn(
            "w-2 h-2 rounded-full",
            statusLevel === 'warning' ? "bg-amber-500 ring-2 ring-amber-500/30" : "bg-muted-foreground/40"
          )} />
          <span className={cn(
            "text-xs",
            statusLevel === 'warning' ? "text-amber-500" : "text-muted-foreground"
          )}>Warning</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className={cn(
            "w-2 h-2 rounded-full",
            statusLevel === 'low' ? "bg-red-500 ring-2 ring-red-500/30" : "bg-muted-foreground/40"
          )} />
          <span className={cn(
            "text-xs",
            statusLevel === 'low' ? "text-red-500" : "text-muted-foreground"
          )}>Low</span>
        </div>
      </div>
    </motion.div>
  );
};