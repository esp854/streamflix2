import { drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';
import { config } from 'dotenv';
import * as schema from '@shared/schema';

config();

// Fonction principale de migration
export async function up(client: Client) {
  console.log('🔧 Adding new fields to banners table...');
  
  try {
    const db = drizzle(client, { schema });
    
    // Add new columns to banners table
    console.log('🏗️  Adding new columns to banners table...');
    
    // Check if columns already exist
    const columnsCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'banners' 
      AND column_name IN ('type', 'category', 'price')
    `);
    
    const existingColumns = columnsCheck.rows.map(row => row.column_name);
    
    if (!existingColumns.includes('type')) {
      await client.query('ALTER TABLE banners ADD COLUMN type TEXT');
      console.log('✅ Added type column');
    } else {
      console.log('ℹ️  type column already exists');
    }
    
    if (!existingColumns.includes('category')) {
      await client.query('ALTER TABLE banners ADD COLUMN category TEXT');
      console.log('✅ Added category column');
    } else {
      console.log('ℹ️  category column already exists');
    }
    
    if (!existingColumns.includes('price')) {
      await client.query('ALTER TABLE banners ADD COLUMN price TEXT');
      console.log('✅ Added price column');
    } else {
      console.log('ℹ️  price column already exists');
    }
    
    // Insert default subscription banner if it doesn't exist
    console.log('🏗️  Checking for existing subscription banner...');
    
    const existingBanner = await client.query(`
      SELECT id FROM banners 
      WHERE title LIKE '%Débloquez le streaming premium%' 
      OR type = 'subscription'
      LIMIT 1
    `);
    
    if (existingBanner.rowCount === 0) {
      console.log('🏗️  Inserting default subscription banner...');
      
      await client.query(`
        INSERT INTO banners (
          title, 
          description, 
          priority, 
          active, 
          type, 
          category, 
          price,
          created_at
        ) VALUES (
          'Débloquez le streaming premium',
          'Accédez à des milliers de films et séries en HD/4K. Paiement sécurisé avec Djamo - Orange Money, Wave, et cartes bancaires acceptées.',
          1,
          true,
          'subscription',
          'promotion',
          '2.000',
          NOW()
        )
      `);
      
      console.log('✅ Default subscription banner inserted');
    } else {
      console.log('ℹ️  Subscription banner already exists');
    }
    
    console.log('✅ Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during migration:', error);
    throw error;
  }
}

// Pour exécution directe
async function addBannerFields() {
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
  addBannerFields().catch(console.error);
}