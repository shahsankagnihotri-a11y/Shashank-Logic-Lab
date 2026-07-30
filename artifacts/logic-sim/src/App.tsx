import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import Dashboard from '@/pages/index';
import Editor from '@/pages/editor';
import SharedCircuit from '@/pages/shared';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import SplashScreen from '@/components/SplashScreen';
import { AnimatePresence } from 'framer-motion';

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/editor" component={Editor} />
      <Route path="/editor/:id" component={Editor} />
      <Route path="/shared/:shareCode" component={SharedCircuit} />
      <Route component={NotFound} />
    </Switch>
  );
}

let splashShown = false;

function App() {
  const [showSplash, setShowSplash] = useState(!splashShown);

  useEffect(() => {
    if (splashShown) return;
    splashShown = true;
    const timer = setTimeout(() => setShowSplash(false), 2200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="dark relative min-h-screen">
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
          <AnimatePresence>
            {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}
          </AnimatePresence>
          <Toaster />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
