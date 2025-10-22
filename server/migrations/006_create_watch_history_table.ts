import { Pool } from 'pg';

export async function up(pool: Pool) {
  console.log("⏳ Création de la table watch_history...");
  
  try {
    // Création de la table watch_history
    await pool.query(`
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

    // Ajout de l'index sur user_id
    await pool.query(`
      CREATE INDEX IF NOT EXISTS watch_history_user_id_idx ON watch_history(user_id);
    `);

    // Ajout de l'index sur movie_id
    await pool.query(`
      CREATE INDEX IF NOT EXISTS watch_history_movie_id_idx ON watch_history(movie_id);
    `);

    console.log("✅ Table watch_history créée avec succès!");
  } catch (error) {
    console.error("❌ Erreur lors de la création de la table watch_history:", error);
    throw error;
  }
}