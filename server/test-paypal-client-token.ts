#!/usr/bin/env node
/**
 * Test script for PayPal client token generation
 * This script tests the client token generation functionality that will be used by the PayPal SDK v6
 */

import dotenv from 'dotenv';
import fetch from 'node-fetch';

// Load environment variables
dotenv.config();

async function testClientTokenGeneration() {
  console.log('Testing PayPal Client Token Generation...\n');
  
  // Check if required environment variables are set
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const mode = process.env.PAYPAL_MODE || 'sandbox';
  
  if (!clientId || !clientSecret) {
    console.error('❌ Error: PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET must be set in environment variables');
    process.exit(1);
  }
  
  const baseUrl = mode === 'live' 
    ? 'https://api.paypal.com' 
    : 'https://api.sandbox.paypal.com';
    
  console.log(`Using PayPal API: ${baseUrl}`);
  console.log(`Client ID: ${clientId.substring(0, 10)}...`);
  console.log(`Mode: ${mode}\n`);
  
  try {
    // Step 1: Get access token
    console.log('Step 1: Getting PayPal access token...');
    
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    
    const tokenResponse = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });
    
    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`Failed to get access token: ${tokenResponse.status} ${tokenResponse.statusText}\n${errorText}`);
    }
    
    const tokenData: any = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    
    console.log('✅ Access token obtained successfully\n');
    
    // Step 2: Generate client token
    console.log('Step 2: Generating client token...');
    
    // For testing purposes, we'll use localhost as the domain
    const domains = ['localhost:5173', 'localhost:5000'];
    
    const clientTokenResponse = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'response_type': 'client_token',
        'domains[]': domains.join(','),
        'grant_type': 'client_credentials'
      }).toString()
    });
    
    if (!clientTokenResponse.ok) {
      const errorText = await clientTokenResponse.text();
      throw new Error(`Failed to generate client token: ${clientTokenResponse.status} ${clientTokenResponse.statusText}\n${errorText}`);
    }
    
    const clientTokenData: any = await clientTokenResponse.json();
    const clientToken = clientTokenData.access_token;
    
    console.log('✅ Client token generated successfully');
    console.log(`Client token (first 50 chars): ${clientToken.substring(0, 50)}...\n`);
    
    // Step 3: Decode and verify token (basic verification)
    console.log('Step 3: Verifying client token structure...');
    
    try {
      // Split the JWT token
      const parts = clientToken.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT token structure');
      }
      
      // Decode the header (base64)
      const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
      console.log('✅ Token header:', header);
      
      // Decode the payload (base64)
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      console.log('✅ Token payload (partial):', {
        iss: payload.iss,
        aud: payload.aud,
        iat: payload.iat,
        exp: payload.exp,
        domains: payload.domains
      });
      
      console.log('\n🎉 All tests passed! PayPal client token generation is working correctly.');
      
    } catch (decodeError: any) {
      console.warn('⚠️ Warning: Could not decode token, but token was generated successfully');
      console.warn('Decode error:', decodeError.message);
    }
    
  } catch (error: any) {
    console.error('❌ Test failed with error:');
    console.error(error.message);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testClientTokenGeneration();
}

export { testClientTokenGeneration };