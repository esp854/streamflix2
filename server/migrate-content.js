import { config } from "dotenv";
import { Pool } from 'pg';
import { createRequire } from 'module';

// Pour utiliser require dans un module ES
const require = createRequire(import.meta.url);

// Charger les variables d'environnement
config();

// Vérifier que DATABASE_URL est défini
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Créer la connexion à la base de données
const pool = new Pool({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  console.log("🚀 Démarrage de la migration pour créer les tables content et episodes...");
  
  try {
    // Création de la table content
    await pool.query(`
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

    // Création de la table episodes
    await pool.query(`
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

    // Ajout de l'index sur tmdb_id pour la table content
    await pool.query(`
      CREATE INDEX IF NOT EXISTS content_tmdb_id_idx ON content(tmdb_id);
    `);

    // Ajout de l'index sur content_id pour la table episodes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS episodes_content_id_idx ON episodes(content_id);
    `);

    // Ajout de l'index sur season_number et episode_number pour la table episodes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS episodes_season_episode_idx ON episodes(season_number, episode_number);
    `);

    console.log("✅ Tables 'content' et 'episodes' créées avec succès!");
  } catch (error) {
    console.error("❌ Erreur lors de la migration:", error);
    throw error;
  } finally {
    // Fermer la connexion
    await pool.end();
  }
}

// Exécuter la migration si ce fichier est exécuté directement
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigration().catch(console.error);
}

export { runMigration };