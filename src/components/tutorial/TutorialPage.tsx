import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { TutorialStep } from '@/types/tutorial.types';
import { cn } from '@/lib/utils';
import {
  MeetAynIllustration,
  EmotionsIllustration,
  EmpathyIllustration,
  MicroBehaviorsIllustration,
  ChatIllustration,
  DocumentsIllustration,
  FilesIllustration,
  NavigationIllustration,
  HistoryIllustration,
  CreditsIllustration,
  ProfileIllustration,
  EngineeringIllustration,
  ComplianceIllustration,
  ChartAnalyzerIllustration,
} from './TutorialIllustrations';

interface TutorialPageProps {
  isOpen: boolean;
  currentStep: number;
  totalSteps: number;
  step: TutorialStep;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onComplete: () => void;
}

const illustrations: Record<string, React.FC> = {
  'meet-ayn': MeetAynIllustration,
  'emotions': EmotionsIllustration,
  'empathy': EmpathyIllustration,
  'micro-behaviors': MicroBehaviorsIllustration,
  'chat': ChatIllustration,
  'documents': DocumentsIllustration,
  'files': FilesIllustration,
  'navigation': NavigationIllustration,
  'history': HistoryIllustration,
  'credits': CreditsIllustration,
  'profile': ProfileIllustration,
  'engineering': EngineeringIllustration,
  'compliance': ComplianceIllustration,
  'chart-analyzer': ChartAnalyzerIllustration,
};

export const TutorialPage = ({
  isOpen,
  currentStep,
  totalSteps,
  step,
  onNext,
  onPrev,
  onSkip,
  onComplete,
}: TutorialPageProps) => {
  const { t, language } = useLanguage();
  const isRTL = language === 'ar';
  const isLastStep = currentStep === totalSteps - 1;

  const Illustration = illustrations[step.id] || MeetAynIllustration;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[300] flex items-center justify-center bg-background/80 backdrop-blur-md"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={cn(
            "relative w-[90%] max-w-lg bg-card rounded-3xl shadow-2xl border border-border/50 overflow-hidden",
            isRTL && "rtl"
          )}
        >
          {/* Close button */}
          <button
            onClick={onSkip}
            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-muted/50 hover:bg-muted transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>

          {/* Illustration area */}
          <div className="h-80 bg-gradient-to-br from-muted/30 to-muted/10 flex items-center justify-center overflow-hidden p-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: isRTL ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: isRTL ? 20 : -20 }}
                transition={{ duration: 0.3 }}
                className="w-full h-full flex items-center justify-center"
              >
                <Illustration />
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Content */}
          <div className="p-6 pt-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  {step.title}
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            </AnimatePresence>

            {/* Progress dots */}
            <div className="flex items-center justify-center gap-1.5 mt-6 mb-4">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <motion.div
                  key={i}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    i === currentStep 
                      ? "w-6 bg-primary" 
                      : i < currentStep 
                        ? "w-1.5 bg-primary/50" 
                        : "w-1.5 bg-muted"
                  )}
                />
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={onPrev}
                disabled={currentStep === 0}
                className="gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                {t('tutorial.back')}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={onSkip}
                className="text-muted-foreground"
              >
                {t('tutorial.skip')}
              </Button>

              <Button
                size="sm"
                onClick={isLastStep ? onComplete : onNext}
                className="gap-1"
              >
                {isLastStep ? t('tutorial.finish') : t('tutorial.next')}
                {!isLastStep && <ChevronRight className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
