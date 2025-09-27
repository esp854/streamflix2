import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CheckCircle, XCircle, MessageSquare, Loader2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Comment } from "@shared/schema";

export default function CommentsModeration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all comments
  const { data: comments, isLoading } = useQuery({
    queryKey: ["/api/admin/comments"],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch("/api/admin/comments", {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to fetch comments");
      return response.json();
    },
  });

  // Approve/reject comment mutation
  const moderateCommentMutation = useMutation({
    mutationFn: async ({ commentId, approved }: { commentId: string; approved: boolean }) => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/admin/comments/${commentId}/approve`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ approved }),
      });
      if (!response.ok) throw new Error("Failed to moderate comment");
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/comments"] });
      toast({
        title: "Commentaire modéré",
        description: `Le commentaire a été ${variables.approved ? 'approuvé' : 'rejeté'}.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de modérer le commentaire.",
        variant: "destructive",
      });
    },
  });

  // Delete comment mutation
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/comments/${commentId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error("Failed to delete comment");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/comments"] });
      toast({
        title: "Commentaire supprimé",
        description: "Le commentaire a été supprimé avec succès.",
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

  const handleApprove = (commentId: string) => {
    moderateCommentMutation.mutate({ commentId, approved: true });
  };

  const handleReject = (commentId: string) => {
    moderateCommentMutation.mutate({ commentId, approved: false });
  };

  const handleDelete = (commentId: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce commentaire ?")) {
      deleteCommentMutation.mutate(commentId);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (approved: boolean) => {
    if (approved) {
      return <Badge variant="default" className="bg-green-500">Approuvé</Badge>;
    } else {
      return <Badge variant="destructive">Rejeté</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {comments && comments.length > 0 ? (
        comments.map((comment: Comment) => (
          <Card key={comment.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="text-xs">
                      {comment.userId.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{comment.userId}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(comment.createdAt.toISOString())}
                    </p>
                  </div>
                </div>
                {getStatusBadge(comment.approved)}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-sm leading-relaxed">{comment.comment}</p>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  Contenu ID: {comment.contentId}
                </div>

                <div className="flex gap-2">
                  {!comment.approved && (
                    <Button
                      size="sm"
                      onClick={() => handleApprove(comment.id)}
                      disabled={moderateCommentMutation.isPending}
                      className="bg-green-500 hover:bg-green-600"
                    >
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Approuver
                    </Button>
                  )}

                  {comment.approved && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReject(comment.id)}
                      disabled={moderateCommentMutation.isPending}
                    >
                      <XCircle className="w-4 h-4 mr-1" />
                      Rejeter
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(comment.id)}
                    disabled={deleteCommentMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Supprimer
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Aucun commentaire trouvé</p>
        </div>
      )}
    </div>
  );
}