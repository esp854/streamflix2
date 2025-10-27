import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Helmet } from "react-helmet";
import AuthModal from "@/components/auth/auth-modal";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/contexts/auth-context";
import type { InferSelectModel } from 'drizzle-orm';
import type { userPreferences } from '@shared/schema';
import { useLocation } from "wouter";

// Define the UserPreferences type based on the schema
type UserPreferences = InferSelectModel<typeof userPreferences>;

// Form validation schema extending the base preferences schema
const preferencesFormSchema = z.object({
  language: z.string().min(1, "Veuillez sélectionner une langue"),
  autoplay: z.boolean(),
});

type PreferencesFormValues = z.infer<typeof preferencesFormSchema>;

export default function Profile() {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    username: user?.username || "",
    email: user?.email || "",
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteForm, setDeleteForm] = useState({ password: "" });
  const [deleteError, setDeleteError] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [subscriptionError, setSubscriptionError] = useState("");
  const [subscriptionData, setSubscriptionData] = useState<any | null>(null);

  const { toast } = useToast();
  const userId = user?.id; // Extract user ID for type safety

  // Query to fetch current user preferences
  const { data: preferences, isLoading } = useQuery<UserPreferences>({
    queryKey: ["/api/preferences", userId],
    queryFn: () => {
      const token = localStorage.getItem('auth_token');
      return fetch(`/api/preferences/${userId}`, {
        headers: {
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
      }).then((res) => res.json());
    },
    enabled: !!userId,
  });

  // Mutation to update preferences
  const updatePreferencesMutation = useMutation({
    mutationFn: (data: PreferencesFormValues) =>
      apiRequest("PUT", `/api/preferences/${userId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/preferences", userId] });
      toast({
        title: "Préférences sauvegardées",
        description: "Vos préférences ont été mises à jour avec succès.",
      });
    },
    onError: (error) => {
      console.error("Error updating preferences:", error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder vos préférences. Veuillez réessayer.",
        variant: "destructive",
      });
    },
  });

  const form = useForm<PreferencesFormValues>({
    resolver: zodResolver(preferencesFormSchema),
    defaultValues: {
      language: preferences?.language || "fr",
      autoplay: preferences?.autoplay ?? true,
    },
  });

  // Update form defaults when preferences are loaded
  useEffect(() => {
    if (preferences) {
      form.reset({
        language: preferences.language || "fr",
        autoplay: preferences.autoplay ?? true,
      });
    }
  }, [preferences, form]);

  const onSubmit = (data: PreferencesFormValues) => {
    updatePreferencesMutation.mutate(data);
  };

  // Redirect to login if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        {/* Ajout de la balise meta pour empêcher l'indexation */}
        <Helmet>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Connectez-vous pour accéder à votre profil</h1>
            <p className="mt-2 text-muted-foreground">
              Vous devez être connecté pour voir cette page
            </p>
          </div>
          
          <div className="mt-8">
            <AuthModal 
              isOpen={true} 
              onClose={() => {
                // Redirect to home or previous page
                window.location.href = '/';
              }} 
              defaultTab="login"
            />
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center space-x-2" data-testid="loading-preferences">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Chargement de vos préférences...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="space-y-6">
        {/* User Info Header */}
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
              <span className="text-2xl font-bold text-primary-foreground">
                {user.username.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-3xl font-bold" data-testid="page-title">
                Bonjour, {user.username} !
              </h1>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Preferences Section Header */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Settings className="h-6 w-6" />
            <h2 className="text-2xl font-bold">
              Mes Préférences
            </h2>
          </div>
          <p className="text-muted-foreground" data-testid="page-description">
            Personnalisez votre expérience de visionnage selon vos préférences.
          </p>
        </div>

        {/* Preferences Form */}
        <Card>
          <CardHeader>
            <CardTitle>Paramètres de lecture</CardTitle>
            <CardDescription>
              Configurez la langue et les options de lecture automatique.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Language Selection */}
                <FormField
                  control={form.control}
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Langue préférée</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        data-testid="select-language"
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionnez une langue" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="fr">Français</SelectItem>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Español</SelectItem>
                          <SelectItem value="de">Deutsch</SelectItem>
                          <SelectItem value="it">Italiano</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        La langue utilisée pour l'interface et les informations des films.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                {/* Autoplay Setting */}
                <FormField
                  control={form.control}
                  name="autoplay"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Lecture automatique</FormLabel>
                        <FormDescription>
                          Démarrer automatiquement la lecture des bandes-annonces et vidéos.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-autoplay"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Submit Button */}
                <div className="flex justify-end pt-4">
                  <Button
                    type="submit"
                    disabled={updatePreferencesMutation.isPending}
                    data-testid="button-save-preferences"
                    className="min-w-[120px]"
                  >
                    {updatePreferencesMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sauvegarde...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Sauvegarder
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <Card>
          <CardHeader>
            <CardTitle>À propos de vos préférences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• Vos préférences sont automatiquement sauvegardées dans votre profil.</p>
            <p>• La langue sélectionnée affecte l'affichage des titres et descriptions de films.</p>
            <p>• La lecture automatique peut être désactivée pour économiser la bande passante.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}