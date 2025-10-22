#!/usr/bin/env tsx
import { config } from "dotenv";
import { join, dirname } from "path";
import { readdir } from "fs/promises";
import { Pool } from 'pg';
import { pathToFileURL } from 'url';
import { fileURLToPath } from 'url';

// Obtenir __dirname dans un module ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
  ssl: { 
    rejectUnauthorized: false // Nécessaire pour Render
  }
});

async function runMigrations() {
  console.log("🚀 Démarrage des migrations...");
  
  try {
    // Obtenir la liste des fichiers de migration
    const migrationsDir = join(__dirname, 'migrations');
    const files = await readdir(migrationsDir);
    
    // Trier les fichiers par ordre alphabétique
    const sortedFiles = files.sort();
    
    console.log(`📁 ${sortedFiles.length} fichiers de migration trouvés`);
    
    // Exécuter chaque migration
    for (const file of sortedFiles) {
      if (file.endsWith('.ts')) {
        console.log(`⏳ Exécution de la migration: ${file}`);
        
        try {
          // Importer dynamiquement le script de migration
          const migrationPath = join(migrationsDir, file);
          const migration = await import(pathToFileURL(migrationPath).toString());
          
          // Exécuter la fonction up si elle existe
          if (typeof migration.up === 'function') {
            await migration.up(pool);
            console.log(`✅ Migration ${file} terminée avec succès`);
          } else {
            console.log(`⚠️  Aucune fonction 'up' trouvée dans ${file}`);
          }
        } catch (error) {
          console.error(`❌ Erreur lors de l'exécution de la migration ${file}:`, error);
          throw error;
        }
      }
    }
    
    // Ajout spécifique pour créer les tables content et episodes si elles n'existent pas
    console.log("⏳ Vérification et création des tables content et episodes...");
    
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

    console.log("✅ Tables 'content' et 'episodes' vérifiées/créées avec succès!");
    
    console.log("🎉 Toutes les migrations ont été exécutées avec succès!");
  } catch (error) {
    console.error("❌ Erreur lors des migrations:", error);
    throw error;
  } finally {
    // Fermer la connexion
    await pool.end();
  }
}

// Exécuter les migrations si ce fichier est exécuté directement
const isDirectExecution = import.meta.url === pathToFileURL(process.argv[1]).toString();
if (isDirectExecution) {
  runMigrations().catch(console.error);
}

export { runMigrations };