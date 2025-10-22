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
const __dirname = fileURLToPath(new URL('.', import.meta.url));

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
    // Utiliser process.cwd() pour obtenir le chemin correct dans l'environnement de production
    const migrationsDir = join(process.cwd(), 'server', 'migrations');
    console.log(`📁 Chemin des migrations: ${migrationsDir}`);
    
    const files = await readdir(migrationsDir);
    
    // Trier les fichiers par ordre alphabétique
    const sortedFiles = files.sort();
    
    console.log(`📁 ${sortedFiles.length} fichiers de migration trouvés`);
    
    // Exécuter chaque migration
    for (const file of sortedFiles) {
      if (file.endsWith('.ts')) {
        console.log(`⏳ Exécution de la migration: ${file}`);
        
        try {
          // Importer dynamiquement le script de migration en utilisant pathToFileURL pour éviter les problèmes Windows
          const migrationPath = join(migrationsDir, file);
          const migrationUrl = pathToFileURL(migrationPath).href;
          const migration = await import(migrationUrl);
          
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
    
    console.log("✅ Toutes les migrations ont été exécutées avec succès!");
  } catch (error) {
    console.error("❌ Erreur lors des migrations:", error);
    throw error;
  }
}

initDatabase().catch(console.error);