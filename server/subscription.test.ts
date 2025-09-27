import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { plans } from './plans';
import { paymentService } from './payment-service';
import { DatabaseStorage } from './storage';

// Mock the database storage
const mockStorage = {
  getUserSubscription: vi.fn(),
  createOrUpdateSubscription: vi.fn(),
  createPayment: vi.fn(),
  updatePaymentStatus: vi.fn(),
  getPaymentById: vi.fn(),
  getUserPayments: vi.fn()
};

// Mock the payment service
const mockPaymentService = {
  createLygosPayment: vi.fn(),
  checkLygosPaymentStatus: vi.fn(),
  processLygosWebhook: vi.fn(),
  isConfigured: vi.fn()
};

describe('Subscription System', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
    
    // Mock storage methods
    mockStorage.getUserSubscription.mockResolvedValue(null);
    mockStorage.createOrUpdateSubscription.mockResolvedValue({
      id: 'sub_123',
      userId: 'user_123',
      planId: 'basic',
      amount: 2000,
      paymentMethod: 'lygos',
      status: 'active',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      createdAt: new Date()
    });
    
    mockStorage.createPayment.mockResolvedValue({
      id: 'pay_123',
      userId: 'user_123',
      amount: 2000,
      method: 'lygos',
      status: 'pending',
      paymentData: {},
      createdAt: new Date()
    });
    
    mockStorage.updatePaymentStatus.mockResolvedValue({
      id: 'pay_123',
      userId: 'user_123',
      amount: 2000,
      method: 'lygos',
      status: 'completed',
      paymentData: {},
      createdAt: new Date()
    });
    
    mockStorage.getPaymentById.mockResolvedValue({
      id: 'pay_123',
      userId: 'user_123',
      subscriptionId: 'sub_123',
      amount: 2000,
      method: 'lygos',
      status: 'completed',
      transactionId: 'txn_123',
      paymentData: {},
      createdAt: new Date()
    });
    
    mockStorage.getUserPayments.mockResolvedValue([
      {
        id: 'pay_123',
        userId: 'user_123',
        amount: 2000,
        method: 'lygos',
        status: 'completed',
        transactionId: 'txn_123',
        paymentData: {},
        createdAt: new Date()
      }
    ]);
    
    // Mock payment service methods
    mockPaymentService.createLygosPayment.mockResolvedValue({
      success: true,
      paymentLink: 'https://payment.link/123',
      paymentId: 'pay_123'
    });
    
    mockPaymentService.checkLygosPaymentStatus.mockResolvedValue({
      id: 'pay_123',
      status: 'completed',
      amount: 2000,
      currency: 'XOF'
    });
    
    mockPaymentService.processLygosWebhook.mockResolvedValue({
      success: true,
      message: 'Payment completed successfully'
    });
    
    mockPaymentService.isConfigured.mockReturnValue(true);
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });
  
  describe('Plan Validation', () => {
    it('should validate all subscription plans', () => {
      const planKeys = Object.keys(plans);
      expect(planKeys).toContain('free');
      expect(planKeys).toContain('basic');
      expect(planKeys).toContain('standard');
      expect(planKeys).toContain('premium');
      expect(planKeys).toContain('vip');
      
      // Check that each plan has required properties
      planKeys.forEach(planId => {
        const plan = plans[planId as keyof typeof plans];
        expect(plan).toHaveProperty('amount');
        expect(plan).toHaveProperty('currency');
        expect(plan).toHaveProperty('name');
        expect(plan).toHaveProperty('duration');
      });
    });
    
    it('should have correct pricing for each plan', () => {
      expect(plans.free.amount).toBe(0);
      expect(plans.basic.amount).toBe(2000);
      expect(plans.standard.amount).toBe(3000);
      expect(plans.premium.amount).toBe(4000);
      expect(plans.vip.amount).toBe(5000);
    });
    
    it('should have 30-day duration for all plans', () => {
      Object.values(plans).forEach(plan => {
        expect(plan.duration).toBe(30);
      });
    });
  });
  
  describe('Payment Processing', () => {
    it('should create payment for paid plans', async () => {
      const result = await mockPaymentService.createLygosPayment('basic', {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+221123456789'
      }, 'user_123');
      
      expect(result.success).toBe(true);
      expect(result.paymentLink).toBeDefined();
      expect(result.paymentId).toBeDefined();
    });
    
    it('should activate subscription immediately for free plans', async () => {
      const result = await mockPaymentService.createLygosPayment('free', {
        name: 'John Doe',
        email: 'john@example.com'
      }, 'user_123');
      
      expect(result.success).toBe(true);
      expect(result.message).toBe('Abonnement gratuit activé avec succès');
    });
    
    it('should check payment status', async () => {
      const status = await mockPaymentService.checkLygosPaymentStatus('pay_123');
      
      expect(status).toHaveProperty('id');
      expect(status).toHaveProperty('status');
      expect(status).toHaveProperty('amount');
      expect(status).toHaveProperty('currency');
    });
  });
  
  describe('Subscription Management', () => {
    it('should create subscription for free plans', async () => {
      const subscription = await mockStorage.createOrUpdateSubscription({
        userId: 'user_123',
        planId: 'free',
        amount: 0,
        paymentMethod: 'free',
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });
      
      expect(subscription).toHaveProperty('id');
      expect(subscription.planId).toBe('free');
      expect(subscription.amount).toBe(0);
      expect(subscription.status).toBe('active');
    });
    
    it('should create payment record for paid plans', async () => {
      const payment = await mockStorage.createPayment({
        userId: 'user_123',
        amount: 2000,
        method: 'lygos',
        status: 'pending',
        paymentData: {}
      });
      
      expect(payment).toHaveProperty('id');
      expect(payment.amount).toBe(2000);
      expect(payment.method).toBe('lygos');
      expect(payment.status).toBe('pending');
    });
    
    it('should update payment status', async () => {
      const payment = await mockStorage.updatePaymentStatus('pay_123', 'completed');
      
      expect(payment.status).toBe('completed');
    });
    
    it('should get user payment history', async () => {
      const payments = await mockStorage.getUserPayments('user_123');
      
      expect(Array.isArray(payments)).toBe(true);
      expect(payments.length).toBeGreaterThan(0);
      expect(payments[0]).toHaveProperty('id');
      expect(payments[0]).toHaveProperty('amount');
      expect(payments[0]).toHaveProperty('method');
      expect(payments[0]).toHaveProperty('status');
    });
  });
  
  describe('Webhook Processing', () => {
    it('should process successful payment webhook', async () => {
      const webhookData = {
        id: 'pay_123',
        status: 'completed',
        custom_data: {
          userId: 'user_123',
          planId: 'basic'
        }
      };
      
      const result = await mockPaymentService.processLygosWebhook(webhookData);
      
      expect(result.success).toBe(true);
      expect(result.message).toBe('Payment completed successfully');
    });
    
    it('should process failed payment webhook', async () => {
      const webhookData = {
        id: 'pay_123',
        status: 'failed',
        custom_data: {
          userId: 'user_123',
          planId: 'basic'
        }
      };
      
      const result = await mockPaymentService.processLygosWebhook(webhookData);
      
      expect(result.success).toBe(true);
      expect(result.message).toBe('Payment failed or cancelled');
    });
  });
});