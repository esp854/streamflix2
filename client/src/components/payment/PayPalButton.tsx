import { useEffect, useState } from "react";
// @ts-ignore
import axios from "axios";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";

interface PayPalButtonProps {
  planId: string;
  amount: number;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export default function PayPalButton({ 
  planId, 
  amount, 
  onSuccess, 
  onError 
}: PayPalButtonProps) {
  const { user, token } = useAuth();
  const { toast } = useToast();
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Charger le SDK PayPal v6
  useEffect(() => {
    if (window.paypal) {
      setIsScriptLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = process.env.VITE_PAYPAL_SDK_URL || "https://www.sandbox.paypal.com/web-sdk/v6/core";
    script.async = true;
    script.onload = () => setIsScriptLoaded(true);
    script.onerror = () => {
      toast({
        title: "Erreur de chargement",
        description: "Impossible de charger le SDK PayPal",
        variant: "destructive"
      });
    };
    
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [toast]);

  // Initialiser le SDK PayPal une fois le script chargé
  useEffect(() => {
    if (isScriptLoaded && user && token) {
      initializePayPal();
    }
  }, [isScriptLoaded, user, token]);

  const getCSRFToken = async (): Promise<string | null> => {
    try {
      const res = await axios.get("/api/csrf-token", {
        withCredentials: true,
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      return res.data?.csrfToken || null;
    } catch (e) {
      console.error("Erreur lors de la récupération du token CSRF:", e);
      return null;
    }
  };

  const initializePayPal = async () => {
    try {
      // Obtenir un clientToken du serveur
      const csrfToken = await getCSRFToken();
      
      // Get client token from server
      const clientTokenResponse = await axios.post(
        "/api/paypal/client-token",
        {},
        {
          withCredentials: true,
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
          },
        }
      );

      const { clientToken } = clientTokenResponse.data;

      if (!clientToken) {
        throw new Error("Impossible d'obtenir le clientToken PayPal");
      }

      // Créer une instance du SDK PayPal avec le clientToken
      const sdkInstance = await window.paypal.createInstance({
        clientToken,
        components: ["paypal-payments"],
        locale: "fr-FR",
        pageType: "checkout",
      });

      // Vérifier l'éligibilité au financement
      const paymentMethods = await sdkInstance.findEligibleMethods();
      const isPayPalEligible = paymentMethods.isEligible("paypal");

      if (isPayPalEligible) {
        // Créer une session de paiement PayPal
        const paypalOneTimePaymentSession = 
          sdkInstance.createPayPalOneTimePaymentSession({
            onApprove: async (data: any) => {
              try {
                // Créer le paiement côté serveur
                const paymentResponse = await axios.post(
                  "/api/subscription/create-payment-paypal",
                  {
                    planId,
                    customerInfo: {
                      name: user?.username || "",
                      email: user?.email || ""
                    }
                  },
                  {
                    withCredentials: true,
                    headers: {
                      ...(token ? { Authorization: `Bearer ${token}` } : {}),
                      ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
                    },
                  }
                );

                const { orderId } = paymentResponse.data;

                if (!orderId) {
                  throw new Error("Impossible d'obtenir l'ID de commande PayPal");
                }

                // Capturer le paiement
                const captureResponse = await axios.post(
                  `/api/subscription/capture-paypal/${paymentResponse.data.paymentId}`,
                  { orderId: data.orderId },
                  {
                    withCredentials: true,
                    headers: {
                      ...(token ? { Authorization: `Bearer ${token}` } : {}),
                      ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
                    },
                  }
                );

                if (captureResponse.data.status === "COMPLETED") {
                  toast({
                    title: "Paiement réussi",
                    description: "Votre paiement a été traité avec succès !",
                  });
                  onSuccess();
                } else {
                  throw new Error("Le paiement n'a pas pu être complété");
                }
              } catch (error: any) {
                console.error("Erreur lors de la capture du paiement:", error);
                onError("Erreur lors de la capture du paiement: " + (error.message || "Erreur inconnue"));
              }
            },
            onShippingAddressChange: (data: any) => {
              console.log("Adresse de livraison modifiée:", data);
            },
            onShippingOptionsChange: (data: any) => {
              console.log("Options d'expédition mises à jour:", data);
            },
            onCancel: (data: any) => {
              console.log("Paiement annulé:", data);
              toast({
                title: "Paiement annulé",
                description: "Vous avez annulé le paiement.",
              });
            },
            onError: (error: any) => {
              console.error("Erreur lors du paiement:", error);
              toast({
                title: "Erreur de paiement",
                description: "Une erreur s'est produite lors du paiement: " + (error.message || "Erreur inconnue"),
                variant: "destructive"
              });
              onError(error.message || "Erreur inconnue");
            },
          });

        // Créer le bouton PayPal
        const paypalButton = document.createElement("paypal-button");
        paypalButton.className = "paypal-gold";
        paypalButton.setAttribute("type", "pay");
        paypalButton.style.width = "100%";
        paypalButton.style.height = "40px";
        
        // Ajouter le bouton au conteneur
        const container = document.getElementById("paypal-button-container");
        if (container) {
          container.innerHTML = "";
          container.appendChild(paypalButton);
          
          // Ajouter l'événement de clic
          paypalButton.addEventListener("click", async () => {
            setIsLoading(true);
            try {
              // Créer d'abord le paiement
              const paymentResponse = await axios.post(
                "/api/subscription/create-payment-paypal",
                {
                  planId,
                  customerInfo: {
                    name: user?.username || "",
                    email: user?.email || ""
                  }
                },
                {
                  withCredentials: true,
                  headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
                  },
                }
              );

              const orderId = paymentResponse.data.orderId;

              if (!orderId) {
                throw new Error("Impossible d'obtenir l'ID de commande PayPal");
              }

              await paypalOneTimePaymentSession.start(
                { presentationMode: "popup" },
                orderId
              );
            } catch (error: any) {
              console.error("Erreur lors du démarrage du flux de paiement:", error);
              // Essayer avec le mode modal en fallback
              try {
                const paymentResponse = await axios.post(
                  "/api/subscription/create-payment-paypal",
                  {
                    planId,
                    customerInfo: {
                      name: user?.username || "",
                      email: user?.email || ""
                    }
                  },
                  {
                    withCredentials: true,
                    headers: {
                      ...(token ? { Authorization: `Bearer ${token}` } : {}),
                      ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
                    },
                  }
                );

                const orderId = paymentResponse.data.orderId;

                if (!orderId) {
                  throw new Error("Impossible d'obtenir l'ID de commande PayPal");
                }

                await paypalOneTimePaymentSession.start(
                  { presentationMode: "modal" },
                  orderId
                );
              } catch (modalError: any) {
                console.error("Erreur lors du démarrage du flux modal:", modalError);
                toast({
                  title: "Erreur de paiement",
                  description: "Impossible de démarrer le processus de paiement: " + (modalError.message || "Erreur inconnue"),
                  variant: "destructive"
                });
                onError("Impossible de démarrer le processus de paiement: " + (modalError.message || "Erreur inconnue"));
              }
            } finally {
              setIsLoading(false);
            }
          });
        }
      }
    } catch (error: any) {
      console.error("Erreur lors de l'initialisation de PayPal:", error);
      toast({
        title: "Erreur PayPal",
        description: error.message || "Impossible d'initialiser PayPal",
        variant: "destructive"
      });
      onError(error.message);
    }
  };

  if (!isScriptLoaded) {
    return (
      <div className="flex justify-center items-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-2">Chargement de PayPal...</span>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div id="paypal-button-container" className="w-full"></div>
      {isLoading && (
        <div className="flex justify-center items-center mt-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <span className="ml-2">Traitement du paiement...</span>
        </div>
      )}
      <style>{`
        paypal-button {
          width: 100%;
          height: 40px;
          --paypal-button-border-radius: 4px;
        }
      `}</style>
    </div>
  );
}