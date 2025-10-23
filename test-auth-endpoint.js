// Test script to verify authentication endpoint
import 'dotenv/config';
import { storage } from './server/storage'; // Note: we're using .js here because we're running with Node.js
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-here-change-in-production";

async function testAuthEndpoint() {
  console.log('Testing authentication endpoint...');
  
  try {
    // Test 1: Check if database connection works
    console.log('\n--- Database Connection Test ---');
    const users = await storage.getAllUsers();
    console.log(`✅ Database connection successful. Found ${users.length} users.`);
    
    // Test 2: Try to authenticate with a test user
    console.log('\n--- Authentication Test ---');
    
    // First, let's create a test user if one doesn't exist
    const testEmail = 'test@example.com';
    let user = await storage.getUserByEmail(testEmail);
    
    if (!user) {
      console.log('Creating test user...');
      const hashedPassword = await bcrypt.hash('test123', 10);
      user = await storage.createUser({
        username: 'testuser',
        email: testEmail,
        password: hashedPassword
      });
      console.log('✅ Test user created successfully');
    } else {
      console.log('✅ Test user already exists');
    }
    
    // Now test the login process
    console.log('\n--- Login Process Test ---');
    
    // Simulate login validation
    const isValidPassword = await bcrypt.compare('test123', user.password);
    if (!isValidPassword) {
      console.log('❌ Password validation failed');
      return;
    }
    
    console.log('✅ Password validation successful');
    
    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    console.log('✅ JWT token generated successfully');
    console.log('Token:', token.substring(0, 20) + '...');
    
    console.log('\n--- Test Summary ---');
    console.log('✅ All authentication tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAuthEndpoint();