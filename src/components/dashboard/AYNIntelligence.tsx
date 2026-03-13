import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ChevronDown, Send, Sparkles } from 'lucide-react';

// ============================================
// PLACEHOLDER DATA — will be replaced by ayn_market_snapshot
// ============================================

const WORLD_MOOD = {
  text: "Things are a bit shaky right now. People are being careful with money.",
  updatedAgo: "2h ago",
};

type Sentiment = 'positive' | 'neutral' | 'cautious';

interface TimingResponse {
  text: string;
  sentiment: Sentiment;
}

const TIMING_RESPONSES: Record<string, TimingResponse> = {
  "Start a business": {
    text: "Not the best timing. People are holding back on spending, so new businesses face a tougher crowd right now.",
    sentiment: "cautious",
  },
  "Raise my prices": {
    text: "Tricky moment. Costs are up everywhere, so people understand price increases — but they're also more likely to shop around.",
    sentiment: "neutral",
  },
  "Sign a long-term contract": {
    text: "Be careful locking in right now. Things are shifting fast, and flexibility is worth a lot in uncertain times.",
    sentiment: "cautious",
  },
  "Invest my savings": {
    text: "There are opportunities if you're patient. Markets are nervous, which often means better entry points for the long run.",
    sentiment: "neutral",
  },
  "Hire someone": {
    text: "Good talent is available right now. Many skilled people are looking, so you might find someone great faster than usual.",
    sentiment: "positive",
  },
  "Build up savings": {
    text: "Smart move right now. When things are uncertain, having cash on hand gives you options others won't have.",
    sentiment: "positive",
  },
};

const DECISION_PLACEHOLDER_RESPONSE =
  "Based on what's happening in the world right now, this move has some headwinds. People are cautious, costs are rising, and markets are jittery. That doesn't mean it's a bad idea — but timing matters. If you can wait a few months, you might find a better window. If you can't wait, go in with extra cushion and a plan B.";

const PRESET_MOVES = [
  "Start a business",
  "Raise my prices",
  "Sign a long-term contract",
  "Invest my savings",
  "Hire someone",
  "Build up savings",
];

// ============================================
// SENTIMENT DOT
// ============================================

const SentimentDot = ({ sentiment }: { sentiment: Sentiment }) => {
  const colors: Record<Sentiment, string> = {
    positive: 'bg-emerald-400',
    neutral: 'bg-amber-400',
    cautious: 'bg-red-400',
  };
  return (
    <span className={cn('inline-block w-2 h-2 rounded-full flex-shrink-0', colors[sentiment])} />
  );
};

// ============================================
// SECTION HEADER (collapsible)
// ============================================

const SectionHeader = ({
  title,
  icon,
  isOpen,
  onToggle,
}: {
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}) => (
  <button
    onClick={onToggle}
    className="w-full flex items-center justify-between gap-2 py-2.5 px-1 text-left group"
  >
    <span className="flex items-center gap-2 text-sm font-medium text-foreground/80 group-hover:text-foreground transition-colors">
      {icon}
      {title}
    </span>
    <ChevronDown
      className={cn(
        'w-3.5 h-3.5 text-muted-foreground transition-transform duration-200',
        isOpen && 'rotate-180'
      )}
    />
  </button>
);

// ============================================
// MAIN COMPONENT
// ============================================

interface AYNIntelligenceProps {
  isMobile: boolean;
}

