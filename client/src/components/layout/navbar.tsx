import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Search, User, ChevronDown, Menu, LogOut, UserPlus, X, HelpCircle, Shield, Crown, Check, CheckCheck, Home, Film, Tv, Heart, TrendingUp, Play, Bell } from "lucide-react";
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
import PWAInstallButton from "@/components/PWAInstallButton";
import NotificationBell from "@/components/NotificationBell";
import SearchSuggestions from "@/components/search-suggestions";

export default function Navbar() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<"login" | "register">("login");
  const [location, navigate] = useLocation();
  
  const { user, logout, isAuthenticated } = useAuth();

  const handleSearch = (query: string) => {
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`);
      setSearchOpen(false);
    }
  };

  const navigationLinks = [
    { href: "/", label: "Accueil", active: location === "/" },
    { href: "/films", label: "Films", active: location === "/films" },
    { href: "/series", label: "Séries", active: location === "/series" },
    { href: "/tv-channels", label: "Chaînes TV", active: location === "/tv-channels" }, // Ajout du lien
    { href: "/ma-liste", label: "Ma Liste", active: location === "/ma-liste" },
    { href: "/tendances", label: "Tendances", active: location === "/tendances" },
  ];

  return (
    <div className="relative">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border" data-testid="navbar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo - Ajusté pour mobile */}
            <div className="flex items-center space-x-4 sm:space-x-8">
              <Link href="/" className="text-lg sm:text-xl md:text-2xl font-bold text-primary flex items-center" data-testid="logo-link">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-1 sm:mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
                <span>StreamFlix</span>
              </Link>
              
              {/* Desktop Navigation - Masqué sur mobile */}
              <div className="hidden md:flex space-x-4 sm:space-x-6">
                {navigationLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`text-xs sm:text-sm font-medium transition-colors duration-200 ${
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
            
            {/* Right side actions - Optimisé pour mobile */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Search - Icône de loupe qui redirige vers la page de recherche */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/search')}
                className="text-muted-foreground hover:text-foreground w-8 h-8 sm:w-10 sm:h-10"
                data-testid="search-toggle"
              >
                <Search className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              
              {/* Notifications */}
              {isAuthenticated && (
                <NotificationBell />
              )}
              
              {/* PWA Install Button - Masqué sur très petits écrans */}
              <div className="hidden xs:block">
                <PWAInstallButton />
              </div>

              {/* User Menu */}
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-1 sm:space-x-2 p-1 sm:p-2" data-testid="user-menu-trigger">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-xs sm:text-sm font-medium text-primary-foreground">
                          {user?.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="hidden md:block text-xs sm:text-sm font-medium">{user?.username}</span>
                      <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 hidden sm:block" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40 sm:w-48">
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="w-full text-xs sm:text-sm" data-testid="user-menu-profile">
                        <User className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        Mon Profil
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/subscription" className="w-full text-yellow-600 text-xs sm:text-sm" data-testid="user-menu-subscription">
                        <Crown className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        Abonnements Premium
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/favorites" className="w-full text-xs sm:text-sm" data-testid="user-menu-favorites">
                        <Bell className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        Ma Liste
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/help" className="w-full text-xs sm:text-sm" data-testid="user-menu-help">
                        <HelpCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                        Centre d'Aide
                      </Link>
                    </DropdownMenuItem>
                    {user?.role === "admin" && (
                      <DropdownMenuItem asChild>
                        <Link href="/admin" className="w-full text-xs sm:text-sm" data-testid="user-menu-admin">
                          <Shield className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          Administration
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={logout}
                      className="text-red-600 focus:text-red-600 text-xs sm:text-sm" 
                      data-testid="user-menu-logout"
                    >
                      <LogOut className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      Se déconnecter
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="flex items-center space-x-1 sm:space-x-2">
                  {/* Desktop: Show text, Mobile: Show icons only */}
                  <Button 
                    variant="ghost" 
                    onClick={() => {
                      setAuthModalTab("login");
                      setAuthModalOpen(true);
                    }}
                    data-testid="login-button"
                    className="hidden sm:flex h-8 text-xs sm:h-10 sm:text-sm"
                  >
                    Connexion
                  </Button>
                  <Button 
                    onClick={() => {
                      setAuthModalTab("register");
                      setAuthModalOpen(true);
                    }}
                    data-testid="register-button"
                    className="hidden sm:flex h-8 text-xs sm:h-10 sm:text-sm"
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
                    className="sm:hidden w-8 h-8"
                    title="Connexion / Inscription"
                    data-testid="mobile-auth-button"
                  >
                    <User className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Mobile Menu */}
              {/* Supprimé selon les spécifications du projet : seule la navigation bottom doit être utilisée */}
            </div>
          </div>
        </div>
        
        {/* Authentication Modal */}
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          defaultTab={authModalTab}
        />
      </nav>
      
      {/* Mobile Bottom Navigation - Déplacé en dehors de l'élément nav pour éviter les conflits de positionnement */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border">
        <div className="flex items-center justify-around py-2 px-2 sm:px-4">
          <Link
            href="/"
            className={`flex flex-col items-center space-y-1 p-1 sm:p-2 rounded-lg transition-colors ${location === "/" ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Home className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-xs">Accueil</span>
          </Link>

          <Link
            href="/films"
            className={`flex flex-col items-center space-y-1 p-1 sm:p-2 rounded-lg transition-colors ${location === "/films" ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Film className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-xs">Films</span>
          </Link>

          <Link
            href="/series"
            className={`flex flex-col items-center space-y-1 p-1 sm:p-2 rounded-lg transition-colors ${location === "/series" ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Tv className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-xs">Séries</span>
          </Link>

          <Link
            href="/ma-liste"
            className={`flex flex-col items-center space-y-1 p-1 sm:p-2 rounded-lg transition-colors ${location === "/ma-liste" ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"}`}
          >
            <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-xs">Favoris</span>
          </Link>

          <Link
            href="/tendances"
            className={`flex flex-col items-center space-y-1 p-1 sm:p-2 rounded-lg transition-colors ${location === "/tendances" ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"}`}
          >
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-xs">Tendance</span>
          </Link>
        </div>
      </div>
    </div>
  );
}