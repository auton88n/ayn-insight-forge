import { useState, memo } from 'react';

import { Brain, Sparkles, Globe, Shield, Zap, Bot, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuthModal } from './auth/AuthModal';
import { useLanguage } from '@/contexts/LanguageContext';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { cn } from '@/lib/utils';
import { Hero } from '@/components/landing/Hero';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { SEO, organizationSchema, websiteSchema, softwareApplicationSchema, createFAQSchema } from '@/components/shared/SEO';
import { useDebugStore } from '@/stores/debugStore';
import { Header } from '@/components/shared/Header';
import { Footer } from '@/components/shared/Footer';

// ScrollReveal component - defined outside to prevent recreation on re-renders
const ScrollReveal = ({
  children,
  direction = 'up',
  delay = 0,
  debugLabel = 'ScrollReveal'
}: {
  children: React.ReactNode;
  direction?: 'up' | 'left' | 'right' | 'scale';
  delay?: number;
  debugLabel?: string;
}) => {
  const [ref, isVisible] = useScrollAnimation({
    debugLabel
  });
  return <div ref={ref as React.RefObject<HTMLDivElement>} className={cn('scroll-animate', direction === 'left' && 'scroll-animate-left', direction === 'right' && 'scroll-animate-right', direction === 'scale' && 'scroll-animate-scale', isVisible && 'visible')} style={{
    transitionDelay: `${delay}s`
  }}>
      {children}
    </div>;
};
const LandingPage = memo(() => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<string>('');
  const {
    t,
    language,
    direction
  } = useLanguage();





  // FAQ Schema for rich snippets
  const faqSchema = createFAQSchema([{
    question: "What is AYN AI?",
    answer: "AYN AI is a perceptive artificial intelligence platform that learns your habits, understands your goals, and helps you succeed. It offers AI employees, custom AI agents, and business automation tools."
  }, {
    question: "How does AYN AI learn my preferences?",
    answer: "AYN AI uses advanced machine learning to analyze your interactions, understand your communication style, and adapt to your workflow patterns over time."
  }, {
    question: "What services does AYN AI offer?",
    answer: "AYN AI offers AI employees for 24/7 customer support, custom AI agents for business automation, content creator websites, smart ticketing systems, and engineering calculation tools."
  }, {
    question: "Is AYN AI available in Arabic?",
    answer: "Yes! AYN AI (عين) is fully multilingual with native support for Arabic, English, and French, making it ideal for Middle Eastern and international businesses."
  }]);
  return <>
    <SEO title="AYN AI - Personal AI Assistant That Learns You | Smart AI Platform" description="AYN AI is a perceptive artificial intelligence that learns your habits, understands your goals, and helps you succeed. AI employees, custom AI agents, business automation, and more." canonical="/" keywords="AYN AI, AYN artificial intelligence, personal AI assistant, AI that learns you, perceptive AI, smart AI platform, AI employees, AI agents, business automation, Arabic AI assistant, عين AI, machine learning assistant, AI productivity tools, custom AI bots, virtual employees" jsonLd={{
      '@graph': [organizationSchema, websiteSchema, softwareApplicationSchema, faqSchema]
    }} />
    <div dir={direction} className="min-h-screen bg-background scroll-smooth">
      {/* Shared Header */}
      <Header />
      {/* Hero Section - Premium AI Eye Experience */}
      <Hero onGetStarted={prefillMessage => {
        if (prefillMessage) {
          setPendingMessage(prefillMessage);
          localStorage.setItem('ayn_pending_message', prefillMessage);
        }
        setShowAuthModal(true);
      }} />

      {/* About AYN - Value Proposition Section */}
      <section id="about" className="py-16 md:py-32 px-4 md:px-6">
        <div className="container mx-auto max-w-6xl text-center">
          <ScrollReveal>
            <span className="text-sm font-mono text-muted-foreground tracking-wider uppercase mb-4 block">
              {language === 'ar' ? 'من نحن' : language === 'fr' ? 'À Propos d\'AYN' : 'About AYN'}
            </span>

            <h2 className="text-3xl md:text-5xl lg:text-6xl font-serif font-bold mb-4 md:mb-6">
              {language === 'ar' ? 'ذكاء اصطناعي لأعمالك' : language === 'fr' ? 'IA pour Votre Entreprise' : 'AI Solutions for Your Business'}
            </h2>

            <p className="text-base md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10 md:mb-16">
              {language === 'ar' ? 'AYN يتعرّف عليك ويساعدك في أتمتة أعمالك وتوسيع نطاقها بالذكاء الاصطناعي.' : language === 'fr' ? 'AYN apprend vos habitudes et vous aide à automatiser et développer votre entreprise avec l\'IA.' : 'AYN learns your habits and helps you automate and scale your business with AI.'}
            </p>
          </ScrollReveal>

          {/* 6 Value Props - 2 Rows */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {/* Row 1: AI Capabilities */}
            <ScrollReveal delay={0.1}>
              <div className="text-center space-y-3 md:space-y-4">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-muted/50 mx-auto flex items-center justify-center">
                  <Brain className="w-7 h-7 md:w-8 md:h-8 text-foreground" />
                </div>
                <h3 className="text-lg md:text-xl font-bold">
                  {language === 'ar' ? 'يتكيّف معك' : language === 'fr' ? 'Compréhension Adaptative' : 'Adaptive Understanding'}
                </h3>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                  {language === 'ar' ? 'يتعلم تفضيلاتك ويقدم إرشادات تناسبك.' : language === 'fr' ? 'Apprend vos préférences et offre des conseils personnalisés.' : 'Learns your preferences and offers personalized guidance tailored to you.'}
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.2}>
              <div className="text-center space-y-3 md:space-y-4">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-muted/50 mx-auto flex items-center justify-center">
                  <Sparkles className="w-7 h-7 md:w-8 md:h-8 text-foreground" />
                </div>
                <h3 className="text-lg md:text-xl font-bold">
                  {language === 'ar' ? 'دائماً بجانبك' : language === 'fr' ? 'Toujours Disponible' : 'Always Available'}
                </h3>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                  {language === 'ar' ? 'رفيق متاح ٢٤ ساعة جاهز لمساعدتك.' : language === 'fr' ? 'Un compagnon disponible 24/7, prêt à vous aider.' : 'A thoughtful companion available 24/7, ready to help whenever you need.'}
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.3}>
              <div className="text-center space-y-3 md:space-y-4">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-muted/50 mx-auto flex items-center justify-center">
                  <Shield className="w-7 h-7 md:w-8 md:h-8 text-foreground" />
                </div>
                <h3 className="text-lg md:text-xl font-bold">
                  {language === 'ar' ? 'خصوصيتك محمية' : language === 'fr' ? 'Vie Privée Protégée' : 'Your Privacy, Protected'}
                </h3>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                  {language === 'ar' ? 'محادثاتك وبياناتك مشفرة بالكامل.' : language === 'fr' ? 'Vos données sont sécurisées avec chiffrement.' : 'Your conversations and data are secured with end-to-end encryption.'}
                </p>
              </div>
            </ScrollReveal>

            {/* Row 2: Business Tools */}
            <ScrollReveal delay={0.4}>
              <div className="text-center space-y-3 md:space-y-4">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-muted/50 mx-auto flex items-center justify-center">
                  <Zap className="w-7 h-7 md:w-8 md:h-8 text-foreground" />
                </div>
                <h3 className="text-lg md:text-xl font-bold">
                  {language === 'ar' ? 'أتمتة ذكية' : language === 'fr' ? 'Automatisation Intelligente' : 'Smart Automation'}
                </h3>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                  {language === 'ar' ? 'أتمتة المهام المتكررة لتوفير الوقت والموارد.' : language === 'fr' ? 'Automatisez les tâches répétitives pour économiser temps et ressources.' : 'Automate repetitive tasks to save time and resources.'}
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.5}>
              <div className="text-center space-y-3 md:space-y-4">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-muted/50 mx-auto flex items-center justify-center">
                  <Bot className="w-7 h-7 md:w-8 md:h-8 text-foreground" />
                </div>
                <h3 className="text-lg md:text-xl font-bold">
                  {language === 'ar' ? 'وكلاء مخصصون' : language === 'fr' ? 'Agents Personnalisés' : 'Custom AI Agents'}
                </h3>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                  {language === 'ar' ? 'وكلاء ذكاء اصطناعي مدربون على بيانات شركتك.' : language === 'fr' ? 'Agents IA entraînés sur les données de votre entreprise.' : 'AI agents trained on your company data for 24/7 support.'}
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.6}>
              <div className="text-center space-y-3 md:space-y-4">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-muted/50 mx-auto flex items-center justify-center">
                  <BarChart3 className="w-7 h-7 md:w-8 md:h-8 text-foreground" />
                </div>
                <h3 className="text-lg md:text-xl font-bold">
                  {language === 'ar' ? 'تحليلات متقدمة' : language === 'fr' ? 'Analyses Avancées' : 'Advanced Analytics'}
                </h3>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                  {language === 'ar' ? 'رؤى عميقة لاتخاذ قرارات أفضل لأعمالك.' : language === 'fr' ? 'Des insights approfondis pour de meilleures décisions commerciales.' : 'Deep insights to make better business decisions.'}
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>



      {/* Shared Footer */}
      <Footer />

      {/* Auth Modal */}
      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
    </div>
  </>;
});
export default LandingPage;