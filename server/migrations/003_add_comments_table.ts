import { drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';
import { config } from 'dotenv';
import * as schema from '@shared/schema';

config();

// Fonction principale de migration
export async function up(client: Client) {
  console.log('🔧 Creating comments table...');

  try {
    const db = drizzle(client, { schema });

    // Check if comments table already exists
    const tableCheck = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'comments'
    `);

    if (tableCheck.rows && tableCheck.rows.length > 0) {
      console.log('ℹ️  Comments table already exists');
      return;
    }

    // Create comments table
    console.log('🏗️  Creating comments table...');

    await client.query(`
      CREATE TABLE comments (
        id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content_id VARCHAR(255) NOT NULL REFERENCES content(id) ON DELETE CASCADE,
        comment TEXT NOT NULL,
        rating INTEGER,
        approved BOOLEAN DEFAULT true NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);

    // Create indexes for better performance
    await client.query(`
      CREATE INDEX idx_comments_content_id ON comments(content_id)
    `);

    await client.query(`
      CREATE INDEX idx_comments_user_id ON comments(user_id)
    `);

    await client.query(`
      CREATE INDEX idx_comments_approved ON comments(approved)
    `);

    await client.query(`
      CREATE INDEX idx_comments_created_at ON comments(created_at DESC)
    `);

    console.log('✅ Comments table created successfully');
    console.log('✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Error during migration:', error);
    throw error;
  }
}

// Pour exécution directe
async function addCommentsTable() {
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
  addCommentsTable().catch(console.error);
}