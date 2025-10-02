import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { plans } from "./plans";
import { paymentService, type CustomerInfo } from "./payment-service";
import { db } from "./db";
import { eq } from "drizzle-orm";
import {
  insertFavoriteSchema,
  insertWatchHistorySchema,
  insertWatchProgressSchema,
  insertUserPreferencesSchema,
  insertContactMessageSchema,
  insertUserSchema,
  insertSubscriptionSchema,
  insertPaymentSchema,
  insertBannerSchema,
  insertCollectionSchema,
  insertContentSchema,
  insertNotificationSchema,
  insertUserSessionSchema,
  insertViewTrackingSchema,
  users,
  payments,
  notifications,
  userSessions,
  viewTracking,
  favorites,
  watchHistory,
  watchProgress,
  userPreferences,
  contactMessages,
  subscriptions,
  banners,
  collections,
  content
} from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { authLimiter, bruteForceProtection, resetLoginAttempts, authenticateToken, csrfProtection, generateCSRFToken } from "./security";
import { sendEmail } from "./mailer";
import { securityLogger } from "./security-logger";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-here-change-in-production";

// Admin middleware
async function requireAdmin(req: any, res: any, next: any) {
  try {
    if (!req.user) {
      securityLogger.logUnauthorizedAccess(req.ip || 'unknown', req.path);
      return res.status(401).json({ error: "Non authentifié" });
    }
    
    // Check if user is admin by fetching from database
    const user = await storage.getUserById(req.user.userId);
    if (!user || user.role !== "admin") {
      securityLogger.logUnauthorizedAccess(req.ip || 'unknown', req.path, req.user.userId);
      return res.status(403).json({ error: "Accès administrateur requis" });
    }
    
    securityLogger.logAdminAccess(req.user.userId, req.ip || 'unknown', `Accessed ${req.path}`);
    next();
  } catch (error) {
    console.error("Error checking admin status:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Create HTTP server
  const server = createServer(app);
  
  // Apply authentication middleware to all routes
  app.use(authenticateToken);
  
  // Apply CSRF protection to all routes
  app.use(csrfProtection);
  
  // Get available payment providers
  app.get("/api/subscription/payment-providers", async (req: any, res: any) => {
    try {
      const providers = {
        paypal: paymentService.isPayPalConfigured()
      };
      res.json(providers);
    } catch (error) {
      console.error("Error fetching payment providers:", error);
      res.status(500).json({ error: "Failed to fetch payment providers" });
    }
  });

  // Get PayPal client ID for frontend
  app.get("/api/paypal/client-id", async (req: any, res: any) => {
    try {
      const clientId = paymentService.getPayPalClientId();
      res.json({ clientId });
    } catch (error) {
      console.error("Error fetching PayPal client ID:", error);
      res.status(500).json({ error: "Failed to fetch PayPal client ID" });
    }
  });

  // Test PayPal configuration
  app.get("/api/paypal/test", async (req: any, res: any) => {
    try {
      const result = await paymentService.testPayPalConfiguration();
      res.json(result);
    } catch (error: any) {
      console.error("PayPal test error:", error);
      res.status(500).json({ configured: false, error: error.message });
    }
  });

  // Capture PayPal payment
  app.post("/api/subscription/capture-paypal/:paymentId", async (req: any, res: any) => {
    try {
      if (!req.user) {
        securityLogger.logUnauthorizedAccess(req.ip || 'unknown', req.path);
        return res.status(401).json({ error: "Non authentifié" });
      }

      const { paymentId } = req.params;
      const { orderId } = req.body;

      // Capture the PayPal order
      const captureResult = await paymentService.capturePayPalPayment(orderId);

      if (captureResult.success) {
        // Update payment status in database
        await storage.updatePaymentStatus(paymentId, 'success');

        // Activate subscription
        const payment = await storage.getPaymentById(paymentId);
        if (payment && (payment.paymentData as any)?.planId) {
          const planId = (payment.paymentData as any).planId;
          const selectedPlan = plans[planId as keyof typeof plans];
          if (selectedPlan) {
            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + selectedPlan.duration);

            await storage.createSubscription({
              userId: req.user.userId,
              planId,
              amount: selectedPlan.amount,
              paymentMethod: 'paypal',
              status: 'active',
              startDate,
              endDate
            });
          }
        }

        res.json({ status: 'COMPLETED', paymentId });
      } else {
        res.status(400).json({ error: captureResult.error });
      }
    } catch (error: any) {
      console.error("Error capturing PayPal payment:", error);
      res.status(500).json({ error: error.message || "Erreur lors de la capture du paiement PayPal" });
    }
  });

  // Create payment invoice for subscription
  app.post("/api/subscription/create-payment", async (req: any, res: any) => {
    try {
      if (!req.user) {
        securityLogger.logUnauthorizedAccess(req.ip || 'unknown', req.path);
        return res.status(401).json({ error: "Non authentifié" });
      }

      const { planId, customerInfo } = req.body || {};
      if (!planId) {
        return res.status(400).json({ error: "Plan ID requis" });
      }

      const plan = plans[planId as keyof typeof plans];
      if (!plan) {
        return res.status(400).json({ error: "Plan invalide" });
      }

      const user = await storage.getUserById(req.user.userId);
      if (!user) {
        return res.status(401).json({ error: "Non authentifié" });
      }

      const info: CustomerInfo = {
        name: customerInfo?.name || user.username,
        email: customerInfo?.email || user.email,
        phone: customerInfo?.phone || "",
      };

      const result = await paymentService.createPayment(planId, info, user.id);
      return res.json(result);
    } catch (error: any) {
      console.error("Erreur lors de la création du paiement:", error);
      return res.status(500).json({ error: error?.message || "Erreur lors de la création du paiement" });
    }
  });

  // Check payment status
  app.get("/api/subscription/check-payment/:paymentId", async (req: any, res: any) => {
    try {
      const { paymentId } = req.params;
      if (!paymentId) {
        return res.status(400).json({ error: "Payment ID requis" });
      }

      const status = await paymentService.checkPaymentStatus(paymentId);
      return res.json(status);
    } catch (error: any) {
      console.error("Erreur lors de la vérification du paiement:", error);
      return res.status(500).json({ error: error?.message || "Erreur lors de la vérification du paiement" });
    }
  });

  // Handle PayPal webhook
  app.post("/api/webhook/paypal", async (req: any, res: any) => {
    try {
      console.log("PayPal webhook received:", req.body);
      
      // For now, we'll process all webhooks without verification
      // In production, you should verify the webhook signature
      
      // Process the webhook event
      const event = req.body;
      const eventType = event.event_type;
      
      console.log(`Processing PayPal event: ${eventType}`);
      
      switch (eventType) {
        case 'PAYMENT.CAPTURE.COMPLETED':
          // Payment completed successfully
          await handlePayPalPaymentCompleted(event);
          break;
          
        case 'PAYMENT.CAPTURE.DENIED':
          // Payment was denied
          await handlePayPalPaymentDenied(event);
          break;
          
        case 'PAYMENT.CAPTURE.REFUNDED':
          // Payment was refunded
          await handlePayPalPaymentRefunded(event);
          break;
          
        case 'BILLING.SUBSCRIPTION.CREATED':
          // Subscription created
          await handlePayPalSubscriptionCreated(event);
          break;
          
        case 'BILLING.SUBSCRIPTION.CANCELLED':
          // Subscription cancelled
          await handlePayPalSubscriptionCancelled(event);
          break;
          
        default:
          console.log(`Unhandled PayPal event type: ${eventType}`);
      }
      
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error processing PayPal webhook:", error);
      res.status(500).json({ error: "Failed to process webhook" });
    }
  });

  // Handle PayPal payment completed
  async function handlePayPalPaymentCompleted(event: any) {
    try {
      const resource = event.resource;
      const customId = resource.custom_id;
      
      if (!customId) {
        console.error("No custom_id found in PayPal event");
        return;
      }
      
      // Parse custom_id to get user info
      let customData;
      try {
        customData = JSON.parse(customId);
      } catch (e) {
        console.error("Failed to parse custom_id:", customId);
        return;
      }
      
      const { userId, planId } = customData;
      
      if (!userId || !planId) {
        console.error("Missing userId or planId in custom data:", customData);
        return;
      }
      
      // Get plan information
      const selectedPlan = plans[planId as keyof typeof plans];
      if (!selectedPlan) {
        console.error("Invalid plan ID:", planId);
        return;
      }
      
      // Calculate end date
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + selectedPlan.duration);
      
      // Create subscription
      const newSubscription = await storage.createSubscription({
        userId: userId,
        planId: planId,
        amount: selectedPlan.amount,
        paymentMethod: 'paypal',
        status: 'active',
        startDate,
        endDate
      });
      
      // Update payment status
      const payments = await storage.getPayments();
      const payment = payments.find(p => p.userId === userId && p.status === 'pending');
      if (payment) {
        await storage.updatePaymentStatus(payment.id, 'success');
      }
      
      console.log("Subscription activated for user:", userId);
    } catch (error) {
      console.error("Error handling PayPal payment completed:", error);
    }
  }

  // Handle PayPal payment denied
  async function handlePayPalPaymentDenied(event: any) {
    try {
      const resource = event.resource;
      const customId = resource.custom_id;
      
      if (!customId) {
        console.error("No custom_id found in PayPal event");
        return;
      }
      
      // Parse custom_id to get user info
      let customData;
      try {
        customData = JSON.parse(customId);
      } catch (e) {
        console.error("Failed to parse custom_id:", customId);
        return;
      }
      
      const { userId } = customData;
      
      if (!userId) {
        console.error("Missing userId in custom data:", customData);
        return;
      }
      
      // Update payment status
      const payments = await storage.getPayments();
      const payment = payments.find(p => p.userId === userId && p.status === 'pending');
      if (payment) {
        await storage.updatePaymentStatus(payment.id, 'failed');
      }
      
      console.log("PayPal payment denied for user:", userId);
    } catch (error) {
      console.error("Error handling PayPal payment denied:", error);
    }
  }

  // Handle PayPal payment refunded
  async function handlePayPalPaymentRefunded(event: any) {
    try {
      const resource = event.resource;
      const customId = resource.custom_id;
      
      if (!customId) {
        console.error("No custom_id found in PayPal event");
        return;
      }
      
      // Parse custom_id to get user info
      let customData;
      try {
        customData = JSON.parse(customId);
      } catch (e) {
        console.error("Failed to parse custom_id:", customId);
        return;
      }
      
      const { userId } = customData;
      
      if (!userId) {
        console.error("Missing userId in custom data:", customData);
        return;
      }
      
      // Update payment status
      const payments = await storage.getPayments();
      const payment = payments.find(p => p.userId === userId && p.status === 'success');
      if (payment) {
        await storage.updatePaymentStatus(payment.id, 'refunded');
      }
      
      console.log("PayPal payment refunded for user:", userId);
    } catch (error) {
      console.error("Error handling PayPal payment refunded:", error);
    }
  }

  // Handle PayPal subscription created
  async function handlePayPalSubscriptionCreated(event: any) {
    try {
      console.log("PayPal subscription created:", event);
      // Handle subscription creation logic here if needed
    } catch (error) {
      console.error("Error handling PayPal subscription created:", error);
    }
  }

  // Handle PayPal subscription cancelled
  async function handlePayPalSubscriptionCancelled(event: any) {
    try {
      console.log("PayPal subscription cancelled:", event);
      // Handle subscription cancellation logic here if needed
    } catch (error) {
      console.error("Error handling PayPal subscription cancelled:", error);
    }
  }

  return server;
}