import { drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';
import { config } from 'dotenv';

config();

async function addDisplayOrderField() {
  console.log('🔧 Adding display_order field to content table...');
  
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL is not defined in .env');
    process.exit(1);
  }
  
  const client = new Client({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    // Ajout du champ display_order à la table content
    console.log('🏗️  Adding display_order column to content table...');
    
    await client.query(`
      ALTER TABLE content 
      ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 0;
    `);
    
    console.log('✅ display_order column added to content table');
    
    // Création d'un index sur display_order pour améliorer les performances
    console.log('🏗️  Creating index on display_order column...');
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS content_display_order_idx ON content(display_order);
    `);
    
    console.log('✅ Index content_display_order_idx created or already exists');
    
    await client.end();
    console.log('✅ Display order field migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during display order field migration:', error);
    process.exit(1);
  }
}

addDisplayOrderField().catch(console.error);