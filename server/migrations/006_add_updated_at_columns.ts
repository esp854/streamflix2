import { Client } from 'pg';
import { config } from 'dotenv';

config();

// Fonction principale de migration
export async function up(client: Client) {
  console.log('🔧 Adding updated_at columns to tables...');
  
  try {
    // Check if updated_at column exists in users table
    const usersColumnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'updated_at'
    `);
    
    if (usersColumnCheck.rowCount === 0) {
      console.log('🏗️  Adding updated_at column to users table...');
      
      // Add updated_at column to users table
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      `);
      
      console.log('✅ updated_at column added to users table');
    } else {
      console.log('ℹ️  updated_at column already exists in users table');
    }
    
    // Check if updated_at column exists in subscriptions table
    const subscriptionsColumnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'subscriptions' AND column_name = 'updated_at'
    `);
    
    if (subscriptionsColumnCheck.rowCount === 0) {
      console.log('🏗️  Adding updated_at column to subscriptions table...');
      
      // Add updated_at column to subscriptions table
      await client.query(`
        ALTER TABLE subscriptions 
        ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      `);
      
      console.log('✅ updated_at column added to subscriptions table');
    } else {
      console.log('ℹ️  updated_at column already exists in subscriptions table');
    }
    
    // Check if updated_at column exists in payments table
    const paymentsColumnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'payments' AND column_name = 'updated_at'
    `);
    
    if (paymentsColumnCheck.rowCount === 0) {
      console.log('🏗️  Adding updated_at column to payments table...');
      
      // Add updated_at column to payments table
      await client.query(`
        ALTER TABLE payments 
        ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      `);
      
      console.log('✅ updated_at column added to payments table');
    } else {
      console.log('ℹ️  updated_at column already exists in payments table');
    }
    
    // Check if updated_at column exists in banners table
    const bannersColumnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'banners' AND column_name = 'updated_at'
    `);
    
    if (bannersColumnCheck.rowCount === 0) {
      console.log('🏗️  Adding updated_at column to banners table...');
      
      // Add updated_at column to banners table
      await client.query(`
        ALTER TABLE banners 
        ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      `);
      
      console.log('✅ updated_at column added to banners table');
    } else {
      console.log('ℹ️  updated_at column already exists in banners table');
    }
    
    // Check if updated_at column exists in collections table
    const collectionsColumnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'collections' AND column_name = 'updated_at'
    `);
    
    if (collectionsColumnCheck.rowCount === 0) {
      console.log('🏗️  Adding updated_at column to collections table...');
      
      // Add updated_at column to collections table
      await client.query(`
        ALTER TABLE collections 
        ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      `);
      
      console.log('✅ updated_at column added to collections table');
    } else {
      console.log('ℹ️  updated_at column already exists in collections table');
    }
    
    // Check if updated_at column exists in content table
    const contentColumnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'content' AND column_name = 'updated_at'
    `);
    
    if (contentColumnCheck.rowCount === 0) {
      console.log('🏗️  Adding updated_at column to content table...');
      
      // Add updated_at column to content table
      await client.query(`
        ALTER TABLE content 
        ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      `);
      
      console.log('✅ updated_at column added to content table');
    } else {
      console.log('ℹ️  updated_at column already exists in content table');
    }
    
    // Check if updated_at column exists in episodes table
    const episodesColumnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'episodes' AND column_name = 'updated_at'
    `);
    
    if (episodesColumnCheck.rowCount === 0) {
      console.log('🏗️  Adding updated_at column to episodes table...');
      
      // Add updated_at column to episodes table
      await client.query(`
        ALTER TABLE episodes 
        ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      `);
      
      console.log('✅ updated_at column added to episodes table');
    } else {
      console.log('ℹ️  updated_at column already exists in episodes table');
    }
    
    // Check if updated_at column exists in notifications table
    const notificationsColumnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'notifications' AND column_name = 'updated_at'
    `);
    
    if (notificationsColumnCheck.rowCount === 0) {
      console.log('🏗️  Adding updated_at column to notifications table...');
      
      // Add updated_at column to notifications table
      await client.query(`
        ALTER TABLE notifications 
        ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      `);
      
      console.log('✅ updated_at column added to notifications table');
    } else {
      console.log('ℹ️  updated_at column already exists in notifications table');
    }
    
    // Check if updated_at column exists in user_sessions table
    const userSessionsColumnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'user_sessions' AND column_name = 'updated_at'
    `);
    
    if (userSessionsColumnCheck.rowCount === 0) {
      console.log('🏗️  Adding updated_at column to user_sessions table...');
      
      // Add updated_at column to user_sessions table
      await client.query(`
        ALTER TABLE user_sessions 
        ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      `);
      
      console.log('✅ updated_at column added to user_sessions table');
    } else {
      console.log('ℹ️  updated_at column already exists in user_sessions table');
    }
    
    // Check if updated_at column exists in comments table
    const commentsColumnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'comments' AND column_name = 'updated_at'
    `);
    
    if (commentsColumnCheck.rowCount === 0) {
      console.log('🏗️  Adding updated_at column to comments table...');
      
      // Add updated_at column to comments table
      await client.query(`
        ALTER TABLE comments 
        ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      `);
      
      console.log('✅ updated_at column added to comments table');
    } else {
      console.log('ℹ️  updated_at column already exists in comments table');
    }
    
    console.log('✅ All updated_at columns migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during migration:', error);
    throw error;
  }
}

// Pour exécution directe
async function addUpdatedAtColumns() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL is not defined in .env');
    process.exit(1);
  }
  
  const client = new Client({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false // Nécessaire pour Render
    }
  });
  
  try {
    await client.connect();
    console.log('✅ Connected to database');
    await up(client);
    await client.end();
  } catch (error) {
    console.error('❌ Error during migration:', error);
    process.exit(1);
  }
}

// Exécuter si appelé directement
if (import.meta.url === `file://${process.argv[1]}`) {
  addUpdatedAtColumns().catch(console.error);
}