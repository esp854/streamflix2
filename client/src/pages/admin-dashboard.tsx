import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  Users,
  Film,
  BarChart3,
  Settings,
  Shield,
  MessageSquare,
  CreditCard,
  Search,
  Plus,
  Edit,
  Trash2,
  Menu as MenuIcon,
  X,
  Loader2,
  Link,
  Tv,
  ExternalLink,
  TrendingUp,
  Download,
  User,
  UserX,
  Package,
  Award,
  Crown,
  Gem,
  Database,
  Key,
  AlertTriangle,
  Activity,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import type { User as UserType, Content, Subscription } from "@shared/schema";
import { AddVideoLinkDialog } from "@/components/admin/add-video-link-dialog";
import CommentsModeration from "@/components/admin/CommentsModeration";
import DashboardOverview from "@/components/admin/DashboardOverview";
import AnalyticsTab from "@/components/admin/AnalyticsTab";
import { useAdminDashboard } from "@/hooks/useAdminDashboard";
import { tmdbService } from "@/lib/tmdb";

// Add this interface for episodes
interface Episode {
  id: string;
  contentId: string;
  seasonNumber: number;
  episodeNumber: number;
  title: string;
  description?: string;
  odyseeUrl?: string;
  releaseDate?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// Add these interfaces for content and activity events
interface ContentEvent {
  id: string;
  timestamp: Date | string;
  eventType: string;
  description: string;
  severity: string;
}

interface ActivityEvent {
  id: string;
  timestamp: Date | string;
  eventType: string;
  userId?: string;
  ipAddress: string;
  userAgent?: string;
  details?: string;
  severity: string;
}

interface SecurityEvent {
  timestamp: Date | string; // Allow both Date and string types
  eventType: string;
  userId?: string;
  ipAddress: string;
  userAgent?: string;
  details?: string;
  severity: string;
  description: string;
}

// Types for our admin dashboard
interface AnalyticsData {
  totalUsers: number;
  activeUsers: number;
  newUsersThisWeek: number;
  totalMovies: number;
  totalSeries: number;
  dailyViews: number;
  weeklyViews: number;
  activeSubscriptionsCount: number;
  activeSessions: number;
  revenue: {
    monthly: number;
    growth: number;
    totalPayments: number;
  };
  subscriptions: {
    basic: number;
    standard: number;
    premium: number;
  };
  recentActivity: {
    newMoviesAdded: number;
    newUsersToday: number;
  };
}

interface SecurityEvent {
  timestamp: Date | string; // Allow both Date and string types
  eventType: string;
  userId?: string;
  ipAddress: string;
  userAgent?: string;
  details?: string;
  severity: string;
}

function AdminDashboard() {
  const { user } = useAuth();

  // Use custom hook for data management
  const {
    users,
    existingContent,
    analytics,
    securityLogs,
    activityLogs,
    subscriptions,
    usersLoading,
    contentLoading,
    analyticsLoading,
    securityLogsLoading,
    activityLoading,
    subscriptionsLoading,
    totalUsersCount,
    totalMoviesCount,
    totalSeriesCount,
    activeSubscriptionsCount,
    monthlyRevenue,
    revenueGrowth,
    activeUsersCount,
    dailyViewsCount,
    weeklyViewsCount,
    subsBasic,
    subsStandard,
    subsPremium,
    userGrowthData,
    revenueData,
    subscriptionData,
    contentTypeData,
    queryClient,
    toast,
  } = useAdminDashboard();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");

  // State for various modals and forms
  const [showAddContentDialog, setShowAddContentDialog] = useState(false);
  const [showAddVideoLinkDialog, setShowAddVideoLinkDialog] = useState(false);
  const [showEditContentDialog, setShowEditContentDialog] = useState(false);
  const [selectedContentForVideo, setSelectedContentForVideo] = useState<Content | null>(null);
  const [selectedContentForEdit, setSelectedContentForEdit] = useState<Content | null>(null);
  const [videoLinkUrl, setVideoLinkUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  // State for episode management
  const [showAddEpisodeDialog, setShowAddEpisodeDialog] = useState(false);
  const [showEditEpisodeDialog, setShowEditEpisodeDialog] = useState(false);
  const [selectedContentForEpisodes, setSelectedContentForEpisodes] = useState<Content | null>(null);
  const [selectedEpisodeForEdit, setSelectedEpisodeForEdit] = useState<any>(null);
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [tmdbSeasons, setTmdbSeasons] = useState<any[] | null>(null);
  const [loadingTmdbSeasons, setLoadingTmdbSeasons] = useState(false);

  // Content management state
  const [tmdbSearchQuery, setTmdbSearchQuery] = useState("");
  const [selectedMovie, setSelectedMovie] = useState<any>(null);
  const [odyseeUrl, setOdyseeUrl] = useState("");
  const [contentLanguage, setContentLanguage] = useState("vf");
  const [contentQuality, setContentQuality] = useState("hd");

  // Add state for user management dialog
  const [showEditUserDialog, setShowEditUserDialog] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<UserType | null>(null);

  // State for search functionality
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{movies: any[], tvShows: any[]}>({movies: [], tvShows: []});
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Add this helper function to get CSRF token
  const getCSRFToken = async (token: string | null): Promise<string | null> => {
    try {
      const response = await fetch("/api/csrf-token", {
        credentials: "include",
        headers: {
          ...(token ? { "Authorization": "Bearer " + token } : {}),
        },
      });
      if (!response.ok) {
        console.error("Failed to fetch CSRF token:", response.status, response.statusText);
        return null;
      }
      const data = await response.json();
      return data.csrfToken || null;
    } catch (error) {
      console.error("Error fetching CSRF token:", error);
      return null;
    }
  };

  // Fetch TMDB seasons for a TV series
  const fetchTmdbSeasons = async (tmdbId: number | undefined) => {
    if (!tmdbId) return;
    setLoadingTmdbSeasons(true);
    try {
      const details = await tmdbService.getTVShowDetails(tmdbId);
      setTmdbSeasons(details?.seasons || []);
    } catch (error) {
      console.error("Error fetching TMDB seasons:", error);
      setTmdbSeasons(null);
    } finally {
      setLoadingTmdbSeasons(false);
    }
  };

  // Fetch episodes for a TV series
  const fetchEpisodes = async (contentId: string) => {
    if (!contentId) return;
    
    setLoadingEpisodes(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/admin/episodes/${contentId}`, {
        credentials: "include",
        headers: {
          ...(token ? { "Authorization": "Bearer " + token } : {}),
        },
      });
      
      if (!response.ok) throw new Error("Failed to fetch episodes");
      
      const data = await response.json();
      setEpisodes(data.episodes || []);
    } catch (error) {
      console.error("Error fetching episodes:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les épisodes : " + (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setLoadingEpisodes(false);
    }
  };

  // Bulk generate episodes for a specific season based on TMDB season episode_count
  const bulkCreateEpisodesForSeason = async (seasonNumber: number, episodeCount: number) => {
    if (!selectedContentForEpisodes?.id) return;
    if (!episodeCount || episodeCount <= 0) return;

    if (!window.confirm(`Créer ${episodeCount} épisodes pour la saison ${seasonNumber} ?`)) {
      return;
    }

    try {
      for (let i = 1; i <= episodeCount; i++) {
        await createEpisodeMutation.mutateAsync({
          contentId: selectedContentForEpisodes.id,
          seasonNumber,
          episodeNumber: i,
          title: `Épisode ${i}`,
          active: true,
        } as any);
      }
      toast({
        title: "Épisodes créés",
        description: `Créé ${episodeCount} épisodes pour la saison ${seasonNumber}.`,
      });
      // Refresh list
      fetchEpisodes(selectedContentForEpisodes.id);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error?.message || "Échec de la création des épisodes",
        variant: "destructive",
      });
    }
  };

  // Handle viewing episodes for a TV series
  const handleViewEpisodes = (content: Content) => {
    if (content.mediaType !== 'tv') {
      toast({
        title: "Erreur",
        description: "Cette fonctionnalité est uniquement disponible pour les séries TV.",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedContentForEpisodes(content);
    fetchTmdbSeasons(content.tmdbId);
    fetchEpisodes(content.id);
    setShowAddEpisodeDialog(true);
  };

  // Mutation for creating episodes
  const createEpisodeMutation = useMutation({
    mutationFn: async (data: Partial<Episode>) => {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error("Vous devez être connecté pour effectuer cette action");
      
      const csrfToken = await getCSRFToken(token);
      if (!csrfToken) throw new Error("Impossible d'obtenir le jeton de sécurité");
      
      const response = await fetch("/api/admin/episodes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token,
          "X-CSRF-Token": csrfToken,
        },
        credentials: "include",
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erreur ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Refresh episodes list for the selected series
      if (selectedContentForEpisodes?.id) {
        fetchEpisodes(selectedContentForEpisodes.id);
      }
      setShowEditEpisodeDialog(false);
      setSelectedEpisodeForEdit(null);
      toast({
        title: "Épisode ajouté",
        description: "L'épisode a été ajouté avec succès.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'ajouter l'épisode.",
        variant: "destructive",
      });
    },
  });

  // Mutation for updating episodes
  const updateEpisodeMutation = useMutation({
    mutationFn: async (data: { episodeId: string; updates: Partial<Episode> }) => {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error("Vous devez être connecté pour effectuer cette action");
      
      const csrfToken = await getCSRFToken(token);
      if (!csrfToken) throw new Error("Impossible d'obtenir le jeton de sécurité");
      
      const response = await fetch(`/api/admin/episodes/${data.episodeId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token,
          "X-CSRF-Token": csrfToken,
        },
        credentials: "include",
        body: JSON.stringify(data.updates),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erreur ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Refresh episodes list
      if (selectedContentForEpisodes?.id) {
        fetchEpisodes(selectedContentForEpisodes.id);
      }
      setShowEditEpisodeDialog(false);
      setSelectedEpisodeForEdit(null);
      toast({
        title: "Épisode mis à jour",
        description: "L'épisode a été mis à jour avec succès.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour l'épisode.",
        variant: "destructive",
      });
    },
  });

  // Handle adding video link to content
  const handleAddVideoLink = (content: Content) => {
    setSelectedContentForVideo(content);
    setShowAddVideoLinkDialog(true);
  };

  // Submit video link form
  const handleSubmitVideoLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContentForVideo) {
      toast({
        title: "Erreur",
        description: "Aucun contenu sélectionné.",
        variant: "destructive",
      });
      return;
    }
    
