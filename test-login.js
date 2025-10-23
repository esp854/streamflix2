const bcrypt = require('bcryptjs');

// Test bcrypt functionality
async function testBcrypt() {
  try {
    console.log('Testing bcrypt...');
    const password = 'test123';
    const hashed = await bcrypt.hash(password, 10);
    console.log('Hashed password:', hashed);
    
    const isValid = await bcrypt.compare(password, hashed);
    console.log('Password comparison result:', isValid);
    
    console.log('Bcrypt test completed successfully');
  } catch (error) {
    console.error('Bcrypt test failed:', error);
  }
}

testBcrypt();