export const AYNIntelligence = ({ isMobile }: AYNIntelligenceProps) => {
  const [timingOpen, setTimingOpen] = useState(false);
  const [decisionOpen, setDecisionOpen] = useState(false);
  const [selectedMove, setSelectedMove] = useState<string | null>(null);
  const [customMove, setCustomMove] = useState('');
  const [decisionText, setDecisionText] = useState('');
  const [decisionResponse, setDecisionResponse] = useState<string | null>(null);

  const handleMoveSelect = useCallback((move: string) => {
    setSelectedMove(move === selectedMove ? null : move);
  }, [selectedMove]);

  const handleCustomMoveSubmit = useCallback(() => {
    if (!customMove.trim()) return;
    setSelectedMove(customMove.trim());
    setCustomMove('');
  }, [customMove]);

  const handleDecisionSubmit = useCallback(() => {
    if (!decisionText.trim()) return;
    setDecisionResponse(DECISION_PLACEHOLDER_RESPONSE);
  }, [decisionText]);

  const timingResponse = selectedMove
    ? TIMING_RESPONSES[selectedMove] ?? {
        text: "Interesting move. The world is in a cautious phase right now, so go in with your eyes open and a little extra margin.",
        sentiment: 'neutral' as Sentiment,
      }
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8, transition: { duration: 0.15 } }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
      className={cn(
        'w-full flex flex-col gap-1 py-2',
        isMobile ? 'px-1 max-w-sm' : 'px-2 max-w-md'
      )}
    >
      {/* ========== WORLD MOOD ========== */}
      <div className="rounded-xl bg-muted/40 backdrop-blur-sm border border-border/40 px-4 py-3">
        <div className="flex items-start gap-3">
          {/* Pulse dot */}
          <div className="pt-1 flex-shrink-0">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/60 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground/90 leading-relaxed">
              {WORLD_MOOD.text}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1.5">
              Updated {WORLD_MOOD.updatedAgo}
            </p>
          </div>
        </div>
      </div>

      {/* ========== IS NOW A GOOD TIME? ========== */}
      <div className="rounded-xl bg-muted/20 border border-border/30 px-4">
        <SectionHeader
          title="Is now a good time to..."
          icon={<Sparkles className="w-3.5 h-3.5" />}
          isOpen={timingOpen}
          onToggle={() => setTimingOpen(!timingOpen)}
        />
        <AnimatePresence>
          {timingOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <div className="pb-3 space-y-3">
                {/* Preset chips */}
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_MOVES.map((move) => (
                    <button
                      key={move}
                      onClick={() => handleMoveSelect(move)}
                      className={cn(
                        'px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-150',
                        'border',
                        selectedMove === move
                          ? 'bg-primary/15 border-primary/40 text-primary'
                          : 'bg-background/50 border-border/50 text-foreground/70 hover:bg-muted hover:text-foreground'
                      )}
                    >
                      {move}
                    </button>
                  ))}
                </div>

                {/* Custom move input */}
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={customMove}
                    onChange={(e) => setCustomMove(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCustomMoveSubmit()}
                    placeholder="Or type your own..."
                    className="flex-1 text-xs bg-background/50 border border-border/50 rounded-lg px-2.5 py-1.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 transition-colors"
                  />
                  {customMove.trim() && (
                    <button
                      onClick={handleCustomMoveSubmit}
                      className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                    >
                      <Send className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Timing response */}
                <AnimatePresence>
                  {timingResponse && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      transition={{ duration: 0.2 }}
                      className="rounded-lg bg-background/60 border border-border/30 px-3 py-2.5"
                    >
                      <div className="flex items-start gap-2">
                        <div className="pt-1.5">
                          <SentimentDot sentiment={timingResponse.sentiment} />
                        </div>
                        <p className="text-xs text-foreground/85 leading-relaxed">
                          {timingResponse.text}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ========== MY DECISION ========== */}
      <div className="rounded-xl bg-muted/20 border border-border/30 px-4">
        <SectionHeader
          title="My decision"
          icon={<span className="text-sm">🤔</span>}
          isOpen={decisionOpen}
          onToggle={() => setDecisionOpen(!decisionOpen)}
        />
        <AnimatePresence>
          {decisionOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <div className="pb-3 space-y-3">
                <div className="flex gap-1.5">
                  <textarea
                    value={decisionText}
                    onChange={(e) => setDecisionText(e.target.value)}
                    placeholder="Describe any decision you're thinking about..."
                    rows={2}
                    className="flex-1 text-xs bg-background/50 border border-border/50 rounded-lg px-2.5 py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/40 transition-colors resize-none leading-relaxed"
                  />
                </div>
                {decisionText.trim() && !decisionResponse && (
                  <button
                    onClick={handleDecisionSubmit}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors"
                  >
                    <Sparkles className="w-3 h-3" />
                    Analyze
                  </button>
                )}

                <AnimatePresence>
                  {decisionResponse && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      transition={{ duration: 0.2 }}
                      className="rounded-lg bg-background/60 border border-border/30 px-3 py-2.5"
                    >
                      <div className="flex items-start gap-2">
                        <div className="pt-1.5">
                          <SentimentDot sentiment="neutral" />
                        </div>
                        <p className="text-xs text-foreground/85 leading-relaxed">
                          {decisionResponse}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setDecisionResponse(null);
                          setDecisionText('');
                        }}
                        className="mt-2 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Ask about another decision
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
