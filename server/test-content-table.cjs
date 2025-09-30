const { config } = require("dotenv");
const { Pool } = require('pg');

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

async function testContentTable() {
  console.log("🔍 Vérification de l'existence des tables content et episodes...");
  
  try {
    // Vérifier si la table content existe
    const contentResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'content'
      );
    `);
    
    if (contentResult.rows[0].exists) {
      console.log("✅ La table 'content' existe");
      
      // Afficher la structure de la table content
      const contentStructure = await pool.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'content' 
        ORDER BY ordinal_position;
      `);
      
      console.log("\n📋 Structure de la table 'content':");
      console.table(contentStructure.rows);
    } else {
      console.log("❌ La table 'content' n'existe pas");
    }
    
    // Vérifier si la table episodes existe
    const episodesResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'episodes'
      );
    `);
    
    if (episodesResult.rows[0].exists) {
      console.log("\n✅ La table 'episodes' existe");
      
      // Afficher la structure de la table episodes
      const episodesStructure = await pool.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'episodes' 
        ORDER BY ordinal_position;
      `);
      
      console.log("\n📋 Structure de la table 'episodes':");
      console.table(episodesStructure.rows);
    } else {
      console.log("\n❌ La table 'episodes' n'existe pas");
    }
    
    // Vérifier les index
    const indexesResult = await pool.query(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename IN ('content', 'episodes');
    `);
    
    if (indexesResult.rows.length > 0) {
      console.log("\n.CreateIndexes trouvés:");
      console.table(indexesResult.rows);
    } else {
      console.log("\n.CreateIndexes non trouvés");
    }
    
  } catch (error) {
    console.error("❌ Erreur lors du test:", error);
    throw error;
  } finally {
    // Fermer la connexion
    await pool.end();
  }
}

// Exécuter le test si ce fichier est exécuté directement
if (require.main === module) {
  testContentTable().catch(console.error);
}

module.exports = { testContentTable };