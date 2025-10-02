import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";
import PayPalButton from "./PayPalButton";

const plans = [
  { key: "basic", name: "Basic", price: 2000 },
  { key: "standard", name: "Standard", price: 3000 },
  { key: "premium", name: "Premium", price: 4000 }
];

export default function Payment() {
  const { user, isAuthenticated, token } = useAuth();
  const { toast } = useToast();
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    email: "",
    phone: ""
  });
  const [providers, setProviders] = useState({ paypal: false });
  const [selectedPlan, setSelectedPlan] = useState(null);

  // Prefill customer info from user data
  useEffect(() => {
    if (user) {
      setCustomerInfo({
        name: user.username || "",
        email: user.email || "",
        phone: ""
      });
    }
  }, [user]);

  // Fetch available payment providers
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const res = await axios.get("/api/subscription/payment-providers");
        // Ne garder que PayPal
        setProviders({ paypal: res.data.paypal });
      } catch (error) {
        console.error("Error fetching payment providers:", error);
      }
    };
    fetchProviders();
  }, []);

  // Fetch CSRF token required by backend security middleware
  const getCSRFToken = async () => {
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

  const handlePayment = async (planKey) => {
    // Validate customer info
    if (!customerInfo.name || !customerInfo.email) {
      toast({
        title: "Informations requises",
        description: "Veuillez remplir votre nom et votre email.",
        variant: "destructive"
      });
      return;
    }

    // Pour PayPal, on définit le plan sélectionné
    setSelectedPlan(planKey);
  };

  const handlePaymentSuccess = () => {
    toast({
      title: "Paiement réussi",
      description: "Paiement réussi ! Votre abonnement a été activé.",
    });
    // Reset the form
    setStatus("");
    setSelectedPlan(null);
  };

  const handlePaymentError = (error) => {
    toast({
      title: "Erreur de paiement",
      description: "Erreur lors du paiement: " + error,
      variant: "destructive"
    });
    setLoading(false);
  };

  if (!isAuthenticated) {
    return (
      <div style={{ padding: "20px", fontFamily: "Arial, sans-serif", textAlign: "center" }}>
        <h1>Connexion requise</h1>
        <p>Vous devez être connecté pour effectuer un paiement.</p>
        <a href="/login" style={{ color: "#007bff", textDecoration: "none" }}>
          Cliquez ici pour vous connecter
        </a>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1>Choisissez un plan d'abonnement :</h1>
      
      {/* Customer Info Form */}
      <div style={{ 
        border: "1px solid #ddd", 
        borderRadius: "8px", 
        padding: "20px", 
        marginBottom: "20px",
        backgroundColor: "#f8f9fa"
      }}>
        <h2>Informations de facturation</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginTop: "15px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Nom complet *</label>
            <input
              type="text"
              value={customerInfo.name}
              onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                fontSize: "16px"
              }}
              placeholder="Votre nom complet"
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Email *</label>
            <input
              type="email"
              value={customerInfo.email}
              onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                fontSize: "16px"
              }}
              placeholder="votre@email.com"
            />
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <label style={{ display: "block", marginBottom: "5px", fontWeight: "bold" }}>Téléphone (optionnel)</label>
            <input
              type="text"
              value={customerInfo.phone}
              onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                fontSize: "16px"
              }}
              placeholder="+221 XX XXX XX XX"
            />
          </div>
        </div>
      </div>

      {/* Plan Selection */}
      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
        {plans.map(plan => (
          <div
            key={plan.key}
            style={{
              border: "1px solid #ddd",
              borderRadius: "8px",
              padding: "20px",
              width: "300px",
              textAlign: "center",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
            }}
          >
            <h2>{plan.name}</h2>
            <p style={{ fontSize: "24px", fontWeight: "bold", color: "#007bff" }}>{plan.price} FCFA</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "15px" }}>
              {providers.paypal && (
                <div>
                  <button
                    onClick={() => handlePayment(plan.key)}
                    disabled={loading}
                    style={{
                      backgroundColor: "#0070ba",
                      color: "white",
                      border: "none",
                      padding: "10px 20px",
                      borderRadius: "4px",
                      cursor: loading ? "not-allowed" : "pointer",
                      fontSize: "14px",
                      opacity: loading ? 0.7 : 1,
                      width: "100%",
                      marginBottom: "10px"
                    }}
                  >
                    {loading && selectedPlan === plan.key ? "Traitement..." : "Payer avec PayPal"}
                  </button>
                  {selectedPlan === plan.key && (
                    <PayPalButton
                      planKey={plan.key}
                      customerInfo={customerInfo}
                      onPaymentSuccess={handlePaymentSuccess}
                      onPaymentError={handlePaymentError}
                      loading={loading}
                      setLoading={setLoading}
                    />
                  )}
                </div>
              )}
              {!providers.paypal && (
                <p style={{ color: "#dc3545", fontSize: "14px" }}>Aucun fournisseur de paiement disponible</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}