import { useState, useRef, useEffect, memo } from 'react';

import { Sparkles, Globe, Shield, Zap, Bot, BarChart3 } from 'lucide-react';
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
  // Use ref to avoid re-renders from debug context updates
  const debugRef = useRef(useDebugStore.getState());
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<string>('');
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const collapseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const {
    t,
    language,
    direction
  } = useLanguage();



  // Debug render logging - use ref to avoid dependency on context
  if (debugRef.current?.isDebugMode) {
    debugRef.current.incrementRenderCount('LandingPage');
  }

  // Hover handlers with collapse delay
  const handleMouseEnter = () => {
    if (collapseTimeoutRef.current) {
      clearTimeout(collapseTimeoutRef.current);
      collapseTimeoutRef.current = null;
    }
    setIsMenuExpanded(true);
  };
  const handleMouseLeave = () => {
    // Don't collapse if a dropdown is open
    if (isDropdownOpen) return;
    collapseTimeoutRef.current = setTimeout(() => {
      setIsMenuExpanded(false);
    }, 300);
  };

  // Handle dropdown open state to prevent menu collapse
  const handleDropdownOpenChange = (open: boolean) => {
    setIsDropdownOpen(open);
    if (open && collapseTimeoutRef.current) {
      clearTimeout(collapseTimeoutRef.current);
      collapseTimeoutRef.current = null;
    }
  };

  // Smooth scroll to section
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth'
      });
      setIsMenuExpanded(false);
    }
  };

  // Auto-collapse on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100 && isMenuExpanded) {
        setIsMenuExpanded(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMenuExpanded]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (collapseTimeoutRef.current) {
        clearTimeout(collapseTimeoutRef.current);
      }
    };
  }, []);





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
      {/* Vertical Dropdown Navigation */}
      <nav className="fixed top-4 md:top-6 left-4 md:left-6 z-50 animate-fade-in">
        <div className="relative">
          {/* Logo Pill - Always visible, acts as trigger - CSS transitions instead of springs */}
          <div ref={menuRef} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} className="flex items-center gap-2 px-3 py-2.5 bg-card border border-border rounded-full shadow-2xl cursor-pointer">
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-foreground flex items-center justify-center">
              <Brain className="w-4 h-4 md:w-5 md:h-5 text-background" />
            </div>
            <span className={cn("text-lg md:text-xl font-bold tracking-tight overflow-hidden whitespace-nowrap transition-all duration-200", isMenuExpanded ? "w-auto opacity-100" : "w-0 opacity-0")}>
              AYN
            </span>
            <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform duration-200", isMenuExpanded && "rotate-180")} />
          </div>

          {/* Dropdown Panel - CSS transitions instead of springs */}
          {isMenuExpanded && <div className="absolute top-full left-0 mt-2 min-w-[200px] bg-card border border-border rounded-2xl shadow-2xl overflow-hidden animate-fade-in" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
              {/* Navigation Links */}
              <div className="p-2">
              <button onClick={() => scrollToSection('about')} className="w-full text-left px-4 py-2.5 rounded-xl hover:bg-muted transition-colors text-sm font-medium">
                  {language === 'ar' ? 'عن AYN' : language === 'fr' ? 'À Propos' : 'About'}
                </button>
                <Link to="/services" className="w-full text-left px-4 py-2.5 rounded-xl hover:bg-muted transition-colors text-sm font-medium block">
                  {language === 'ar' ? 'الخدمات' : language === 'fr' ? 'Services' : 'Services'}
                </Link>
                <Link to="/pricing" className="w-full text-left px-4 py-2.5 rounded-xl hover:bg-muted transition-colors text-sm font-medium block">
                  {language === 'ar' ? 'الأسعار' : language === 'fr' ? 'Tarifs' : 'Pricing'}
                </Link>
                <Link to="/contact" className="w-full text-left px-4 py-2.5 rounded-xl hover:bg-muted transition-colors text-sm font-medium block">
                  {language === 'ar' ? 'تواصل معنا' : language === 'fr' ? 'Contact' : 'Contact'}
                </Link>
              </div>

              {/* Separator */}
              <div className="h-px bg-border mx-2" />

              {/* Settings Row */}
              <div className="p-2 flex items-center justify-between px-4">
                <LanguageSwitcher onOpenChange={handleDropdownOpenChange} />
                <ThemeToggle />
              </div>

              {/* Separator */}
              <div className="h-px bg-border mx-2" />

              {/* CTA Button */}
              <div className="p-3">
                <Button onClick={() => {
                setIsMenuExpanded(false);
                setShowAuthModal(true);
              }} className="w-full rounded-xl">
                  {t('nav.getStarted')}
                </Button>
              </div>
            </div>}
        </div>
      </nav>

      {/* Mobile Sheet Navigation (fallback for small screens) */}
      <div className="fixed top-4 right-4 z-50 md:hidden">
        <Sheet>
          <SheetTrigger asChild>
            
          </SheetTrigger>
          <SheetContent side="right" className="w-[280px] sm:w-[320px]">
            <div className="flex flex-col gap-6 pt-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-foreground flex items-center justify-center">
                  <Brain className="w-6 h-6 text-background" />
                </div>
                <span className="text-2xl font-bold">AYN</span>
              </div>
              
              <div className="flex flex-col gap-4">
                <button onClick={() => scrollToSection('about')} className="text-left py-2 text-sm font-medium hover:text-foreground/80 transition-colors">
                  {language === 'ar' ? 'عن AYN' : language === 'fr' ? 'À Propos' : 'About'}
                </button>
                <Link to="/services" className="block text-left py-2 text-sm font-medium hover:text-foreground/80 transition-colors">
                  {language === 'ar' ? 'الخدمات' : language === 'fr' ? 'Services' : 'Services'}
                </Link>
                <Link to="/pricing" className="block text-left py-2 text-sm font-medium hover:text-foreground/80 transition-colors">
                  {language === 'ar' ? 'الأسعار' : language === 'fr' ? 'Tarifs' : 'Pricing'}
                </Link>
                <Link to="/contact" className="block text-left py-2 text-sm font-medium hover:text-foreground/80 transition-colors">
                  {language === 'ar' ? 'تواصل معنا' : language === 'fr' ? 'Contact' : 'Contact'}
                </Link>
                
                <div className="h-px bg-border my-2" />
                
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-muted-foreground">{language === 'ar' ? 'اللغة' : language === 'fr' ? 'Langue' : 'Language'}</span>
                  <LanguageSwitcher onOpenChange={handleDropdownOpenChange} />
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-sm text-muted-foreground">{language === 'ar' ? 'المظهر' : language === 'fr' ? 'Thème' : 'Theme'}</span>
                  <ThemeToggle />
                </div>
                
                <Button onClick={() => setShowAuthModal(true)} className="w-full rounded-xl">
                  {t('nav.getStarted')}
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

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



      {/* Professional Footer */}
      <footer className="pt-8 pb-4">
        <div className="container max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-8 mb-6">
            {/* Column 1: Brand */}
            <div className="space-y-3 col-span-2 sm:col-span-1">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center">
                  <Brain className="w-5 h-5 text-background" />
                </div>
                <span className="text-2xl font-bold">AYN</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {language === 'ar' ? 'حلول ذكاء اصطناعي متقدمة' : language === 'fr' ? 'Solutions IA avancées' : 'Advanced AI Solutions'}
              </p>
            </div>

            {/* Column 2: Navigate */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm uppercase tracking-wider text-foreground">
                {language === 'ar' ? 'التنقل' : language === 'fr' ? 'Navigation' : 'Navigate'}
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link to="/services" className="hover:text-foreground transition-colors">
                    {language === 'ar' ? 'الخدمات' : language === 'fr' ? 'Services' : 'Services'}
                  </Link>
                </li>
                <li>
                  <Link to="/pricing" className="hover:text-foreground transition-colors">
                    {language === 'ar' ? 'الأسعار' : language === 'fr' ? 'Tarifs' : 'Pricing'}
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="hover:text-foreground transition-colors">
                    {language === 'ar' ? 'تواصل معنا' : language === 'fr' ? 'Contact' : 'Contact'}
                  </Link>
                </li>
                <li>
                  <Link to="/support" className="hover:text-foreground transition-colors">
                    {language === 'ar' ? 'الدعم' : language === 'fr' ? 'Support' : 'Support'}
                  </Link>
                </li>
                <li>
                  <Link to="/privacy" className="hover:text-foreground transition-colors">
                    {language === 'ar' ? 'سياسة الخصوصية' : language === 'fr' ? 'Confidentialité' : 'Privacy Policy'}
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="hover:text-foreground transition-colors">
                    {language === 'ar' ? 'الشروط والأحكام' : language === 'fr' ? 'Conditions' : 'Terms of Service'}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Column 3: Services */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm uppercase tracking-wider text-foreground">
                {language === 'ar' ? 'الخدمات' : language === 'fr' ? 'Services' : 'Services'}
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {[
                  { label: language === 'ar' ? 'وكلاء ذكاء اصطناعي' : language === 'fr' ? 'Agents IA' : 'Custom AI Agents', route: '/services/ai-agents' },
                  { label: language === 'ar' ? 'أتمتة العمليات' : language === 'fr' ? 'Automatisation' : 'Process Automation', route: '/services/automation' },
                  { label: language === 'ar' ? 'موظفون بالذكاء الاصطناعي' : language === 'fr' ? 'Employés IA' : 'AI Employees', route: '/services/ai-employee' },
                  { label: language === 'ar' ? 'نظام التذاكر الذكي' : language === 'fr' ? 'Billetterie' : 'Smart Ticketing', route: '/services/ticketing' },
                ].map(service => (
                  <li key={service.route}>
                    <Link to={service.route} className="hover:text-foreground transition-colors">
                      {service.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 4: Contact & Social */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm uppercase tracking-wider text-foreground">
                {language === 'ar' ? 'تواصل' : language === 'fr' ? 'Contact' : 'Contact'}
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <a href="mailto:info@aynn.io" className="hover:text-foreground transition-colors">info@aynn.io</a>
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>
                  <a href="https://discord.gg/y2DcBegbC7" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Discord</a>
                </li>
                <li className="flex items-center gap-2">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  <a href="https://x.com/AYNN_AI" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">@AYNN_AI</a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <Separator className="mb-6" />
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              © 2026 AYN AI. {language === 'ar' ? 'جميع الحقوق محفوظة.' : language === 'fr' ? 'Tous droits réservés.' : 'All rights reserved.'}
            </p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <Link to="/privacy" className="hover:text-foreground transition-colors">
                {language === 'ar' ? 'سياسة الخصوصية' : language === 'fr' ? 'Politique de confidentialité' : 'Privacy Policy'}
              </Link>
              <Link to="/terms" className="hover:text-foreground transition-colors">
                {language === 'ar' ? 'شروط الخدمة' : language === 'fr' ? 'Conditions d\'utilisation' : 'Terms of Service'}
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
    </div>
  </>;
});
export default LandingPage;