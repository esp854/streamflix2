import React, { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard, Check } from "lucide-react";

// PayPal global type
declare global {
  interface Window {
    paypal?: any;
  }
}

interface CustomerInfo {
  name: string;
  email: string;
  phone?: string;
}

interface BackendPlan {
  amount: number;
  currency: string;
  name: string;
  duration: number;
  description?: string;
}

interface PlansResponse {
  [key: string]: BackendPlan;
}

const PayPalPaymentPage: React.FC = () => {
  const { toast } = useToast();
  const { user, isAuthenticated, token } = useAuth();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [searchParams] = useLocation();
  
  // Extract planId from URL parameters
  const urlParams = new URLSearchParams(searchParams.split('?')[1]);
  const planId = urlParams.get('plan') || '';
  
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: "",
    email: "",
    phone: "",
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [paypalOrderId, setPaypalOrderId] = useState<string | null>(null);
  const [paypalPaymentId, setPaypalPaymentId] = useState<string | null>(null);
  const [paypalLoaded, setPaypalLoaded] = useState(false);
  const [paypalClientId, setPaypalClientId] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Prefill from user
  useEffect(() => {
    if (user) {
      setCustomerInfo({ name: user.username, email: user.email, phone: "" });
    }
  }, [user]);

  // Fetch PayPal client ID
  useEffect(() => {
    const fetchPayPalClientId = async () => {
      try {
        const res = await fetch("/api/paypal/client-id");
        if (res.ok) {
          const data = await res.json();
          setPaypalClientId(data.clientId);
        }
      } catch (error) {
        console.error("Error fetching PayPal client ID:", error);
      }
    };

    fetchPayPalClientId();
  }, []);

  // Fetch plan details
  const { data: plans } = useQuery<PlansResponse>({
    queryKey: ["subscription-plans"],
    queryFn: async () => {
      const res = await fetch("/api/subscription/plans", { credentials: "include" });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to fetch plans: ${res.status} ${errorText}`);
      }
      return res.json();
    },
    staleTime: 60_000,
    retry: 1,
  });

  // Render PayPal button when order is created
  useEffect(() => {
    if (paypalOrderId && paypalLoaded && window.paypal) {
      const paypalButtonContainer = document.getElementById('paypal-button-container');
      if (paypalButtonContainer) {
        paypalButtonContainer.innerHTML = ''; // Clear previous button

        window.paypal.Buttons({
          createOrder: () => paypalOrderId,
          onApprove: async (data: any) => {
            try {
              // Capture the payment
              const captureResponse = await fetch(`/api/subscription/capture-paypal/${paypalPaymentId}`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                  'Content-Type': 'application/json',
                  ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify({ orderId: data.orderID }),
              });

              const captureData = await captureResponse.json();

              if (captureResponse.ok && captureData.status === 'COMPLETED') {
                toast({
                  title: "Paiement réussi",
                  description: "Votre abonnement PayPal a été activé avec succès!",
                });
                // Refresh subscription data
                queryClient.invalidateQueries({ queryKey: ["current-subscription"] });
                setPaypalOrderId(null);
                setPaypalPaymentId(null);
                setLocation('/payment-success'); // Redirect to success page
              } else {
                throw new Error(captureData.error || 'Erreur lors de la capture du paiement');
              }
            } catch (error: any) {
              toast({
                title: "Erreur de paiement",
                description: error.message || "Erreur lors de la finalisation du paiement PayPal",
                variant: "destructive"
              });
            }
          },
          onError: (error: any) => {
            console.error('PayPal payment error:', error);
            toast({
              title: "Erreur PayPal",
              description: "Une erreur s'est produite lors du paiement PayPal",
              variant: "destructive"
            });
          }
        }).render('#paypal-button-container');
      }
    }
  }, [paypalOrderId, paypalLoaded, token, toast, queryClient, setLocation, paypalPaymentId]);

  // Handle PayPal payment
  const handlePayPalPayment = async () => {
    if (!planId) {
      toast({
        title: "Plan requis",
        description: "Aucun plan sélectionné.",
        variant: "destructive"
      });
      return;
    }
    
    if (!paypalClientId || paypalClientId === 'your_paypal_client_id') {
      toast({
        title: "PayPal non configuré",
        description: "Le paiement PayPal n'est pas disponible pour le moment. Veuillez réessayer plus tard.",
        variant: "destructive"
      });
      return;
    }

    if (!customerInfo.name || !customerInfo.email) {
      toast({
        title: "Informations requises",
        description: "Nom et email sont requis.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsProcessing(true);

      // Create PayPal order
      const csrfToken = await getCSRFToken();
      const res = await fetch('/api/subscription/create-payment-paypal', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(csrfToken ? { 'x-csrf-token': csrfToken } : {}),
        },
        body: JSON.stringify({ planId, customerInfo }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la création du paiement PayPal');

      if (data.orderId) {
        setPaypalOrderId(data.orderId);
        setPaypalPaymentId(data.paymentId);
        // Load PayPal SDK if not loaded
        if (!paypalLoaded) {
          await loadPayPalSDK();
        }
        // The PayPal button will be rendered when orderId is set
      }
    } catch (error: any) {
      toast({
        title: "Erreur PayPal",
        description: error.message || "Erreur lors de l'initialisation du paiement PayPal",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const loadPayPalSDK = () => {
    return new Promise((resolve) => {
      if (window.paypal) {
        setPaypalLoaded(true);
        resolve(true);
        return;
      }

      if (!paypalClientId) {
        console.error("PayPal client ID not available");
        resolve(false);
        return;
      }

      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=${paypalClientId}&currency=USD&intent=capture`;
      script.onload = () => {
        setPaypalLoaded(true);
        resolve(true);
      };
      script.onerror = () => {
        console.error("Failed to load PayPal SDK");
        resolve(false);
      };
      document.head.appendChild(script);
    });
  };

  const getCSRFToken = async () => {
    try {
      const res = await fetch('/api/csrf-token', {
        credentials: 'include',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await res.json();
      return data.csrfToken;
    } catch {
      return null;
    }
  };

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!isAuthenticated) {
      setLocation(`/login?redirect=/paypal-payment?plan=${planId}`);
    }
  }, [isAuthenticated, setLocation, planId]);

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        <Card>
          <CardHeader>
            <CardTitle>Connexion requise</CardTitle>
            <CardDescription>Vous devez être connecté pour effectuer un paiement.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Redirection vers la page de connexion...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedPlan = plans?.[planId];

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Paiement PayPal</h1>
        <p className="text-muted-foreground">Finalisez votre abonnement en toute sécurité avec PayPal</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Payment Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informations de facturation</CardTitle>
            <CardDescription>Remplissez vos informations pour procéder au paiement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nom complet *</label>
                <input
                  type="text"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo((p) => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Votre nom complet"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email *</label>
                <input
                  type="email"
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo((p) => ({ ...p, email: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="votre@email.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Téléphone (optionnel)</label>
                <input
                  type="text"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo((p) => ({ ...p, phone: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="+221 XX XXX XX XX"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Résumé de la commande</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedPlan ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">Plan {selectedPlan.name}</h3>
                      <p className="text-sm text-muted-foreground">Abonnement mensuel</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">
                        {selectedPlan.amount.toLocaleString('fr-FR')} {selectedPlan.currency}
                      </p>
                      <p className="text-sm text-muted-foreground">par mois</p>
                    </div>
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span>{selectedPlan.amount.toLocaleString('fr-FR')} {selectedPlan.currency}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p>Chargement des détails du plan...</p>
              )}
            </CardContent>
          </Card>

          {/* PayPal Payment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                Paiement sécurisé avec PayPal
              </CardTitle>
              <CardDescription>
                PayPal vous permet de payer en toute sécurité avec votre compte PayPal ou votre carte bancaire.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {paypalOrderId ? (
                  <div className="flex flex-col items-center gap-4">
                    <p className="text-center text-muted-foreground">
                      Cliquez sur le bouton ci-dessous pour payer avec PayPal
                    </p>
                    <div id="paypal-button-container" className="w-full"></div>
                  </div>
                ) : (
                  <Button 
                    className="w-full py-6 text-lg" 
                    size="lg" 
                    disabled={isProcessing} 
                    onClick={handlePayPalPayment}
                  >
                    {isProcessing ? (
                      <span className="inline-flex items-center">
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        <span>Traitement…</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center">
                        <CreditCard className="w-5 h-5 mr-2" />
                        <span>Payer avec PayPal</span>
                      </span>
                    )}
                  </Button>
                )}
                
                <p className="text-xs text-center text-muted-foreground">
                  En cliquant sur "Payer avec PayPal", vous acceptez nos{' '}
                  <a href="/terms" className="underline">conditions d'utilisation</a> et notre{' '}
                  <a href="/privacy" className="underline">politique de confidentialité</a>.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PayPalPaymentPage;