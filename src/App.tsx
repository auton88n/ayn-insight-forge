import { lazy, Suspense } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "@/components/shared/theme-provider";
import { LanguageProvider } from "@/contexts/LanguageContext";
// Emotion state now managed by Zustand store (src/stores/emotionStore.ts)
// Sound state now managed by Zustand store (src/stores/soundStore.ts)
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
// Debug state now managed by Zustand store (src/stores/debugStore.ts)

import { PageLoader } from "@/components/ui/page-loader";
// Skeleton layouts removed — using PageLoader for all route fallbacks
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { OfflineBanner } from "@/components/shared/OfflineBanner";
import { AnimatePresence } from 'framer-motion';
import PageTransition from "@/components/shared/PageTransition";
import { ScrollToTop } from "@/components/shared/ScrollToTop";
import { useVisitorTracking } from "@/hooks/useVisitorTracking";
import { HelmetProvider } from 'react-helmet-async';

// Lazy load all route pages for code splitting
const Index = lazy(() => import("./pages/Index"));
const Settings = lazy(() => import("./pages/Settings"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ApprovalResult = lazy(() => import("./pages/ApprovalResult"));

const AIEmployee = lazy(() => import("./pages/services/AIEmployee"));
const AIEmployeeApply = lazy(() => import("./pages/services/AIEmployeeApply"));
const InfluencerSites = lazy(() => import("./pages/services/InfluencerSites"));
const InfluencerSitesApply = lazy(() => import("./pages/services/InfluencerSitesApply"));
const AIAgents = lazy(() => import("./pages/services/AIAgents"));
const AIAgentsApply = lazy(() => import("./pages/services/AIAgentsApply"));
const Automation = lazy(() => import("./pages/services/Automation"));
const AutomationApply = lazy(() => import("./pages/services/AutomationApply"));
const Ticketing = lazy(() => import("./pages/services/Ticketing"));
const TicketingApply = lazy(() => import("./pages/services/TicketingApply"));
const Support = lazy(() => import("./pages/Support"));
const Engineering = lazy(() => import("./pages/EngineeringWorkspacePage"));

const Compliance = lazy(() => import("./pages/CompliancePage"));
const AIGradingDesigner = lazy(() => import("./pages/AIGradingDesigner"));
const CivilEngineering = lazy(() => import("./pages/services/CivilEngineering"));
const Pricing = lazy(() => import("./pages/Pricing"));
const ChartAnalyzerPage = lazy(() => import("./pages/ChartAnalyzerPage"));
const Performance = lazy(() => import("./pages/Performance"));
const SubscriptionSuccess = lazy(() => import("./pages/SubscriptionSuccess"));
const SubscriptionCanceled = lazy(() => import("./pages/SubscriptionCanceled"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,        // 1 minute - data stays fresh
      gcTime: 5 * 60 * 1000,       // 5 minutes - keep in cache
      refetchOnWindowFocus: false, // Don't refetch when tab regains focus
      retry: 1,                    // Only retry once on failure
    },
  },
});

