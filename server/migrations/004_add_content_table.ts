import { drizzle } from 'drizzle-orm/node-postgres';
import { Client } from 'pg';
import { config } from 'dotenv';
import * as schema from '@shared/schema';

config();

async function addContentTables() {
  console.log('🔧 Creating content and episodes tables...');
  
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
    
    const db = drizzle(client, { schema });
    
    // Création de la table content
    console.log('🏗️  Creating content table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS content (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tmdb_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        poster_path TEXT,
        backdrop_path TEXT,
        release_date TEXT,
        genres JSONB,
        odysee_url TEXT,
        mux_playback_id TEXT,
        mux_url TEXT,
        language TEXT NOT NULL,
        quality TEXT NOT NULL,
        media_type TEXT NOT NULL,
        rating INTEGER,
        active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    console.log('✅ Content table created or already exists');
    
    // Création de la table episodes
    console.log('🏗️  Creating episodes table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS episodes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        content_id UUID NOT NULL,
        season_number INTEGER NOT NULL,
        episode_number INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        odysee_url TEXT,
        mux_playback_id TEXT,
        mux_url TEXT,
        duration INTEGER,
        release_date TEXT,
        active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    
    console.log('✅ Episodes table created or already exists');
    
    // Ajout des index
    console.log('🏗️  Creating indexes...');
    
    // Index sur tmdb_id pour la table content
    try {
      await client.query(`
        CREATE INDEX IF NOT EXISTS content_tmdb_id_idx ON content(tmdb_id);
      `);
      console.log('✅ Index content_tmdb_id_idx created or already exists');
    } catch (error) {
      console.log('ℹ️  Index content_tmdb_id_idx already exists');
    }
    
    // Index sur content_id pour la table episodes
    try {
      await client.query(`
        CREATE INDEX IF NOT EXISTS episodes_content_id_idx ON episodes(content_id);
      `);
      console.log('✅ Index episodes_content_id_idx created or already exists');
    } catch (error) {
      console.log('ℹ️  Index episodes_content_id_idx already exists');
    }
    
    // Index sur season_number et episode_number pour la table episodes
    try {
      await client.query(`
        CREATE INDEX IF NOT EXISTS episodes_season_episode_idx ON episodes(season_number, episode_number);
      `);
      console.log('✅ Index episodes_season_episode_idx created or already exists');
    } catch (error) {
      console.log('ℹ️  Index episodes_season_episode_idx already exists');
    }
    
    await client.end();
    console.log('✅ Content tables migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during content tables migration:', error);
    process.exit(1);
  }
}

addContentTables().catch(console.error);