import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowUp,
  Brain,
  X,
  Loader2,
  Minimize2,
  ChevronUp,
  Sparkles,
  Globe,
  Clock,
  Plus,
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useChartCoach } from '@/hooks/useChartCoach';
import { MessageFormatter } from '@/components/shared/MessageFormatter';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { ChartAnalysisResult } from '@/types/chartAnalyzer.types';
import { formatDistanceToNow } from 'date-fns';

const QUICK_ACTIONS_WITH_RESULT = [
  "Should I buy or sell?",
  "Build me a strategy",
  "What's my exact entry?",
  "Risk analysis",
  "Set my stop loss",
];

const QUICK_ACTIONS_GENERAL = [
  "How to build a trading plan?",
  "Explain position sizing",
  "Best entry strategies",
  "Risk management rules",
];

const getNewsChip = (ticker?: string) =>
  ticker ? `Latest news on ${ticker}` : null;

const placeholders = [
  "Should I buy or sell this?",
  "Build me a trading strategy...",
  "What's my risk here?",
  "Where should I enter?",
  "Help me plan this trade...",
];

// Memoized message bubble
const MessageBubble = memo(({ msg, index }: { msg: { role: string; content: string }; index: number }) => (
  <div
    className={cn(
      "flex flex-col gap-2",
      msg.role === 'user' ? 'items-end' : 'items-start'
    )}
    style={{ contain: 'content' }}
  >
    <div
      className={cn(
        "max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5",
        msg.role === 'user'
          ? "bg-amber-500/15 text-foreground"
          : "bg-muted"
      )}
    >
      {msg.role === 'assistant' ? (
        <MessageFormatter content={msg.content} className="prose prose-sm dark:prose-invert max-w-prose" />
      ) : (
        <p className="text-sm">{msg.content}</p>
      )}
    </div>
  </div>
));
MessageBubble.displayName = 'MessageBubble';

interface ChartCoachChatProps {
  result?: ChartAnalysisResult | null;
}

