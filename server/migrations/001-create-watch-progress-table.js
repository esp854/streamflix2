// Migration script to create watch_progress table
import { Pool } from 'pg';

async function createWatchProgressTable() {
  // Get database connection details from environment variables
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Creating watch_progress table...');
    
    // Create watch_progress table
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
    
    console.log('✅ Table watch_progress created successfully');
    
    // Create indexes
    await pool.query(`CREATE INDEX IF NOT EXISTS watch_progress_user_id_idx ON watch_progress(user_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS watch_progress_content_id_idx ON watch_progress(content_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS watch_progress_episode_id_idx ON watch_progress(episode_id);`);
    
    console.log('✅ Indexes for watch_progress created successfully');
  } catch (error) {
    console.error('❌ Error creating watch_progress table:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run the migration if this file is executed directly
if (require.main === module) {
  createWatchProgressTable()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

export { createWatchProgressTable };