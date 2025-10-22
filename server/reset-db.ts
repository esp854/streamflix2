import { config } from "dotenv";
import pkg from "pg";
const { Client } = pkg;

// Charger les variables d'environnement
config();

async function resetDatabase() {
  if (!process.env.DATABASE_URL) {
    console.log("❌ DATABASE_URL non définie dans .env");
    return;
  }

  console.log("🗑️  Réinitialisation de la base de données StreamKJI...");
  
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log("✅ Connexion établie");

    // Supprimer toutes les tables dans l'ordre correct (relations)
    console.log("🧹 Suppression des tables existantes...");
    
    const dropQueries = [
      'DROP TABLE IF EXISTS user_preferences CASCADE;',
      'DROP TABLE IF EXISTS favorites CASCADE;',
      'DROP TABLE IF EXISTS contact_messages CASCADE;',
      'DROP TABLE IF EXISTS users CASCADE;'
    ];

    for (const query of dropQueries) {
      try {
        await client.query(query);
        console.log(`   ✓ ${query}`);
      } catch (error) {
        console.log(`   ⚠️  ${query} - Table peut-être déjà supprimée`);
      }
    }

    // Vérifier qu'il n'y a plus de tables
    const remainingTables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

    if (remainingTables.rows.length === 0) {
      console.log("✅ Toutes les tables ont été supprimées");
    } else {
      console.log("⚠️  Tables restantes:", remainingTables.rows.map(r => r.table_name));
    }

    await client.end();
    
    console.log("\n🎉 Base de données réinitialisée avec succès !");
    console.log("📋 Prochaines étapes :");
    console.log("   1. npm run db:push     - Créer les nouvelles tables");
    console.log("   2. npm run create-admin - Créer l'utilisateur admin");
    console.log("   3. npm run dev         - Démarrer l'application");

  } catch (error) {
    console.error("❌ Erreur lors de la réinitialisation:", error);
    if (error instanceof Error) {
      console.error(error.message);
    }
    process.exit(1);
  }
}

resetDatabase().catch(console.error);