import { drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';
import { config } from 'dotenv';
import * as schema from '@shared/schema';

config();

// Fonction principale de migration
export async function up(client: Client) {
  console.log('🔧 Adding banned field to users table...');
  
  try {
    const db = drizzle(client, { schema });
    
    // Add banned column to users table
    console.log('🏗️  Adding banned column to users table...');
    
    // Check if column already exists
    const columnsCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name = 'banned'
    `);
    
    if (columnsCheck.rowCount === 0) {
      await client.query('ALTER TABLE users ADD COLUMN banned BOOLEAN DEFAULT false NOT NULL');
      console.log('✅ Added banned column');
    } else {
      console.log('ℹ️  banned column already exists');
    }
    
    console.log('✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during migration:', error);
    throw error;
  }
}

// Pour exécution directe
async function addBannedField() {
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
  addBannedField().catch(console.error);
}