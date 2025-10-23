require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function runSql() {
  try {
    const client = await pool.connect();
    console.log('✅ Connected to database');
    
    // Read the SQL file
    const sql = fs.readFileSync('add_updated_at_column.sql', 'utf8');
    console.log('SQL to execute:', sql);
    
    // Execute the SQL
    await client.query(sql);
    console.log('✅ SQL executed successfully');
    
    client.release();
  } catch (error) {
    console.error('❌ Error executing SQL:', error);
  } finally {
    await pool.end();
  }
}

runSql();