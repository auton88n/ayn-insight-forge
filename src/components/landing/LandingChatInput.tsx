import React, { useState, useRef, useEffect } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { ArrowUp, Plus, Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface LandingChatInputProps {
  onSendAttempt: (message: string) => void;
  onPlaceholderChange?: () => void;
}

const placeholders = ["What's on your mind?", "Ask AYN anything...", "How can I help you today?"];

export const LandingChatInput: React.FC<LandingChatInputProps> = ({ onSendAttempt, onPlaceholderChange }) => {
  const [inputMessage, setInputMessage] = useState('');
  const [currentPlaceholder, setCurrentPlaceholder] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Rotate placeholders and notify parent (eye blinks)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPlaceholder((prev) => (prev + 1) % placeholders.length);
      onPlaceholderChange?.();
    }, 4000);
    return () => clearInterval(interval);
  }, [onPlaceholderChange]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [inputMessage]);

  const handleSend = () => {
    const trimmed = inputMessage.trim();
    if (trimmed) {
      onSendAttempt(trimmed);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-xl mx-auto mt-8 md:mt-12 px-4"
    >
      <div
        dir="ltr"
        className={cn(
          "relative rounded-[20px] overflow-hidden",
          // Light mode
          "bg-background/95 backdrop-blur-xl",
          "border border-border/50",
          "shadow-lg shadow-black/5",
          // Dark mode — glass pill
          "dark:bg-[rgba(255,255,255,0.06)] dark:backdrop-blur-[40px] dark:backdrop-saturate-[180%]",
          "dark:border-t dark:border-l dark:border-t-[rgba(255,255,255,0.18)] dark:border-l-[rgba(255,255,255,0.12)]",
          "dark:border-r-transparent dark:border-b-transparent",
          "dark:shadow-[0_0_0_0.5px_rgba(0,0,0,0.3),0_20px_60px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.06)]",
          // Transitions
          "transition-all duration-300",
          "hover:shadow-xl dark:hover:bg-[rgba(255,255,255,0.09)] dark:hover:border-t-[rgba(255,255,255,0.22)]",
          // Noise overlay
          "dark:glass-noise"
        )}
        style={{ transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        {/* Row 1: Input Area */}
        <div className="flex items-end gap-2 px-4 pt-3 pb-2 relative z-[2]">
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={isFocused ? '' : placeholders[currentPlaceholder]}
              className={cn(
                "resize-none border-0 bg-transparent p-0 py-[10px] min-h-[44px] max-h-[120px]",
                "focus:ring-0 focus-visible:ring-0 focus-visible:ring-offset-0",
                "text-base placeholder:text-muted-foreground/60 leading-normal"
              )}
              rows={1}
            />
          </div>

          <AnimatePresence>
            {inputMessage.trim() && (
              <motion.button
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                onClick={handleSend}
                className={cn(
                  "flex-shrink-0 w-9 h-9 rounded-full",
                  "flex items-center justify-center",
                  "bg-foreground text-background",
                  "dark:bg-[#22C55E] dark:text-black",
                  "dark:shadow-[0_0_20px_rgba(34,197,94,0.25)]",
                  "transition-all duration-200",
                  "hover:scale-105 hover:shadow-lg",
                  "active:scale-95"
                )}
              >
                <ArrowUp className="w-5 h-5" strokeWidth={2.5} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Row 2: Toolbar */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-border/30 dark:border-[rgba(255,255,255,0.06)] bg-muted/20 dark:bg-[rgba(255,255,255,0.02)] relative z-[2]">
          <button
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center",
              "text-muted-foreground/60 hover:text-muted-foreground",
              "hover:bg-muted/50 dark:hover:bg-[rgba(255,255,255,0.06)] transition-colors cursor-default"
            )}
          >
            <Plus className="w-5 h-5" />
          </button>
          <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg", "text-sm text-muted-foreground font-medium tracking-wide uppercase")}>
            <Brain className="w-4 h-4" />
            <span className="text-xs tracking-[0.08em]">AYN</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
