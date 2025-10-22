import { Client } from 'pg';
import { config } from 'dotenv';

config();

// Fonction principale de migration
export async function up(client: Client) {
  console.log('🔧 Fixing primary key constraint on users table...');
  
  try {
    // Check if primary key constraint already exists
    const pkCheck = await client.query(`
      SELECT a.attname AS column_name
      FROM pg_index i
      JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
      WHERE i.indrelid = 'users'::regclass AND i.indisprimary
    `);
    
    if (pkCheck.rowCount === 0) {
      console.log('🏗️  Adding primary key constraint to users table...');
      
      // Add primary key constraint to the id column
      await client.query(`
        ALTER TABLE users 
        ADD CONSTRAINT users_pkey PRIMARY KEY (id)
      `);
      
      console.log('✅ Primary key constraint added to users table');
    } else {
      console.log('ℹ️  Primary key constraint already exists on users table');
    }
    
    console.log('✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during migration:', error);
    throw error;
  }
}

// Pour exécution directe
async function fixUsersPrimaryKey() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL is not defined in .env');
    process.exit(1);
  }
  
  const client = new Client({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false // Nécessaire pour Render
    }
  });
  
  try {
    await client.connect();
    console.log('✅ Connected to database');
    await up(client);
    await client.end();
  } catch (error) {
    console.error('❌ Error during migration:', error);
    process.exit(1);
  }
}

// Exécuter si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  fixUsersPrimaryKey().catch(console.error);
}