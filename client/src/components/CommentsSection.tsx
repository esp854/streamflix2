import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MessageSquare, Send, Trash2, Edit, Check, X } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import type { Comment } from "@shared/schema";

interface CommentsSectionProps {
  contentId: string;
  contentType: 'movie' | 'tv';
}

export default function CommentsSection({ contentId, contentType }: CommentsSectionProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  // Fetch comments
  const { data: comments, isLoading } = useQuery({
    queryKey: [`/api/comments/${contentId}`],
    queryFn: async () => {
      const response = await fetch(`/api/comments/${contentId}`);
      if (!response.ok) throw new Error("Failed to fetch comments");
      return response.json();
    },
  });

  // Create comment mutation
  const createCommentMutation = useMutation({
    mutationFn: async (commentData: { contentId: string; comment: string; userId: string }) => {
      const token = localStorage.getItem('auth_token');
      // Get CSRF token
      const csrfResponse = await fetch("/api/csrf-token", {
        method: "GET",
        credentials: "include",
        headers: {
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
      });
      if (!csrfResponse.ok) throw new Error("Failed to get CSRF token");
      const { csrfToken } = await csrfResponse.json();

      const response = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify(commentData),
      });
      if (!response.ok) throw new Error("Failed to create comment");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/comments/${contentId}`] });
      setNewComment("");
      toast({
        title: "Commentaire ajouté",
        description: "Votre commentaire a été ajouté avec succès.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'ajouter le commentaire.",
        variant: "destructive",
      });
    },
  });

  // Update comment mutation
  const updateCommentMutation = useMutation({
    mutationFn: async ({ commentId, comment }: { commentId: string; comment: string }) => {
      const token = localStorage.getItem('auth_token');
      // Get CSRF token
      const csrfResponse = await fetch("/api/csrf-token", {
        method: "GET",
        credentials: "include",
        headers: {
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
      });
      if (!csrfResponse.ok) throw new Error("Failed to get CSRF token");
      const { csrfToken } = await csrfResponse.json();

      const response = await fetch(`/api/comments/${commentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify({ comment }),
      });
      if (!response.ok) throw new Error("Failed to update comment");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/comments/${contentId}`] });
      setEditingComment(null);
      setEditText("");
      toast({
        title: "Commentaire modifié",
        description: "Votre commentaire a été modifié avec succès.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de modifier le commentaire.",
        variant: "destructive",
      });
    },
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const token = localStorage.getItem('auth_token');
      // Get CSRF token
      const csrfResponse = await fetch("/api/csrf-token", {
        method: "GET",
        credentials: "include",
        headers: {
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
      });
      if (!csrfResponse.ok) throw new Error("Failed to get CSRF token");
      const { csrfToken } = await csrfResponse.json();

      const response = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
          "X-CSRF-Token": csrfToken,
        },
      });
      if (!response.ok) throw new Error("Failed to delete comment");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/comments/${contentId}`] });
      toast({
        title: "Commentaire supprimé",
        description: "Votre commentaire a été supprimé avec succès.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer le commentaire.",
        variant: "destructive",
      });
    },
  });

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    createCommentMutation.mutate({
      contentId,
      comment: newComment.trim(),
      userId: user.id,
    });
  };

  const handleEditComment = (comment: Comment) => {
    setEditingComment(comment.id);
    setEditText(comment.comment);
  };

  const handleSaveEdit = (commentId: string) => {
    if (!editText.trim()) return;
    updateCommentMutation.mutate({ commentId, comment: editText.trim() });
  };

  const handleCancelEdit = () => {
    setEditingComment(null);
    setEditText("");
  };

  const handleDeleteComment = (commentId: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce commentaire ?")) {
      deleteCommentMutation.mutate(commentId);
    }
  };

  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <section className="space-y-4 sm:space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
            Commentaires ({comments?.comments?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          {/* Add comment form */}
          {user ? (
            <form onSubmit={handleSubmitComment} className="space-y-3 sm:space-y-4">
              <div className="flex gap-3 sm:gap-4">
                <Avatar className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
                  <AvatarFallback className="text-xs sm:text-sm">
                    {user.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <Textarea
                    placeholder="Écrivez votre commentaire..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="min-h-[60px] sm:min-h-[80px] resize-none text-sm sm:text-base"
                    required
                  />
                  <div className="flex justify-end">
                    <Button
                      type="submit"
                      disabled={!newComment.trim() || createCommentMutation.isPending}
                      className="flex items-center gap-2 h-8 sm:h-9 px-3 sm:px-4 text-xs sm:text-sm"
                    >
                      <Send className="w-3 h-3 sm:w-4 sm:h-4" />
                      {createCommentMutation.isPending ? "Publication..." : "Publier"}
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          ) : (
            <div className="text-center py-6 sm:py-8 text-muted-foreground">
              <MessageSquare className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 opacity-50" />
              <p className="text-sm sm:text-base">Connectez-vous pour laisser un commentaire</p>
            </div>
          )}

          {/* Comments list */}
          <div className="space-y-3 sm:space-y-4">
            {isLoading ? (
              <div className="space-y-3 sm:space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex gap-3 sm:gap-4">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-muted rounded-full animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 sm:h-4 bg-muted rounded animate-pulse w-1/4" />
                      <div className="h-3 sm:h-4 bg-muted rounded animate-pulse w-3/4" />
                      <div className="h-2 sm:h-3 bg-muted rounded animate-pulse w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : comments?.comments?.length > 0 ? (
              comments.comments.map((comment: Comment) => (
                <div key={comment.id} className="flex gap-3 sm:gap-4">
                  <Avatar className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
                    <AvatarFallback className="text-xs sm:text-sm">
                      {comment.userId.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <span className="font-medium text-sm sm:text-base">
                        {comment.userId}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(comment.createdAt)}
                      </span>
                    </div>

                    {editingComment === comment.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="min-h-[60px] resize-none text-sm sm:text-base"
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSaveEdit(comment.id)}
                            disabled={updateCommentMutation.isPending}
                            className="h-8 sm:h-9 text-xs sm:text-sm"
                          >
                            <Check className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                            Sauvegarder
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelEdit}
                            className="h-8 sm:h-9 text-xs sm:text-sm"
                          >
                            <X className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                            Annuler
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm sm:text-base leading-relaxed">{comment.comment}</p>
                    )}

                    {user && user.id === comment.userId && editingComment !== comment.id && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEditComment(comment)}
                          className="h-7 sm:h-8 px-2 text-xs"
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          <span className="hidden xs:inline">Modifier</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteComment(comment.id)}
                          className="h-7 sm:h-8 px-2 text-xs text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-3 h-3 mr-1" />
                          <span className="hidden xs:inline">Supprimer</span>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 sm:py-8 text-muted-foreground">
                <MessageSquare className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 opacity-50" />
                <p className="text-sm sm:text-base">Aucun commentaire pour le moment</p>
                <p className="text-xs sm:text-sm">Soyez le premier à donner votre avis !</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}