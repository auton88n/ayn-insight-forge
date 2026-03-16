import { useRef, useState, memo, useCallback } from 'react';
import { Brain } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { LandingChatInput } from '@/components/landing/LandingChatInput';
import { useDebugStore } from '@/stores/debugStore';

interface HeroProps {
  onGetStarted: (prefillMessage?: string) => void;
}

const appleEase = [0.16, 1, 0.3, 1] as [number, number, number, number];

export const Hero = memo(({ onGetStarted }: HeroProps) => {
  const { language } = useLanguage();
  const debugRef = useRef(useDebugStore.getState());
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);

  if (debugRef.current?.isDebugMode) {
    debugRef.current.incrementRenderCount('Hero');
  }

  const handlePlaceholderChange = useCallback(() => {
    setIsBlinking(true);
    setTimeout(() => setIsBlinking(false), 150);
  }, []);

  return (
    <section
      ref={containerRef}
      className="relative min-h-[100dvh] flex flex-col items-center justify-between pt-20 md:pt-24 pb-6 md:pb-8 px-4 md:px-12 lg:px-24 overflow-x-hidden overflow-y-visible"
      aria-label="Hero"
    >
      {/* Ambient orbs — Apple Vision Pro soft glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="ambient-orb w-[500px] h-[500px] bg-[rgba(34,197,94,0.06)] top-[10%] left-[-10%]" />
        <div className="ambient-orb w-[400px] h-[400px] bg-[rgba(59,130,246,0.05)] bottom-[5%] right-[-5%]" />
        <div className="ambient-orb w-[300px] h-[300px] bg-[rgba(168,85,247,0.04)] top-[40%] right-[20%]" />
      </div>

      {/* Headline */}
      <div className="w-full max-w-4xl text-center mb-4 md:mb-6">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: appleEase, delay: 0 }}
          className="font-sans font-bold tracking-[-0.04em] text-foreground mb-2 md:mb-3 text-5xl sm:text-6xl md:text-7xl lg:text-8xl"
        >
          {language === 'ar' ? 'تعرّف على AYN' : language === 'fr' ? 'Découvrez AYN' : 'Meet AYN'}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: appleEase, delay: 0.1 }}
          className="text-base md:text-lg lg:text-xl text-muted-foreground font-normal tracking-[-0.01em] max-w-2xl mx-auto"
        >
          {language === 'ar'
            ? 'رفيقك الذكي الذي يساعدك على التنظيم والتخطيط والعيش بشكل أفضل.'
            : language === 'fr'
            ? 'Le compagnon intelligent qui vous aide à organiser, planifier et mieux vivre.'
            : 'The intelligent companion that helps you organize, plan, and live better'}
        </motion.p>
      </div>

      {/* Central eye — glass container */}
      <motion.div
        className="relative w-full max-w-5xl flex-1 flex items-center justify-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...appleSpring, delay: 0.2 }}
      >
        {/* Subtle ambient glow behind eye */}
        <div className="absolute w-[200px] h-[200px] sm:w-[280px] sm:h-[280px] md:w-[360px] md:h-[360px] lg:w-[480px] lg:h-[480px] rounded-full -z-10 pointer-events-none bg-gradient-to-b from-transparent via-[rgba(34,197,94,0.04)] to-transparent dark:via-[rgba(34,197,94,0.06)]" />

        {/* Eye */}
        <div
          className="relative z-10 flex items-center justify-center group cursor-pointer"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="absolute -inset-8 rounded-full blur-2xl pointer-events-none dark:bg-[radial-gradient(circle,_rgba(34,197,94,0.08)_0%,_transparent_70%)] bg-[radial-gradient(circle,_rgba(229,229,229,0.3)_0%,_transparent_70%)]" />

          <div className="relative w-[120px] h-[120px] sm:w-[160px] sm:h-[160px] md:w-[200px] md:h-[200px] lg:w-[240px] lg:h-[240px] rounded-full flex items-center justify-center overflow-hidden shadow-xl dark:bg-[rgba(255,255,255,0.06)] dark:backdrop-blur-[40px] dark:shadow-[0_0_0_0.5px_rgba(0,0,0,0.3),0_20px_60px_rgba(0,0,0,0.5)] dark:border dark:border-[rgba(255,255,255,0.12)] bg-card">
            <div className="absolute inset-2 rounded-full shadow-[inset_0_4px_16px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_4px_16px_rgba(0,0,0,0.4)]" />
            <div className="absolute inset-[15%] rounded-full bg-muted dark:bg-[rgba(255,255,255,0.04)]" />

            <motion.svg
              viewBox="0 0 100 100"
              className="w-[70%] h-[70%] relative z-10"
              xmlns="http://www.w3.org/2000/svg"
              animate={{
                scaleY: isBlinking ? 0.05 : 1,
                opacity: isBlinking ? 0.7 : 1,
              }}
              transition={{
                duration: isBlinking ? 0.08 : 0.12,
                ease: isBlinking
                  ? [0.55, 0.055, 0.675, 0.19]
                  : [0.34, 1.56, 0.64, 1],
              }}
              style={{ transformOrigin: 'center center' }}
            >
              <circle
                cx="50"
                cy="50"
                r={isHovered ? 32 : 28}
                className="fill-foreground dark:fill-[#22C55E]"
                style={{ transition: 'r 0.4s cubic-bezier(0.16, 1, 0.3, 1), fill 0.3s ease' }}
              />
              <foreignObject x="0" y="0" width="100" height="100">
                <div
                  className="w-full h-full flex items-center justify-center"
                  style={{ transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}
                >
                  <Brain
                    className="text-background dark:text-black/90"
                    style={{
                      width: isHovered ? '40%' : '36%',
                      height: isHovered ? '40%' : '36%',
                    }}
                  />
                </div>
              </foreignObject>
            </motion.svg>
          </div>
        </div>
      </motion.div>

      {/* Interactive Chat Input */}
      <LandingChatInput
        onSendAttempt={(message) => onGetStarted(message)}
        onPlaceholderChange={handlePlaceholderChange}
      />
    </section>
  );
});
