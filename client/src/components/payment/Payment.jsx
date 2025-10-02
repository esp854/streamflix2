import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "@/contexts/auth-context";
import { useToast } from "@/hooks/use-toast";

const plans = [
  { key: "basic", name: "Basic", price: 2000 },
  { key: "standard", name: "Standard", price: 3000 },
  { key: "premium", name: "Premium", price: 4000 }
];

export default function Payment() {
  const { user, isAuthenticated, token } = useAuth();
  const { toast } = useToast();
  const [qrCode, setQrCode] = useState(null);
  const [paymentId, setPaymentId] = useState(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    email: "",
    phone: ""
  });
  const [providers, setProviders] = useState({ lygos: false, paypal: false });

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
        setProviders(res.data);
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

  const handlePayment = async (planKey, provider) => {
    // Validate customer info
    if (!customerInfo.name || !customerInfo.email) {
      toast({
        title: "Informations requises",
        description: "Veuillez remplir votre nom et votre email.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Use the specific API endpoint for the chosen provider
      const endpoint = provider === 'paypal' ? '/api/subscription/create-payment-paypal' : '/api/subscription/create-payment-lygos';
      const csrfToken = await getCSRFToken();
      const res = await axios.post(endpoint, {
        planId: planKey,
        customerInfo: customerInfo
      }, {
        withCredentials: true, // Include credentials for authentication
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),
        },
      });
      
      console.log("Payment response:", res.data);
      
      // Check what type of response we got
      if (res.data.paymentLink) {
        // Open payment link in new tab
        window.open(res.data.paymentLink, "_blank");
      } else if (res.data.approval_url) {
        // Open approval URL in new tab
        window.open(res.data.approval_url, "_blank");
      } else if (res.data.link) {
        // Open link in new tab (from Lygos API)
        window.open(res.data.link, "_blank");
      } else if (res.data.qrCode) {
        setQrCode(res.data.qrCode);
        setPaymentId(res.data.paymentId || res.data.id);
      } else {
        // If we don't get a payment link, show a message
        toast({
          title: "Paiement initié",
          description: "Votre demande de paiement a été créée. Veuillez suivre les instructions reçues par email.",
        });
      }
      
      setStatus("");
    } catch (error) {
      console.error("Erreur lors de la création du paiement:", error);
      toast({
        title: "Erreur de paiement",
        description: "Erreur lors de la création du paiement: " + (error.response?.data?.error || error.response?.data?.message || error.message),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const checkPayment = async () => {
    if (!paymentId) {
      toast({
        title: "Aucun paiement en cours",
        description: "Aucun paiement en cours à vérifier.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Use the correct API endpoint for checking payment status
      const res = await axios.get(`/api/subscription/check-payment/${paymentId}`, {
        withCredentials: true, // Include credentials for authentication
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      
      console.log("Payment status response:", res.data);
      
      setStatus(res.data.status || res.data.payment_status); // Handle different response formats
      
      // Si le paiement est réussi, activer l'abonnement
      if (res.data.status === "completed" || res.data.payment_status === "completed") {
        toast({
          title: "Paiement réussi",
          description: "Paiement réussi ! Votre abonnement a été activé.",
        });
        // Reset the form
        setQrCode(null);
        setPaymentId(null);
        setStatus("");
      } else {
        toast({
          title: "Statut du paiement",
          description: `Statut actuel : ${res.data.status || res.data.payment_status}`,
        });
      }
    } catch (error) {
      console.error("Erreur lors de la vérification du paiement:", error);
      toast({
        title: "Erreur de vérification",
        description: "Erreur lors de la vérification du paiement: " + (error.response?.data?.error || error.response?.data?.message || error.message),
        variant: "destructive"
      });
    }
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
              {providers.lygos && (
                <button
                  onClick={() => handlePayment(plan.key, 'lygos')}
                  disabled={loading}
                  style={{
                    backgroundColor: "#28a745",
                    color: "white",
                    border: "none",
                    padding: "10px 20px",
                    borderRadius: "4px",
                    cursor: loading ? "not-allowed" : "pointer",
                    fontSize: "14px",
                    opacity: loading ? 0.7 : 1,
                    width: "100%"
                  }}
                >
                  {loading ? "Traitement..." : "Payer avec Lygos"}
                </button>
              )}
              {providers.paypal && (
                <button
                  onClick={() => handlePayment(plan.key, 'paypal')}
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
                    width: "100%"
                  }}
                >
                  {loading ? "Traitement..." : "Payer avec PayPal"}
                </button>
              )}
              {!providers.lygos && !providers.paypal && (
                <p style={{ color: "#dc3545", fontSize: "14px" }}>Aucun fournisseur de paiement disponible</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {qrCode && (
        <div style={{ marginTop: "30px", textAlign: "center" }}>
          <h3>Scannez le QR code pour payer :</h3>
          <img src={qrCode} alt="QR Code paiement" style={{ width: "200px", height: "200px" }} />
          <p>
            <a 
              href={qrCode} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ color: "#007bff", textDecoration: "none" }}
            >
              Ouvrir le QR code dans un nouvel onglet
            </a>
          </p>
          <button 
            onClick={checkPayment}
            style={{
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              padding: "10px 20px",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "16px",
              marginTop: "10px"
            }}
          >
            Vérifier le statut du paiement
          </button>
        </div>
      )}

      {status && (
        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <h3>Statut du paiement : 
            <span style={{ 
              color: status === "completed" ? "#28a745" : 
                     status === "pending" ? "#ffc107" : "#dc3545",
              fontWeight: "bold"
            }}>
              {" "}{status}
            </span>
          </h3>
        </div>
      )}
    </div>
  );
}