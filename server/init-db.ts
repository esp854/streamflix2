import { config } from "dotenv";
import { Client } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";
import { join } from "path";
import { readdir } from "fs/promises";
import { pathToFileURL } from 'url';
import { fileURLToPath } from 'url';

// Obtenir __dirname dans un module ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = pathToFileURL(__filename).pathname;

// Charger les variables d'environnement
config();

async function initDatabase() {
  console.log("🔧 Initialisation de la base de données...");
  
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("❌ DATABASE_URL n'est pas définie dans .env");
    process.exit(1);
  }
  
  // Extraire les composants de l'URL
  const url = new URL(databaseUrl);
  const dbName = url.pathname.substring(1);
  const dbUser = url.username;
  const dbPassword = url.password;
  const dbHost = url.hostname;
  const dbPort = url.port;
  
  console.log(`📍 Configuration: ${dbUser}@${dbHost}:${dbPort}/${dbName}`);
  
  // Créer une connexion sans spécifier la base de données pour créer la base
  const adminClient = new Client({
    host: dbHost,
    port: parseInt(dbPort) || 5432,
    user: dbUser,
    password: dbPassword,
    database: 'postgres', // Se connecter à la base par défaut
    ssl: {
      rejectUnauthorized: false // Nécessaire pour Render
    }
  });
  
  try {
    await adminClient.connect();
    console.log("✅ Connexion à PostgreSQL réussie");
    
    // Vérifier si la base de données existe
    const dbCheck = await adminClient.query(
      "SELECT 1 FROM pg_database WHERE datname = $1", 
      [dbName]
    );
    
    if (dbCheck.rowCount === 0) {
      console.log(`🏗️  Création de la base de données '${dbName}'...`);
      await adminClient.query(`CREATE DATABASE "${dbName}"`);
      console.log("✅ Base de données créée avec succès");
    } else {
      console.log(`ℹ️  La base de données '${dbName}' existe déjà`);
    }
    
    await adminClient.end();
    
    // Maintenant se connecter à la base de données spécifique
    const dbClient = new Client({
      connectionString: databaseUrl,
      ssl: {
        rejectUnauthorized: false // Nécessaire pour Render
      }
    });
    
    await dbClient.connect();
    console.log(`✅ Connecté à la base de données '${dbName}'`);
    
    // Créer les tables avec Drizzle
    console.log("🏗️  Création des tables...");
    const db = drizzle(dbClient, { schema });
    
    // Exécuter les migrations manuellement
    console.log("🏗️  Exécution des migrations...");
    await runMigrations(dbClient);
    
    // Fermer la connexion
    await dbClient.end();
    console.log("✅ Initialisation terminée avec succès !");
    
  } catch (error) {
    console.error("❌ Erreur lors de l'initialisation:", error);
    
    if (error instanceof Error) {
      if (error.message.includes("ECONNREFUSED")) {
        console.log("\n💡 PostgreSQL n'est pas démarré");
        console.log("   Vérifiez que le service PostgreSQL est en cours d'exécution");
      } else if (error.message.includes("password authentication failed")) {
        console.log("\n💡 Mot de passe incorrect");
        console.log("   Mettez à jour le mot de passe dans .env");
      } else if (error.message.includes("SSL/TLS required")) {
        console.log("\n💡 SSL/TLS requis");
        console.log("   La connexion doit utiliser SSL/TLS");
      } else {
        console.log(`\n💡 ${error.message}`);
      }
    }
    
    process.exit(1);
  }
}

async function runMigrations(client: Client) {
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
          const migration = await import(migrationPath);
          
          // Exécuter la fonction up si elle existe
          if (typeof migration.up === 'function') {
            await migration.up(client);
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
    
    // Création des tables manquantes si nécessaire
    console.log("⏳ Vérification et création des tables manquantes...");
    
    // Création de la table content
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

    // Création de la table episodes
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

    // Création de la table watch_progress
    await client.query(`
      CREATE TABLE IF NOT EXISTS watch_progress (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content_id UUID REFERENCES content(id) ON DELETE CASCADE,
        episode_id UUID REFERENCES episodes(id) ON DELETE CASCADE,
        movie_id INTEGER,
        current_time INTEGER NOT NULL,
        duration INTEGER,
        completed BOOLEAN NOT NULL DEFAULT false,
        last_watched_at TIMESTAMP NOT NULL DEFAULT NOW(),
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // Création de la table watch_history
    await client.query(`
      CREATE TABLE IF NOT EXISTS watch_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        movie_id INTEGER NOT NULL,
        movie_title TEXT NOT NULL,
        movie_poster TEXT,
        watched_at TIMESTAMP NOT NULL DEFAULT NOW(),
        watch_duration INTEGER,
        session_id UUID REFERENCES user_sessions(id),
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // Ajout des index
    await client.query(`
      CREATE INDEX IF NOT EXISTS content_tmdb_id_idx ON content(tmdb_id);
      CREATE INDEX IF NOT EXISTS episodes_content_id_idx ON episodes(content_id);
      CREATE INDEX IF NOT EXISTS episodes_season_episode_idx ON episodes(season_number, episode_number);
      CREATE INDEX IF NOT EXISTS watch_progress_user_id_idx ON watch_progress(user_id);
      CREATE INDEX IF NOT EXISTS watch_progress_content_id_idx ON watch_progress(content_id);
      CREATE INDEX IF NOT EXISTS watch_progress_episode_id_idx ON watch_progress(episode_id);
      CREATE INDEX IF NOT EXISTS watch_progress_movie_id_idx ON watch_progress(movie_id);
      CREATE INDEX IF NOT EXISTS watch_history_user_id_idx ON watch_history(user_id);
      CREATE INDEX IF NOT EXISTS watch_history_movie_id_idx ON watch_history(movie_id);
    `);

    console.log("✅ Toutes les tables ont été vérifiées/créées avec succès!");
    
  } catch (error) {
    console.error("❌ Erreur lors des migrations:", error);
    throw error;
  }
}

initDatabase().catch(console.error);