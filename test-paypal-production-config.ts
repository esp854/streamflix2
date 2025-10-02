/**
 * Test script for PayPal production configuration
 * This script validates that the PayPal production environment is properly configured
 */

import dotenv from 'dotenv';
import { paymentService } from './server/payment-service';

// Load environment variables
dotenv.config();

async function testPayPalProductionConfig() {
  console.log('Testing PayPal Production Configuration...\n');
  
  try {
    // Step 1: Check if PayPal is configured
    console.log('Step 1: Checking PayPal configuration...');
    
    const isConfigured = paymentService.isPayPalConfigured();
    if (!isConfigured) {
      throw new Error('PayPal is not configured. Please check your environment variables.');
    }
    
    console.log('✅ PayPal is configured\n');
    
    // Step 2: Check PayPal mode
    console.log('Step 2: Checking PayPal mode...');
    
    const paypalMode = process.env.PAYPAL_MODE || 'sandbox';
    console.log(`PayPal mode: ${paypalMode}`);
    
    if (paypalMode === 'live') {
      console.log('✅ PayPal is configured for production\n');
    } else {
      console.log('ℹ️  PayPal is configured for sandbox (development) mode\n');
    }
    
    // Step 3: Test PayPal configuration
    console.log('Step 3: Testing PayPal configuration...');
    
    const configTest = await paymentService.testPayPalConfiguration();
    if (!configTest.configured) {
      throw new Error('PayPal configuration test failed.');
    }
    
    console.log('✅ PayPal configuration test passed\n');
    
    // Step 4: Test client token generation (only in production)
    if (paypalMode === 'live') {
      console.log('Step 4: Testing client token generation...');
      
      try {
        const clientToken = await paymentService.generatePayPalClientToken();
        if (clientToken) {
          console.log('✅ Client token generated successfully');
          console.log(`Token length: ${clientToken.length} characters\n`);
        } else {
          throw new Error('Client token is empty');
        }
      } catch (error) {
        console.error('❌ Client token generation failed:', error);
        throw error;
      }
    }
    
    // Step 5: Check environment variables
    console.log('Step 5: Checking environment variables...');
    
    const requiredVars = [
      'PAYPAL_CLIENT_ID',
      'PAYPAL_CLIENT_SECRET',
      'PAYPAL_MODE',
      'PAYPAL_MERCHANT_DOMAINS',
      'CLIENT_URL'
    ];
    
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.warn('⚠️  Warning: The following environment variables are missing:');
      missingVars.forEach(varName => console.warn(`   - ${varName}`));
      console.log();
    } else {
      console.log('✅ All required environment variables are present\n');
    }
    
    // Step 6: Display configuration summary
    console.log('Step 6: Configuration Summary');
    console.log('============================');
    console.log(`PayPal Client ID: ${process.env.PAYPAL_CLIENT_ID ? '✅ Set' : '❌ Missing'}`);
    console.log(`PayPal Client Secret: ${process.env.PAYPAL_CLIENT_SECRET ? '✅ Set' : '❌ Missing'}`);
    console.log(`PayPal Mode: ${paypalMode} ${paypalMode === 'live' ? '✅ Production' : '⚠️  Sandbox'}`);
    console.log(`Merchant Domains: ${process.env.PAYPAL_MERCHANT_DOMAINS || 'Not set'}`);
    console.log(`Client URL: ${process.env.CLIENT_URL || 'Not set'}`);
    console.log();
    
    console.log('🎉 PayPal production configuration test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed with error:');
    console.error(error);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testPayPalProductionConfig();
}

export { testPayPalProductionConfig };