const AnimatedRoutes = () => {
  const location = useLocation();
  
  // Track page visits for analytics
  useVisitorTracking();

  // Fast routes skip animation for instant navigation
  const fastRoutes = ['/settings', '/pricing'];
  const isFastRoute = fastRoutes.some(route => location.pathname.startsWith(route));
  
  const routes = (
    <Routes location={location} key={isFastRoute ? 'fast' : location.pathname}>
      <Route path="/" element={<Suspense fallback={<PageLoader />}><PageTransition><Index /></PageTransition></Suspense>} />
      {/* Fast routes - no animation wrapper */}
      <Route path="/settings" element={<Suspense fallback={<PageLoader />}><Settings /></Suspense>} />
      <Route path="/pricing" element={<Suspense fallback={<PageLoader />}><Pricing /></Suspense>} />
      
      <Route path="/reset-password" element={<PageTransition><ResetPassword /></PageTransition>} />
      
      <Route path="/services/ai-employee" element={<Suspense fallback={<PageLoader />}><PageTransition><AIEmployee /></PageTransition></Suspense>} />
      <Route path="/services/ai-employee/apply" element={<Suspense fallback={<PageLoader />}><PageTransition><AIEmployeeApply /></PageTransition></Suspense>} />
      <Route path="/services/content-creator-sites" element={<Suspense fallback={<PageLoader />}><PageTransition><InfluencerSites /></PageTransition></Suspense>} />
      <Route path="/services/content-creator-sites/apply" element={<Suspense fallback={<PageLoader />}><PageTransition><InfluencerSitesApply /></PageTransition></Suspense>} />
      <Route path="/services/ai-agents" element={<Suspense fallback={<PageLoader />}><PageTransition><AIAgents /></PageTransition></Suspense>} />
      <Route path="/services/ai-agents/apply" element={<Suspense fallback={<PageLoader />}><PageTransition><AIAgentsApply /></PageTransition></Suspense>} />
      <Route path="/services/automation" element={<Suspense fallback={<PageLoader />}><PageTransition><Automation /></PageTransition></Suspense>} />
      <Route path="/services/automation/apply" element={<Suspense fallback={<PageLoader />}><PageTransition><AutomationApply /></PageTransition></Suspense>} />
      <Route path="/services/ticketing" element={<Suspense fallback={<PageLoader />}><PageTransition><Ticketing /></PageTransition></Suspense>} />
      <Route path="/services/ticketing/apply" element={<Suspense fallback={<PageLoader />}><PageTransition><TicketingApply /></PageTransition></Suspense>} />
      <Route path="/support" element={<PageTransition><Support /></PageTransition>} />
      <Route path="/engineering" element={<Suspense fallback={<PageLoader />}><PageTransition><Engineering /></PageTransition></Suspense>} />
      
      <Route path="/compliance" element={<Suspense fallback={<PageLoader />}><PageTransition><Compliance /></PageTransition></Suspense>} />
      <Route path="/engineering/grading" element={<Suspense fallback={<PageLoader />}><PageTransition><AIGradingDesigner /></PageTransition></Suspense>} />
      <Route path="/services/civil-engineering" element={<Suspense fallback={<PageLoader />}><PageTransition><CivilEngineering /></PageTransition></Suspense>} />
      <Route path="/chart-analyzer" element={<Suspense fallback={<PageLoader />}><PageTransition><ChartAnalyzerPage /></PageTransition></Suspense>} />
      <Route path="/performance" element={<Suspense fallback={<PageLoader />}><PageTransition><Performance /></PageTransition></Suspense>} />
      <Route path="/approval-result" element={<PageTransition><ApprovalResult /></PageTransition>} />
      <Route path="/subscription-success" element={<PageTransition><SubscriptionSuccess /></PageTransition>} />
      <Route path="/subscription-canceled" element={<PageTransition><SubscriptionCanceled /></PageTransition>} />
      <Route path="/terms" element={<PageTransition><Terms /></PageTransition>} />
      <Route path="/privacy" element={<PageTransition><Privacy /></PageTransition>} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<PageTransition><NotFound /></PageTransition>} />
    </Routes>
  );

  // Skip AnimatePresence for fast routes
  if (isFastRoute) {
    return routes;
  }

  return (
    <AnimatePresence mode="wait">
      {routes}
    </AnimatePresence>
  );
};

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <ThemeProvider defaultTheme="light" storageKey="ayn-theme">
              <SubscriptionProvider>
                  <TooltipProvider>
                    <OfflineBanner />
                    <Toaster />
                    <Sonner />
                    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                      <ScrollToTop />
                      <ErrorBoundary>
                        <Suspense fallback={<PageLoader />}>
                          <AnimatedRoutes />
                        </Suspense>
                      </ErrorBoundary>
                    </BrowserRouter>
                  </TooltipProvider>
              </SubscriptionProvider>
        </ThemeProvider>
      </LanguageProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
