// Script to run all database migrations
import { createWatchProgressTable } from './001-create-watch-progress-table.js';

async function runAllMigrations() {
  console.log('Starting database migrations...');
  
  try {
    // Run watch_progress table creation
    await createWatchProgressTable();
    console.log('✅ Migration 001 completed: watch_progress table');
    
    console.log('🎉 All migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run all migrations if this file is executed directly
if (require.main === module) {
  runAllMigrations()
    .then(() => {
      console.log('All migrations completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migrations failed:', error);
      process.exit(1);
    });
}

export { runAllMigrations };