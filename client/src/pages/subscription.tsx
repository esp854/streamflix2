import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// PayPal global type
declare global {
  interface Window {
    paypal?: any;
  }
}

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/auth-context";

import { Check, Info, Loader2, Shield, Star, Crown, Zap, X, CreditCard, Clock, QrCode } from "lucide-react";
import PlanFeatureComparison from "@/components/PlanFeatureComparison";

interface BackendPlan {
  amount: number;
  currency: string; // e.g. "XOF"
  name: string; // e.g. "Premium"
  duration: number; // in days
  description?: string;
}

interface PlansResponse {
  [key: string]: BackendPlan;
}

interface CustomerInfo {
  name: string;
  email: string;
  phone?: string;
}

interface SubscribeResponse {
  success?: boolean;
  message?: string;
  subscription?: any;
  paymentLink?: string;
  approval_url?: string;
  error?: string;
}

const planIcons: Record<string, React.ReactNode> = {
  free: <Shield className="w-6 h-6" />,
  basic: <Shield className="w-6 h-6" />,
  standard: <Star className="w-6 h-6" />,
  premium: <Crown className="w-6 h-6" />,
  vip: <Zap className="w-6 h-6" />,
};

const planColors: Record<string, string> = {
  free: "border-gray-200",
  basic: "border-gray-200",
  standard: "border-blue-500 ring-2 ring-blue-200",
  premium: "border-yellow-500 ring-2 ring-yellow-200",
  vip: "border-purple-500 ring-2 ring-purple-200",
};

const planFeatures: Record<string, { text: string; available: boolean }[]> = {
  free: [
    { text: "Accès limité au contenu", available: true },
    { text: "Qualité Standard (SD)", available: true },
    { text: "1 appareil simultané", available: true },
    { text: "Avec publicités", available: true },
    { text: "Téléchargement", available: false },
    { text: "Contenu exclusif", available: false },
    { text: "Support client", available: false },
    { text: "Support prioritaire", available: false },
  ],
  basic: [
    { text: "Accès à tout le contenu", available: true },
    { text: "Qualité Standard (SD)", available: true },
    { text: "1 appareil simultané", available: true },
    { text: "Support client", available: true },
    { text: "Téléchargement", available: false },
    { text: "Contenu exclusif", available: false },
    { text: "Support prioritaire", available: false },
    { text: "Sans publicités", available: true },
  ],
  standard: [
    { text: "Accès à tout le contenu", available: true },
    { text: "Qualité HD", available: true },
    { text: "2 appareils simultanés", available: true },
    { text: "Téléchargement hors ligne", available: true },
    { text: "Support prioritaire", available: true },
    { text: "Contenu exclusif", available: false },
    { text: "Accès anticipé", available: false },
    { text: "Sans publicités", available: true },
  ],
  premium: [
    { text: "Accès à tout le contenu", available: true },
    { text: "Qualité 4K Ultra HD", available: true },
    { text: "4 appareils simultanés", available: true },
    { text: "Téléchargement illimité", available: true },
    { text: "Support VIP 24/7", available: true },
    { text: "Contenu exclusif", available: true },
    { text: "Accès anticipé", available: false },
    { text: "Sans publicités", available: true },
  ],
  vip: [
    { text: "Accès à tout le contenu", available: true },
    { text: "Qualité 4K Ultra HD", available: true },
    { text: "Appareils illimités", available: true },
    { text: "Téléchargement illimité", available: true },
    { text: "Support VIP 24/7", available: true },
    { text: "Contenu exclusif", available: true },
    { text: "Accès anticipé aux nouveautés", available: true },
    { text: "Sans publicités", available: true },
  ],
};

