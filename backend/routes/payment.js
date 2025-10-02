import express from "express";
import axios from "axios";
const router = express.Router();

const API_KEY = process.env.LYGOS_API_KEY || "VOTRE_API_KEY_LYGOS"; // remplace par ta clé secrète
const LYGOS_SUCCESS_URL = process.env.LYGOS_SUCCESS_URL || "https://streamflix2-o7vx.onrender.com/success";
const LYGOS_CANCEL_URL = process.env.LYGOS_CANCEL_URL || "https://streamflix2-o7vx.onrender.com/cancel";

// Tous les plans disponibles
const plans = [
  { key: "free", name: "Plan Gratuit", price: 0 },
  { key: "basic", name: "Plan Basic", price: 2000 },
  { key: "standard", name: "Plan Standard", price: 3000 },
  { key: "premium", name: "Plan Premium", price: 4000 }
];

// Créer un paiement pour un plan donné
router.post("/create-payment", async (req, res) => {
  const { planKey } = req.body;
  const plan = plans.find(p => p.key === planKey);

  if (!plan) return res.status(400).send("Plan invalide");

  // Générer un order_id unique
  const order_id = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  try {
    // Appel à Create Payment Gateway de Lygos
    const response = await axios.post(
      "https://api.lygosapp.com/v1/gateway",
      {
        amount: plan.price,
        shop_name: "StreamFlix",
        order_id,
        message: `Paiement pour ${plan.name}`,
        success_url: LYGOS_SUCCESS_URL,
        failure_url: LYGOS_CANCEL_URL
      },
      { 
        headers: { 
          "api-key": API_KEY,
          "Content-Type": "application/json"
        } 
      }
    );

    // Retourner les infos au frontend
    res.json({
      paymentLink: response.data.payment_url,
      qrCode: response.data.qr_code_url,
      paymentId: response.data.payment_id
    });

  } catch (error) {
    console.error(error.response?.data || error);
    res.status(500).send("Erreur création paiement");
  }
});

// Vérifier le statut du paiement
router.get("/check-payment/:paymentId", async (req, res) => {
  const paymentId = req.params.paymentId;

  try {
    const response = await axios.get(
      `https://api.lygosapp.com/v1/gateway/${paymentId}`,
      { 
        headers: { 
          "api-key": API_KEY,
          "Content-Type": "application/json"
        } 
      }
    );

    res.json({ status: response.data.status });
  } catch (error) {
    console.error(error.response?.data || error);
    res.status(500).send("Erreur vérification paiement");
  }
});

// Webhook endpoint for Lygos payment notifications
router.post("/webhook/lygos", async (req, res) => {
  try {
    const paymentData = req.body;
    const { id, status } = paymentData;
    
    console.log("Lygos webhook received:", paymentData);
    
    // Process the payment based on status
    if (status === "completed") {
      // TODO: Activate subscription in your database
      // TODO: Send confirmation email
      console.log("Payment completed for payment ID:", id);
    } else if (status === "failed" || status === "cancelled") {
      // TODO: Handle failed payment
      console.log("Payment failed or cancelled for payment ID:", id);
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error("Webhook processing error:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
});

export default router;