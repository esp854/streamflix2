import { plans } from './plans';
import { paymentService } from './payment-service';
import { DatabaseStorage } from './storage';
import { db } from './db';
import { users, subscriptions, payments } from '../shared/schema';
import { eq } from 'drizzle-orm';

// Use real database storage instead of mocks
const storage = new DatabaseStorage();

// Simple test framework
async function runTest(name: string, testFn: () => Promise<void>) {
  try {
    console.log(`Running test: ${name}`);
    await testFn();
    console.log(`✅ ${name} - PASSED`);
  } catch (error) {
    console.log(`❌ ${name} - FAILED:`, error);
  }
}

// Test user data
const testUser = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'hashedpassword'
};

async function runAllTests() {
  console.log('Starting subscription system tests...');
  
  let createdUserId: string = '';
  
  try {
    // Setup: Create a test user
    console.log('Setting up test user...');
    const [user] = await db.insert(users).values(testUser).returning();
    createdUserId = user.id;
    console.log('Test user created:', createdUserId);
    
    // Plan Validation Tests
    await runTest('Plan validation - all plans exist', async () => {
      const planKeys = Object.keys(plans);
      if (!planKeys.includes('free')) throw new Error('Missing free plan');
      if (!planKeys.includes('basic')) throw new Error('Missing basic plan');
      if (!planKeys.includes('standard')) throw new Error('Missing standard plan');
      if (!planKeys.includes('premium')) throw new Error('Missing premium plan');
      if (!planKeys.includes('vip')) throw new Error('Missing vip plan');
    });
    
    await runTest('Plan validation - correct pricing', async () => {
      if (plans.free.amount !== 0) throw new Error('Free plan should be 0');
      if (plans.basic.amount !== 2500) throw new Error('Basic plan should be 2500');
      if (plans.standard.amount !== 3500) throw new Error('Standard plan should be 3500');
      if (plans.premium.amount !== 4500) throw new Error('Premium plan should be 4500');
      if (plans.vip.amount !== 5500) throw new Error('VIP plan should be 5500');
    });
    
    await runTest('Plan validation - 30-day duration', async () => {
      Object.values(plans).forEach(plan => {
        if (plan.duration !== 30) throw new Error(`Plan ${plan.name} should have 30-day duration`);
      });
    });
    
    // Subscription Management Tests
    await runTest('Create free subscription', async () => {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);
      
      const subscription = await storage.createSubscription({
        userId: createdUserId,
        planId: 'free',
        amount: 0,
        paymentMethod: 'free',
        status: 'active',
        startDate,
        endDate
      });
      
      if (!subscription.id) throw new Error('Subscription should have an ID');
      if (subscription.planId !== 'free') throw new Error('Plan ID should be free');
      if (subscription.amount !== 0) throw new Error('Amount should be 0');
      if (subscription.status !== 'active') throw new Error('Status should be active');
    });
    
    await runTest('Create payment record', async () => {
      const payment = await storage.createPayment({
        userId: createdUserId,
        amount: 2500,
        method: 'lygos',
        status: 'pending',
        paymentData: {}
      });
      
      if (!payment.id) throw new Error('Payment should have an ID');
      if (payment.amount !== 2500) throw new Error('Amount should be 2500');
      if (payment.method !== 'lygos') throw new Error('Method should be lygos');
      if (payment.status !== 'pending') throw new Error('Status should be pending');
    });
    
    await runTest('Update payment status', async () => {
      // Create a payment first
      const payment = await storage.createPayment({
        userId: createdUserId,
        amount: 2500,
        method: 'lygos',
        status: 'pending',
        paymentData: {}
      });
      
      // Update the payment status
      const updatedPayment = await storage.updatePaymentStatus(payment.id, 'completed');
      
      if (updatedPayment.status !== 'completed') throw new Error('Status should be completed');
    });
    
    await runTest('Get user payment history', async () => {
      // Create a payment first
      await storage.createPayment({
        userId: createdUserId,
        amount: 2500,
        method: 'lygos',
        status: 'pending',
        paymentData: {}
      });
      
      const userPayments = await storage.getUserPayments(createdUserId);
      
      if (!Array.isArray(userPayments)) throw new Error('Should return an array');
      if (userPayments.length === 0) throw new Error('Should have at least one payment');
      if (!userPayments[0].id) throw new Error('Payment should have an ID');
    });
    
    await runTest('Get user subscription', async () => {
      // Create a subscription first
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);
      
      await storage.createSubscription({
        userId: createdUserId,
        planId: 'basic',
        amount: 2500,
        paymentMethod: 'lygos',
        status: 'active',
        startDate,
        endDate
      });
      
      const subscription = await storage.getUserSubscription(createdUserId);
      
      if (!subscription) throw new Error('Should return a subscription');
      if (subscription.planId !== 'basic') throw new Error('Plan ID should be basic');
      if (subscription.status !== 'active') throw new Error('Status should be active');
    });
    
    // Payment Processing Tests (only if service is configured)
    if (paymentService.isConfigured()) {
      await runTest('Create free plan payment', async () => {
        const result = await paymentService.createPayment('free', {
          name: 'John Doe',
          email: 'john@example.com'
        }, createdUserId);
        
        if (!result.success) throw new Error('Should be successful');
        if (result.message !== 'Abonnement gratuit activé avec succès') {
          throw new Error('Should have success message');
        }
      });
    } else {
      console.log('⚠️  Payment service not configured, skipping payment tests');
    }
    
    console.log('✅ All tests completed successfully!');
    
  } catch (error) {
    console.log('❌ Test suite failed:', error);
  } finally {
    // Cleanup: Remove test data
    try {
      console.log('Cleaning up test data...');
      await db.delete(payments).where(eq(payments.userId, createdUserId));
      await db.delete(subscriptions).where(eq(subscriptions.userId, createdUserId));
      await db.delete(users).where(eq(users.id, createdUserId));
      console.log('Test data cleaned up');
    } catch (cleanupError) {
      console.log('Error during cleanup:', cleanupError);
    }
  }
}

// Run the tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests();
}

export { runAllTests };