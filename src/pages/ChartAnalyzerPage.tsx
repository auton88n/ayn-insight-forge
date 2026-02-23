import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart3, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import ChartUnifiedChat from '@/components/dashboard/ChartUnifiedChat';
import ChartCoachSidebar from '@/components/dashboard/ChartCoachSidebar';
import { useChartCoach } from '@/hooks/useChartCoach';

const ChartAnalyzerPage = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | undefined>();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Sidebar state — persisted to localStorage
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    try {
      const stored = localStorage.getItem('chart-sidebar-open');
      if (stored !== null) return stored === 'true';
    } catch {}
    return window.innerWidth >= 1024;
  });
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Lifted chat state — persists across tab switches
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [latestResult, setLatestResult] = useState<any>(null);

  // Coach hook lifted to page level so sidebar can share session data
  const coach = useChartCoach(latestResult ?? undefined);

  useEffect(() => {
    try { localStorage.setItem('chart-sidebar-open', String(sidebarOpen)); } catch {}
  }, [sidebarOpen]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
      setIsCheckingAuth(false);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!isCheckingAuth && !userId) navigate('/');
  }, [isCheckingAuth, userId, navigate]);

  if (isCheckingAuth || !userId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse">
          <BarChart3 className="w-12 h-12 text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Subtle ambient gradient */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[radial-gradient(ellipse_at_center,_hsl(36_80%_50%_/_0.06)_0%,_transparent_70%)]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[radial-gradient(ellipse_at_center,_hsl(25_80%_45%_/_0.04)_0%,_transparent_70%)]" />
      </div>

      <div className="relative pt-4 px-4 h-screen flex flex-col">
        {/* Top bar: Back button only */}
        <div className="flex items-center gap-3 mb-2 shrink-0 mx-auto w-full max-w-6xl">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="gap-2 bg-muted/50 backdrop-blur-sm rounded-full px-4 hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        {/* Content — Chat only */}
        <div className="flex-1 min-h-0">
          <div className="max-w-6xl mx-auto h-full flex gap-0 overflow-hidden rounded-xl">
            {/* Desktop sidebar — Chat session history */}
            {sidebarOpen && (
              <div className="hidden lg:block h-full border border-border/50 rounded-l-xl overflow-hidden bg-background/50">
                <ChartCoachSidebar
                  sessions={coach.sessions}
                  activeSessionId={coach.activeSessionId}
                  onSwitchSession={coach.switchSession}
                  onNewChat={() => { coach.newChat(); setChatMessages([]); }}
                  onDeleteSession={coach.deleteSession}
                  onClose={() => setSidebarOpen(false)}
                />
              </div>
            )}

            {/* Mobile sidebar (Sheet) */}
            <ChartCoachSidebar
              sessions={coach.sessions}
              activeSessionId={coach.activeSessionId}
              onSwitchSession={(id) => { coach.switchSession(id); setMobileSidebarOpen(false); }}
              onNewChat={() => { coach.newChat(); setChatMessages([]); setMobileSidebarOpen(false); }}
              onDeleteSession={coach.deleteSession}
              onClose={() => setMobileSidebarOpen(false)}
              mobileMode
              open={mobileSidebarOpen}
            />

            {/* Chat pane */}
            <div className="flex-1 min-w-0 h-full">
              <ChartUnifiedChat
                messages={chatMessages}
                onMessagesChange={setChatMessages}
                latestResult={latestResult}
                onLatestResultChange={setLatestResult}
                coach={coach}
                onToggleSidebar={() => {
                  if (window.innerWidth >= 1024) setSidebarOpen(o => !o);
                  else setMobileSidebarOpen(o => !o);
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartAnalyzerPage;
