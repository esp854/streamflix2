require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function testAuth() {
  try {
    console.log('Testing database connection...');
    const client = await pool.connect();
    console.log('✅ Connected to database');
    
    // Test a simple query
    const result = await client.query('SELECT COUNT(*) FROM users');
    console.log(`✅ Found ${result.rows[0].count} users in the database`);
    
    client.release();
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

testAuth();