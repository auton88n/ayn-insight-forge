import { Link } from 'react-router-dom';
import { Brain, Mail } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Separator } from '@/components/ui/separator';

export const Footer = () => {
  const { language } = useLanguage();

  return (
    <footer className="border-t border-border/50 py-12 px-6">
      <div className="container max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
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

          {/* Navigate */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-3">
              {language === 'ar' ? 'التنقل' : language === 'fr' ? 'Navigation' : 'Navigate'}
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/" className="hover:text-foreground transition-colors">{language === 'ar' ? 'الرئيسية' : language === 'fr' ? 'Accueil' : 'Home'}</Link></li>
              <li><Link to="/services" className="hover:text-foreground transition-colors">{language === 'ar' ? 'الخدمات' : language === 'fr' ? 'Services' : 'Services'}</Link></li>
              <li><Link to="/pricing" className="hover:text-foreground transition-colors">{language === 'ar' ? 'الأسعار' : language === 'fr' ? 'Tarifs' : 'Pricing'}</Link></li>
              <li><Link to="/contact" className="hover:text-foreground transition-colors">{language === 'ar' ? 'تواصل معنا' : language === 'fr' ? 'Contact' : 'Contact'}</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-3">
              {language === 'ar' ? 'قانوني' : language === 'fr' ? 'Légal' : 'Legal'}
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/privacy" className="hover:text-foreground transition-colors">{language === 'ar' ? 'سياسة الخصوصية' : language === 'fr' ? 'Confidentialité' : 'Privacy Policy'}</Link></li>
              <li><Link to="/terms" className="hover:text-foreground transition-colors">{language === 'ar' ? 'الشروط والأحكام' : language === 'fr' ? 'Conditions' : 'Terms of Service'}</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-3">
              {language === 'ar' ? 'تواصل' : language === 'fr' ? 'Contact' : 'Contact'}
            </h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="mailto:info@aynn.io" className="hover:text-foreground transition-colors flex items-center gap-2"><Mail className="w-4 h-4" />info@aynn.io</a></li>
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
  );
};
