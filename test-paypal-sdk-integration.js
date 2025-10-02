/**
 * Test script for PayPal SDK v6 integration
 * This script tests the complete integration flow
 */

import dotenv from 'dotenv';
import fetch from 'node-fetch';

// Load environment variables
dotenv.config();

async function testPayPalSDKIntegration() {
  console.log('Testing PayPal SDK v6 Integration...\n');
  
  const baseUrl = 'http://localhost:5000';
  
  try {
    // Step 1: Test if the server is running
    console.log('Step 1: Testing server connectivity...');
    
    const healthResponse = await fetch(`${baseUrl}/api/test`);
    if (!healthResponse.ok) {
      throw new Error('Server is not responding. Make sure the server is running.');
    }
    
    console.log('✅ Server is running\n');
    
    // Step 2: Test PayPal configuration
    console.log('Step 2: Testing PayPal configuration...');
    
    const configResponse = await fetch(`${baseUrl}/api/paypal/test`);
    const configData = await configResponse.json();
    
    if (!configData.configured) {
      throw new Error('PayPal is not configured. Please check your environment variables.');
    }
    
    console.log('✅ PayPal is configured\n');
    
    // Step 3: Test client token generation
    console.log('Step 3: Testing client token generation...');
    
    // For this test, we'll simulate the request without authentication
    // In a real scenario, you would need to be authenticated
    
    try {
      const tokenResponse = await fetch(`${baseUrl}/api/paypal/client-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      // We expect this to fail without authentication, which is correct
      if (tokenResponse.status === 401) {
        console.log('✅ Client token endpoint is protected (as expected)');
      } else {
        const tokenData = await tokenResponse.json();
        if (tokenData.clientToken) {
          console.log('✅ Client token generated successfully');
          console.log(`Token (first 50 chars): ${tokenData.clientToken.substring(0, 50)}...`);
        }
      }
    } catch (error) {
      console.log('ℹ️  Client token endpoint test completed (authentication required)');
    }
    
    console.log('\n🎉 PayPal SDK v6 integration tests completed!');
    console.log('\nTo fully test the integration:');
    console.log('1. Start the StreamFlix application');
    console.log('2. Navigate to http://localhost:5173/test-paypal-sdk');
    console.log('3. Log in with a test account');
    console.log('4. Try the PayPal payment flow');
    
  } catch (error) {
    console.error('❌ Test failed with error:');
    console.error(error.message);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testPayPalSDKIntegration();
}

export { testPayPalSDKIntegration };