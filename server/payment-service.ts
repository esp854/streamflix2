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
  private lygosApiKey: string;
  private lygosApiBaseUrl: string;
  private paypalClientId: string;
  private paypalClientSecret: string;
  private paypalMode: string;
  private clientUrl: string;
  private lygosSuccessUrl: string;
  private lygosCancelUrl: string;

  constructor() {
    this.lygosApiKey = process.env.LYGOS_API_KEY || '';
    // Use the correct endpoint from environment variables
    // Remove trailing slash and /v1 if present, as we'll add it in the requests
    let baseUrl = process.env.LYGOS_API_BASE_URL || 'https://api.lygosapp.com';
    if (baseUrl.endsWith('/')) {
      baseUrl = baseUrl.slice(0, -1);
    }
    if (baseUrl.endsWith('/v1')) {
      baseUrl = baseUrl.slice(0, -3);
    }
    this.lygosApiBaseUrl = baseUrl;
    this.paypalClientId = process.env.PAYPAL_CLIENT_ID || '';
    this.paypalClientSecret = process.env.PAYPAL_CLIENT_SECRET || '';
    this.paypalMode = process.env.PAYPAL_MODE || 'live';
    this.clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    this.lygosSuccessUrl = process.env.LYGOS_SUCCESS_URL || `${this.clientUrl}/subscription?payment=success`;
    this.lygosCancelUrl = process.env.LYGOS_CANCEL_URL || `${this.clientUrl}/subscription?payment=failed`;
  }

  // Check if the payment service is properly configured
  isConfigured(): boolean {
    return !!(this.lygosApiKey && this.lygosApiBaseUrl) || !!(this.paypalClientId && this.paypalClientSecret);
  }

  // Check if PayPal is configured
  isPayPalConfigured(): boolean {
    return !!(this.paypalClientId && this.paypalClientSecret);
  }

  // Check if Lygos is configured
  isLygosConfigured(): boolean {
    return !!(this.lygosApiKey && this.lygosApiBaseUrl);
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

  // Generic create payment method that chooses the best available provider
  async createPayment(
    planId: string,
    customerInfo: CustomerInfo,
    userId: string
  ): Promise<PaymentResponse> {
    // Prefer Lygos if configured, then PayPal
    if (this.lygosApiKey && this.lygosApiBaseUrl) {
      console.log('Using Lygos for payment');
      return this.createLygosPayment(planId, customerInfo, userId);
    } else if (this.paypalClientId && this.paypalClientSecret) {
      console.log('Using PayPal for payment');
      return this.createPayPalPayment(planId, customerInfo, userId);
    } else {
      throw new Error("Aucun service de paiement configuré");
    }
  }

  // Generic check payment status method
  async checkPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    // Try PayPal first if configured
    if (this.paypalClientId && this.paypalClientSecret) {
      try {
        return await this.checkPayPalPaymentStatus(paymentId);
      } catch (error) {
        console.log('PayPal check failed, trying Lygos');
      }
    }

    // Fallback to Lygos
    if (this.lygosApiKey && this.lygosApiBaseUrl) {
      return this.checkLygosPaymentStatus(paymentId);
    }

    throw new Error("Aucun service de paiement configuré pour vérifier le statut");
  }

  // Create a payment using Lygos
  async createLygosPayment(
    planId: string,
    customerInfo: CustomerInfo,
    userId: string
  ): Promise<PaymentResponse> {
    try {
      // Validate plan
      if (!plans[planId as keyof typeof plans]) {
        throw new Error("Plan invalide");
      }

      const selectedPlan = plans[planId as keyof typeof plans];
      const description = `Abonnement ${selectedPlan.name} - ${selectedPlan.amount} FCFA`;

      // For free plans, no payment is needed - return success immediately
      if (selectedPlan.amount === 0) {
        return {
          success: true,
          message: 'Abonnement gratuit activé avec succès'
        };
      }

      // Check if Lygos is configured
      if (!this.isConfigured()) {
        throw new Error("Service de paiement Lygos non configuré");
      }

      // Log the request data for debugging
      const webhookBase = process.env.BASE_URL || process.env.APP_URL || 'http://localhost:5000';
      const requestData = {
        amount: selectedPlan.amount,
        shop_name: `StreamFlix - Plan ${selectedPlan.name}`,
        order_id: `subscription_${userId}_${planId}_${Date.now()}`,
        message: description,
        success_url: this.lygosSuccessUrl,
        failure_url: this.lygosCancelUrl,
        customer: {
          name: customerInfo.name,
          email: customerInfo.email,
          phone: customerInfo.phone || ""
        }
      };
      
      console.log('Sending request to Lygos API:', {
        url: `${this.lygosApiBaseUrl}/v1/gateway`,
        headers: {
          "api-key": this.lygosApiKey,
          "Content-Type": "application/json"
        },
        body: requestData
      });

      // Create payment with Lygos using the correct API format
      const response = await fetch(`${this.lygosApiBaseUrl}/v1/gateway`, {
        method: "POST",
        headers: {
          "api-key": this.lygosApiKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestData)
      });

      console.log('Lygos API response status:', response.status);
      // Convert headers to array properly
      const headersArray: [string, string][] = [];
      response.headers.forEach((value, key) => {
        headersArray.push([key, value]);
      });
      console.log('Lygos API response headers:', headersArray);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Lygos API error response:', errorText);
        const errorMessage = `Lygos API error: ${response.status} ${response.statusText} - ${errorText}`;
        throw new Error(errorMessage);
      }

      const paymentData = await response.json();
      console.log('Lygos API success response:', paymentData);
      
      // Map common Lygos response fields
      return {
        paymentLink: paymentData.link || paymentData.payment_url || paymentData.paymentLink,
        approval_url: paymentData.approval_url,
        paymentId: paymentData.id || paymentData.token || paymentData.paymentId,
        qrCode: paymentData.qr_code_url || paymentData.qrCode,
        success: true
      };
    } catch (error: any) {
      console.error("Error creating Lygos payment:", error);
      // Provide more detailed error information
      const errorMessage = error.message || 'Unknown error occurred while creating payment';
      throw new Error(`Erreur lors de la création du paiement: ${errorMessage}`);
    }
  }

  // Check payment status with Lygos
  async checkLygosPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    try {
      // Check if Lygos is configured
      if (!this.isConfigured()) {
        throw new Error("Service de paiement Lygos non configuré");
      }

      // Check payment status with Lygos
      const response = await fetch(`${this.lygosApiBaseUrl}/v1/gateway/${paymentId}`, {
        headers: {
          "api-key": this.lygosApiKey,
          "Content-Type": "application/json"
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Lygos API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const paymentData = await response.json();
      return paymentData;
    } catch (error: any) {
      console.error("Error checking Lygos payment status:", error);
      throw new Error(`Erreur lors de la vérification du paiement: ${error.message}`);
    }
  }

  // Process webhook from Lygos
  async processLygosWebhook(paymentData: any): Promise<{ success: boolean; message?: string }> {
    try {
      console.log("Processing Lygos webhook:", paymentData);

      const { id, status, custom_data } = paymentData;

      // Process the payment based on status
      if (status === "completed") {
        // Activate subscription in your database
        if (custom_data && custom_data.userId && custom_data.planId) {
          console.log("Lygos payment completed for payment ID:", id);
          return { success: true, message: "Payment completed successfully" };
        }
      } else if (status === "failed" || status === "cancelled") {
        // Handle failed payment
        console.log("Lygos payment failed or cancelled for payment ID:", id);
        return { success: true, message: "Payment failed or cancelled" };
      }

      return { success: true };
    } catch (error) {
      console.error("Error processing Lygos webhook:", error);
      throw new Error("Failed to process webhook");
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
}

// Export a singleton instance of the payment service
export const paymentService = new PaymentService();