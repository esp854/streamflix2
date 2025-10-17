import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  Play,
  Calendar,
  Clock,
  Tv,
  Users,
  Star,
  Filter,
  Loader2,
  ExternalLink,
  Download,
  Upload,
  RefreshCw,
  GripVertical,
  Save,
  MoveUp,
  MoveDown
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { tmdbService } from "@/lib/tmdb";
import type { Content } from "@shared/schema";

interface DisplayOrderItem extends Content {
  displayOrder: number;
}

export default function DisplayOrderManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State management
  const [searchQuery, setSearchQuery] = useState("");
  const [contentType, setContentType] = useState<"all" | "movie" | "tv">("all");
  const [draggedItem, setDraggedItem] = useState<DisplayOrderItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Fetch content sorted by display order
  const { data: contentList, isLoading, refetch } = useQuery({
    queryKey: ["/api/content/sorted/display-order"],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch("/api/content/sorted/display-order", {
        credentials: "include",
        headers: {
          ...(token ? { "Authorization": "Bearer " + token } : {}),
        },
      });

      if (!response.ok) throw new Error("Failed to fetch content");

      const data = await response.json();
      return data.map((item: any) => ({
        ...item,
        mediaType: item.mediaType || (item.seasonNumber ? 'tv' : 'movie')
      }));
    },
  });

  // Filter content based on search query and content type
  const filteredContent = contentList?.filter((content: DisplayOrderItem) => {
    // Filter by content type
    if (contentType !== "all" && content.mediaType !== contentType) {
      return false;
    }
    
    // Filter by search query
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      content.title.toLowerCase().includes(query) ||
      content.description?.toLowerCase().includes(query) ||
      content.genres?.some(g => g.toLowerCase().includes(query))
    );
  }) || [];

  // Handle drag start
  const handleDragStart = (e: React.DragEvent, item: DisplayOrderItem) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = "move";
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  // Handle drop
  const handleDrop = (e: React.DragEvent, targetItem: DisplayOrderItem) => {
    e.preventDefault();
    
    if (!draggedItem || draggedItem.id === targetItem.id) {
      return;
    }
    
    // Create a new array with updated order
    const updatedContent = [...filteredContent];
    const draggedIndex = updatedContent.findIndex(item => item.id === draggedItem.id);
    const targetIndex = updatedContent.findIndex(item => item.id === targetItem.id);
    
    // Remove dragged item
    const [removed] = updatedContent.splice(draggedIndex, 1);
    // Insert at target position
    updatedContent.splice(targetIndex, 0, removed);
    
    // Update the local state immediately for better UX
    // The actual save will happen when user clicks "Save Order"
    queryClient.setQueryData(["/api/content/sorted/display-order"], updatedContent);
  };

  // Move item up
  const moveItemUp = (index: number) => {
    if (index <= 0) return;
    
    const updatedContent = [...filteredContent];
    [updatedContent[index - 1], updatedContent[index]] = [updatedContent[index], updatedContent[index - 1]];
    
    // Update the local state immediately for better UX
    queryClient.setQueryData(["/api/content/sorted/display-order"], updatedContent);
  };

  // Move item down
  const moveItemDown = (index: number) => {
    if (index >= filteredContent.length - 1) return;
    
    const updatedContent = [...filteredContent];
    [updatedContent[index], updatedContent[index + 1]] = [updatedContent[index + 1], updatedContent[index]];
    
    // Update the local state immediately for better UX
    queryClient.setQueryData(["/api/content/sorted/display-order"], updatedContent);
  };

  // Save display order
  const saveDisplayOrder = async () => {
    setIsSaving(true);
    
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error("Vous devez être connecté pour effectuer cette action");
      
      // Get CSRF token
      const csrfResponse = await fetch("/api/csrf-token", {
        credentials: "include",
        headers: {
          "Authorization": "Bearer " + token,
        },
      });
      
      if (!csrfResponse.ok) throw new Error("Impossible d'obtenir le jeton de sécurité");
      
      const { csrfToken } = await csrfResponse.json();
      
      // Get current data from query cache
      const currentData = queryClient.getQueryData<DisplayOrderItem[]>(["/api/content/sorted/display-order"]) || filteredContent;
      
      // Prepare updates
      const updates = currentData.map((item: DisplayOrderItem, index: number) => ({
        id: item.id,
        displayOrder: index
      }));
      
      const response = await fetch("/api/admin/content/display-orders", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token,
          "X-CSRF-Token": csrfToken,
        },
        credentials: "include",
        body: JSON.stringify({ updates }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erreur ${response.status}: ${response.statusText}`);
      }
      
      toast({
        title: "Ordre d'affichage enregistré",
        description: "L'ordre d'affichage a été enregistré avec succès.",
      });
      
      // Refresh content list
      refetch();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'enregistrer l'ordre d'affichage.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to default order (by creation date)
  const resetToDefaultOrder = async () => {
    if (!window.confirm("Êtes-vous sûr de vouloir réinitialiser l'ordre d'affichage par défaut ?")) {
      return;
    }
    
    setIsSaving(true);
    
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) throw new Error("Vous devez être connecté pour effectuer cette action");
      
      // Get CSRF token
      const csrfResponse = await fetch("/api/csrf-token", {
        credentials: "include",
        headers: {
          "Authorization": "Bearer " + token,
        },
      });
      
      if (!csrfResponse.ok) throw new Error("Impossible d'obtenir le jeton de sécurité");
      
      const { csrfToken } = await csrfResponse.json();
      
      // Prepare updates - set all display orders to 0 (will sort by creation date)
      const updates = filteredContent.map((item: DisplayOrderItem) => ({
        id: item.id,
        displayOrder: 0
      }));
      
      const response = await fetch("/api/admin/content/display-orders", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token,
          "X-CSRF-Token": csrfToken,
        },
        credentials: "include",
        body: JSON.stringify({ updates }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erreur ${response.status}: ${response.statusText}`);
      }
      
      toast({
        title: "Ordre d'affichage réinitialisé",
        description: "L'ordre d'affichage a été réinitialisé par défaut.",
      });
      
      // Refresh content list
      refetch();
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de réinitialiser l'ordre d'affichage.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Gestion de l'Ordre d'Affichage</h2>
          <p className="text-muted-foreground">
            Organisez l'ordre d'affichage de vos contenus
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={saveDisplayOrder} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Enregistrer l'ordre
          </Button>
          <Button variant="outline" onClick={resetToDefaultOrder} disabled={isSaving}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Réinitialiser
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Rechercher des contenus..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={contentType} onValueChange={(value: "all" | "movie" | "tv") => setContentType(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Type de contenu" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les contenus</SelectItem>
            <SelectItem value="movie">Films</SelectItem>
            <SelectItem value="tv">Séries</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Content List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {filteredContent.length > 0 ? (
            filteredContent.map((content: DisplayOrderItem, index: number) => (
              <Card 
                key={content.id} 
                className="overflow-hidden hover:shadow-lg transition-shadow"
                draggable
                onDragStart={(e) => handleDragStart(e, content)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, content)}
              >
                <div className="flex items-center p-4">
                  <div 
                    className="cursor-move p-2 text-muted-foreground hover:bg-muted rounded-md mr-3"
                    draggable
                  >
                    <GripVertical className="h-5 w-5" />
                  </div>
                  
                  <div className="flex-shrink-0 mr-4">
                    {content.posterPath ? (
                      <img
                        src={tmdbService.getPosterUrl(content.posterPath)}
                        alt={content.title}
                        className="w-16 h-24 object-cover rounded-md"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/placeholder-poster.jpg";
                        }}
                      />
                    ) : (
                      <div className="w-16 h-24 bg-muted flex items-center justify-center rounded-md">
                        <Tv className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-lg truncate">{content.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {content.description || "Aucune description disponible"}
                        </p>
                        
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4 mr-1" />
                            <span>
                              {content.releaseDate 
                                ? new Date(content.releaseDate).getFullYear() 
                                : "Date inconnue"}
                            </span>
                          </div>
                          
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Star className="h-4 w-4 mr-1 fill-current" />
                            <span>{content.rating?.toFixed(1) || "N/A"}</span>
                          </div>
                          
                          <Badge variant="secondary">
                            {content.mediaType === 'tv' ? 'Série' : 'Film'}
                          </Badge>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mt-2">
                          {content.genres?.slice(0, 3).map((genre, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {genre}
                            </Badge>
                          ))}
                          {content.genres && content.genres.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{content.genres.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => moveItemUp(index)}
                          disabled={index === 0}
                        >
                          <MoveUp className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => moveItemDown(index)}
                          disabled={index === filteredContent.length - 1}
                        >
                          <MoveDown className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="text-center py-12">
              <Tv className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-1">Aucun contenu trouvé</h3>
              <p className="text-muted-foreground">
                {searchQuery 
                  ? "Aucun contenu ne correspond à votre recherche" 
                  : "Commencez par ajouter des contenus à votre plateforme"}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}