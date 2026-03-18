import { Link } from 'react-router-dom';
import { ArrowRight, Bot, Cpu, Users, Ticket, Brain } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { SEO } from '@/components/shared/SEO';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';
import { LazyLoad } from '@/components/ui/lazy-load';
import DeviceMockups from '@/components/services/DeviceMockups';
import AutomationFlowMockup from '@/components/services/AutomationFlowMockup';
import AIEmployeeMockup from '@/components/services/AIEmployeeMockup';
import TicketingMockup from '@/components/services/TicketingMockup';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const Services = () => {
  const { language, direction } = useLanguage();

  const services = [
    {
      slug: 'ai-agents',
      icon: Bot,
      color: 'text-blue-500',
      title: language === 'ar' ? 'مساعد ذكي لعملك' : language === 'fr' ? 'Agents IA Personnalisés' : 'Custom AI Agents',
      description: language === 'ar' ? 'مساعد ذكي يعمل ٢٤ ساعة لخدمة عملائك.' : language === 'fr' ? 'Assistants intelligents 24/7 formés sur votre entreprise.' : '24/7 intelligent assistants trained on your business.',
      mockup: <LazyLoad minHeight="200px" debugLabel="DeviceMockups"><DeviceMockups /></LazyLoad>,
    },
    {
      slug: 'automation',
      icon: Cpu,
      color: 'text-emerald-500',
      title: language === 'ar' ? 'أتمتة العمليات' : language === 'fr' ? 'Automatisation des Processus' : 'Process Automation',
      description: language === 'ar' ? 'أتمتة المهام المتكررة لتوفير الوقت والجهد.' : language === 'fr' ? 'Automatisez les flux de travail pour gagner du temps.' : 'Automate workflows to save time and reduce errors.',
      mockup: <LazyLoad minHeight="200px" debugLabel="AutomationMockup"><AutomationFlowMockup /></LazyLoad>,
    },
    {
      slug: 'ai-employee',
      icon: Users,
      color: 'text-violet-500',
      title: language === 'ar' ? 'موظفين بالذكاء الاصطناعي' : language === 'fr' ? 'Employés IA' : 'AI Employees',
      description: language === 'ar' ? 'موظفين يعملون ٢٤ ساعة بدون إجازات أو تأمين صحي.' : language === 'fr' ? 'Employés qui travaillent 24h/24 sans vacances.' : 'Employees who work 24/7 with no vacations or healthcare costs.',
      mockup: <LazyLoad minHeight="200px" debugLabel="AIEmployeeMockup"><AIEmployeeMockup /></LazyLoad>,
    },
    {
      slug: 'ticketing',
      icon: Ticket,
      color: 'text-purple-500',
      title: language === 'ar' ? 'نظام التذاكر الذكي' : language === 'fr' ? 'Billetterie Intelligente' : 'Smart Ticketing System',
      description: language === 'ar' ? 'بيع التذاكر أونلاين والتحقق بمسح QR من الجوال.' : language === 'fr' ? 'Vendez des billets en ligne et validez par scan QR.' : 'Sell tickets online and validate with phone QR scanning.',
      mockup: <LazyLoad minHeight="200px" debugLabel="TicketingMockup"><TicketingMockup /></LazyLoad>,
    },
  ];

  return (
    <>
      <SEO
        title="Services - AYN AI | AI Solutions for Business"
        description="Explore AYN AI services: Custom AI Agents, Process Automation, AI Employees, and Smart Ticketing Systems."
        canonical="/services"
      />
      <div dir={direction} className="min-h-screen bg-background">
        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
          <div className="container max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center">
                <Brain className="w-5 h-5 text-background" />
              </div>
              <span className="text-xl font-bold">AYN</span>
            </Link>
            <div className="hidden md:flex items-center gap-6 text-sm font-medium">
              <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
                {language === 'ar' ? 'الرئيسية' : language === 'fr' ? 'Accueil' : 'Home'}
              </Link>
              <Link to="/services" className="text-foreground">
                {language === 'ar' ? 'الخدمات' : language === 'fr' ? 'Services' : 'Services'}
              </Link>
              <Link to="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                {language === 'ar' ? 'الأسعار' : language === 'fr' ? 'Tarifs' : 'Pricing'}
              </Link>
              <Link to="/support" className="text-muted-foreground hover:text-foreground transition-colors">
                {language === 'ar' ? 'الدعم' : language === 'fr' ? 'Support' : 'Support'}
              </Link>
            </div>
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <ThemeToggle />
            </div>
          </div>
        </nav>

        {/* Hero */}
        <section className="pt-32 pb-16 px-6">
          <div className="container max-w-6xl mx-auto text-center">
            <span className="text-sm font-mono text-muted-foreground tracking-wider uppercase mb-4 block">
              {language === 'ar' ? 'خدماتنا' : language === 'fr' ? 'Nos Services' : 'Our Services'}
            </span>
            <h1 className="text-4xl md:text-6xl font-serif font-bold mb-6">
              {language === 'ar' ? <>حلول ذكاء اصطناعي <span className="text-primary">لأعمالك</span></> : language === 'fr' ? <>Solutions IA pour <span className="text-primary">Votre Entreprise</span></> : <>AI Solutions for <span className="text-primary">Your Business</span></>}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {language === 'ar' ? 'نحوّل أعمالك بتقنيات الذكاء الاصطناعي المتقدمة' : language === 'fr' ? 'Transformez votre entreprise avec des solutions IA avancées' : 'Transform your business with cutting-edge AI solutions'}
            </p>
          </div>
        </section>

        {/* Services Grid */}
        <section className="pb-24 px-6">
          <div className="container max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {services.map((service, i) => (
                <motion.div
                  key={service.slug}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                >
                  <Link to={`/services/${service.slug}`} className="block group">
                    <div className="bg-card border border-border/50 rounded-3xl p-8 min-h-[400px] flex flex-col hover:border-border hover:shadow-xl transition-all duration-300">
                      <div className="mb-6">
                        <service.icon className={cn("w-8 h-8 mb-4", service.color)} />
                        <h2 className="text-2xl font-bold group-hover:text-primary transition-colors">
                          {service.title}
                        </h2>
                        <p className="text-muted-foreground mt-2">{service.description}</p>
                      </div>
                      <div className="flex-1 flex items-center justify-center overflow-hidden rounded-2xl bg-muted/30 p-4">
                        {service.mockup}
                      </div>
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors mt-6">
                        {language === 'ar' ? 'اكتشف المزيد' : language === 'fr' ? 'En Savoir Plus' : 'Learn More'}
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border/50 py-12 px-6">
          <div className="container max-w-6xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
              <div className="col-span-2 md:col-span-1">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center">
                    <Brain className="w-5 h-5 text-background" />
                  </div>
                  <span className="text-xl font-bold">AYN</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {language === 'ar' ? 'حلول ذكاء اصطناعي متقدمة' : language === 'fr' ? 'Solutions IA avancées' : 'Advanced AI Solutions'}
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-sm uppercase tracking-wider mb-3">
                  {language === 'ar' ? 'التنقل' : language === 'fr' ? 'Navigation' : 'Navigate'}
                </h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><Link to="/" className="hover:text-foreground transition-colors">{language === 'ar' ? 'الرئيسية' : language === 'fr' ? 'Accueil' : 'Home'}</Link></li>
                  <li><Link to="/services" className="hover:text-foreground transition-colors">{language === 'ar' ? 'الخدمات' : language === 'fr' ? 'Services' : 'Services'}</Link></li>
                  <li><Link to="/pricing" className="hover:text-foreground transition-colors">{language === 'ar' ? 'الأسعار' : language === 'fr' ? 'Tarifs' : 'Pricing'}</Link></li>
                  <li><Link to="/support" className="hover:text-foreground transition-colors">{language === 'ar' ? 'الدعم' : language === 'fr' ? 'Support' : 'Support'}</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-sm uppercase tracking-wider mb-3">
                  {language === 'ar' ? 'قانوني' : language === 'fr' ? 'Légal' : 'Legal'}
                </h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><Link to="/privacy" className="hover:text-foreground transition-colors">{language === 'ar' ? 'سياسة الخصوصية' : language === 'fr' ? 'Confidentialité' : 'Privacy Policy'}</Link></li>
                  <li><Link to="/terms" className="hover:text-foreground transition-colors">{language === 'ar' ? 'الشروط والأحكام' : language === 'fr' ? 'Conditions' : 'Terms of Service'}</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-sm uppercase tracking-wider mb-3">
                  {language === 'ar' ? 'تواصل' : language === 'fr' ? 'Contact' : 'Contact'}
                </h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><a href="mailto:info@aynn.io" className="hover:text-foreground transition-colors">info@aynn.io</a></li>
                  <li><a href="https://discord.gg/y2DcBegbC7" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Discord</a></li>
                  <li><a href="https://x.com/AYNN_AI" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">@AYNN_AI</a></li>
                </ul>
              </div>
            </div>
            <Separator className="mb-6" />
            <p className="text-xs text-muted-foreground text-center">
              © 2026 AYN AI. {language === 'ar' ? 'جميع الحقوق محفوظة.' : language === 'fr' ? 'Tous droits réservés.' : 'All rights reserved.'}
            </p>
          </div>
        </footer>
      </div>
    </>
  );
};

export default Services;
