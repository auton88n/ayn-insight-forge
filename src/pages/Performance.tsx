import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Activity, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import PerformanceDashboard from '@/components/trading/PerformanceDashboard';

export default function Performance() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsAuthenticated(!!user);
    });
  }, []);

  return (
    <>
      <Helmet>
        <title>AYN Trading Performance | Live Paper Trading Results</title>
        <meta name="description" content="Track AYN's live paper trading performance — win rate, P&L, open positions, and trade history with full transparency." />
      </Helmet>

      <div className="max-w-5xl mx-auto py-6 px-4 space-y-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/')}
          className="gap-2 bg-muted/50 backdrop-blur-sm rounded-full px-4 hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Activity className="h-7 w-7 text-primary" />
            AYN's Trading Performance
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Live paper trading account — full transparency
          </p>
        </div>

        {/* Auth context banner for unauthenticated visitors */}
        {isAuthenticated === false && (
          <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3">
            <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              This is AYN's live paper trading performance.{' '}
              <button
                onClick={() => navigate('/')}
                className="text-primary underline underline-offset-2 hover:no-underline"
              >
                Sign in
              </button>{' '}
              to start your own trading analysis.
            </p>
          </div>
        )}

        {/* Dashboard — single source of truth */}
        <PerformanceDashboard />
      </div>
    </>
  );
}
