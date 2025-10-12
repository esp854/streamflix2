import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Search, User, ChevronDown, Menu, LogOut, UserPlus, X, HelpCircle, Shield, Crown, Check, CheckCheck, Home, Film, Tv, Heart, TrendingUp, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/auth-context";
import AuthModal from "@/components/auth/auth-modal";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import PWAInstallButton from "@/components/PWAInstallButton";
import NotificationBell from "@/components/NotificationBell";

export default function Navbar() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<"login" | "register">("login");
  const [location, navigate] = useLocation();
  
  const { user, logout, isAuthenticated } = useAuth();

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const query = formData.get("query") as string;
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
      setSearchOpen(false);
      // Clear the form
      e.currentTarget.reset();
    }
  };

  const handleSearchBlur = (e: React.FocusEvent) => {
    // Only close if clicking outside the search form
    setTimeout(() => {
      if (!e.currentTarget.contains(document.activeElement)) {
        setSearchOpen(false);
      }
    }, 100);
  };

  const navigationLinks = [
    { href: "/", label: "Accueil", active: location === "/" },
    { href: "/category/28", label: "Films", active: location.startsWith("/category") },
    { href: "/series", label: "Séries", active: location === "/series" },
    { href: "/favorites", label: "Ma Liste", active: location === "/favorites" },
    { href: "/trending", label: "Tendances", active: location === "/trending" },
  ];

  return (
    <div className="relative">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border" data-testid="navbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-8">
              <Link href="/" className="text-2xl font-bold text-primary flex items-center" data-testid="logo-link">
                <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                StreamFlix
              </Link>
              
              {/* Desktop Navigation */}
              <div className="hidden md:flex space-x-6">
                {navigationLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`font-medium transition-colors duration-200 ${
                      link.active
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                    data-testid={`nav-link-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
            
            {/* Right side actions */}
            <div className="flex items-center space-x-4">
              {/* Search */}
              {!searchOpen ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSearchOpen(true)}
                  className="text-muted-foreground hover:text-foreground"
                  data-testid="search-toggle"
                >
                  <Search className="h-5 w-5" />
                </Button>
              ) : (
                <form onSubmit={handleSearch} className="flex items-center space-x-2" onBlur={handleSearchBlur}>
                  <Input
                    name="query"
                    placeholder="Rechercher des films..."
                    className="w-64"
                    autoFocus
                    data-testid="search-input"
                  />
                  <Button type="submit" size="sm" variant="secondary">
                    <Search className="h-4 w-4" />
                  </Button>
                </form>
              )}
              
              {/* Notifications */}
              {isAuthenticated && (
                <NotificationBell />
              )}
              
              {/* PWA Install Button */}
              <PWAInstallButton />

              {/* User Menu */}
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2" data-testid="user-menu-trigger">
                      <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-primary-foreground">
                          {user?.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="hidden md:block text-sm font-medium">{user?.username}</span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="w-full" data-testid="user-menu-profile">
                        <User className="h-4 w-4 mr-2" />
                        Mon Profil
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/subscription" className="w-full text-yellow-600" data-testid="user-menu-subscription">
                        <Crown className="h-4 w-4 mr-2" />
                        Abonnements Premium
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/favorites" className="w-full" data-testid="user-menu-favorites">
                        <Bell className="h-4 w-4 mr-2" />
                        Ma Liste
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/help" className="w-full" data-testid="user-menu-help">
                        <HelpCircle className="h-4 w-4 mr-2" />
                        Centre d'Aide
                      </Link>
                    </DropdownMenuItem>
                    {user?.role === "admin" && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="w-full" data-testid="user-menu-admin">
                          <Shield className="h-4 w-4 mr-2" />
                          Administration
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={logout}
                      className="text-red-600 focus:text-red-600" 
                      data-testid="user-menu-logout"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Se déconnecter
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center space-x-2">
                  {/* Desktop: Show text, Mobile: Show icons only */}
                  <Button 
                    variant="ghost" 
                    onClick={() => {
                      setAuthModalTab("login");
                      setAuthModalOpen(true);
                    }}
                    data-testid="login-button"
                    className="hidden sm:flex"
                  >
                    Connexion
                  </Button>
                  <Button 
                    onClick={() => {
                      setAuthModalTab("register");
                      setAuthModalOpen(true);
                    }}
                    data-testid="register-button"
                    className="hidden sm:flex"
                  >
                    Inscription
                  </Button>
                  
                  {/* Mobile: Single auth icon */}
                  <Button 
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setAuthModalTab("login");
                      setAuthModalOpen(true);
                    }}
                    className="sm:hidden"
                    title="Connexion / Inscription"
                    data-testid="mobile-auth-button"
                  >
                    <User className="h-5 w-5" />
                  </Button>
                </div>
              )}

              {/* Mobile Menu */}
              {/* Supprimé selon les spécifications du projet : seule la navigation bottom doit être utilisée */}
            </div>
          </div>
        </div>
        
        {/* Search Overlay for mobile */}
        {searchOpen && (
          <div className="md:hidden bg-background border-b border-border" data-testid="mobile-search-overlay">
            <div className="px-4 py-4">
              <div className="flex items-center space-x-2 mb-2">
                <h3 className="text-lg font-medium flex-1">Rechercher</h3>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setSearchOpen(false)}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <form onSubmit={handleSearch} className="flex items-center space-x-2">
                <Input
                  name="query"
                  placeholder="Rechercher des films, séries..."
                  className="flex-1"
                  autoFocus
                  data-testid="mobile-search-input"
                />
                <Button type="submit" size="sm" variant="secondary">
                  <Search className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </div>
        )}
        
        {/* Authentication Modal */}
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          defaultTab={authModalTab}
        />
      </nav>
      
      {/* Mobile Bottom Navigation - Déplacé en dehors de l'élément nav pour éviter les conflits de positionnement */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border">
        <div className="flex items-center justify-around py-2 px-4">
          <Link
            href="/"
            className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors ${location === "/" ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Home className="w-5 h-5" />
            <span className="text-xs">Accueil</span>
          </Link>

          <Link
            href="/category/28"
            className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors ${location.startsWith("/category") ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Film className="w-5 h-5" />
            <span className="text-xs">Films</span>
          </Link>

          <Link
            href="/series"
            className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors ${location === "/series" ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Tv className="w-5 h-5" />
            <span className="text-xs">Séries</span>
          </Link>

          <Link
            href="/favorites"
            className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors ${location === "/favorites" ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Heart className="w-5 h-5" />
            <span className="text-xs">Favoris</span>
          </Link>

          <Link
            href="/trending"
            className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors ${location === "/trending" ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"}`}
          >
            <TrendingUp className="w-5 h-5" />
            <span className="text-xs">Tendance</span>
          </Link>
        </div>
      </div>
    </div>
  );
}