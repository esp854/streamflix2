import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Lock, Eye, EyeOff } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
});

const registerSchema = z.object({
  username: z.string().min(3, "Le nom d'utilisateur doit contenir au moins 3 caractères"),
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "login" | "register";
  onLoginSuccess?: (redirectUrl?: string) => void;
}

export default function AuthModal({ isOpen, onClose, defaultTab = "login", onLoginSuccess }: AuthModalProps) {
  const [currentTab, setCurrentTab] = useState<"login" | "register">(defaultTab);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, register } = useAuth();
  const { toast } = useToast();

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onLoginSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      await login(data.email, data.password);
      toast({
        title: "Connexion réussie",
        description: "Vous êtes maintenant connecté !",
      });
      onClose();
      loginForm.reset();
      
      // Handle redirect after successful login
      const urlParams = new URLSearchParams(window.location.search);
      const redirect = urlParams.get('redirect');
      
      if (onLoginSuccess) {
        onLoginSuccess(redirect || undefined);
      } else if (redirect) {
        window.location.href = redirect;
      }
    } catch (error) {
      toast({
        title: "Erreur de connexion",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onRegisterSubmit = async (data: RegisterFormValues) => {
    setIsLoading(true);
    try {
      await register(data.username, data.email, data.password, data.confirmPassword);
      toast({
        title: "Inscription réussie",
        description: "Votre compte a été créé avec succès !",
      });
      onClose();
      registerForm.reset();
    } catch (error) {
      toast({
        title: "Erreur d'inscription",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    loginForm.reset();
    registerForm.reset();
    setShowPassword(false);
    setShowConfirmPassword(false);
    setCurrentTab("login");
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md w-11/12 max-w-xs p-3 sm:p-4 rounded-lg" aria-describedby="auth-dialog-description">
        <DialogHeader className="text-center">
          <DialogTitle id="auth-dialog-title" className="text-center text-lg sm:text-xl font-bold">
            StreamFlix
          </DialogTitle>
          <DialogDescription id="auth-dialog-description" className="text-center text-xs sm:text-sm">
            {currentTab === "login" 
              ? "Connectez-vous" 
              : "Créez votre compte"}
          </DialogDescription>
        </DialogHeader>
        
        {/* Subscription notice for login - réduit la taille sur mobile */}
        {currentTab === "login" && (
          <div className="bg-blue-50 border border-blue-200 rounded p-2 text-xs text-blue-800">
            <p className="font-medium hidden sm:block">Accès au contenu premium :</p>
            <p className="hidden sm:block">Vous devez être connecté pour vous abonner à un plan et accéder au contenu premium.</p>
            <p className="sm:hidden">Connectez-vous pour accéder au contenu</p>
          </div>
        )}
        
        {/* Subscription notice for registration - réduit la taille sur mobile */}
        {currentTab === "register" && (
          <div className="bg-green-50 border border-green-200 rounded p-2 text-xs text-green-800">
            <p className="font-medium hidden sm:block">Processus d'abonnement :</p>
            <p className="hidden sm:block">1. Créez votre compte</p>
            <p className="hidden sm:block">2. Connectez-vous</p>
            <p className="hidden sm:block">3. Choisissez un plan</p>
            <p className="sm:hidden">Créez votre compte pour accéder au contenu</p>
          </div>
        )}

        <Tabs value={currentTab} onValueChange={(value: string) => setCurrentTab(value as "login" | "register")}>
          <TabsList className="grid w-full grid-cols-2 h-8 sm:h-10">
            <TabsTrigger value="login" className="text-xs sm:text-sm">Connexion</TabsTrigger>
            <TabsTrigger value="register" className="text-xs sm:text-sm">Inscription</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-2 sm:space-y-3 mt-3 sm:mt-4">
            <Form {...loginForm}>
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-2 sm:space-y-3">
                <FormField
                  control={loginForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm">Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-2 sm:left-3 top-2.5 sm:top-3 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                          <Input 
                            placeholder="votre@email.com" 
                            className="pl-7 sm:pl-10 h-8 sm:h-10 text-xs sm:text-sm" 
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm">Mot de passe</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-2 sm:left-3 top-2.5 sm:top-3 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                          <Input 
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••" 
                            className="pl-7 sm:pl-10 pr-7 sm:pr-10 h-8 sm:h-10 text-xs sm:text-sm" 
                            {...field} 
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-2 sm:px-3 py-0 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full h-8 sm:h-10 text-xs sm:text-sm" disabled={isLoading}>
                  {isLoading ? "Connexion..." : "Se connecter"}
                </Button>
              </form>
            </Form>
          </TabsContent>

          <TabsContent value="register" className="space-y-2 sm:space-y-3 mt-3 sm:mt-4">
            <Form {...registerForm}>
              <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-2 sm:space-y-3">
                <FormField
                  control={registerForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm">Nom d'utilisateur</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-2 sm:left-3 top-2.5 sm:top-3 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                          <Input 
                            placeholder="Votre nom d'utilisateur" 
                            className="pl-7 sm:pl-10 h-8 sm:h-10 text-xs sm:text-sm" 
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm">Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-2 sm:left-3 top-2.5 sm:top-3 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                          <Input 
                            placeholder="votre@email.com" 
                            className="pl-7 sm:pl-10 h-8 sm:h-10 text-xs sm:text-sm" 
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm">Mot de passe</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-2 sm:left-3 top-2.5 sm:top-3 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                          <Input 
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••" 
                            className="pl-7 sm:pl-10 pr-7 sm:pr-10 h-8 sm:h-10 text-xs sm:text-sm" 
                            {...field} 
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-2 sm:px-3 py-0 hover:bg-transparent"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs sm:text-sm">Confirmer le mot de passe</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-2 sm:left-3 top-2.5 sm:top-3 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                          <Input 
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="••••••••" 
                            className="pl-7 sm:pl-10 pr-7 sm:pr-10 h-8 sm:h-10 text-xs sm:text-sm" 
                            {...field} 
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-2 sm:px-3 py-0 hover:bg-transparent"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs" />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full h-8 sm:h-10 text-xs sm:text-sm" disabled={isLoading}>
                  {isLoading ? "Inscription..." : "S'inscrire"}
                </Button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>

        <div className="text-center text-xs text-muted-foreground mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-muted">
          {currentTab === "login" ? (
            <>
              Pas de compte ?{" "}
              <Button
                variant="link"
                className="p-0 h-auto font-normal text-xs"
                onClick={() => setCurrentTab("register")}
              >
                S'inscrire
              </Button>
            </>
          ) : (
            <>
              Déjà inscrit ?{" "}
              <Button
                variant="link"
                className="p-0 h-auto font-normal text-xs"
                onClick={() => setCurrentTab("login")}
              >
                Se connecter
              </Button>
            </>
          )}
        </div>
        
        {/* Subscription notice - réduit la taille sur mobile */}
        <div className="text-center text-xs text-muted-foreground mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-muted hidden sm:block">
          <p>
            ℹ️ Après la création de votre compte, vous pourrez vous abonner à un plan pour accéder au contenu premium.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}