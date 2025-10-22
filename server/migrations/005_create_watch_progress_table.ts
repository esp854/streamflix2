import { Pool } from 'pg';

export async function up(pool: Pool) {
  console.log("⏳ Création de la table watch_progress...");
  
  try {
    // Création de la table watch_progress
    await pool.query(`
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

    // Ajout de l'index sur user_id
    await pool.query(`
      CREATE INDEX IF NOT EXISTS watch_progress_user_id_idx ON watch_progress(user_id);
    `);

    // Ajout de l'index sur content_id
    await pool.query(`
      CREATE INDEX IF NOT EXISTS watch_progress_content_id_idx ON watch_progress(content_id);
    `);

    // Ajout de l'index sur episode_id
    await pool.query(`
      CREATE INDEX IF NOT EXISTS watch_progress_episode_id_idx ON watch_progress(episode_id);
    `);

    // Ajout de l'index sur movie_id
    await pool.query(`
      CREATE INDEX IF NOT EXISTS watch_progress_movie_id_idx ON watch_progress(movie_id);
    `);

    console.log("✅ Table watch_progress créée avec succès!");
  } catch (error) {
    console.error("❌ Erreur lors de la création de la table watch_progress:", error);
    throw error;
  }
}