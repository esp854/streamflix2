import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  Search, 
  TrendingUp, 
  Tv, 
  User, 
  UserPlus, 
  Menu, 
  X, 
  Heart,
  Film
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import AuthModal from "@/components/auth/auth-modal";
import PWAInstallButton from "@/components/PWAInstallButton";
import { useFavorites } from "@/hooks/use-favorites";
import { useQuery } from "@tanstack/react-query";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavbarProps {
  className?: string;
}

export default function Navbar({ className = "" }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<"login" | "register">("login");
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  
  // Get favorite count
  const { data: favoritesData } = useQuery({
    queryKey: ["/api/favorites", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const response = await fetch(`/api/favorites/${user.id}`, {
        credentials: 'include',
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!user?.id,
  });
  
  const favoriteCount = favoritesData?.length || 0;

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  const navItems = [
    { href: "/", label: "Accueil", icon: Home },
    { href: "/trending", label: "Tendances", icon: TrendingUp },
    { href: "/series", label: "Séries", icon: Tv },
    { href: "/search", label: "Recherche", icon: Search },
  ];

  return (
    <>
      <nav 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? "bg-background/90 backdrop-blur-md border-b border-border/50" 
            : "bg-background"
        } ${className}`}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-12 md:h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <Film className="h-6 w-6 md:h-8 md:w-8 text-primary" />
              <span className="text-lg md:text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                StreamFlix
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors flex items-center"
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </Link>
                );
              })}
            </div>

            {/* Right side buttons */}
            <div className="flex items-center space-x-2">
              {/* Desktop: Favorites */}
              {user && (
                <Link 
                  href="/favorites" 
                  className="hidden md:flex items-center px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors relative"
                >
                  <Heart className="w-4 h-4 mr-2" />
                  Favoris
                  {favoriteCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {favoriteCount}
                    </span>
                  )}
                </Link>
              )}

              {/* Desktop: Auth buttons or User menu */}
              <div className="hidden md:flex items-center space-x-2">
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <User className="w-4 h-4 mr-2" />
                        {user.username}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">{user.username}</p>
                          <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuGroup>
                        <DropdownMenuItem asChild>
                          <Link href="/profile" className="cursor-pointer">
                            <User className="mr-2 h-4 w-4" />
                            <span>Profil</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/offline-content" className="cursor-pointer">
                            <span>Téléchargements</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/user-preferences" className="cursor-pointer">
                            <span>Préférences</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/favorites" className="cursor-pointer">
                            <Heart className="mr-2 h-4 w-4" />
                            <span>Favoris</span>
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuGroup>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout}>
                        Déconnexion
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        setAuthModalTab("login");
                        setAuthModalOpen(true);
                      }}
                    >
                      <User className="w-4 h-4 mr-2" />
                      Connexion
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setAuthModalTab("register");
                        setAuthModalOpen(true);
                      }}
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Inscription
                    </Button>
                  </>
                )}
              </div>

              {/* PWA Install Button */}
              <PWAInstallButton />

              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-background border-t border-border/50">
            <div className="container mx-auto px-4 py-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </Link>
                );
              })}
              
              {user && (
                <>
                  <Link
                    href="/favorites"
                    className="flex items-center px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Heart className="w-5 h-5 mr-3" />
                    Favoris
                    {favoriteCount > 0 && (
                      <span className="ml-2 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {favoriteCount}
                      </span>
                    )}
                  </Link>
                </>
              )}
              
              {user ? (
                <>
                  <Link
                    href="/profile"
                    className="flex items-center px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User className="w-5 h-5 mr-3" />
                    Profil
                  </Link>
                  <Link
                    href="/offline-content"
                    className="flex items-center px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span>Téléchargements</span>
                  </Link>
                  <Link
                    href="/user-preferences"
                    className="flex items-center px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <span>Préférences</span>
                  </Link>
                  <Button
                    variant="ghost"
                    className="w-full justify-start px-3 py-2 rounded-md text-base font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                  >
                    Déconnexion
                  </Button>
                </>
              ) : (
                <>
                  {/* Mobile: Single auth icon */}
                  <Button 
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setAuthModalTab("login");
                      setAuthModalOpen(true);
                      setIsMenuOpen(false);
                    }}
                    className="sm:hidden"
                    title="Connexion / Inscription"
                    data-testid="mobile-auth-button"
                  >
                    <User className="h-5 w-5" />
                  </Button>
                  
                  {/* Mobile: Separate auth buttons for larger screens */}
                  <div className="hidden sm:flex space-x-2 pt-2">
                    <Button 
                      variant="ghost" 
                      className="flex-1 justify-center"
                      onClick={() => {
                        setAuthModalTab("login");
                        setAuthModalOpen(true);
                        setIsMenuOpen(false);
                      }}
                    >
                      <User className="w-4 h-4 mr-2" />
                      Connexion
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1 justify-center"
                      onClick={() => {
                        setAuthModalTab("register");
                        setAuthModalOpen(true);
                        setIsMenuOpen(false);
                      }}
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Inscription
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultTab={authModalTab}
        onLoginSuccess={() => {
          setAuthModalOpen(false);
        }}
      />
    </>
  );
}