function SubscriptionPage() {
  const { toast } = useToast();
  const { user, isAuthenticated, token } = useAuth();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: "",
    email: "",
    phone: "",
  });
  const [providers, setProviders] = useState({ lygos: false, paypal: false });
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

  // Fetch available payment providers and PayPal client ID
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const res = await fetch("/api/subscription/payment-providers");
        if (res.ok) {
          const data = await res.json();
          setProviders(data);
        }
      } catch (error) {
        console.error("Error fetching payment providers:", error);
      }
    };

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

    fetchProviders();
    fetchPayPalClientId();
  }, []);

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
                setLocation('/'); // Redirect to home
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
  }, [paypalOrderId, paypalLoaded, token, toast, queryClient, setLocation]);

  // Plans
  const {
    data: plans,
    isLoading: plansLoading,
    isError: plansError,
    refetch: refetchPlans,
  } = useQuery<PlansResponse>({
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

  // Current subscription
  const { data: current, refetch: refetchCurrent } = useQuery({
    queryKey: ["current-subscription"],
    queryFn: async () => {
      const token = localStorage.getItem("auth_token");
      const res = await fetch("/api/subscription/current", {
        credentials: "include",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error("Failed to fetch current subscription");
      return res.json();
    },
    enabled: isAuthenticated,
  });

  // Payment history
  const { data: history } = useQuery({
    queryKey: ["payment-history"],
    queryFn: async () => {
      const token = localStorage.getItem("auth_token");
      const res = await fetch("/api/subscription/payment-history", {
        credentials: "include",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) throw new Error("Failed to fetch payment history");
      return res.json();
    },
    enabled: isAuthenticated,
  });

  const availablePlans = useMemo(() => {
    if (!plans) return [] as [string, BackendPlan][];
    
    // Filter out free plan for authenticated users
    if (isAuthenticated) {
      return Object.entries(plans).filter(([id]) => id !== "free") as [string, BackendPlan][];
    }
    
    // For unauthenticated users, show all plans including free
    return Object.entries(plans) as [string, BackendPlan][];
  }, [plans, isAuthenticated]);

  const createPayment = useMutation({
    mutationFn: async ({ planId, provider }: { planId: string; provider: string }) => {
      // Fetch CSRF token if authenticated
      const token = localStorage.getItem("auth_token");
      let csrfToken = "";
      try {
        const csrfRes = await fetch("/api/csrf-token", {
          method: "GET",
          credentials: "include",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          }
        });
        if (csrfRes.ok) {
          const j = await csrfRes.json();
          csrfToken = j.csrfToken || "";
        }
      } catch {}

      // For free plans, use the dedicated endpoint
      if (plans && plans[planId]?.amount === 0) {
        const res = await fetch("/api/subscription/create-free", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
          },
          body: JSON.stringify({ planId, customerInfo }),
        });
        const data: SubscribeResponse = await res.json().catch(() => ({} as any));
        if (!res.ok) throw new Error(data.error || data.message || "Erreur lors de l'activation de l'abonnement gratuit");
        return data;
      }

      // For paid plans, use the specific provider endpoint
      const endpoint = provider === 'paypal' ? '/api/subscription/create-payment-paypal' : '/api/subscription/create-payment-lygos';
      const res = await fetch(endpoint, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
        },
        body: JSON.stringify({ planId, customerInfo }),
      });
      const data: SubscribeResponse = await res.json().catch(() => ({} as any));
      if (!res.ok) throw new Error(data.error || data.message || "Erreur paiement");
      return data;
    },
    onSuccess: async (data) => {
      if (!mountedRef.current) return;

      // Open payment link if it exists (for paid plans)
      if (data.paymentLink) {
        try { 
          window.open(data.paymentLink, "_blank"); 
        } catch (e) {
          // Fallback if popup blocked
          toast({ 
            title: "Paiement requis", 
            description: "Veuillez suivre les instructions de paiement qui vont s'ouvrir dans une nouvelle fenêtre.",
            variant: "default"
          });
        }
      }

      // Refresh current subscription
      await queryClient.invalidateQueries({ queryKey: ["current-subscription"] });
      toast({ 
        title: "Demande effectuée", 
        description: data.message || "Votre demande d'abonnement a été prise en compte." 
      });
      setIsProcessing(false);
    },
    onError: (err: any) => {
      if (!mountedRef.current) return;
      setIsProcessing(false);
      toast({ 
        title: "Erreur", 
        description: err?.message || "Impossible de créer le paiement", 
        variant: "destructive" 
      });
    },
  });

  const onChoosePlan = (planId: string) => {
    if (!isAuthenticated) {
      setLocation("/login?redirect=/subscription");
      return;
    }
    setSelectedPlan(planId);
  };

  const onPay = async () => {
    if (!selectedPlan) {
      toast({
        title: "Plan requis",
        description: "Veuillez sélectionner un plan.",
        variant: "destructive"
      });
      return;
    }
    if (!selectedProvider) {
      toast({
        title: "Fournisseur requis",
        description: "Veuillez sélectionner un fournisseur de paiement.",
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

    if (selectedProvider === 'paypal') {
      // Handle PayPal payment directly on site
      await handlePayPalPayment();
    } else {
      // Handle Lygos payment
      setIsProcessing(true);
      createPayment.mutate({ planId: selectedPlan, provider: selectedProvider });
    }
  };

  const handlePayPalPayment = async () => {
    if (!paypalClientId || paypalClientId === 'your_paypal_client_id') {
      toast({
        title: "PayPal non configuré",
        description: "Le paiement PayPal n'est pas disponible pour le moment. Veuillez réessayer plus tard ou utiliser une autre méthode.",
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
        body: JSON.stringify({ planId: selectedPlan, customerInfo }),
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

  const isFreePlan = (planId: string) => {
    return plans && plans[planId]?.amount === 0;
  };

  const renderPlans = () => {
    if (plansLoading) {
      return (
        <div className="flex justify-center items-center min-h-[240px]">
          <div className="flex items-center">
            <div className="loader-wrapper">
              <Loader2 className="w-6 h-6 animate-spin mr-2"/>
            </div>
            <span>Chargement des plans…</span>
          </div>
        </div>
      );
    }
    if (plansError) {
      return (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-red-600">Erreur</CardTitle>
            <CardDescription>Impossible de récupérer les plans d'abonnement.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => refetchPlans()}>
              <div className="loader-wrapper">
                <Loader2 className="w-4 h-4 mr-2"/>
              </div>
              <span>Réessayer</span>
            </Button>
          </CardContent>
        </Card>
      );
    }
    if (!availablePlans.length) {
      return (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Aucun plan disponible</CardTitle>
            <CardDescription>Aucun plan d'abonnement n'est actuellement disponible.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" onClick={() => refetchPlans()}>
              <span>Recharger la page</span>
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {availablePlans.map(([planId, plan]) => {
          const icon = planIcons[planId] ?? <Shield className="w-6 h-6"/>;
          const color = selectedPlan === planId ? (planColors[planId] ?? "border-gray-200") : "border-gray-200";
          const features = planFeatures[planId] ?? [];

          return (
            <Card 
              key={planId} 
              className={`relative transition-all cursor-pointer hover:shadow-lg ${color}`} 
              onClick={() => onChoosePlan(planId)}
            >
              {planId === "standard" && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-blue-600 text-white">Populaire</Badge>
                </div>
              )}
              {planId === "premium" && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-yellow-600 text-white">Recommandé</Badge>
                </div>
              )}
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-3 rounded-full bg-gray-100 w-16 h-16 flex items-center justify-center">
                  {icon}
                </div>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description ?? `Accès ${planId}`}</CardDescription>
                <div className="mt-4">
                  {plan.amount > 0 ? (
                    <>
                      <span className="text-4xl font-bold">{plan.amount.toLocaleString('fr-FR')}</span>
                      <span className="text-muted-foreground ml-1">{plan.currency}/mois</span>
                    </>
                  ) : (
                    <span className="text-4xl font-bold">Gratuit</span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6 min-h-[180px]">
                  {features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      {f.available ? <Check className="w-4 h-4 text-green-600 mt-0.5"/> : <X className="w-4 h-4 text-red-500 mt-0.5"/>}
                      <span className={f.available ? "" : "text-muted-foreground line-through"}>{f.text}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  className="w-full" 
                  variant={selectedPlan === planId ? "default" : "outline"} 
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    onChoosePlan(planId); 
                  }}
                >
                  {selectedPlan === planId ? "Sélectionné" : "Choisir ce plan"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Choisissez votre plan</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Profitez d'un streaming illimité avec nos plans flexibles. Changez ou annulez à tout moment.
        </p>
        {!isAuthenticated && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg max-w-2xl mx-auto">
            <p className="text-blue-800">
              <span className="font-medium">Note :</span> Vous devez être connecté pour vous abonner.
              <Button className="ml-3" size="sm" onClick={() => setLocation('/login?redirect=/subscription')}>Se connecter</Button>
            </p>
          </div>
        )}
      </div>

      {/* Current subscription */}
      {current?.subscription && (
        <Card className="mb-8 bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-800 flex items-center gap-2">
              <Check className="w-5 h-5"/> Abonnement actuel
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="font-medium">Plan {String(current.subscription.planId).charAt(0).toUpperCase() + String(current.subscription.planId).slice(1)}</p>
              <p className="text-sm text-muted-foreground">Expire le {new Date(current.subscription.endDate).toLocaleDateString('fr-FR')}</p>
            </div>
            <Badge variant="outline" className="bg-green-100 text-green-800">Actif</Badge>
          </CardContent>
        </Card>
      )}

      {/* Plans */}
      <div className="mb-12">{renderPlans()}</div>

      {/* Feature comparison */}
      <Card className="mb-12">
        <CardHeader>
          <CardTitle>Comparaison des fonctionnalités</CardTitle>
          <CardDescription>Comparez les fonctionnalités disponibles dans chaque plan</CardDescription>
        </CardHeader>
        <CardContent>
          <PlanFeatureComparison currentPlanId={current?.subscription?.planId} />
        </CardContent>
      </Card>

      {/* Customer info form + payment */}
      {selectedPlan && (
        <>
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Informations de facturation</CardTitle>
              <CardDescription>Remplissez vos informations pour procéder au paiement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nom complet *</Label>
                  <Input id="name" value={customerInfo.name} onChange={(e) => setCustomerInfo((p) => ({ ...p, name: e.target.value }))} placeholder="Votre nom complet" required />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" type="email" value={customerInfo.email} onChange={(e) => setCustomerInfo((p) => ({ ...p, email: e.target.value }))} placeholder="votre@email.com" required />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="phone">Téléphone (optionnel)</Label>
                  <Input id="phone" value={customerInfo.phone} onChange={(e) => setCustomerInfo((p) => ({ ...p, phone: e.target.value }))} placeholder="+221 XX XXX XX XX" />
                </div>

                <div className="md:col-span-2">
                  <Label className="text-base font-medium">Choisissez votre méthode de paiement</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    {providers.lygos && (
                      <div
                        className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                          selectedProvider === 'lygos' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-300'
                        }`}
                        onClick={() => setSelectedProvider('lygos')}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-sm">L</span>
                          </div>
                          <div>
                            <h4 className="font-medium">Lygos</h4>
                            <p className="text-sm text-muted-foreground">Portefeuille mobile</p>
                          </div>
                        </div>
                        <p className="text-xs mt-2 text-muted-foreground">
                          Orange Money, MTN Mobile Money, Wave
                        </p>
                      </div>
                    )}
                    {providers.paypal && (
                      <div
                        className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                          selectedProvider === 'paypal' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'
                        }`}
                        onClick={() => setSelectedProvider('paypal')}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold text-sm">P</span>
                          </div>
                          <div>
                            <h4 className="font-medium">PayPal</h4>
                            <p className="text-sm text-muted-foreground">Carte bancaire</p>
                          </div>
                        </div>
                        <p className="text-xs mt-2 text-muted-foreground">
                          Visa, Mastercard, PayPal
                        </p>
                      </div>
                    )}
                  </div>
                  {!providers.lygos && !providers.paypal && (
                    <p className="text-red-600 text-sm mt-2">Aucun fournisseur de paiement disponible</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                {isFreePlan(selectedPlan) ? (
                  <>
                    <Shield className="w-6 h-6 text-green-500"/>Activer votre abonnement gratuit
                  </>
                ) : (
                  <>
                    <CreditCard className="w-6 h-6 text-blue-500"/>Finaliser votre abonnement
                  </>
                )}
              </CardTitle>
              <CardDescription>
                {isFreePlan(selectedPlan) 
                  ? "Confirmez vos informations pour activer votre abonnement gratuit" 
                  : selectedProvider === 'paypal' 
                    ? "Paiement sécurisé via PayPal (Visa, Mastercard)" 
                    : "Paiement sécurisé et crypté via Lygos"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Plan {selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)}</p>
                    <p className="text-sm text-muted-foreground">Abonnement mensuel</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">
                      {isFreePlan(selectedPlan) 
                        ? "Gratuit" 
                        : `${plans?.[selectedPlan]?.amount.toLocaleString('fr-FR') ?? '0'} ${plans?.[selectedPlan]?.currency ?? 'FCFA'}`}
                    </p>
                    {!isFreePlan(selectedPlan) && plans?.[selectedPlan] && (
                      <p className="text-sm text-muted-foreground">par mois</p>
                    )}
                  </div>
                </div>

                {isFreePlan(selectedPlan) ? (
                  <div className="flex flex-col items-center gap-2 p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Shield className="w-6 h-6 text-green-500"/>
                      <span className="font-medium">Abonnement gratuit</span>
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      Votre abonnement gratuit sera activé immédiatement après confirmation
                    </p>
                  </div>
                ) : selectedProvider === 'paypal' ? (
                  paypalOrderId ? (
                    <div className="flex flex-col items-center gap-2 p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-6 h-6 text-blue-600"/>
                        <span className="font-medium">Paiement PayPal</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-4">Cliquez sur le bouton ci-dessous pour payer avec PayPal</p>
                      <div id="paypal-button-container"></div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-6 h-6 text-blue-600"/>
                        <span className="font-medium">Paiement PayPal</span>
                      </div>
                      <p className="text-xs text-muted-foreground">Paiement sécurisé via PayPal (Visa, Mastercard)</p>
                    </div>
                  )
                ) : (
                  <div className="flex flex-col items-center gap-2 p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <QrCode className="w-6 h-6 text-green-500"/>
                      <span className="font-medium">Paiement Lygos</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Paiement via portefeuille mobile (Orange Money, MTN, Wave)</p>
                  </div>
                )}

                {(!selectedProvider || selectedProvider !== 'paypal' || !paypalOrderId) && (
                  <Button className="w-full py-6 text-lg" size="lg" disabled={isProcessing} onClick={onPay}>
                    {isProcessing ? (
                      <span className="inline-flex items-center">
                        <div className="loader-wrapper">
                          <Loader2 className="w-5 h-5 animate-spin mr-2"/>
                        </div>
                        <span>Traitement…</span>
                      </span>
                    ) : isFreePlan(selectedPlan) ? (
                      <span className="inline-flex items-center">
                        <Check className="w-5 h-5 mr-2"/>
                        <span>Activer l'abonnement gratuit</span>
                      </span>
                    ) : selectedProvider === 'paypal' ? (
                      <span className="inline-flex items-center">
                        <CreditCard className="w-5 h-5 mr-2"/>
                        <span>Payer avec PayPal</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center">
                        <QrCode className="w-5 h-5 mr-2"/>
                        <span>Payer avec Lygos</span>
                      </span>
                    )}
                  </Button>
                )}

                <p className="text-xs text-center text-muted-foreground">
                  En cliquant sur "{isFreePlan(selectedPlan) ? 'Activer l\'abonnement gratuit' : 'Procéder au paiement'}", vous acceptez nos <a href="/terms" className="underline">conditions d'utilisation</a> et notre <a href="/privacy" className="underline">politique de confidentialité</a>.
                </p>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Payment history */}
      {history?.payments?.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Clock className="w-5 h-5"/>Historique des paiements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {history.payments.slice(0, 5).map((p: any) => (
                <div key={p.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{Number(p.amount).toLocaleString('fr-FR')} {plans?.[selectedPlan]?.currency ?? 'FCFA'}</p>
                    <p className="text-sm text-muted-foreground">{new Date(p.createdAt).toLocaleDateString('fr-FR')} - {p.method}</p>
                  </div>
                  <Badge variant={p.status === 'success' ? 'default' : 'destructive'}>
                    {p.status === 'success' ? 'Réussi' : 'Échec'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default SubscriptionPage;