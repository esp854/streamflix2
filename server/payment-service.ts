import { plans } from "./plans";
import { storage } from "./storage";

// Define types for our payment service
export interface CustomerInfo {
  name: string;
  email: string;
  phone?: string;
}

export interface PaymentResponse {
  paymentLink?: string;
  qrCode?: string;
  paymentId?: string;
  orderId?: string;
  success?: boolean;
  approval_url?: string;
  error?: string;
  message?: string;
}

export interface PaymentStatus {
  id: string;
  status: string;
  amount: number;
  currency: string;
  custom_data?: any;
}

// Payment service class to handle different payment providers
export class PaymentService {
  private paypalClientId: string;
  private paypalClientSecret: string;
  private paypalMode: string;
  private clientUrl: string;

  constructor() {
    this.paypalClientId = process.env.PAYPAL_CLIENT_ID || '';
    this.paypalClientSecret = process.env.PAYPAL_CLIENT_SECRET || '';
    this.paypalMode = process.env.PAYPAL_MODE || 'live';
    this.clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  }

  // Check if the payment service is properly configured
  isConfigured(): boolean {
    return this.isPayPalConfigured();
  }

  // Check if PayPal is configured
  isPayPalConfigured(): boolean {
    return !!(this.paypalClientId && this.paypalClientSecret);
  }

  // Get PayPal client ID for frontend
  getPayPalClientId(): string {
    return this.paypalClientId;
  }

  // Test PayPal configuration
  async testPayPalConfiguration(): Promise<{ configured: boolean; accessToken?: boolean; error?: string }> {
    try {
      const configured = this.isPayPalConfigured();
      if (!configured) {
        return { configured: false };
      }

      const accessToken = await this.getPayPalAccessToken();
      return { configured: true, accessToken: !!accessToken };
    } catch (error: any) {
      return { configured: false, error: error.message };
    }
  }

  // Generic create payment method that uses PayPal
  async createPayment(
    planId: string,
    customerInfo: CustomerInfo,
    userId: string
  ): Promise<PaymentResponse> {
    // Utiliser PayPal
    console.log('Using PayPal for payment');
    return this.createPayPalPayment(planId, customerInfo, userId);
  }

