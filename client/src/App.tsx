import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";
import { AuthProvider } from "@/contexts/auth-context";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import Home from "@/pages/home";
import MovieDetail from "@/pages/movie-detail";
import TVDetail from "@/pages/tv-detail";
import WatchMovie from "@/pages/watch-movie";
import WatchTV from "@/pages/watch-tv";
import Search from "@/pages/search";
import Category from "@/pages/category";
import Trending from "@/pages/trending";
import Favorites from "@/pages/favorites";
import ContinueWatching from "@/pages/continue-watching";
import Profile from "@/pages/profile";
import Contact from "@/pages/contact";
import Terms from "@/pages/terms";
import Privacy from "@/pages/privacy";
import HelpCenter from "@/pages/help-center";
import AdminDashboard from "@/pages/admin-dashboard";
import Subscription from "@/pages/subscription";
import PaymentSuccess from "@/pages/payment-success";
import PaymentCancelled from "@/pages/payment-cancelled";
import PlanDemo from "@/pages/plan-demo";
import NotFound from "@/pages/not-found";
import Series from "@/pages/series";
import ZuploadTest from "@/pages/zupload-test";
import ZuploadEpisodeTest from "@/pages/zupload-episode-test";
import ZuploadDirectTest from "@/pages/zupload-direct-test";
import ErrorBoundary from "@/components/ErrorBoundary";
import AuthModal from "@/components/auth/auth-modal";
import SplashScreen from "@/components/SplashScreen";
import { useState, useEffect } from "react";
import { useLocation as useWouterLocation } from "wouter";
import UpcomingMovies from "@/pages/upcoming-movies";
import NowPlayingMovies from "@/pages/now-playing-movies";
import WatchPartyPage from "@/pages/watch-party";

// Login route component that opens the AuthModal
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
      <Route path="/watch-party/:roomId?" component={WatchPartyPage} />
      
      {/* Authentication route */}
      <Route path="/login" component={LoginRoute} />
      
      {/* Admin route */}
      <Route path="/admin" component={AdminDashboard} />
      
      {/* Test routes */}
      <Route path="/zupload-test" component={ZuploadTest} />
      <Route path="/zupload-episode-test" component={ZuploadEpisodeTest} />
      <Route path="/zupload-direct-test" component={ZuploadDirectTest} />
      
      {/* Regular routes with navbar/footer */}
      <Route path="/" component={Home} />
      <Route path="/movie/:id" component={MovieDetail} />
      <Route path="/series" component={Series} />
      <Route path="/tv/:id" component={TVDetail} />
      <Route path="/search" component={Search} />
      <Route path="/category/:genre" component={Category} />
      <Route path="/trending" component={Trending} />
      <Route path="/favorites" component={Favorites} />
      <Route path="/continue-watching" component={ContinueWatching} />
      <Route path="/profile" component={Profile} />
      <Route path="/subscription" component={Subscription} />
      <Route path="/payment-success" component={PaymentSuccess} />
      <Route path="/paiement/success" component={PaymentSuccess} />
      <Route path="/paiement/cancel" component={PaymentCancelled} />
      <Route path="/plan-demo" component={PlanDemo} />
      <Route path="/contact" component={Contact} />
      <Route path="/help" component={HelpCenter} />
      <Route path="/terms" component={Terms} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/movies/upcoming" component={UpcomingMovies} />
      <Route path="/movies/now-playing" component={NowPlayingMovies} />
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