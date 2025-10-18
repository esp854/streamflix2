import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";
import { AuthProvider } from "@/contexts/auth-context";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import Home from "./pages/home";
import MovieDetail from "./pages/movie-detail";
import TVDetail from "./pages/tv-detail";
import WatchMovie from "./pages/watch-movie";
import WatchTV from "./pages/watch-tv";
import WatchParty from "./pages/watch-party";
import Series from "./pages/series";
import Search from "./pages/search";
import Profile from "./pages/profile";
import AdminDashboard from "./pages/admin-dashboard";
import Subscription from "./pages/subscription";
import NotFound from "./pages/not-found";
import Universe from "./pages/universe";
import ErrorBoundary from "@/components/ErrorBoundary";
import AuthModal from "@/components/auth/auth-modal";
import SplashScreen from "@/components/SplashScreen";
import { useState, useEffect } from "react";
import { useLocation as useWouterLocation } from "wouter";

const routes = [
  { path: "/", component: Home },
  { path: "/movie/:id", component: MovieDetail },
  { path: "/universe/:id", component: Universe },
  { path: "/series", component: Series },
  { path: "/tv/:id", component: TVDetail },
  { path: "/search", component: Search },
  { path: "/profile", component: Profile },
  { path: "/admin", component: AdminDashboard },
  { path: "/subscription", component: Subscription },
  { path: "/*", component: NotFound },
];

function LoginRoute() {
  const [, setLocation] = useWouterLocation();
  
  const handleLoginSuccess = (redirectUrl?: string) => {
    if (redirectUrl) {
      setLocation(redirectUrl);
    } else {
      setLocation('/');
    }
  };
  
  const handleClose = () => {
    // Check for redirect parameter
    const urlParams = new URLSearchParams(window.location.search);
    const redirect = urlParams.get('redirect');
    
    if (redirect) {
      setLocation(redirect);
    } else {
      setLocation('/');
    }
  };
  
  return (
    <AuthModal 
      isOpen={true} 
      onClose={handleClose} 
      defaultTab="login"
      onLoginSuccess={handleLoginSuccess}
    />
  );
}

function Router() {
  return (
    <Switch>
      {/* Watch routes - full screen without navbar/footer */}
      <Route path="/watch/movie/:id" component={WatchMovie} />
      <Route path="/watch/tv/:id/:season?/:episode?" component={WatchTV} />
      <Route path="/watch-party/:roomId?" component={WatchParty} />
      
      {/* Authentication route */}
      <Route path="/login" component={LoginRoute} />
      
      {/* Admin route */}
      <Route path="/admin" component={AdminDashboard} />
      
      {/* Regular routes with navbar/footer */}
      <Route path="/" component={Home} />
      <Route path="/movie/:id" component={MovieDetail} />
      <Route path="/universe/:id" component={Universe} />
      <Route path="/series" component={Series} />
      <Route path="/tv/:id" component={TVDetail} />
      <Route path="/search" component={Search} />
      <Route path="/profile" component={Profile} />
      <Route path="/subscription" component={Subscription} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [location] = useLocation();
  const isWatchPage = location.startsWith("/watch/");
  const isAdminPage = location === "/admin";
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Simulate a delay for the splash screen
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return <SplashScreen onAnimationComplete={() => setShowSplash(false)} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <ErrorBoundary>
            <div className="flex flex-col min-h-screen">
              {!isWatchPage && !isAdminPage && <Navbar />}
              <main className={`flex-grow ${!isWatchPage && !isAdminPage ? 'pt-12 md:pt-16 pb-16 md:pb-0' : ''}`}>
                <Router />
              </main>
              {!isWatchPage && !isAdminPage && <Footer />}
            </div>
          </ErrorBoundary>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;