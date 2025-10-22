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
            const client = await pool.connect();
            try {
              await migration.up(client);
              console.log(`✅ Migration ${file} terminée avec succès`);
            } finally {
              client.release();
            }
          } else {
            console.log(`⚠️  Aucune fonction 'up' trouvée dans ${file}`);
          }
        } catch (error) {
          console.error(`❌ Erreur lors de l'exécution de la migration ${file}:`, error);
          throw error;
        }
      }
    }
    
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