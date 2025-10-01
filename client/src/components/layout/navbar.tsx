import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Search, Bell, User, ChevronDown, Menu, LogOut, UserPlus, X, HelpCircle, Shield, Crown, Check, CheckCheck, Home, Film, Tv, Heart, TrendingUp, Play } from "lucide-react";
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

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  createdAt: string;
}

export default function Navbar() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<"login" | "register">("login");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [location, navigate] = useLocation();
  
  const { user, logout, isAuthenticated } = useAuth();

  // Fetch notifications when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated]);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch("/api/notifications", {
        credentials: "include",
        headers: {
          ...(token ? { "Authorization": "Bearer " + token } : {}),
        },
      });
      
      if (response.ok) {
        const userNotifications = await response.json();
        setNotifications(userNotifications);
        setUnreadCount(userNotifications.filter((n: Notification) => !n.read).length);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const getCSRFToken = async (): Promise<string | null> => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch("/api/csrf-token", {
        credentials: "include",
        headers: {
          ...(token ? { "Authorization": "Bearer " + token } : {}),
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.csrfToken;
      }
      return null;
    } catch (error) {
      console.error("Error fetching CSRF token:", error);
      return null;
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const csrfToken = await getCSRFToken();
      
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": "Bearer " + token } : {}),
          ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
        },
      });
      
      if (response.ok) {
        setNotifications(notifications.map(n => 
          n.id === notificationId ? { ...n, read: true } : n
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      // Mark all unread notifications as read
      const unreadNotifications = notifications.filter(n => !n.read);
      await Promise.all(unreadNotifications.map(n => markAsRead(n.id)));
      
      // Update local state
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

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
              <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-muted-foreground hover:text-foreground relative"
                    data-testid="notifications-button"
                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="end">
                  <div className="border-b p-4 flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">Notifications</h3>
                      {unreadCount > 0 && (
                        <p className="text-sm text-muted-foreground">{unreadCount} non lues</p>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={markAllAsRead}
                        className="text-xs h-8"
                      >
                        <CheckCheck className="h-3 w-3 mr-1" />
                        Tout marquer comme lu
                      </Button>
                    )}
                  </div>
                  <ScrollArea className="h-80">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground">
                        Aucune notification
                      </div>
                    ) : (
                      <div className="divide-y">
                        {notifications.map((notification) => (
                          <div 
                            key={notification.id} 
                            className={`p-4 hover:bg-muted/50 ${!notification.read ? 'bg-muted/30' : ''}`}
                          >
                            <div className="flex justify-between items-start">
                              <h4 className="font-medium text-sm">{notification.title}</h4>
                              {!notification.read && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsRead(notification.id);
                                  }}
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {format(new Date(notification.createdAt), 'dd MMM yyyy', { locale: fr })}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </PopoverContent>
              </Popover>
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
                
                {/* Mobile: Icon buttons */}
                <Button 
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setAuthModalTab("login");
                    setAuthModalOpen(true);
                  }}
                  className="sm:hidden"
                  title="Connexion"
                  data-testid="mobile-login-button"
                >
                  <User className="h-5 w-5" />
                </Button>
                <Button 
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setAuthModalTab("register");
                    setAuthModalOpen(true);
                  }}
                  className="sm:hidden"
                  title="Inscription"
                  data-testid="mobile-register-button"
                >
                  <UserPlus className="h-5 w-5" />
                </Button>
              </div>
            )}

            {/* Mobile Menu */}

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
          className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors ${
            location === "/" ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-xs">Accueil</span>
        </Link>

        <Link
          href="/category/28"
          className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors ${
            location.startsWith("/category") ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Film className="w-5 h-5" />
          <span className="text-xs">Films</span>
        </Link>

        <Link
          href="/series"
          className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors ${
            location === "/series" ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Tv className="w-5 h-5" />
          <span className="text-xs">Séries</span>
        </Link>

        <Link
          href="/favorites"
          className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors ${
            location === "/favorites" ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Heart className="w-5 h-5" />
          <span className="text-xs">Favoris</span>
        </Link>

        <Link
          href="/trending"
          className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors ${
            location === "/trending" ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <TrendingUp className="w-5 h-5" />
          <span className="text-xs">Tendance</span>
        </Link>
      </div>
    </div>
  );
}