  // Generic check payment status method
  async checkPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    // Utiliser PayPal
    return this.checkPayPalPaymentStatus(paymentId);
  }

  // Create a payment using PayPal
  async createPayPalPayment(
    planId: string,
    customerInfo: CustomerInfo,
    userId: string
  ): Promise<PaymentResponse> {
    try {
      console.log('Starting PayPal payment creation for plan:', planId);

      // Validate plan
      if (!plans[planId as keyof typeof plans]) {
        throw new Error("Plan invalide");
      }

      const selectedPlan = plans[planId as keyof typeof plans];
      console.log('Selected plan:', selectedPlan);

      // For free plans, no payment is needed
      if (selectedPlan.amount === 0) {
        return {
          success: true,
          message: 'Abonnement gratuit activé avec succès'
        };
      }

      // Check if PayPal is configured
      if (!this.paypalClientId || !this.paypalClientSecret) {
        console.error('PayPal not configured:', { clientId: !!this.paypalClientId, clientSecret: !!this.paypalClientSecret });
        throw new Error("PayPal non configuré");
      }

      console.log('Getting PayPal access token...');
      const accessToken = await this.getPayPalAccessToken();
      console.log('Access token obtained:', !!accessToken);

      // Convert XOF to USD (approximate rate: 1 USD = 655 XOF)
      const usdAmount = (selectedPlan.amount / 655).toFixed(2);
      console.log('Converted amount:', selectedPlan.amount, 'XOF ->', usdAmount, 'USD');

      // Create order using PayPal Orders API v2
      const orderData = {
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: 'USD',
            value: usdAmount
          },
          description: `Abonnement ${selectedPlan.name} - ${selectedPlan.amount} FCFA (${usdAmount} USD)`,
          custom_id: JSON.stringify({ userId, planId }) // Add custom data for webhook identification
        }]
      };

      console.log('Creating PayPal order with data:', orderData);
      const response = await fetch(`${this.getPayPalBaseUrl()}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      console.log('PayPal API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('PayPal API error response:', errorText);
        throw new Error(`PayPal API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const result = await response.json();
      console.log('PayPal order created:', result);

      try {
        // Store payment record
        const paymentRecord = await storage.createPayment({
          userId,
          amount: selectedPlan.amount,
          method: 'paypal',
          status: 'pending',
          paymentData: { orderId: result.id, planId }
        });
        
        console.log('Payment record created:', paymentRecord.id);
        
        return {
          success: true,
          orderId: result.id,
          paymentId: paymentRecord.id,
        };
      } catch (storageError: any) {
        console.error("Error creating payment record in database:", storageError);
        // Even if we can't store the payment record, we should still return the PayPal order
        return {
          success: true,
          orderId: result.id,
          message: "Paiement PayPal créé avec succès, mais une erreur est survenue lors de l'enregistrement local"
        };
      }
    } catch (error: any) {
      console.error("Error creating PayPal payment:", error);
      throw new Error(`Erreur lors de la création du paiement PayPal: ${error.message}`);
    }
  }

  // Verify PayPal webhook signature
  async verifyPayPalWebhook(req: any): Promise<boolean> {
    try {
      const accessToken = await this.getPayPalAccessToken();
      
      const verificationData = {
        transmission_id: req.headers['paypal-transmission-id'],
        transmission_time: req.headers['paypal-transmission-time'],
        cert_url: req.headers['paypal-cert-url'],
        auth_algo: req.headers['paypal-auth-algo'],
        transmission_sig: req.headers['paypal-transmission-sig'],
        webhook_id: process.env.PAYPAL_WEBHOOK_ID || 'WEBHOOK_ID', // You need to set this in your .env file
        webhook_event: req.body
      };

      const response = await fetch(`${this.getPayPalBaseUrl()}/v1/notifications/verify-webhook-signature`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(verificationData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('PayPal webhook verification failed:', errorText);
        return false;
      }

      const verificationResult = await response.json();
      return verificationResult.verification_status === 'SUCCESS';
    } catch (error) {
      console.error('Error verifying PayPal webhook:', error);
      return false;
    }
  }

  // Capture PayPal payment
  async capturePayPalPayment(orderId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const accessToken = await this.getPayPalAccessToken();

      const response = await fetch(`${this.getPayPalBaseUrl()}/v2/checkout/orders/${orderId}/capture`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`PayPal capture error: ${errorData.message}`);
      }

      const captureData = await response.json();

      return {
        success: true
      };
    } catch (error: any) {
      console.error("Error capturing PayPal payment:", error);
      return {
        success: false,
        error: error.message || "Erreur lors de la capture du paiement PayPal"
      };
    }
  }

  // Check PayPal payment status
  async checkPayPalPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    try {
      const accessToken = await this.getPayPalAccessToken();

      // First try to get order details
      const orderResponse = await fetch(`${this.getPayPalBaseUrl()}/v2/checkout/orders/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (orderResponse.ok) {
        const orderData = await orderResponse.json();
        return {
          id: orderData.id,
          status: orderData.status,
          amount: parseFloat(orderData.purchase_units[0].amount.value),
          currency: orderData.purchase_units[0].amount.currency_code,
          custom_data: orderData.purchase_units[0].custom_id ? { custom_id: orderData.purchase_units[0].custom_id } : undefined,
        };
      }

      // Fallback to payment API if order not found
      const paymentResponse = await fetch(`${this.getPayPalBaseUrl()}/v1/payments/payment/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!paymentResponse.ok) {
        throw new Error('Failed to check PayPal payment status');
      }

      const paymentData = await paymentResponse.json();

      return {
        id: paymentData.id,
        status: paymentData.state,
        amount: parseFloat(paymentData.transactions[0].amount.total),
        currency: paymentData.transactions[0].amount.currency,
        custom_data: paymentData.transactions[0].custom ? JSON.parse(paymentData.transactions[0].custom) : undefined,
      };
    } catch (error: any) {
      console.error("Error checking PayPal payment status:", error);
      throw new Error(`Erreur lors de la vérification du paiement PayPal: ${error.message}`);
    }
  }

  // PayPal methods
  private getPayPalBaseUrl(): string {
    return this.paypalMode === 'live'
      ? 'https://api.paypal.com'
      : 'https://api.sandbox.paypal.com';
  }

  private async getPayPalAccessToken(): Promise<string> {
    const auth = Buffer.from(`${this.paypalClientId}:${this.paypalClientSecret}`).toString('base64');

    const response = await fetch(`${this.getPayPalBaseUrl()}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      throw new Error('Failed to get PayPal access token');
    }

    const data = await response.json();
    return data.access_token;
  }
}

// Export a singleton instance of the payment service
export const paymentService = new PaymentService();