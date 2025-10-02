import { useEffect, useRef } from "react";

export default function PayPalButton({
  planKey,
  customerInfo,
  onPaymentSuccess,
  onPaymentError,
  loading,
  setLoading
}) {
  const paypalRef = useRef(null);
  const paypalButtonRef = useRef(null);

  // Fetch PayPal client ID from backend
  const getPayPalClientId = async () => {
    try {
      const res = await fetch("/api/paypal/client-id");
      const data = await res.json();
      return data.clientId;
    } catch (error) {
      console.error("Error fetching PayPal client ID:", error);
      throw new Error("Impossible de récupérer la configuration PayPal");
    }
  };

  // Initialize PayPal button
  useEffect(() => {
    if (!paypalRef.current) return;

    const initializePayPal = async () => {
      try {
        setLoading(true);
        
        // Get PayPal client ID
        const clientId = await getPayPalClientId();
        
        if (!clientId || clientId === "your_paypal_client_id") {
          throw new Error("PayPal n'est pas correctement configuré");
        }

        // Load PayPal SDK if not already loaded
        if (!window.paypal) {
          const script = document.createElement("script");
          script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD`;
          script.async = true;
          script.onload = () => {
            renderPayPalButton();
          };
          script.onerror = () => {
            setLoading(false);
            onPaymentError("Impossible de charger le SDK PayPal");
          };
          document.head.appendChild(script);
        } else {
          renderPayPalButton();
        }
      } catch (error) {
        setLoading(false);
        console.error("Error initializing PayPal:", error);
        onPaymentError(error.message || "Erreur lors de l'initialisation de PayPal");
      }
    };

    const renderPayPalButton = () => {
      if (!window.paypal || !paypalRef.current) return;

      // Clean up previous button
      if (paypalButtonRef.current) {
        paypalButtonRef.current.close();
      }

      // Get plan details
      const plans = {
        basic: { name: "Basic", amount: 2000 },
        standard: { name: "Standard", amount: 3000 },
        premium: { name: "Premium", amount: 4000 }
      };
      
      const selectedPlan = plans[planKey];
      if (!selectedPlan) {
        onPaymentError("Plan invalide");
        setLoading(false);
        return;
      }

      // Convert XOF to USD (approximate rate: 1 USD = 655 XOF)
      const usdAmount = (selectedPlan.amount / 655).toFixed(2);

      // Create new PayPal button
      paypalButtonRef.current = window.paypal.Buttons({
        style: {
          shape: 'rect',
          color: 'gold',
          layout: 'vertical',
          label: 'paypal'
        },
        createOrder: async (data, actions) => {
          try {
            // Create order on backend
            const res = await fetch("/api/subscription/create-payment-paypal", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              credentials: "include",
              body: JSON.stringify({
                planId: planKey,
                customerInfo: customerInfo
              })
            });
            
            const result = await res.json();
            
            if (!res.ok) {
              throw new Error(result.error || "Erreur lors de la création de la commande");
            }
            
            if (result.orderId) {
              return result.orderId;
            } else {
              throw new Error("Impossible de créer la commande PayPal");
            }
          } catch (error) {
            console.error("Error creating PayPal order:", error);
            throw new Error(error.message || "Erreur lors de la création de la commande");
          }
        },
        onApprove: async (data, actions) => {
          try {
            setLoading(true);
            // Capture the payment
            const res = await fetch(`/api/subscription/capture-paypal/${data.orderID}`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              credentials: "include",
              body: JSON.stringify({
                orderId: data.orderID
              })
            });
            
            const result = await res.json();
            
            if (!res.ok) {
              throw new Error(result.error || "Erreur lors de la capture du paiement");
            }
            
            if (result.status === "COMPLETED") {
              onPaymentSuccess();
              
              // Recharger la page après 2 secondes pour refléter l'activation de l'abonnement
              setTimeout(() => {
                window.location.reload();
              }, 2000);
            } else {
              throw new Error("Le paiement n'a pas pu être complété");
            }
          } catch (error) {
            console.error("Error capturing PayPal payment:", error);
            onPaymentError(error.message || "Erreur lors de la capture du paiement");
          } finally {
            setLoading(false);
          }
        },
        onError: (err) => {
          console.error("PayPal error:", err);
          setLoading(false);
          onPaymentError(err.message || "Une erreur s'est produite avec PayPal");
        },
        onCancel: () => {
          setLoading(false);
          onPaymentError("Le paiement a été annulé");
        }
      });

      // Render the button
      paypalButtonRef.current.render(paypalRef.current).then(() => {
        setLoading(false);
      }).catch((error) => {
        setLoading(false);
        console.error("Error rendering PayPal button:", error);
        onPaymentError("Erreur lors de l'affichage du bouton PayPal");
      });
    };

    initializePayPal();

    // Cleanup function
    return () => {
      if (paypalButtonRef.current) {
        paypalButtonRef.current.close();
      }
    };
  }, [planKey, customerInfo, onPaymentSuccess, onPaymentError, setLoading]);

  return (
    <div>
      <div ref={paypalRef} />
      {loading && (
        <div style={{ textAlign: "center", marginTop: "10px" }}>
          Chargement de PayPal...
        </div>
      )}
    </div>
  );
}