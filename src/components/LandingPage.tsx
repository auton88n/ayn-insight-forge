import { useState, useRef, useEffect, useMemo, memo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Brain, ArrowRight, CheckCircle, Send, Loader2, Sparkles, Globe, Shield, ChevronDown, Calculator, ShieldCheck, Mountain, Ticket, Mail, MapPin, Navigation2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { AuthModal } from './auth/AuthModal';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { TypewriterText } from '@/components/shared/TypewriterText';
import { Hero } from '@/components/landing/Hero';
import { z } from 'zod';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { LazyLoad } from './ui/lazy-load';
import MobileMockup from './services/MobileMockup';
import DeviceMockups from './services/DeviceMockups';
import AutomationFlowMockup from './services/AutomationFlowMockup';
import AIEmployeeMockup from './services/AIEmployeeMockup';
import EngineeringMockup from './services/EngineeringMockup';
import TicketingMockup from './services/TicketingMockup';
import { SEO, organizationSchema, websiteSchema, softwareApplicationSchema, createFAQSchema } from '@/components/shared/SEO';
import { useDebugStore } from '@/stores/debugStore';

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
  const {
    toast
  } = useToast();

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

  // Contact form state
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [contactErrors, setContactErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Contact form validation schema - memoized to prevent recreation on re-renders
  const contactSchema = useMemo(() => z.object({
    name: z.string().trim().min(1, {
      message: language === 'ar' ? 'الاسم مطلوب' : 'Name is required'
    }).max(100, {
      message: language === 'ar' ? 'الاسم يجب أن يكون أقل من 100 حرف' : 'Name must be less than 100 characters'
    }),
    email: z.string().trim().email({
      message: language === 'ar' ? 'البريد الإلكتروني غير صالح' : 'Invalid email address'
    }).max(255, {
      message: language === 'ar' ? 'البريد الإلكتروني يجب أن يكون أقل من 255 حرف' : 'Email must be less than 255 characters'
    }),
    message: z.string().trim().min(1, {
      message: language === 'ar' ? 'الرسالة مطلوبة' : 'Message is required'
    }).max(1000, {
      message: language === 'ar' ? 'الرسالة يجب أن تكون أقل من 1000 حرف' : 'Message must be less than 1000 characters'
    })
  }), [language]);

  // Handle contact form submission
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactErrors({});

    // Validate form
    try {
      contactSchema.parse(contactForm);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach(err => {
          if (err.path[0]) {
            errors[err.path[0].toString()] = err.message;
          }
        });
        setContactErrors(errors);
        return;
      }
    }
    setIsSubmitting(true);
    try {
      // Save to database
      const {
        error: dbError
      } = await supabase.from('contact_messages').insert({
        name: contactForm.name.trim(),
        email: contactForm.email.trim(),
        message: contactForm.message.trim()
      });
      if (dbError) {
        if (import.meta.env.DEV) {
          console.error('Database error:', dbError);
        }
        throw new Error('Failed to save message');
      }

      // Send email notification
      const {
        error: emailError
      } = await supabase.functions.invoke('send-contact-email', {
        body: {
          name: contactForm.name.trim(),
          email: contactForm.email.trim(),
          message: contactForm.message.trim()
        }
      });
      if (emailError) {
        if (import.meta.env.DEV) {
          console.error('Email error:', emailError);
        }
        // Don't throw - message was saved, just email failed
      }
      setIsSubmitted(true);
      setContactForm({
        name: '',
        email: '',
        message: ''
      });
      toast({
        title: language === 'ar' ? 'تم الإرسال بنجاح' : 'Message Sent',
        description: language === 'ar' ? 'سنتواصل معك قريباً' : "We'll get back to you soon"
      });

      // Reset submitted state after 3 seconds
      setTimeout(() => setIsSubmitted(false), 3000);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Contact form error:', error);
      }
      toast({
        title: language === 'ar' ? 'خطأ' : 'Error',
        description: language === 'ar' ? 'حدث خطأ. يرجى المحاولة مرة أخرى' : 'Something went wrong. Please try again',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  const services = [{
    number: '01',
    slug: 'content-creator-sites',
    title: language === 'ar' ? 'مواقع لصناع المحتوى' : language === 'fr' ? 'Sites Premium pour Créateurs' : 'Premium Content Creator Sites',
    description: language === 'ar' ? 'موقع احترافي يعكس هويتك ويجذب فرص التعاون.' : language === 'fr' ? 'Sites web de luxe conçus pour mettre en valeur votre marque personnelle.' : 'Luxury websites custom-built to showcase your personal brand.',
    mockup: <LazyLoad minHeight="320px" debugLabel="MobileMockup"><MobileMockup /></LazyLoad>
  }, {
    number: '02',
    slug: 'ai-agents',
    title: language === 'ar' ? 'مساعد ذكي لعملك' : language === 'fr' ? 'Agents IA Personnalisés' : 'Custom AI Agents',
    description: language === 'ar' ? 'مساعد ذكي يعمل ٢٤ ساعة لخدمة عملائك.' : language === 'fr' ? 'Assistants intelligents 24/7 formés sur votre entreprise.' : '24/7 intelligent assistants trained on your business.',
    mockup: <LazyLoad minHeight="280px" debugLabel="DeviceMockups"><DeviceMockups /></LazyLoad>
  }, {
    number: '03',
    slug: 'automation',
    title: language === 'ar' ? 'أتمتة العمليات' : language === 'fr' ? 'Automatisation des Processus' : 'Process Automation',
    description: language === 'ar' ? 'أتمتة المهام المتكررة لتوفير الوقت والجهد.' : language === 'fr' ? 'Automatisez les flux de travail pour gagner du temps.' : 'Automate workflows to save time and reduce errors in any business.',
    mockup: <LazyLoad minHeight="260px" debugLabel="AutomationMockup"><AutomationFlowMockup /></LazyLoad>
  }, {
    number: '04',
    slug: 'ai-employee',
    title: language === 'ar' ? 'موظفين بالذكاء الاصطناعي' : language === 'fr' ? 'Employés IA' : 'AI Employees',
    description: language === 'ar' ? 'موظفين يعملون ٢٤ ساعة بدون إجازات أو تأمين صحي.' : language === 'fr' ? 'Employés qui travaillent 24h/24 sans vacances ni assurance santé.' : 'Employees who work 24/7 with no vacations or healthcare costs.',
    mockup: <LazyLoad minHeight="280px" debugLabel="AIEmployeeMockup"><AIEmployeeMockup /></LazyLoad>
  }, {
    number: '05',
    slug: 'engineering',
    isInternal: true,
    title: language === 'ar' ? 'حاسبات الهندسة المدنية' : language === 'fr' ? 'Calculateurs de Génie Civil' : 'Civil Engineering Calculators',
    description: language === 'ar' ? 'تصميم العناصر الإنشائية مع التصور ثلاثي الأبعاد والتحليل بالذكاء الاصطناعي.' : language === 'fr' ? 'Concevez des éléments structurels avec visualisation 3D et analyse IA.' : 'Design structural elements with 3D visualization and AI-powered analysis.',
    mockup: <LazyLoad minHeight="260px" debugLabel="EngineeringMockup"><EngineeringMockup /></LazyLoad>
  }, {
    number: '06',
    slug: 'ticketing',
    title: language === 'ar' ? 'نظام التذاكر الذكي' : language === 'fr' ? 'Billetterie Intelligente' : 'Smart Ticketing System',
    description: language === 'ar' ? 'بيع التذاكر أونلاين والتحقق بمسح QR من الجوال.' : language === 'fr' ? 'Vendez des billets en ligne et validez par scan QR.' : 'Sell tickets online and validate with phone QR scanning.',
    mockup: <LazyLoad minHeight="300px" debugLabel="TicketingMockup"><TicketingMockup /></LazyLoad>
  }];
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
          {/* Logo Pill — glass-backed, always visible */}
          <div ref={menuRef} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} className="flex items-center gap-2 px-3 py-2.5 bg-card/80 backdrop-blur-xl border border-border/60 rounded-full shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer">
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-xl bg-foreground flex items-center justify-center">
              <Brain className="w-4 h-4 md:w-5 md:h-5 text-background" />
            </div>
            <span className={cn("text-lg md:text-xl font-bold tracking-tight overflow-hidden whitespace-nowrap transition-all duration-200", isMenuExpanded ? "w-auto opacity-100" : "w-0 opacity-0")}>
              AYN
            </span>
            <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform duration-300", isMenuExpanded && "rotate-180")} />
          </div>

          {/* Dropdown Panel — glass morphism */}
          {isMenuExpanded && <div className="absolute top-full left-0 mt-2 min-w-[200px] bg-card/80 backdrop-blur-xl border border-border/60 rounded-2xl shadow-2xl overflow-hidden animate-scale-fade-in" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
              {/* Navigation Links */}
              <div className="p-2">
                <button onClick={() => scrollToSection('about')} className="w-full text-left px-4 py-2.5 rounded-xl hover:bg-muted transition-colors text-sm font-medium">
                  {language === 'ar' ? 'عن AYN' : language === 'fr' ? 'À Propos' : 'About'}
                </button>
                <button onClick={() => scrollToSection('services')} className="w-full text-left px-4 py-2.5 rounded-xl hover:bg-muted transition-colors text-sm font-medium">
                  {language === 'ar' ? 'خدماتنا' : language === 'fr' ? 'Services' : 'Services'}
                </button>
                <button onClick={() => scrollToSection('contact')} className="w-full text-left px-4 py-2.5 rounded-xl hover:bg-muted transition-colors text-sm font-medium">
                  {language === 'ar' ? 'تواصل معنا' : language === 'fr' ? 'Contact' : 'Contact'}
                </button>
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
                <button onClick={() => scrollToSection('services')} className="text-left py-2 text-sm font-medium hover:text-foreground/80 transition-colors">
                  {language === 'ar' ? 'خدماتنا' : language === 'fr' ? 'Services' : 'Services'}
                </button>
                <button onClick={() => scrollToSection('contact')} className="text-left py-2 text-sm font-medium hover:text-foreground/80 transition-colors">
                  {language === 'ar' ? 'تواصل معنا' : language === 'fr' ? 'Contact' : 'Contact'}
                </button>
                
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
      <section id="about" className="py-20 md:py-36 px-4 md:px-6">
        <div className="container mx-auto max-w-6xl text-center">
          <ScrollReveal>
            <span className="text-xs font-mono text-muted-foreground/70 tracking-[0.2em] uppercase mb-6 block">
              {language === 'ar' ? 'من نحن' : language === 'fr' ? 'À Propos d\'AYN' : 'About AYN'}
            </span>

            <h2 className="text-3xl md:text-5xl lg:text-6xl font-serif font-bold mb-5 md:mb-7 tracking-tight">
              {language === 'ar' ? 'ذكاء اصطناعي + أدوات هندسية' : language === 'fr' ? 'IA + Outils d\'Ingénierie' : 'AI Assistant + Engineering Tools'}
            </h2>

            <p className="text-base md:text-lg text-muted-foreground/80 max-w-2xl mx-auto mb-14 md:mb-20 leading-relaxed">
              {language === 'ar' ? 'AYN يتعرّف عليك ويساعدك في مهامك اليومية، بالإضافة إلى أدوات هندسية احترافية للتصميم الإنشائي.' : language === 'fr' ? 'AYN apprend vos habitudes et vous aide à rester organisé, avec des outils d\'ingénierie professionnels.' : 'AYN learns your habits and helps you stay organized, plus professional engineering tools for structural design.'}
            </p>
          </ScrollReveal>

          {/* 6 Value Props - 2 Rows */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-16">
            {/* Row 1: AI Capabilities */}
            <ScrollReveal delay={0.1}>
              <div className="text-center space-y-4 md:space-y-5">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-muted/40 mx-auto flex items-center justify-center transition-colors duration-300 group-hover:bg-muted/60">
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

            {/* Row 2: Engineering Tools */}
            <ScrollReveal delay={0.4}>
              <div className="text-center space-y-3 md:space-y-4">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-muted/50 mx-auto flex items-center justify-center">
                  <Calculator className="w-7 h-7 md:w-8 md:h-8 text-foreground" />
                </div>
                <h3 className="text-lg md:text-xl font-bold">
                  {language === 'ar' ? 'حاسبات إنشائية' : language === 'fr' ? 'Calculateurs Structurels' : 'Structural Calculators'}
                </h3>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                  {language === 'ar' ? 'تصميم الكمرات والأعمدة والأساسات مع تصور ثلاثي الأبعاد.' : language === 'fr' ? 'Concevez poutres, colonnes et fondations avec visualisation 3D.' : 'Design beams, columns, slabs and foundations with 3D visualization.'}
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.5}>
              <div className="text-center space-y-3 md:space-y-4">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-muted/50 mx-auto flex items-center justify-center">
                  <ShieldCheck className="w-7 h-7 md:w-8 md:h-8 text-foreground" />
                </div>
                <h3 className="text-lg md:text-xl font-bold">
                  {language === 'ar' ? 'فحص الامتثال' : language === 'fr' ? 'Conformité au Code' : 'Code Compliance'}
                </h3>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                  {language === 'ar' ? 'تحقق من مطابقة التصميم لكود البناء تلقائيًا.' : language === 'fr' ? 'Vérifiez automatiquement la conformité au code du bâtiment.' : 'Automated building code compliance checks and reports.'}
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delay={0.6}>
              <div className="text-center space-y-3 md:space-y-4">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-muted/50 mx-auto flex items-center justify-center">
                  <Mountain className="w-7 h-7 md:w-8 md:h-8 text-foreground" />
                </div>
                <h3 className="text-lg md:text-xl font-bold">
                  {language === 'ar' ? 'تصميم التسوية' : language === 'fr' ? 'Conception de Terrassement' : 'Site Grading'}
                </h3>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                  {language === 'ar' ? 'تحليل التضاريس وتصميم المناسيب بالذكاء الاصطناعي.' : language === 'fr' ? 'Analyse du terrain et conception d\'élévation avec IA.' : 'Terrain analysis and elevation design with AI assistance.'}
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* Services Section - Bento Grid */}
      <section id="services" className="py-16 md:py-32 px-4 md:px-6 overflow-x-hidden">
        <div className="container mx-auto max-w-6xl">
          {/* Section header */}
          <ScrollReveal>
            <div className="text-center mb-12 md:mb-16">
            <span className="text-sm font-mono text-muted-foreground tracking-wider uppercase mb-4 block">
                {language === 'ar' ? 'خدماتنا' : language === 'fr' ? 'Ce Que Nous Faisons' : 'What We Do'}
              </span>
              <h2 className="text-3xl md:text-5xl lg:text-6xl font-serif mb-4 md:mb-6">
                {language === 'ar' ? <>ست طرق <span className="font-bold">لتبسيط حياتك</span></> : language === 'fr' ? <>Six Façons de <span className="font-bold">Simplifier Votre Vie</span></> : <>Six Ways We Help <span className="font-bold">Simplify Your Life</span></>}
              </h2>
            </div>
          </ScrollReveal>

          {/* Bento Grid - 4 Services */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="flex flex-col gap-6">
              {/* Top Left - Content Creator Sites */}
              <ScrollReveal>
                <Link to={`/services/${services[0].slug}`} className="block">
                  <motion.div className="bg-neutral-50 dark:bg-card rounded-3xl p-6 md:p-8 min-h-[320px] lg:min-h-[380px] flex flex-col group cursor-pointer overflow-hidden contain-layout" whileHover={{
                    y: -4
                  }} transition={{
                    duration: 0.3,
                    ease: [0.32, 0.72, 0, 1]
                  }}>
                    <div className="mb-4">
                      
                      <h3 className="text-xl md:text-2xl font-bold mt-2 group-hover:text-primary transition-colors">
                        {services[0].title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-2">
                        {services[0].description}
                      </p>
                    </div>
                    <div className="flex-1 flex items-center justify-center overflow-hidden">
                      {services[0].mockup}
                    </div>
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors mt-4">
                      {language === 'ar' ? 'اكتشف المزيد' : language === 'fr' ? 'En Savoir Plus' : 'Learn More'}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </motion.div>
                </Link>
              </ScrollReveal>

              {/* Bottom Left - Automation */}
              <ScrollReveal delay={0.2}>
                <Link to={`/services/${services[2].slug}`} className="block">
                  <motion.div className="bg-neutral-50 dark:bg-card rounded-3xl p-6 md:p-8 min-h-[280px] group cursor-pointer contain-layout" whileHover={{
                    y: -4
                  }} transition={{
                    duration: 0.3,
                    ease: [0.32, 0.72, 0, 1]
                  }}>
                    <div className="flex flex-col gap-4">
                      <div>
                        
                        <h3 className="text-xl md:text-2xl font-bold mt-2 group-hover:text-primary transition-colors">
                          {services[2].title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-2">
                          {services[2].description}
                        </p>
                      </div>
                      <div className="flex-1 flex items-center justify-center h-[120px]">
                        {services[2].mockup}
                      </div>
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                        {language === 'ar' ? 'اكتشف المزيد' : language === 'fr' ? 'En Savoir Plus' : 'Learn More'}
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </motion.div>
                </Link>
              </ScrollReveal>

              {/* Ticketing System - Featured Card */}
              <ScrollReveal delay={0.3}>
                <Link to="/services/ticketing" className="block">
                  <motion.div className="bg-neutral-50 dark:bg-card rounded-3xl p-6 md:p-8 min-h-[500px] flex flex-col group cursor-pointer overflow-hidden contain-layout" whileHover={{
                    y: -4
                  }} transition={{
                    duration: 0.3,
                    ease: [0.32, 0.72, 0, 1]
                  }}>
                    <div className="mb-4">
                      <span className="text-xs font-mono text-purple-500 tracking-wider">NEW</span>
                      <h3 className="text-xl md:text-2xl font-bold mt-2 group-hover:text-purple-500 transition-colors">
                        {services[5].title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-2">
                        {services[5].description}
                      </p>
                    </div>
                    <div className="flex-1 flex items-center justify-center overflow-visible">
                      {services[5].mockup}
                    </div>
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors mt-4">
                      {language === 'ar' ? 'اكتشف المزيد' : language === 'fr' ? 'En Savoir Plus' : 'Learn More'}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </motion.div>
                </Link>
              </ScrollReveal>
            </div>

            {/* Right Column */}
            <div className="flex flex-col gap-6">
              {/* Top Right - AI Agents */}
              <ScrollReveal delay={0.1}>
                <Link to={`/services/${services[1].slug}`} className="block">
                  <motion.div className="bg-neutral-50 dark:bg-card rounded-3xl p-6 md:p-8 min-h-[280px] group cursor-pointer contain-layout" whileHover={{
                    y: -4
                  }} transition={{
                    duration: 0.3,
                    ease: [0.32, 0.72, 0, 1]
                  }}>
                    <div className="flex flex-col gap-4">
                      <div>
                        
                        <h3 className="text-xl md:text-2xl font-bold mt-2 group-hover:text-primary transition-colors">
                          {services[1].title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-2">
                          {services[1].description}
                        </p>
                      </div>
                      <div className="flex-1 flex items-center justify-center h-[120px]">
                        {services[1].mockup}
                      </div>
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                        {language === 'ar' ? 'اكتشف المزيد' : language === 'fr' ? 'En Savoir Plus' : 'Learn More'}
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </motion.div>
                </Link>
              </ScrollReveal>

              {/* Bottom Right - AI Employees */}
              <ScrollReveal delay={0.3}>
                <Link to={`/services/${services[3].slug}`} className="block">
                  <motion.div className="bg-neutral-50 dark:bg-card rounded-3xl p-6 md:p-8 min-h-[480px] group cursor-pointer overflow-hidden contain-layout" whileHover={{
                    y: -4
                  }} transition={{
                    duration: 0.3,
                    ease: [0.32, 0.72, 0, 1]
                  }}>
                    <div className="flex flex-col gap-4">
                      <div>
                        <h3 className="text-xl md:text-2xl font-bold mt-2 group-hover:text-primary transition-colors">
                          {services[3].title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-2">
                          {services[3].description}
                        </p>
                      </div>
                      <div className="flex-1 flex items-center justify-center min-h-[280px]">
                        {services[3].mockup}
                      </div>
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                        {language === 'ar' ? 'اكتشف المزيد' : language === 'fr' ? 'En Savoir Plus' : 'Learn More'}
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </motion.div>
                </Link>
              </ScrollReveal>
              
              {/* Engineering Tools - Featured Card */}
              <ScrollReveal delay={0.4}>
                <Link to="/engineering" className="block">
                  <motion.div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-3xl p-6 md:p-8 min-h-[320px] lg:min-h-[380px] flex flex-col group cursor-pointer overflow-hidden contain-layout" whileHover={{
                    y: -4
                  }} transition={{
                    duration: 0.3,
                    ease: [0.32, 0.72, 0, 1]
                  }}>
                    <div className="mb-4">
                      <span className="text-xs font-mono text-cyan-500 tracking-wider">NEW</span>
                      <h3 className="text-xl md:text-2xl font-bold mt-2 group-hover:text-cyan-500 transition-colors">
                        {services[4].title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-2">
                        {services[4].description}
                      </p>
                    </div>
                    <div className="flex-1 flex items-center justify-center overflow-visible">
                      {services[4].mockup}
                    </div>
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors mt-4">
                      {language === 'ar' ? 'ابدأ التصميم' : language === 'fr' ? 'Commencer la Conception' : 'Start Designing'}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </motion.div>
                </Link>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>

      {/* Premium Contact Section */}
      <section id="contact" className="py-16 md:py-32 px-4 md:px-6 bg-background">
        <div className="container mx-auto max-w-3xl">
          <ScrollReveal>
            <div className="text-center mb-10 md:mb-16">
              <span className="text-sm font-mono text-muted-foreground tracking-wider uppercase mb-4 block">
                {language === 'ar' ? 'راسلنا' : language === 'fr' ? 'Contactez-Nous' : 'Get In Touch'}
              </span>
              <h2 className="text-3xl md:text-5xl lg:text-6xl font-serif font-bold mb-4 md:mb-6">
                {language === 'ar' ? 'دعنا نتحدث' : language === 'fr' ? 'Commençons une Conversation' : "Let's Start a Conversation"}
              </h2>
              <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto">
                {language === 'ar' ? 'شاركنا فكرتك، ودعنا نحوّلها إلى واقع' : language === 'fr' ? 'Parlez-nous de votre projet et nous vous aiderons à réaliser votre vision' : "Tell us about your project and we'll help transform your vision into reality"}
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.2}>
            {isSubmitted ?
            // Success state
            <div className="text-center py-20 animate-scale-fade-in">
                <div className="w-16 h-16 rounded-full bg-foreground mx-auto mb-6 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-background" />
                </div>
                <h3 className="text-2xl font-bold mb-3">
                  {language === 'ar' ? 'شكراً لك!' : language === 'fr' ? 'Merci!' : 'Thank You!'}
                </h3>
                <p className="text-muted-foreground">
                  {language === 'ar' ? 'سنرد عليك خلال 24 ساعة' : language === 'fr' ? 'Nous vous contacterons dans 24 heures' : "We'll be in touch within 24 hours"}
                </p>
              </div> :
            // Contact form
            <form onSubmit={handleContactSubmit} className="space-y-6">
                {/* Name input */}
                <div className="space-y-2 group">
                  <label htmlFor="name" className="text-sm font-mono uppercase tracking-wider text-muted-foreground">
                    {language === 'ar' ? 'الاسم' : language === 'fr' ? 'Nom' : 'Name'}
                  </label>
                  <Input id="name" type="text" value={contactForm.name} onChange={e => setContactForm({
                  ...contactForm,
                  name: e.target.value
                })} placeholder={language === 'ar' ? 'الاسم الكامل' : language === 'fr' ? 'Votre nom complet' : 'Your full name'} className={cn("h-14 bg-transparent border-2 border-border rounded-none text-base transition-all duration-300", "focus:border-foreground focus:ring-0", "group-hover:border-muted-foreground", contactErrors.name && "border-destructive")} disabled={isSubmitting} />
                  {contactErrors.name && <p className="text-sm text-destructive animate-slide-down-fade">{contactErrors.name}</p>}
                </div>

                {/* Email input */}
                <div className="space-y-2 group">
                  <label htmlFor="email" className="text-sm font-mono uppercase tracking-wider text-muted-foreground">
                    {language === 'ar' ? 'البريد الإلكتروني' : language === 'fr' ? 'Email' : 'Email'}
                  </label>
                  <Input id="email" type="email" value={contactForm.email} onChange={e => setContactForm({
                  ...contactForm,
                  email: e.target.value
                })} placeholder={language === 'ar' ? 'بريدك الإلكتروني' : language === 'fr' ? 'votre@email.com' : 'your@email.com'} className={cn("h-14 bg-transparent border-2 border-border rounded-none text-base transition-all duration-300", "focus:border-foreground focus:ring-0", "group-hover:border-muted-foreground", contactErrors.email && "border-destructive")} disabled={isSubmitting} />
                  {contactErrors.email && <p className="text-sm text-destructive animate-slide-down-fade">{contactErrors.email}</p>}
                </div>

                {/* Message textarea */}
                <div className="space-y-2 group">
                  <label htmlFor="message" className="text-sm font-mono uppercase tracking-wider text-muted-foreground">
                    {language === 'ar' ? 'الرسالة' : language === 'fr' ? 'Message' : 'Message'}
                  </label>
                  <Textarea id="message" value={contactForm.message} onChange={e => setContactForm({
                  ...contactForm,
                  message: e.target.value
                })} placeholder={language === 'ar' ? 'كيف يمكننا مساعدتك؟' : language === 'fr' ? 'Parlez-nous de votre projet...' : 'Tell us about your project...'} rows={6} className={cn("bg-transparent border-2 border-border rounded-none text-base transition-all duration-300 resize-none", "focus:border-foreground focus:ring-0", "group-hover:border-muted-foreground", contactErrors.message && "border-destructive")} disabled={isSubmitting} />
                  {contactErrors.message && <p className="text-sm text-destructive animate-slide-down-fade">{contactErrors.message}</p>}
                </div>

                {/* Submit button */}
                <Button type="submit" size="lg" disabled={isSubmitting} className={cn("w-full h-14 rounded-none font-mono uppercase tracking-wider transition-all duration-300", "hover:shadow-2xl")}>
                  {isSubmitting ? <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      {language === 'ar' ? 'جارٍ الإرسال...' : language === 'fr' ? 'Envoi...' : 'Sending...'}
                    </> : <>
                      {language === 'ar' ? 'أرسل' : language === 'fr' ? 'Envoyer' : 'Send Message'}
                      <Send className="ml-2 h-5 w-5" />
                    </>}
                </Button>
              </form>}
          </ScrollReveal>
        </div>
      </section>

      {/* Professional Footer */}
      <footer className="pt-8 pb-4">
        <div className="container max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 mb-6">
            {/* Column 1: Brand */}
            <div className="space-y-3 col-span-2 sm:col-span-1">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center">
                  <Brain className="w-5 h-5 text-background" />
                </div>
                <span className="text-2xl font-bold">AYN</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {language === 'ar' ? 'هندسة مدعومة بالذكاء الاصطناعي' : language === 'fr' ? 'Ingénierie propulsée par l\'IA' : 'AI-Powered Engineering'}
              </p>
            </div>

            {/* Column 2: Explore */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm uppercase tracking-wider text-foreground">
                {language === 'ar' ? 'استكشف' : language === 'fr' ? 'Explorer' : 'Explore'}
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {[
                  { label: language === 'ar' ? 'حول' : language === 'fr' ? 'À propos' : 'About', id: 'about' },
                  { label: language === 'ar' ? 'الخدمات' : language === 'fr' ? 'Services' : 'Services', id: 'services' },
                  { label: language === 'ar' ? 'تواصل' : language === 'fr' ? 'Contact' : 'Contact', id: 'contact' },
                ].map(link => (
                  <li key={link.id}>
                    <button onClick={() => document.getElementById(link.id)?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-foreground transition-colors">
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 3: Services (first half) */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm uppercase tracking-wider text-foreground">
                {language === 'ar' ? 'الخدمات' : language === 'fr' ? 'Services' : 'Services'}
              </h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {[
                  { label: language === 'ar' ? 'مواقع صناع المحتوى' : language === 'fr' ? 'Sites Créateurs' : 'Content Creator Sites', route: '/services/content-creator-sites' },
                  { label: language === 'ar' ? 'وكلاء ذكاء اصطناعي' : language === 'fr' ? 'Agents IA' : 'Custom AI Agents', route: '/services/ai-agents' },
                  { label: language === 'ar' ? 'أتمتة العمليات' : language === 'fr' ? 'Automatisation' : 'Process Automation', route: '/services/automation' },
                ].map(service => (
                  <li key={service.route}>
                    <Link to={service.route} className="hover:text-foreground transition-colors">
                      {service.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Column 4: Services (second half) */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm uppercase tracking-wider text-foreground opacity-0 pointer-events-none hidden lg:block">.</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {[
                  { label: language === 'ar' ? 'موظفون بالذكاء الاصطناعي' : language === 'fr' ? 'Employés IA' : 'AI Employees', route: '/services/ai-employee' },
                  { label: language === 'ar' ? 'الهندسة المدنية' : language === 'fr' ? 'Génie Civil' : 'Civil Engineering', route: '/services/civil-engineering' },
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

            {/* Column 5: Contact & Social */}
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
          <p className="text-center text-xs text-muted-foreground">
            © 2026 AYN AI. {language === 'ar' ? 'جميع الحقوق محفوظة.' : language === 'fr' ? 'Tous droits réservés.' : 'All rights reserved.'}
          </p>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
    </div>
  </>;
});
export default LandingPage;