export default function ChartCoachChat({ result }: ChartCoachChatProps) {
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentPlaceholder, setCurrentPlaceholder] = useState(0);
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const [historyOpen, setHistoryOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, isLoading, sendMessage, clearChat, sessions, activeSessionId, switchSession, newChat } = useChartCoach(result ?? undefined);

  const quickActions = result ? QUICK_ACTIONS_WITH_RESULT : QUICK_ACTIONS_GENERAL;

  // Smart auto-scroll
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const prevMessageCountRef = useRef(0);

  const handleScroll = useCallback(() => {
    const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (!viewport) return;
    const { scrollTop, scrollHeight, clientHeight } = viewport;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    setShouldAutoScroll(isNearBottom);
  }, []);

  // Rotate placeholders
  useEffect(() => {
    const interval = setInterval(() => {
      setShowPlaceholder(false);
      setTimeout(() => {
        setCurrentPlaceholder((prev) => (prev + 1) % placeholders.length);
        setShowPlaceholder(true);
      }, 200);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);

  // Bind scroll listener
  useEffect(() => {
    if (!isExpanded) return;
    const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement | null;
    if (!viewport) return;
    viewport.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => viewport.removeEventListener('scroll', handleScroll);
  }, [handleScroll, isExpanded]);

  // Smart auto-scroll on new messages
  useEffect(() => {
    if (!isExpanded) {
      prevMessageCountRef.current = messages.length;
      return;
    }
    const newMessageAdded = messages.length > prevMessageCountRef.current;
    if (newMessageAdded && shouldAutoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMessageCountRef.current = messages.length;
  }, [messages.length, shouldAutoScroll, isExpanded]);

  // Auto-expand when messages arrive
  useEffect(() => {
    if (messages.length > 0 && !isExpanded) {
      setIsExpanded(true);
    }
  }, [messages.length]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isCollapsed) {
        setIsCollapsed(true);
      }
      if (e.key === '/' && isCollapsed &&
        !(document.activeElement instanceof HTMLInputElement ||
          document.activeElement instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        setIsCollapsed(false);
        setTimeout(() => textareaRef.current?.focus(), 100);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isCollapsed]);

  const handleSubmit = useCallback(() => {
    if (!input.trim() || isLoading) return;
    sendMessage(input);
    setInput('');
    setIsExpanded(true);
  }, [input, isLoading, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Collapsed state - floating button
  if (isCollapsed) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", duration: 0.4 }}
              onClick={() => {
                setIsCollapsed(false);
                setTimeout(() => textareaRef.current?.focus(), 100);
              }}
              className={cn(
                "fixed bottom-6 right-6 w-14 h-14 rounded-full z-50",
                "bg-background/95 backdrop-blur-xl",
                "border border-amber-500/30",
                "shadow-lg hover:shadow-xl",
                "flex items-center justify-center",
                "transition-all duration-200",
                "hover:scale-110 hover:border-amber-500/50",
                "group"
              )}
            >
              <Brain className="w-6 h-6 text-amber-500 group-hover:scale-110 transition-transform" />

              {messages.length > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-white text-xs font-medium flex items-center justify-center"
                >
                  {messages.length > 9 ? '9+' : messages.length}
                </motion.span>
              )}

              {isLoading && (
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-amber-500"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}

              {result && !messages.length && (
                <span className="absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background animate-pulse" />
              )}
            </motion.button>
          </TooltipTrigger>
          <TooltipContent side="left" className="text-xs">
            <p>Open AYN Trade Advisor <kbd className="ml-1 px-1 py-0.5 rounded bg-muted text-muted-foreground">/</kbd></p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Expanded state - bottom bar
  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="fixed bottom-0 left-0 right-0 z-50 p-4 pb-6"
    >
      <div className="mx-auto max-w-2xl">
        {/* Expandable Messages Area */}
        <AnimatePresence>
          {isExpanded && messages.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0, y: 20 }}
              animate={{ height: 'auto', opacity: 1, y: 0 }}
              exit={{ height: 0, opacity: 0, y: 20 }}
              transition={{ duration: 0.2 }}
              className="mb-3"
            >
              <div className={cn(
                "rounded-2xl overflow-hidden",
                "bg-background/95 backdrop-blur-xl",
                "border border-amber-500/20",
                "shadow-lg shadow-black/5"
              )}>
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/30">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Brain className="w-4 h-4 text-amber-500" />
                    <span className="font-medium">AYN Trade Advisor</span>
                    {result && (
                      <span className="text-xs text-amber-500/70">· {result.ticker}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      onClick={clearChat}
                    >
                      Clear
                    </button>
                    <button
                      className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-muted/50 transition-colors"
                      onClick={() => setIsExpanded(false)}
                    >
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>
                <ScrollArea ref={scrollAreaRef} className="h-[280px]" style={{ contain: 'strict' }}>
                  <div
                    className="p-4 space-y-4 flex flex-col"
                    style={{ contentVisibility: 'auto', containIntrinsicSize: '0 500px' }}
                  >
                    {messages.map((msg, i) => (
                      <MessageBubble key={`${msg.role}-${i}`} msg={msg} index={i} />
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-muted rounded-2xl px-4 py-2.5">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Sparkles className="w-4 h-4 animate-pulse text-amber-500" />
                            <span>AYN is thinking...</span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Input Container */}
        <div
          className={cn(
            "relative rounded-2xl overflow-visible",
            "bg-background/95 backdrop-blur-xl",
            "border border-amber-500/20",
            "shadow-lg shadow-black/5",
            "transition-all duration-300",
            "hover:border-amber-500/30 hover:shadow-xl"
          )}
        >
          {/* Row 1: Input Area */}
          <div className="flex items-end gap-2 px-4 pt-3 pb-2 cursor-text" onClick={() => textareaRef.current?.focus()}>
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder=""
                disabled={isLoading}
                unstyled
                className={cn(
                  "resize-none pl-0.5 pr-0 py-3 min-h-[44px] max-h-[120px] w-full",
                  "text-base placeholder:text-muted-foreground/60"
                )}
                rows={1}
              />

              {/* Animated placeholder */}
              {!input && !isFocused && (
                <div
                  className={cn(
                    "absolute top-3 left-0.5 pointer-events-none text-muted-foreground/50",
                    "transition-opacity duration-200",
                    showPlaceholder ? "opacity-100" : "opacity-0"
                  )}
                >
                  {placeholders[currentPlaceholder]}
                </div>
              )}
            </div>

            {/* Send Button */}
            <AnimatePresence>
              {input.trim() && (
                <motion.button
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className={cn(
                    "flex-shrink-0 w-9 h-9 rounded-xl",
                    "flex items-center justify-center",
                    "bg-amber-500 text-white",
                    "transition-all duration-200",
                    "hover:scale-105 hover:shadow-lg hover:bg-amber-600",
                    "active:scale-95",
                    "disabled:opacity-50"
                  )}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <ArrowUp className="w-5 h-5" strokeWidth={2.5} />
                  )}
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Row 2: Quick Actions + Controls */}
          <div className="flex items-center justify-between px-3 py-2 border-t border-border/30 bg-muted/20">
            {/* Left: Quick action chips */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              {result?.ticker && getNewsChip(result.ticker) && (
                <button
                  onClick={() => sendMessage(getNewsChip(result.ticker)!)}
                  disabled={isLoading}
                  className="shrink-0 text-[11px] px-2.5 py-1 rounded-full border border-blue-500/20 text-blue-500 dark:text-blue-400 hover:bg-blue-500/10 transition-colors disabled:opacity-50 whitespace-nowrap flex items-center gap-1"
                >
                  <Globe className="w-3 h-3" />
                  News on {result.ticker}
                </button>
              )}
              {quickActions.map((action) => (
                <button
                  key={action}
                  onClick={() => sendMessage(action)}
                  disabled={isLoading}
                  className="shrink-0 text-[11px] px-2.5 py-1 rounded-full border border-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 transition-colors disabled:opacity-50 whitespace-nowrap"
                >
                  {action}
                </button>
              ))}
            </div>

            {/* Right: History + New Chat + Minimize + AYN */}
            <div className="flex items-center gap-1 shrink-0 ml-2">
              {/* History Button */}
              <Popover open={historyOpen} onOpenChange={setHistoryOpen}>
                <TooltipProvider>
                  <Tooltip>
                    <PopoverTrigger asChild>
                      <TooltipTrigger asChild>
                        <button
                          className="h-7 rounded-lg flex items-center gap-1 px-2 hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground text-[11px]"
                        >
                          <Clock className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">History</span>
                        </button>
                      </TooltipTrigger>
                    </PopoverTrigger>
                    <TooltipContent side="top" className="text-xs">Chat history</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <PopoverContent
                  side="top"
                  align="end"
                  className="w-72 p-0 max-h-[300px] overflow-hidden"
                  sideOffset={8}
                >
                  <div className="px-3 py-2 border-b border-border/50 text-xs font-medium text-muted-foreground">
                    Chat History
                  </div>
                  <ScrollArea className="max-h-[260px]">
                    {sessions.length === 0 ? (
                      <div className="px-3 py-6 text-center text-xs text-muted-foreground">
                        No previous chats
                      </div>
                    ) : (
                      <div className="py-1">
                        {sessions.map((session) => (
                          <button
                            key={session.id}
                            onClick={() => {
                              switchSession(session.id);
                              setHistoryOpen(false);
                              setIsExpanded(true);
                            }}
                            className={cn(
                              "w-full text-left px-3 py-2 hover:bg-muted/50 transition-colors flex items-start gap-2",
                              session.id === activeSessionId && "bg-amber-500/10 border-l-2 border-amber-500"
                            )}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate">{session.title}</p>
                              <p className="text-[10px] text-muted-foreground">
                                {formatDistanceToNow(session.updatedAt, { addSuffix: true })}
                              </p>
                            </div>
                            <span className="text-[10px] text-muted-foreground shrink-0">
                              {session.messages.length} msgs
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </PopoverContent>
              </Popover>

              {/* New Chat Button */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={newChat}
                      className="h-7 rounded-lg flex items-center gap-1 px-2 hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground text-[11px]"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">New</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">New chat</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Minimize */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setIsCollapsed(true)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
                    >
                      <Minimize2 className="w-4 h-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    <p>Minimize <kbd className="ml-1 px-1 py-0.5 rounded bg-muted text-muted-foreground">Esc</kbd></p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {messages.length > 0 && !isExpanded && (
                <button
                  onClick={() => setIsExpanded(true)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted/50 transition-colors"
                >
                  <ChevronUp className="w-4 h-4 text-muted-foreground" />
                </button>
              )}

              <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm text-muted-foreground">
                <Brain className="w-4 h-4 text-amber-500" />
                <span className="text-xs">AYN</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
