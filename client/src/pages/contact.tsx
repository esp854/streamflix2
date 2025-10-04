import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, Mail, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertContactMessageSchema } from "@shared/schema";
import type { InsertContactMessage } from "@shared/schema";

type ContactFormValues = InsertContactMessage;

export default function Contact() {
  const { toast } = useToast();

  // Mutation to submit contact message
  const submitContactMutation = useMutation({
    mutationFn: (data: ContactFormValues) =>
      apiRequest("POST", "/api/contact", data),
    onSuccess: () => {
      toast({
        title: "Message envoyé avec succès",
        description: "Nous avons bien reçu votre message et vous répondrons dans les plus brefs délais.",
      });
      form.reset();
    },
    onError: (error) => {
      console.error("Error submitting contact message:", error);
      toast({
        title: "Erreur lors de l'envoi",
        description: "Impossible d'envoyer votre message. Veuillez réessayer ou nous contacter directement.",
        variant: "destructive",
      });
    },
  });

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(insertContactMessageSchema),
    defaultValues: {
      name: "",
      email: "",
      message: "",
    },
  });

  const onSubmit = (data: ContactFormValues) => {
    submitContactMutation.mutate(data);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold" data-testid="page-title">
            Contactez-nous
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto" data-testid="page-description">
            Une question, une suggestion ou besoin d'aide ? Notre équipe est là pour vous accompagner.
            N'hésitez pas à nous contacter, nous vous répondrons rapidement.
          </p>
        </div>

        <Separator />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contact Information */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informations de contact</CardTitle>
                <CardDescription>
                  Plusieurs moyens pour nous joindre selon vos préférences.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <Mail className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Email</h3>
                    <p className="text-muted-foreground" data-testid="contact-email">
                      streamflix234m@gmail.com
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Réponse sous 24h en moyenne
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* FAQ Section */}
            <Card>
              <CardHeader>
                <CardTitle>Questions fréquentes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <h4 className="font-medium mb-1">Comment réinitialiser mon mot de passe ?</h4>
                  <p className="text-muted-foreground">
                    Utilisez le lien "Mot de passe oublié" sur la page de connexion.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Problème de lecture vidéo ?</h4>
                  <p className="text-muted-foreground">
                    Vérifiez votre connexion internet et essayez de recharger la page.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-1">Comment signaler un contenu ?</h4>
                  <p className="text-muted-foreground">
                    Utilisez le bouton de signalement présent sur chaque film ou série.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <Card>
            <CardHeader>
              <CardTitle>Envoyez-nous un message</CardTitle>
              <CardDescription>
                Remplissez le formulaire ci-dessous et nous vous répondrons rapidement.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Name Field */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nom complet *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Votre nom et prénom"
                            {...field}
                            data-testid="input-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Email Field */}
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Adresse email *</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="votre.email@exemple.com"
                            {...field}
                            data-testid="input-email"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Message Field */}
                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Décrivez votre demande, question ou suggestion..."
                            className="min-h-[120px] resize-none"
                            maxLength={1000}
                            {...field}
                            data-testid="textarea-message"
                          />
                        </FormControl>
                        <div className="flex justify-between items-center mt-1">
                          <FormMessage />
                          <span className="text-xs text-muted-foreground">
                            {field.value.length}/1000 caractères
                          </span>
                        </div>
                      </FormItem>
                    )}
                  />

                  {/* Submit Button */}
                  <div className="flex justify-end pt-4">
                    <Button
                      type="submit"
                      disabled={submitContactMutation.isPending}
                      data-testid="button-submit-contact"
                      className="min-w-[140px]"
                    >
                      {submitContactMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Envoi en cours...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Envoyer le message
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Politique de confidentialité</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>• Vos données personnelles sont uniquement utilisées pour répondre à votre demande.</p>
            <p>• Nous ne partageons jamais vos informations avec des tiers sans votre consentement.</p>
            <p>• Votre message est traité de manière confidentielle par notre équipe support.</p>
            <p>• Vous pouvez demander la suppression de vos données à tout moment en nous contactant.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}