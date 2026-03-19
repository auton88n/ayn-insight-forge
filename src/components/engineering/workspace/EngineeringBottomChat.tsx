import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowUp, 
  Plus,
  Play, 
  FileDown, 
  FileText,
  GitCompare, 
  History, 
  RotateCcw,
  Loader2,
  Save,
  Brain,
  X,
  ChevronUp,
  Sparkles,
  CheckCircle2,
  Minimize2,
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useEngineeringAIAgent, type ChatMessage } from '@/hooks/useEngineeringAIAgent';
import { AIActionChip } from './AIActionChip';
import ReactMarkdown from 'react-markdown';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Memoized message bubble for scroll performance
const MessageBubble = memo(({ msg, index }: { msg: ChatMessage; index: number }) => (
  <div
    className={cn(
      "flex flex-col gap-2",
      msg.role === 'user' ? 'items-end' : 'items-start'
    )}
    style={{ contain: 'content' }}
  >
    <div
      className={cn(
        "max-w-[85%] rounded-2xl px-4 py-2.5",
        msg.role === 'user'
          ? "bg-foreground text-background"
          : "bg-muted"
      )}
    >
      {msg.role === 'assistant' ? (
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown>{msg.content}</ReactMarkdown>
        </div>
      ) : (
        <p className="text-sm">{msg.content}</p>
      )}
    </div>
    
    {/* Action chips for assistant messages */}
    {msg.role === 'assistant' && msg.actions && msg.actions.length > 0 && (
      <div className="flex flex-wrap gap-1.5 max-w-[85%]">
        {msg.actions.map((action, j) => (
          <AIActionChip key={j} action={action} />
        ))}
      </div>
    )}
  </div>
));
MessageBubble.displayName = 'MessageBubble';

interface EngineeringBottomChatProps {
  onCalculate: () => void;
  onExportDXF?: () => void;
  onExportPDF?: () => void;
  onCompare: () => void;
  onHistory: () => void;
  onReset?: () => void;
  onSave?: () => void;
  isCalculating: boolean;
  hasResults: boolean;
  canCompare: boolean;
  calculatorType: string | null;
  currentInputs: Record<string, any>;
  currentOutputs: Record<string, any> | null;
  onSetInput?: (field: string, value: any) => void;
  onSetMultipleInputs?: (inputs: Record<string, any>) => void;
  onSwitchCalculator?: (type: string) => void;
  sidebarCollapsed?: boolean;
}

const placeholders = [
  "Design a beam for 6m span with 20kN/m load...",
  "Optimize this for cost efficiency...",
  "Check ACI/CSA code compliance...",
  "Compare 300mm vs 400mm width...",
  "What's the required reinforcement?",
];

