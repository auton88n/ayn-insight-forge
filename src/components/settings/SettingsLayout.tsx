import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, User, Bell, Shield, Monitor, Search, AlertTriangle, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { SettingsProvider, useSettingsContext } from '@/contexts/SettingsContext';
import { useUnsavedChangesWarning } from '@/hooks/useUnsavedChangesWarning';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useState } from 'react';

interface SettingsLayoutProps {
  children: {
    account: React.ReactNode;
    notifications: React.ReactNode;
    privacy: React.ReactNode;
    sessions: React.ReactNode;
    memory: React.ReactNode;
  };
}

const SettingsLayoutContent = ({ children }: SettingsLayoutProps) => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { searchTerm, setSearchTerm, hasUnsavedChanges, setHasUnsavedChanges } = useSettingsContext();
  const [showWarning, setShowWarning] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);

  useUnsavedChangesWarning(hasUnsavedChanges);

  const handleNavigation = (navigationFn: () => void) => {
    if (hasUnsavedChanges) {
      setPendingNavigation(() => navigationFn);
      setShowWarning(true);
    } else {
      navigationFn();
    }
  };

  const handleBack = () => {
    handleNavigation(() => navigate('/'));
  };

  const confirmNavigation = () => {
    setHasUnsavedChanges(false);
    setShowWarning(false);
    
    if (pendingNavigation) {
      pendingNavigation();
      setPendingNavigation(null);
    }
  };

  const cancelNavigation = () => {
    setShowWarning(false);
    setPendingNavigation(null);
  };

  return (
    <>
      <div className="min-h-screen bg-background p-4 md:p-6 pt-6 md:pt-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-6 md:mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBack}
              className="gap-2 mb-3 md:mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('common.back')}
            </Button>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 md:gap-4 mb-4 md:mb-6">
              <h1 className="text-2xl md:text-3xl font-bold">{t('settings.title')}</h1>
              {hasUnsavedChanges && (
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  <span>{t('settings.unsavedChanges')}</span>
                </div>
              )}
            </div>
            
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t('settings.searchSettings')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-card/50 backdrop-blur-xl border-border/50"
              />
            </div>
          </div>

          <Tabs defaultValue="account" className="w-full" dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <TabsList className="w-full grid grid-cols-5 mb-8 bg-muted">
              <TabsTrigger value="account" className="gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">{t('settings.account')}</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="gap-2">
                <Bell className="h-4 w-4" />
                <span className="hidden sm:inline">{t('settings.notifications')}</span>
              </TabsTrigger>
              <TabsTrigger value="privacy" className="gap-2">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">{t('settings.privacy')}</span>
              </TabsTrigger>
              <TabsTrigger value="sessions" className="gap-2">
                <Monitor className="h-4 w-4" />
                <span className="hidden sm:inline">{t('settings.sessions')}</span>
              </TabsTrigger>
              <TabsTrigger value="memory" className="gap-2">
                <Brain className="h-4 w-4" />
                <span className="hidden sm:inline">Memory</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="account">{children.account}</TabsContent>
            <TabsContent value="notifications">{children.notifications}</TabsContent>
            <TabsContent value="privacy">{children.privacy}</TabsContent>
            <TabsContent value="sessions">{children.sessions}</TabsContent>
            <TabsContent value="memory">{children.memory}</TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Unsaved Changes Warning Dialog */}
      <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              {t('settings.unsavedChangesTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('settings.unsavedChangesDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelNavigation}>
              {t('settings.stayOnPage')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmNavigation} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('settings.leaveWithoutSaving')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export const SettingsLayout = ({ children }: SettingsLayoutProps) => {
  return (
    <SettingsProvider>
      <SettingsLayoutContent>{children}</SettingsLayoutContent>
    </SettingsProvider>
  );
};