    // Decode any HTML entities in the URL before sending to the server
    let cleanVideoUrl = videoLinkUrl;
    const textArea = document.createElement('textarea');
    textArea.innerHTML = videoLinkUrl;
    cleanVideoUrl = textArea.value;
    
    addVideoLinkMutation.mutate({
      tmdbId: selectedContentForVideo.tmdbId,
      videoUrl: cleanVideoUrl
    });
  };

  // Handle editing content
  const handleEditContent = (content: Content) => {
    setSelectedContentForEdit(content);
    setShowEditContentDialog(true);
  };

  // Handle updating content
  const handleUpdateContent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContentForEdit) {
      toast({
        title: "Erreur",
        description: "Aucun contenu sélectionné.",
        variant: "destructive",
      });
      return;
    }
    
    // Get form data
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    // Extract values from form
    const title = (form.querySelector('#title') as HTMLInputElement)?.value;
    const language = (form.querySelector('#language') as HTMLSelectElement)?.value;
    const quality = (form.querySelector('#quality') as HTMLSelectElement)?.value;
    const mediaType = (form.querySelector('#media-type') as HTMLSelectElement)?.value;
    const description = (form.querySelector('#description') as HTMLTextAreaElement)?.value;
    const genres = (form.querySelector('#genres') as HTMLInputElement)?.value;
    const releaseDate = (form.querySelector('#release-date') as HTMLInputElement)?.value;
    const posterPath = (form.querySelector('#poster-path') as HTMLInputElement)?.value;
    const backdropPath = (form.querySelector('#backdrop-path') as HTMLInputElement)?.value;
    const odyseeUrl = (form.querySelector('#odysee-url') as HTMLInputElement)?.value;
    const active = (form.querySelector('#active') as HTMLInputElement)?.checked;
    
    // Decode any HTML entities in the URL before sending to the server
    let cleanOdyseeUrl = odyseeUrl;
    if (odyseeUrl) {
      const textArea = document.createElement('textarea');
      textArea.innerHTML = odyseeUrl;
      cleanOdyseeUrl = textArea.value;
    }
    
    // Prepare updates object
    const updates: Partial<Content> = {
      title: title || undefined,
      language: language || undefined,
      quality: quality || undefined,
      mediaType: mediaType || undefined,
      description: description || undefined,
      releaseDate: releaseDate || undefined,
      posterPath: posterPath || undefined,
      backdropPath: backdropPath || undefined,
      odyseeUrl: cleanOdyseeUrl || undefined,
      active: active !== undefined ? active : undefined,
    };
    
    // Handle genres
    if (genres) {
      updates.genres = genres.split(',').map(g => g.trim()).filter(g => g.length > 0);
    }
    
    editContentMutation.mutate({
      contentId: selectedContentForEdit.id,
      updates
    });
  };

  // Handle searching for content
  const handleSearchContent = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez entrer un terme de recherche.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSearching(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error("Vous devez être connecté pour effectuer cette action");
      
      const csrfToken = await getCSRFToken(token);
      if (!csrfToken) throw new Error("Impossible d'obtenir le jeton de sécurité");
      
      const response = await fetch("/api/admin/search-content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token,
          "X-CSRF-Token": csrfToken,
        },
        credentials: "include",
        body: JSON.stringify({ query: searchQuery }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erreur ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      setSearchResults({
        movies: result.movies || [],
        tvShows: result.tvShows || []
      });
      setShowSearchResults(true);
      
      toast({
        title: "Recherche terminée",
        description: `Trouvé ${result.movies?.length || 0} films et ${result.tvShows?.length || 0} séries.`,
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de rechercher le contenu.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  // Handle importing specific content
  const handleImportSpecificContent = async (tmdbId: number, mediaType: string, title: string) => {
    if (!window.confirm(`Êtes-vous sûr de vouloir importer "${title}" ?`)) {
      return;
    }
    
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error("Vous devez être connecté pour effectuer cette action");
      
      const csrfToken = await getCSRFToken(token);
      if (!csrfToken) throw new Error("Impossible d'obtenir le jeton de sécurité");
      
      const response = await fetch("/api/admin/import-content-by-id", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token,
          "X-CSRF-Token": csrfToken,
        },
        credentials: "include",
        body: JSON.stringify({ tmdbId, mediaType }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erreur ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      toast({
        title: "Import réussi",
        description: result.message,
      });
      
      // Refresh content list
      queryClient.invalidateQueries({ queryKey: ["/api/admin/content"] });
      setShowSearchResults(false);
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'importer le contenu.",
        variant: "destructive",
      });
    }
  };

  // Handle importing content from TMDB
  const handleImportContent = async () => {
    setIsImporting(true);
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error("Vous devez être connecté pour effectuer cette action");
      
      const csrfToken = await getCSRFToken(token);
      if (!csrfToken) throw new Error("Impossible d'obtenir le jeton de sécurité");
      
      const response = await fetch("/api/admin/import-content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token,
          "X-CSRF-Token": csrfToken,
        },
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erreur ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      toast({
        title: "Import réussi",
        description: `Contenu importé avec succès: ${result.moviesAdded} films et ${result.tvShowsAdded} séries ajoutés.`,
      });
      
      // Refresh content list
      queryClient.invalidateQueries({ queryKey: ["/api/admin/content"] });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'importer le contenu.",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Mutation for creating new content
  const createContentMutation = useMutation({
    mutationFn: async (data: Partial<Content>) => {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error("Vous devez être connecté pour effectuer cette action");
      
      const csrfToken = await getCSRFToken(token);
      if (!csrfToken) throw new Error("Impossible d'obtenir le jeton de sécurité");
      
      const response = await fetch("/api/admin/content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token,
          "X-CSRF-Token": csrfToken,
        },
        credentials: "include",
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erreur ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contents/tmdb"] });
      setShowAddContentDialog(false);
      toast({
        title: "Contenu ajouté",
        description: "Le contenu a été ajouté avec succès.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'ajouter le contenu.",
        variant: "destructive",
      });
    },
  });

  // Mutation for editing content
  const editContentMutation = useMutation({
    mutationFn: async (data: { contentId: string; updates: Partial<Content> }) => {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error("Vous devez être connecté pour effectuer cette action");
      
      const csrfToken = await getCSRFToken(token);
      if (!csrfToken) throw new Error("Impossible d'obtenir le jeton de sécurité");
      
      const response = await fetch(`/api/admin/content/${data.contentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token,
          "X-CSRF-Token": csrfToken,
        },
        credentials: "include",
        body: JSON.stringify(data.updates),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erreur ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/content"] });
      setShowEditContentDialog(false);
      setSelectedContentForEdit(null);
      toast({
        title: "Contenu mis à jour",
        description: "Le contenu a été mis à jour avec succès.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour le contenu.",
        variant: "destructive",
      });
    },
  });

  // Mutation for adding video link to content
  const addVideoLinkMutation = useMutation({
    mutationFn: async (data: { tmdbId: number; videoUrl: string }) => {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error("Vous devez être connecté pour effectuer cette action");
      
      const csrfToken = await getCSRFToken(token);
      if (!csrfToken) throw new Error("Impossible d'obtenir le jeton de sécurité");
      
      const response = await fetch("/api/contents/add-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token,
          "X-CSRF-Token": csrfToken,
        },
        credentials: "include",
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erreur ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contents/tmdb"] });
      setShowAddVideoLinkDialog(false);
      setVideoLinkUrl("");
      setSelectedContentForVideo(null);
      toast({
        title: "Lien vidéo ajouté",
        description: "Le lien vidéo a été ajouté avec succès au contenu.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'ajouter le lien vidéo.",
        variant: "destructive",
      });
    },
  });

  // Mutation for deleting content
  const deleteContentMutation = useMutation({
    mutationFn: async (contentId: string) => {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error("Vous devez être connecté pour effectuer cette action");
      
      const csrfToken = await getCSRFToken(token);
      if (!csrfToken) throw new Error("Impossible d'obtenir le jeton de sécurité");
      
      const response = await fetch(`/api/admin/content/${contentId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token,
          "X-CSRF-Token": csrfToken,
        },
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erreur ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate all content-related queries
      queryClient.invalidateQueries({ queryKey: ["/api/admin/content"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tmdb/popular"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tmdb/genre"] });
      queryClient.invalidateQueries({ queryKey: ["/api/content"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tmdb/featured-content"] });
      queryClient.invalidateQueries({ queryKey: ["/api/tmdb/content-with-links"] });
      
      // Clear TMDB service cache
      tmdbService.clearContentCache();
      
      // Clear service worker cache for API responses
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ command: 'CLEAR_API_CACHE' });
      }
      
      toast({
        title: "Contenu supprimé",
        description: "Le contenu a été supprimé avec succès.",
      });
    },
    onError: (error: any) => {
      console.error("Error deleting content:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer le contenu.",
        variant: "destructive",
      });
    },
  });

  // Sidebar menu items
  const menuItems = [
    { id: "dashboard", label: "Tableau de Bord", icon: BarChart3 },
    { id: "content", label: "Gestion Contenus", icon: Film },
    { id: "series", label: "Séries", icon: Tv },
    { id: "users", label: "Utilisateurs", icon: Users },
    { id: "subscriptions", label: "Abonnements", icon: CreditCard },
    { id: "comments", label: "Commentaires", icon: MessageSquare },
    { id: "analytics", label: "Statistiques", icon: TrendingUp },
    { id: "security", label: "Sécurité", icon: Shield },
    { id: "settings", label: "Paramètres", icon: Settings },
  ];

  // Function to handle editing a user
  const handleEditUser = (user: UserType) => {
    setSelectedUserForEdit(user);
    setShowEditUserDialog(true);
  };

  // Function to handle suspending a user
  const handleSuspendUser = (userId: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir suspendre cet utilisateur ?")) {
      suspendUserMutation.mutate(userId);
    }
  };

  // Function to handle deleting a user
  const handleDeleteUser = (userId: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.")) {
      deleteUserMutation.mutate(userId);
    }
  };

  // Function to handle banning a user
  const handleBanUser = (userId: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir bannir cet utilisateur ? Cette action est irréversible.")) {
      banUserMutation.mutate(userId);
    }
  };

  // Function to handle updating a user
  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForEdit) {
      toast({
        title: "Erreur",
        description: "Aucun utilisateur sélectionné.",
        variant: "destructive",
      });
      return;
    }
    
    const form = e.target as HTMLFormElement;
    const username = (form.querySelector('#edit-username') as HTMLInputElement)?.value;
    const email = (form.querySelector('#edit-email') as HTMLInputElement)?.value;
    const role = (form.querySelector('#edit-role') as HTMLSelectElement)?.value;
    
    editUserMutation.mutate({
      userId: selectedUserForEdit.id,
      updates: {
        username: username || undefined,
        email: email || undefined,
        role: role || undefined,
      }
    });
    
    setShowEditUserDialog(false);
    setSelectedUserForEdit(null);
  };

  // Mutation for suspending a user
  const suspendUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error("Vous devez être connecté pour effectuer cette action");
      
      const csrfToken = await getCSRFToken(token);
      if (!csrfToken) throw new Error("Impossible d'obtenir le jeton de sécurité");
      
      const response = await fetch(`/api/admin/users/${userId}/suspend`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token,
          "X-CSRF-Token": csrfToken,
        },
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erreur ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Utilisateur suspendu",
        description: "L'utilisateur a été suspendu avec succès.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de suspendre l'utilisateur.",
        variant: "destructive",
      });
    },
  });

  // Mutation for deleting a user
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error("Vous devez être connecté pour effectuer cette action");
      
      const csrfToken = await getCSRFToken(token);
      if (!csrfToken) throw new Error("Impossible d'obtenir le jeton de sécurité");
      
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token,
          "X-CSRF-Token": csrfToken,
        },
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erreur ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Utilisateur supprimé",
        description: "L'utilisateur a été supprimé avec succès.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer l'utilisateur.",
        variant: "destructive",
      });
    },
  });

  // Mutation for banning a user
  const banUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error("Vous devez être connecté pour effectuer cette action");
      
      const csrfToken = await getCSRFToken(token);
      if (!csrfToken) throw new Error("Impossible d'obtenir le jeton de sécurité");
      
      const response = await fetch(`/api/admin/users/${userId}/ban`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token,
          "X-CSRF-Token": csrfToken,
        },
        credentials: "include",
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erreur ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Utilisateur banni",
        description: "L'utilisateur a été banni avec succès.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de bannir l'utilisateur.",
        variant: "destructive",
      });
    },
  });

  // Mutation for editing a user
  const editUserMutation = useMutation({
    mutationFn: async (data: { userId: string; updates: Partial<UserType> }) => {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error("Vous devez être connecté pour effectuer cette action");
      
      const csrfToken = await getCSRFToken(token);
      if (!csrfToken) throw new Error("Impossible d'obtenir le jeton de sécurité");
      
      const response = await fetch(`/api/admin/users/${data.userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token,
          "X-CSRF-Token": csrfToken,
        },
        credentials: "include",
        body: JSON.stringify(data.updates),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erreur ${response.status}: ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Utilisateur mis à jour",
        description: "L'utilisateur a été mis à jour avec succès.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de mettre à jour l'utilisateur.",
        variant: "destructive",
      });
    },
  });

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="w-12 h-12 text-destructive mx-auto mb-4" />
            <CardTitle>Accès refusé</CardTitle>
            <CardDescription>
              Vous n'avez pas les permissions nécessaires pour accéder à cette page.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="admin-theme flex min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 text-foreground">
      {/* Sidebar */}
      <div className={`bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm transition-all duration-300 shadow-lg ${sidebarOpen ? 'w-64' : 'w-16'} ${sidebarOpen ? 'hidden md:block' : ''}`}>
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Admin</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </Button>
        </div>
        
        <nav className="p-2 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <Button
                key={item.id}
                variant="ghost"
                className={`w-full justify-start mb-1 transition-all duration-200 hover:scale-105 ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                } ${sidebarOpen ? '' : 'justify-center px-2'}`}
                onClick={() => setActiveTab(item.id)}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-white' : ''}`} />
                {sidebarOpen && <span className="ml-3 font-medium">{item.label}</span>}
              </Button>
            );
          })}
        </nav>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-h-0">
        <header className="border-b border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
          <div className="flex items-center justify-between px-4 sm:px-6 py-4">
            <div className="flex items-center gap-3">
              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <MenuIcon className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Tableau de Bord Administrateur
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Gérez votre plateforme StreamKJI
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-2 sm:gap-3 bg-white/80 dark:bg-slate-700/80 px-3 sm:px-4 py-2 rounded-full border border-slate-200 dark:border-slate-600">
                <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-xs sm:text-sm">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div className="hidden sm:block">
                  <span className="font-medium text-slate-900 dark:text-slate-100">{user.username}</span>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Administrateur</p>
                </div>
              </div>
              <Button asChild variant="outline" size="sm" className="border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors hidden sm:flex">
                <a href="/">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Retour au site
                </a>
              </Button>
              <Button asChild variant="outline" size="icon" className="sm:hidden">
                <a href="/">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        </header>
        
        {/* Mobile Navigation Sheet */}
        <Sheet open={sidebarOpen && window.innerWidth < 768} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="w-64 p-0">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Admin</span>
              </div>
            </div>
            <nav className="p-2 space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <Button
                    key={item.id}
                    variant="ghost"
                    className={`w-full justify-start mb-1 transition-all duration-200 hover:scale-105 ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                    onClick={() => {
                      setActiveTab(item.id);
                      setSidebarOpen(false); // Close sheet after selection
                    }}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? 'text-white' : ''}`} />
                    <span className="ml-3 font-medium">{item.label}</span>
                  </Button>
                );
              })}
            </nav>
          </SheetContent>
        </Sheet>

        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 min-h-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {/* Dashboard Tab */}
            <TabsContent value="dashboard" className="space-y-6">
              <DashboardOverview
                totalUsersCount={totalUsersCount}
                totalMoviesCount={totalMoviesCount}
                totalSeriesCount={totalSeriesCount}
                activeSubscriptionsCount={activeSubscriptionsCount}
                monthlyRevenue={monthlyRevenue}
                revenueGrowth={revenueGrowth}
                activeUsersCount={activeUsersCount}
                dailyViewsCount={dailyViewsCount}
                subsBasic={subsBasic}
                subsStandard={subsStandard}
                subsPremium={subsPremium}
                userGrowthData={userGrowthData}
                revenueData={revenueData}
                subscriptionData={subscriptionData}
                contentTypeData={contentTypeData}
                analytics={analytics}
                securityLogs={securityLogs}
                usersLoading={usersLoading}
                contentLoading={contentLoading}
                subscriptionsLoading={subscriptionsLoading}
                analyticsLoading={analyticsLoading}
                securityLogsLoading={securityLogsLoading}
              />
            </TabsContent>

            {/* Content Management Tab */}
            <TabsContent value="content" className="space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-xl sm:text-2xl font-bold">Gestion des Contenus</h2>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <Button onClick={() => setShowAddContentDialog(true)} className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    <span className="hidden xs:inline">Ajouter Contenu</span>
                    <span className="xs:hidden">Ajouter</span>
                  </Button>
                  <Button onClick={handleImportContent} disabled={isImporting} className="w-full sm:w-auto">
                    {isImporting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        <span className="hidden sm:inline">Import en cours...</span>
                        <span className="sm:hidden">Import...</span>
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Importer depuis TMDB</span>
                        <span className="sm:hidden">Importer</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Search bar */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher un film ou une série..."
                    className="pl-8 text-sm sm:text-base"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearchContent()}
                  />
                </div>
                <Button onClick={handleSearchContent} disabled={isSearching} size="sm" className="px-3 sm:px-4">
                  {isSearching ? (
                    <div className="loader-wrapper">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline ml-2">Rechercher</span>
                </Button>
              </div>

              {/* Search results */}
              {showSearchResults && (
                <Card>
                  <CardHeader>
                    <CardTitle>Résultats de la recherche</CardTitle>
                    <CardDescription>
                      {searchResults.movies.length + searchResults.tvShows.length} résultats trouvés
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Movies */}
                      {searchResults.movies.map((movie: any) => (
                        <div key={`movie-${movie.id}`} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-4">
                            {movie.poster_path ? (
                              <img 
                                src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`} 
                                alt={movie.title}
                                className="w-12 h-16 object-cover rounded"
                              />
                            ) : (
                              <div className="w-12 h-16 bg-muted rounded flex items-center justify-center">
                                <Film className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <h3 className="font-medium">{movie.title}</h3>
                              <p className="text-sm text-muted-foreground">
                                {movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'} • Film
                              </p>
                            </div>
                          </div>
                          <Button onClick={() => handleImportSpecificContent(movie.id, 'movie', movie.title)}>
                            Importer
                          </Button>
                        </div>
                      ))}

                      {/* TV Shows */}
                      {searchResults.tvShows.map((show: any) => (
                        <div key={`tv-${show.id}`} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-4">
                            {show.poster_path ? (
                              <img 
                                src={`https://image.tmdb.org/t/p/w92${show.poster_path}`} 
                                alt={show.name}
                                className="w-12 h-16 object-cover rounded"
                              />
                            ) : (
                              <div className="w-12 h-16 bg-muted rounded flex items-center justify-center">
                                <Tv className="h-6 w-6 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <h3 className="font-medium">{show.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {show.first_air_date ? new Date(show.first_air_date).getFullYear() : 'N/A'} • Série TV
                              </p>
                            </div>
                          </div>
                          <Button onClick={() => handleImportSpecificContent(show.id, 'tv', show.name)}>
                            Importer
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Content list */}
              <Card>
                <CardHeader>
                  <CardTitle>Liste des Contenus</CardTitle>
                  <CardDescription>
                    {existingContent ? `${existingContent.length} contenus` : 'Chargement...'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {contentLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  ) : existingContent && existingContent.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      {existingContent.map((content: Content) => (
                        <Card key={content.id} className="overflow-hidden">
                          <div className="relative">
                            {content.posterPath ? (
                              <img
                                src={`https://image.tmdb.org/t/p/w500${content.posterPath}`}
                                alt={content.title}
                                className="w-full h-32 sm:h-48 object-cover"
                              />
                            ) : (
                              <div className="w-full h-32 sm:h-48 bg-muted flex items-center justify-center">
                                {content.mediaType === 'movie' ? (
                                  <Film className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground" />
                                ) : (
                                  <Tv className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground" />
                                )}
                              </div>
                            )}
                            <Badge
                              className="absolute top-1 right-1 sm:top-2 sm:right-2 text-xs"
                              variant={content.active ? "default" : "secondary"}
                            >
                              {content.active ? "Actif" : "Inactif"}
                            </Badge>
                          </div>
                          <CardContent className="p-3 sm:p-4">
                            <h3 className="font-semibold line-clamp-1 text-sm sm:text-base">{content.title}</h3>
                            <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">{content.mediaType === 'movie' ? 'Film' : 'Série'}</Badge>
                              <Badge variant="outline" className="text-xs">{content.language}</Badge>
                              <Badge variant="outline" className="text-xs">{content.quality}</Badge>
                            </div>
                            <p className="text-xs sm:text-sm text-muted-foreground mt-2 line-clamp-2">
                              {content.description || "Aucune description"}
                            </p>
                            <div className="flex justify-between items-center mt-3 sm:mt-4">
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleAddVideoLink(content)}
                                  className="h-7 w-7 p-0 sm:h-8 sm:w-8 sm:p-1"
                                >
                                  <Link className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditContent(content)}
                                  className="h-7 w-7 p-0 sm:h-8 sm:w-8 sm:p-1"
                                >
                                  <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                                </Button>
                                {content.mediaType === 'tv' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleViewEpisodes(content)}
                                    className="h-7 w-7 p-0 sm:h-8 sm:w-8 sm:p-1"
                                  >
                                    <Tv className="h-3 w-3 sm:h-4 sm:w-4" />
                                  </Button>
                                )}
                              </div>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => deleteContentMutation.mutate(content.id)}
                                className="h-7 w-7 p-0 sm:h-8 sm:w-8 sm:p-1"
                              >
                                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Film className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-1">Aucun contenu trouvé</h3>
                      <p className="text-muted-foreground">
                        Commencez par importer du contenu depuis TMDB
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Series Tab */}
            <TabsContent value="series" className="space-y-4 sm:space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Gestion des Séries</h2>
                <Card>
                  <CardHeader>
                    <CardTitle>Liste des Séries TV</CardTitle>
                    <CardDescription>
                      {existingContent ? `${existingContent.filter((c: Content) => c.mediaType === 'tv').length} séries` : 'Chargement...'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {contentLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin" />
                      </div>
                    ) : existingContent && existingContent.filter((c: Content) => c.mediaType === 'tv').length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                        {existingContent.filter((c: Content) => c.mediaType === 'tv').map((series: Content) => (
                          <Card key={series.id} className="overflow-hidden">
                            <div className="relative">
                              {series.posterPath ? (
                                <img
                                  src={`https://image.tmdb.org/t/p/w500${series.posterPath}`}
                                  alt={series.title}
                                  className="w-full h-32 sm:h-48 object-cover"
                                />
                              ) : (
                                <div className="w-full h-32 sm:h-48 bg-muted flex items-center justify-center">
                                  <Tv className="h-8 w-8 sm:h-12 sm:w-12 text-muted-foreground" />
                                </div>
                              )}
                              <Badge className="absolute top-1 right-1 sm:top-2 sm:right-2 text-xs" variant={series.active ? 'default' : 'secondary'}>
                                {series.active ? 'Actif' : 'Inactif'}
                              </Badge>
                            </div>
                            <CardContent className="p-3 sm:p-4">
                              <h3 className="font-semibold line-clamp-1 text-sm sm:text-base">{series.title}</h3>
                              <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-2">
                                <Badge variant="outline" className="text-xs">Série</Badge>
                                <Badge variant="outline" className="text-xs">{series.language}</Badge>
                                <Badge variant="outline" className="text-xs">{series.quality}</Badge>
                              </div>
                              <p className="text-xs sm:text-sm text-muted-foreground mt-2 line-clamp-2">
                                {series.description || 'Aucune description'}
                              </p>
                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-3 sm:mt-4 gap-2 sm:gap-0">
                                <Button size="sm" variant="outline" onClick={() => handleViewEpisodes(series)} className="w-full sm:w-auto text-xs sm:text-sm">
                                  <Tv className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                  Gérer saisons & épisodes
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => handleEditContent(series)} className="w-full sm:w-auto text-xs sm:text-sm">
                                  <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                                  Modifier la fiche
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Tv className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-1">Aucune série trouvée</h3>
                        <p className="text-muted-foreground">Importez des séries depuis TMDB ou ajoutez-en manuellement</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users" className="space-y-4 sm:space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Gestion des Utilisateurs</h2>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Liste des Utilisateurs</CardTitle>
                    <CardDescription>
                      {users ? `${users.length} utilisateurs` : 'Chargement...'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {usersLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin" />
                      </div>
                    ) : users && users.length > 0 ? (
                      <div className="space-y-4">
                        {users.map((user: UserType) => (
                          <div key={user.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg gap-3 sm:gap-4">
                            <div className="flex items-center gap-3 sm:gap-4">
                              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground flex-shrink-0">
                                <User className="h-4 w-4 sm:h-5 sm:w-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-sm sm:text-base line-clamp-1">{user.username}</h3>
                                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">{user.email}</p>
                              </div>
                              <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className="text-xs">
                                {user.role === 'admin' ? 'Admin' : 'User'}
                              </Badge>
                            </div>
                            <div className="flex gap-2 justify-end">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditUser(user)}
                                className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:p-2"
                              >
                                <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span className="sr-only sm:not-sr-only sm:ml-1">Modifier</span>
                              </Button>
                              {user.role !== 'admin' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleSuspendUser(user.id)}
                                    className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:p-2"
                                  >
                                    <UserX className="h-3 w-3 sm:h-4 sm:w-4" />
                                    <span className="sr-only sm:not-sr-only sm:ml-1">Suspendre</span>
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleDeleteUser(user.id)}
                                    className="h-8 w-8 p-0 sm:h-9 sm:w-auto sm:p-2"
                                  >
                                    <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                                    <span className="sr-only sm:not-sr-only sm:ml-1">Supprimer</span>
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-1">Aucun utilisateur trouvé</h3>
                        <p className="text-muted-foreground">
                          Il n'y a actuellement aucun utilisateur dans le système
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Subscriptions Tab */}
            <TabsContent value="subscriptions" className="space-y-4 sm:space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Gestion des Abonnements</h2>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Liste des Abonnements</CardTitle>
                    <CardDescription>
                      {subscriptions ? `${subscriptions.length} abonnements` : 'Chargement...'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {subscriptionsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin" />
                      </div>
                    ) : subscriptions && subscriptions.length > 0 ? (
                      <div className="space-y-4">
                        {subscriptions.map((subscription: Subscription) => (
                          <div key={subscription.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border rounded-lg gap-3 sm:gap-4">
                            <div className="flex items-center gap-3 sm:gap-4">
                              <div className={`p-1.5 sm:p-2 rounded-full flex-shrink-0 ${
                                subscription.planId === 'basic' ? 'bg-blue-100 text-blue-800' :
                                subscription.planId === 'standard' ? 'bg-green-100 text-green-800' :
                                subscription.planId === 'premium' ? 'bg-purple-100 text-purple-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {subscription.planId === 'basic' ? <Package className="h-4 w-4 sm:h-5 sm:w-5" /> :
                                  subscription.planId === 'standard' ? <Award className="h-4 w-4 sm:h-5 sm:w-5" /> :
                                  subscription.planId === 'premium' ? <Crown className="h-4 w-4 sm:h-5 sm:w-5" /> :
                                  <Gem className="h-4 w-4 sm:h-5 sm:w-5" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium capitalize text-sm sm:text-base">
                                  {subscription.planId === 'basic' ? 'Basique' :
                                    subscription.planId === 'standard' ? 'Standard' :
                                    subscription.planId === 'premium' ? 'Premium' :
                                    subscription.planId}
                                </h3>
                                <p className="text-xs sm:text-sm text-muted-foreground">
                                  {new Date(subscription.startDate).toLocaleDateString('fr-FR')} -
                                  {new Date(subscription.endDate).toLocaleDateString('fr-FR')}
                                </p>
                              </div>
                              <Badge variant={
                                subscription.status === 'active' ? 'default' :
                                subscription.status === 'cancelled' ? 'destructive' :
                                'secondary'
                              } className="text-xs">
                                {subscription.status === 'active' ? 'Actif' :
                                  subscription.status === 'cancelled' ? 'Annulé' :
                                  'Expiré'}
                              </Badge>
                            </div>
                            <div className="text-left sm:text-right">
                              <p className="font-medium text-sm sm:text-base">{subscription.amount} FCFA</p>
                              <p className="text-xs sm:text-sm text-muted-foreground capitalize">
                                {subscription.paymentMethod}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-1">Aucun abonnement trouvé</h3>
                        <p className="text-muted-foreground">
                          Il n'y a actuellement aucun abonnement dans le système
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              <AnalyticsTab
                activeUsersCount={activeUsersCount}
                dailyViewsCount={dailyViewsCount}
                totalMoviesCount={totalMoviesCount}
                totalSeriesCount={totalSeriesCount}
                userGrowthData={userGrowthData}
                revenueData={revenueData}
                subscriptionData={subscriptionData}
                contentTypeData={contentTypeData}
              />
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="space-y-4 sm:space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Sécurité</h2>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Journal de Sécurité</CardTitle>
                    <CardDescription>
                      {securityLogs ? `${securityLogs.length} événements` : 'Chargement...'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {securityLogsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin" />
                      </div>
                    ) : securityLogs && securityLogs.length > 0 ? (
                      <div className="space-y-4">
                        {securityLogs.map((log: SecurityEvent, index: number) => (
                          <div key={index} className="flex items-start gap-4 p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-white/50 dark:bg-slate-800/50">
                            <div className={`p-2 rounded-full mt-1 ${
                              log.severity === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                              log.severity === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                              'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            }`}>
                              <div className={`h-4 w-4 rounded-full ${
                                log.severity === 'high' ? 'bg-red-500' :
                                log.severity === 'medium' ? 'bg-yellow-500' :
                                'bg-green-500'
                              }`} />
                            </div>
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{log.eventType}</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{new Date(log.timestamp).toLocaleString()}</p>
                              </div>
                              <p className="text-sm text-slate-600 dark:text-slate-300">{log.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Shield className="h-12 w-12 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-1 text-slate-900 dark:text-slate-100">Aucun événement de sécurité</h3>
                        <p className="text-slate-600 dark:text-slate-400">
                          Aucun événement de sécurité n'a été enregistré pour le moment
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              <div className="col-span-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Content</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {contentLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="loader-wrapper">
                          <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                      </div>
                    ) : existingContent && existingContent.length > 0 ? (
                      <div className="space-y-4">
                        {existingContent.map((log: ContentEvent, index: number) => (
                          <div key={index} className="flex items-start gap-4 p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-white/50 dark:bg-slate-800/50">
                            <div className={`p-2 rounded-full mt-1 ${
                              log.severity === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                              log.severity === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                              'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            }`}>
                              <div className={`h-4 w-4 rounded-full ${
                                log.severity === 'high' ? 'bg-red-500' :
                                log.severity === 'medium' ? 'bg-yellow-500' :
                                'bg-green-500'
                              }`} />
                            </div>
                            <div className="space-y-1 flex-1">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{log.eventType}</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{new Date(log.timestamp).toLocaleString()}</p>
                              </div>
                              <p className="text-sm text-slate-600 dark:text-slate-300">{log.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Database className="h-12 w-12 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-1 text-slate-900 dark:text-slate-100">Aucun contenu trouvé</h3>
                        <p className="text-slate-600 dark:text-slate-400">
                          Aucun contenu n'a été trouvé dans le système
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              <div className="col-span-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {activityLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin" />
                      </div>
                    ) : activityLogs && activityLogs.length > 0 ? (
                      <div className="space-y-4">
                        {activityLogs.map((log: ActivityEvent, index: number) => (
                          <div key={index} className="flex items-start gap-4 p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-white/50 dark:bg-slate-800/50">
                            <div className={`p-2 rounded-full mt-1 ${
                              log.severity === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                              log.severity === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                              'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                            }`}>
                              {log.eventType === 'ADMIN_ACCESS' ? <Key className="h-4 w-4" /> :
                               log.eventType === 'FAILED_LOGIN' ? <UserX className="h-4 w-4" /> :
                               log.eventType === 'BRUTE_FORCE_ATTEMPT' ? <AlertTriangle className="h-4 w-4" /> :
                               <Shield className="h-4 w-4" />}
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between">
                                <p className="font-medium text-slate-900 dark:text-slate-100">
                                  {log.eventType === 'ADMIN_ACCESS' ? 'Accès administrateur' :
                                   log.eventType === 'FAILED_LOGIN' ? 'Échec de connexion' :
                                   log.eventType === 'BRUTE_FORCE_ATTEMPT' ? 'Tentative de force brute' :
                                   log.eventType}
                                </p>
                                <Badge variant={
                                  log.severity === 'high' ? 'destructive' :
                                  log.severity === 'medium' ? 'default' :
                                  'secondary'
                                }>
                                  {log.severity === 'high' ? 'Élevé' :
                                   log.severity === 'medium' ? 'Moyen' :
                                   'Faible'}
                                </Badge>
                              </div>
                              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                                {log.userId ? `Utilisateur: ${log.userId}` : 'Utilisateur inconnu'}
                              </p>
                              <p className="text-sm text-slate-600 dark:text-slate-300">
                                IP: {log.ipAddress}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                                {new Date(log.timestamp).toLocaleString('fr-FR')}
                              </p>
                              {log.details && (
                                <p className="text-sm mt-2 bg-slate-100 dark:bg-slate-700 p-2 rounded text-slate-900 dark:text-slate-100">
                                  {log.details}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Activity className="h-12 w-12 text-slate-400 dark:text-slate-600 mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-1 text-slate-900 dark:text-slate-100">Aucun événement d'activité</h3>
                        <p className="text-slate-600 dark:text-slate-400">
                          Aucun événement d'activité n'a été enregistré pour le moment
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Comments Tab */}
            <TabsContent value="comments" className="space-y-4 sm:space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Modération des Commentaires</h2>

                <Card>
                  <CardHeader>
                    <CardTitle>Tous les Commentaires</CardTitle>
                    <CardDescription>
                      Approuvez ou rejetez les commentaires des utilisateurs
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <CommentsModeration />
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-4 sm:space-y-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Paramètres</h2>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Configuration du Système</CardTitle>
                      <CardDescription>
                        Paramètres généraux de l'application
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">Mode Maintenance</h3>
                          <p className="text-sm text-muted-foreground">
                            Activer le mode maintenance pour les utilisateurs
                          </p>
                        </div>
                        <Switch />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">Notifications par Email</h3>
                          <p className="text-sm text-muted-foreground">
                            Envoyer des notifications par email aux administrateurs
                          </p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">Journalisation</h3>
                          <p className="text-sm text-muted-foreground">
                            Enregistrer tous les événements dans les journaux
                          </p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Performances</CardTitle>
                      <CardDescription>
                        Optimisation et surveillance des performances
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">Cache</h3>
                          <p className="text-sm text-muted-foreground">
                            Utiliser le cache pour améliorer les performances
                          </p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">Compression</h3>
                          <p className="text-sm text-muted-foreground">
                            Compresser les réponses pour réduire la bande passante
                          </p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      
                      <Button variant="outline" className="w-full">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Vider le Cache
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
      
      {/* Add Content Dialog */}
      <Dialog open={showAddContentDialog} onOpenChange={setShowAddContentDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Ajouter un Contenu</DialogTitle>
            <DialogDescription>
              Ajouter un nouveau film ou série à la plateforme
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const form = e.target as HTMLFormElement;
            const formData = new FormData(form);
            
            createContentMutation.mutate({
              tmdbId: parseInt(formData.get('tmdbId') as string),
              title: formData.get('title') as string,
              description: formData.get('description') as string,
              posterPath: formData.get('posterPath') as string,
              backdropPath: formData.get('backdropPath') as string,
              releaseDate: formData.get('releaseDate') as string,
              genres: (formData.get('genres') as string).split(',').map(g => g.trim()).filter(g => g.length > 0),
              language: formData.get('language') as string,
              quality: formData.get('quality') as string,
              mediaType: formData.get('mediaType') as string,
              active: (formData.get('active') as string) === 'on',
            });
          }}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="tmdbId" className="text-right">
                  ID TMDB
                </Label>
                <Input
                  id="tmdbId"
                  name="tmdbId"
                  type="number"
                  className="col-span-3"
                  required
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">
                  Titre
                </Label>
                <Input
                  id="title"
                  name="title"
                  className="col-span-3"
                  required
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="posterPath" className="text-right">
                  Affiche
                </Label>
                <Input
                  id="posterPath"
                  name="posterPath"
                  className="col-span-3"
                  placeholder="/path/to/poster.jpg"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="backdropPath" className="text-right">
                  Arrière-plan
                </Label>
                <Input
                  id="backdropPath"
                  name="backdropPath"
                  className="col-span-3"
                  placeholder="/path/to/backdrop.jpg"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="releaseDate" className="text-right">
                  Date
                </Label>
                <Input
                  id="releaseDate"
                  name="releaseDate"
                  type="date"
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="genres" className="text-right">
                  Genres
                </Label>
                <Input
                  id="genres"
                  name="genres"
                  className="col-span-3"
                  placeholder="Action, Aventure, Comédie"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="language" className="text-right">
                  Langue
                </Label>
                <Select name="language" defaultValue="vf">
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vf">VF</SelectItem>
                    <SelectItem value="vostfr">VOSTFR</SelectItem>
                    <SelectItem value="vo">VO</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="quality" className="text-right">
                  Qualité
                </Label>
                <Select name="quality" defaultValue="hd">
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sd">SD</SelectItem>
                    <SelectItem value="hd">HD</SelectItem>
                    <SelectItem value="4k">4K</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="mediaType" className="text-right">
                  Type
                </Label>
                <Select name="mediaType" defaultValue="movie">
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="movie">Film</SelectItem>
                    <SelectItem value="tv">Série TV</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="active" className="text-right">
                  Actif
                </Label>
                <div className="col-span-3 flex items-center">
                  <Switch id="active" name="active" defaultChecked />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Ajouter</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Add Video Link Dialog */}
      <AddVideoLinkDialog 
        open={showAddVideoLinkDialog}
        onOpenChange={setShowAddVideoLinkDialog}
        content={selectedContentForVideo}
        getCSRFToken={getCSRFToken}
      />
      
      {/* Edit Content Dialog */}
      <Dialog open={showEditContentDialog} onOpenChange={setShowEditContentDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Modifier le Contenu</DialogTitle>
            <DialogDescription>
              Modifier les détails du contenu sélectionné
            </DialogDescription>
          </DialogHeader>
          {selectedContentForEdit && (
            <form onSubmit={handleUpdateContent}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="title" className="text-right">
                    Titre
                  </Label>
                  <Input
                    id="title"
                    defaultValue={selectedContentForEdit.title}
                    className="col-span-3"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    defaultValue={selectedContentForEdit.description || ''}
                    className="col-span-3"
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="poster-path" className="text-right">
                    Affiche
                  </Label>
                  <Input
                    id="poster-path"
                    defaultValue={selectedContentForEdit.posterPath || ''}
                    className="col-span-3"
                    placeholder="/path/to/poster.jpg"
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="backdrop-path" className="text-right">
                    Arrière-plan
                  </Label>
                  <Input
                    id="backdrop-path"
                    defaultValue={selectedContentForEdit.backdropPath || ''}
                    className="col-span-3"
                    placeholder="/path/to/backdrop.jpg"
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="release-date" className="text-right">
                    Date
                  </Label>
                  <Input
                    id="release-date"
                    type="date"
                    defaultValue={selectedContentForEdit.releaseDate || ''}
                    className="col-span-3"
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="genres" className="text-right">
                    Genres
                  </Label>
                  <Input
                    id="genres"
                    defaultValue={selectedContentForEdit.genres?.join(', ') || ''}
                    className="col-span-3"
                    placeholder="Action, Aventure, Comédie"
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="language" className="text-right">
                    Langue
                  </Label>
                  <Select defaultValue={selectedContentForEdit.language}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Sélectionner une langue" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="vf">VF</SelectItem>
                      <SelectItem value="vostfr">VOSTFR</SelectItem>
                      <SelectItem value="vo">VO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="quality" className="text-right">
                    Qualité
                  </Label>
                  <Select defaultValue={selectedContentForEdit.quality}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Sélectionner une qualité" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sd">SD</SelectItem>
                      <SelectItem value="hd">HD</SelectItem>
                      <SelectItem value="4k">4K</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="media-type" className="text-right">
                    Type
                  </Label>
                  <Select defaultValue={selectedContentForEdit.mediaType}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Sélectionner un type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="movie">Film</SelectItem>
                      <SelectItem value="tv">Série TV</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="odysee-url" className="text-right">
                    URL Odysee
                  </Label>
                  <Input
                    id="odysee-url"
                    defaultValue={selectedContentForEdit.odyseeUrl || ''}
                    className="col-span-3"
                    placeholder="https://odysee.com/..."
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="active" className="text-right">
                    Actif
                  </Label>
                  <div className="col-span-3 flex items-center">
                    <Switch 
                      id="active" 
                      defaultChecked={selectedContentForEdit.active} 
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Enregistrer</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Edit User Dialog */}
      <Dialog open={showEditUserDialog} onOpenChange={setShowEditUserDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Modifier l'Utilisateur</DialogTitle>
            <DialogDescription>
              Modifier les détails de l'utilisateur sélectionné
            </DialogDescription>
          </DialogHeader>
          {selectedUserForEdit && (
            <form onSubmit={handleUpdateUser}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-username" className="text-right">
                    Nom d'utilisateur
                  </Label>
                  <Input
                    id="edit-username"
                    defaultValue={selectedUserForEdit.username}
                    className="col-span-3"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-email" className="text-right">
                    Email
                  </Label>
                  <Input
                    id="edit-email"
                    type="email"
                    defaultValue={selectedUserForEdit.email}
                    className="col-span-3"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="edit-role" className="text-right">
                    Rôle
                  </Label>
                  <Select defaultValue={selectedUserForEdit.role}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Sélectionner un rôle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">Utilisateur</SelectItem>
                      <SelectItem value="admin">Administrateur</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Enregistrer</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Add Episode Dialog */}
      <Dialog open={showAddEpisodeDialog} onOpenChange={(open) => {
        setShowAddEpisodeDialog(open);
        if (!open) {
          setSelectedContentForEpisodes(null);
          setEpisodes([]);
          setTmdbSeasons(null);
        }
      }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Gérer les Épisodes</DialogTitle>
            <DialogDescription>
              {selectedContentForEpisodes?.title}
            </DialogDescription>

            {/* TMDB Seasons Section */}
            <div className="mt-4">
              <h4 className="text-sm font-semibold mb-2">Saisons (TMDB)</h4>
              {loadingTmdbSeasons ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              ) : tmdbSeasons && tmdbSeasons.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {tmdbSeasons
                    .filter((s: any) => (s?.season_number ?? 0) > 0)
                    .map((season: any) => (
                      <div key={season.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <div className="font-medium">Saison {season.season_number} — {season.name}</div>
                          <div className="text-xs text-muted-foreground">{season.episode_count} épisodes</div>
                        </div>
                        <Button size="sm" onClick={() => bulkCreateEpisodesForSeason(season.season_number, season.episode_count)}>
                          Générer épisodes
                        </Button>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Aucune saison TMDB trouvée.</p>
              )}
            </div>
          </DialogHeader>
          
          {loadingEpisodes ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">Liste des Épisodes</h3>
                <Button 
                  onClick={() => {
                    setSelectedEpisodeForEdit(null);
                    setShowEditEpisodeDialog(true);
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter Épisode
                </Button>
              </div>
              
              {episodes.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {episodes.map((episode) => (
                    <div key={episode.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">
                          S{episode.seasonNumber} E{episode.episodeNumber} - {episode.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {episode.releaseDate ? new Date(episode.releaseDate).toLocaleDateString('fr-FR') : 'Date non définie'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            setSelectedEpisodeForEdit(episode);
                            setShowEditEpisodeDialog(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => {
                            if (window.confirm("Êtes-vous sûr de vouloir supprimer cet épisode ?")) {
                              // Add delete episode mutation here
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Tv className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-1">Aucun épisode trouvé</h3>
                  <p className="text-muted-foreground">
                    Commencez par ajouter un épisode
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Edit Episode Dialog */}
      <Dialog open={showEditEpisodeDialog} onOpenChange={setShowEditEpisodeDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {selectedEpisodeForEdit ? "Modifier l'Épisode" : "Ajouter un Épisode"}
            </DialogTitle>
            <DialogDescription>
              {selectedEpisodeForEdit ? "Modifier les détails de l'épisode" : "Ajouter un nouvel épisode"}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            const form = e.target as HTMLFormElement;
            const formData = new FormData(form);
            
            const episodeData = {
              contentId: selectedContentForEpisodes?.id || '',
              seasonNumber: parseInt(formData.get('seasonNumber') as string),
              episodeNumber: parseInt(formData.get('episodeNumber') as string),
              title: formData.get('title') as string,
              description: formData.get('description') as string,
              odyseeUrl: formData.get('odyseeUrl') as string,
              releaseDate: formData.get('releaseDate') as string,
              active: (formData.get('active') as string) === 'on',
            };
            
            if (selectedEpisodeForEdit) {
              // Update existing episode
              updateEpisodeMutation.mutate({
                episodeId: selectedEpisodeForEdit.id,
                updates: episodeData
              });
            } else {
              // Create new episode
              createEpisodeMutation.mutate(episodeData);
            }
          }}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="seasonNumber" className="text-right">
                  Saison
                </Label>
                <Input
                  id="seasonNumber"
                  name="seasonNumber"
                  type="number"
                  min="1"
                  defaultValue={selectedEpisodeForEdit?.seasonNumber || ''}
                  className="col-span-3"
                  required
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="episodeNumber" className="text-right">
                  Épisode
                </Label>
                <Input
                  id="episodeNumber"
                  name="episodeNumber"
                  type="number"
                  min="1"
                  defaultValue={selectedEpisodeForEdit?.episodeNumber || ''}
                  className="col-span-3"
                  required
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="title" className="text-right">
                  Titre
                </Label>
                <Input
                  id="title"
                  name="title"
                  defaultValue={selectedEpisodeForEdit?.title || ''}
                  className="col-span-3"
                  required
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">
                  Description
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={selectedEpisodeForEdit?.description || ''}
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="odyseeUrl" className="text-right">
                  URL Odysee
                </Label>
                <Input
                  id="odyseeUrl"
                  name="odyseeUrl"
                  defaultValue={selectedEpisodeForEdit?.odyseeUrl || ''}
                  className="col-span-3"
                  placeholder="https://odysee.com/..."
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="releaseDate" className="text-right">
                  Date
                </Label>
                <Input
                  id="releaseDate"
                  name="releaseDate"
                  type="date"
                  defaultValue={selectedEpisodeForEdit?.releaseDate || ''}
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="active" className="text-right">
                  Actif
                </Label>
                <div className="col-span-3 flex items-center">
                  <Switch 
                    id="active" 
                    name="active" 
                    defaultChecked={selectedEpisodeForEdit?.active !== false} 
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">
                {selectedEpisodeForEdit ? "Enregistrer" : "Ajouter"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminDashboard;
