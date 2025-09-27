// Simple test script to verify payment functionality
const axios = require('axios');

async function testPayment() {
  try {
    console.log('Testing payment creation...');
    
    // Test creating a payment
    const response = await axios.post('http://localhost:5000/api/subscription/create-payment', {
      planId: 'basic',
      customerInfo: {
        name: 'Test User',
        email: 'test@example.com'
      }
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      withCredentials: true
    });
    
    console.log('Payment creation response:', response.data);
    
    // If we got a payment ID, test checking the status
    if (response.data.paymentId || response.data.id) {
      const paymentId = response.data.paymentId || response.data.id;
      console.log(`Testing payment status check for ID: ${paymentId}`);
      
      // Wait a moment before checking status
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const statusResponse = await axios.get(`http://localhost:5000/api/subscription/check-payment/${paymentId}`, {
        withCredentials: true
      });
      
      console.log('Payment status response:', statusResponse.data);
    }
  } catch (error) {
    console.error('Error testing payment:', error.response?.data || error.message);
  }
}

testPayment();