export const EngineeringBottomChat: React.FC<EngineeringBottomChatProps> = ({
  onCalculate,
  onExportDXF,
  onExportPDF,
  onCompare,
  onHistory,
  onReset,
  onSave,
  isCalculating,
  hasResults,
  canCompare,
  calculatorType,
  currentInputs,
  currentOutputs,
  onSetInput,
  onSetMultipleInputs,
  onSwitchCalculator,
  sidebarCollapsed = false,
}) => {
  const [input, setInput] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentPlaceholder, setCurrentPlaceholder] = useState(0);
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const actionsMenuRef = useRef<HTMLDivElement>(null);

  // Smart auto-scroll state (prevents forcing user down when reading history)
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

  // AI Agent hook
  const {
    messages,
    isLoading,
    currentAction,
    sendMessage,
    executeQuickCommand,
    clearConversation,
  } = useEngineeringAIAgent({
    calculatorType,
    currentInputs,
    currentOutputs,
    onSetInput: onSetInput || (() => {}),
    onSetMultipleInputs: onSetMultipleInputs || (() => {}),
    onCalculate,
    onSwitchCalculator: onSwitchCalculator || (() => {}),
    onReset: onReset || (() => {}),
    onShowHistory: onHistory,
    onSaveDesign: onSave ? async (name) => { onSave(); } : undefined,
    onExportFile: onExportPDF || onExportDXF ? (format) => {
      if (format === 'pdf' && onExportPDF) onExportPDF();
      else if (format === 'dxf' && onExportDXF) onExportDXF();
    } : undefined,
  });

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

  // Bind scroll listener to the ScrollArea viewport (Radix)
  useEffect(() => {
    if (!isExpanded) return;
    const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement | null;
    if (!viewport) return;

    viewport.addEventListener('scroll', handleScroll, { passive: true });
    // Initialize shouldAutoScroll based on initial position
    handleScroll();

    return () => viewport.removeEventListener('scroll', handleScroll);
  }, [handleScroll, isExpanded]);

  // Smart auto-scroll: only when NEW messages are added AND user is near bottom
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

  // Auto-expand when there are messages
  useEffect(() => {
    if (messages.length > 0 && !isExpanded) {
      setIsExpanded(true);
    }
  }, [messages.length, isExpanded]);

  // Close actions menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(e.target as Node)) {
        setShowActionsMenu(false);
      }
    };
    if (showActionsMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showActionsMenu]);

  // Keyboard shortcuts: Esc to collapse, / to expand
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to collapse
      if (e.key === 'Escape' && !isCollapsed) {
        setIsCollapsed(true);
      }
      // / to expand (only when not in input)
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

  const handleSubmit = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    // Check for quick command
    if (input.startsWith('/')) {
      const handled = executeQuickCommand(input.trim().toLowerCase());
      if (handled) {
        setInput('');
        return;
      }
    }

    await sendMessage(input);
    setInput('');
    setIsExpanded(true);
  }, [input, isLoading, sendMessage, executeQuickCommand]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleAction = (action: () => void) => {
    action();
    setShowActionsMenu(false);
  };

  // Secondary actions for dropdown menu (PDF and DXF moved to main toolbar)
  const secondaryActions = [
    { icon: Save, label: 'Save Design', onClick: onSave, show: !!onSave && hasResults },
    { icon: GitCompare, label: 'Compare', onClick: onCompare, show: canCompare },
  ].filter(item => item.show !== false);

  // Calculate sidebar width offset
  const sidebarWidth = sidebarCollapsed ? 64 : 200;

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
                "border border-border/50",
                "shadow-lg hover:shadow-xl",
                "flex items-center justify-center",
                "transition-all duration-200",
                "hover:scale-110 hover:border-primary/50",
                "group"
              )}
            >
              <Brain className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
              
              {/* Message count badge */}
              {messages.length > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-medium flex items-center justify-center"
                >
                  {messages.length > 9 ? '9+' : messages.length}
                </motion.span>
              )}
              
              {/* Pulse animation when loading */}
              {isLoading && (
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-primary"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              )}
            </motion.button>
          </TooltipTrigger>
          <TooltipContent side="left" className="text-xs">
            <p>Open AYN Chat <kbd className="ml-1 px-1 py-0.5 rounded bg-muted text-muted-foreground">/</kbd></p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Expanded state - full chat bar
  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      style={{ left: sidebarWidth }}
      className="fixed bottom-0 right-0 z-50 p-4 pb-6"
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
                "border border-border/50",
                "shadow-lg shadow-black/5"
              )}>
                <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/30">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Brain className="w-4 h-4 text-primary" />
                    <span className="font-medium">AYN Engineering</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      onClick={clearConversation}
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
                      <MessageBubble 
                        key={msg.id ?? `${msg.role}-${i}`} 
                        msg={msg} 
                        index={i} 
                      />
                    ))}
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-muted rounded-2xl px-4 py-2.5">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Sparkles className="w-4 h-4 animate-pulse text-primary" />
                            <span>Thinking...</span>
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

        {/* Current Action Status */}
        <AnimatePresence>
          {currentAction && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mb-2 flex items-center justify-center gap-2 text-sm text-primary"
            >
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{currentAction}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Input Container - Matching AYN Style */}
        <div
          dir="ltr"
          className={cn(
            "relative rounded-2xl overflow-hidden",
            "bg-background/95 backdrop-blur-xl",
            "border border-border/50",
            "shadow-lg shadow-black/5",
            "transition-all duration-300",
            "hover:border-border hover:shadow-xl"
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
                className={cn(
                  "resize-none border-0 bg-transparent pl-0.5 pr-0 py-3 min-h-[44px] max-h-[120px] w-full",
                  "focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0",
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

            {/* Send Button - Only shows when there's text */}
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
                    "bg-foreground text-background",
                    "transition-all duration-200",
                    "hover:scale-105 hover:shadow-lg",
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

          {/* Row 2: Toolbar with visible buttons */}
          <div className="flex items-center justify-between px-3 py-2 border-t border-border/30 bg-muted/20">
            {/* Left: Main Action Buttons */}
            <div className="flex items-center gap-1">
              {/* Calculate Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={onCalculate}
                disabled={isCalculating || !calculatorType}
                className="h-7 px-2.5 text-xs gap-1.5"
              >
                {isCalculating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5" />
                )}
                Calculate
              </Button>

              {/* Reset Button */}
              {onReset && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onReset}
                  className="h-7 px-2.5 text-xs gap-1.5 text-muted-foreground"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset
                </Button>
              )}

              {/* Export PDF Button - Visible when results exist */}
              {hasResults && onExportPDF && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onExportPDF}
                        className="h-7 px-2.5 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        PDF
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Export PDF Report</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {/* Export DXF Button - Visible when results exist */}
              {hasResults && onExportDXF && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={onExportDXF}
                        className="h-7 px-2.5 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                        DXF
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Export CAD Drawing</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {/* History Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={onHistory}
                className="h-7 px-2.5 text-xs gap-1.5 text-muted-foreground"
              >
                <History className="w-3.5 h-3.5" />
                History
              </Button>

              {/* More Actions Menu */}
              {secondaryActions.length > 0 && (
                <div className="relative" ref={actionsMenuRef}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowActionsMenu(!showActionsMenu)}
                    className={cn(
                      "h-7 w-7 p-0",
                      showActionsMenu && "bg-muted"
                    )}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>

                  <AnimatePresence>
                    {showActionsMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute bottom-full left-0 mb-2 w-40 py-1.5 rounded-lg bg-popover border border-border shadow-xl z-50"
                      >
                        {secondaryActions.map((item, idx) => (
                          <button
                            key={idx}
                            onClick={() => item.onClick && handleAction(item.onClick)}
                            className="w-full flex items-center gap-2.5 px-3 py-1.5 text-sm hover:bg-accent transition-colors"
                          >
                            <item.icon className="w-3.5 h-3.5" />
                            <span>{item.label}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Center: Status */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {hasResults && (
                <div className="flex items-center gap-1.5 text-emerald-500">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span className="text-xs">Ready</span>
                </div>
              )}
            </div>

            {/* Right: Minimize + AYN Brain + Toggle */}
            <div className="flex items-center gap-1">
              {/* Minimize button */}
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
              
              <div
                className={cn(
                  "flex items-center gap-1.5 px-2 py-1.5 rounded-lg",
                  "text-sm text-muted-foreground"
                )}
              >
                <Brain className="w-4 h-4" />
                <span className="text-xs">AYN</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
