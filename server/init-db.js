// Script d'initialisation de la base de données
// Ce script crée les tables nécessaires et insère des données de test

import { Pool } from 'pg';
import dotenv from 'dotenv';

// Charger les variables d'environnement
dotenv.config();

async function initDatabase() {
  // Configuration de la connexion à la base de données
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔧 Initialisation de la base de données...');
    
    // Création de la table users
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(255) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user' NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        banned BOOLEAN DEFAULT false NOT NULL
      );
    `);
    console.log("✅ Table 'users' créée");

    // Création de la table favorites
    await pool.query(`
      CREATE TABLE IF NOT EXISTS favorites (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        movie_id INTEGER NOT NULL,
        movie_title TEXT NOT NULL,
        movie_poster TEXT,
        movie_genres JSONB,
        added_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    console.log("✅ Table 'favorites' créée");

    // Création de la table user_preferences
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_preferences (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        preferred_genres JSONB,
        language VARCHAR(10) DEFAULT 'fr' NOT NULL,
        autoplay BOOLEAN DEFAULT true NOT NULL
      );
    `);
    console.log("✅ Table 'user_preferences' créée");

    // Création de la table contact_messages
    await pool.query(`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    console.log("✅ Table 'contact_messages' créée");

    // Création de la table subscriptions
    await pool.query(`
      CREATE TABLE IF NOT EXISTS subscriptions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        plan_id VARCHAR(50) NOT NULL,
        amount INTEGER NOT NULL,
        payment_method VARCHAR(50) NOT NULL,
        status VARCHAR(50) DEFAULT 'active' NOT NULL,
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    console.log("✅ Table 'subscriptions' créée");

    // Création de la table payments
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
        amount INTEGER NOT NULL,
        method VARCHAR(50) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending' NOT NULL,
        transaction_id TEXT,
        payment_data TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    console.log("✅ Table 'payments' créée");

    // Création de la table banners
    await pool.query(`
      CREATE TABLE IF NOT EXISTS banners (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        title TEXT NOT NULL,
        description TEXT,
        movie_id INTEGER,
        image_url TEXT,
        priority INTEGER DEFAULT 1 NOT NULL,
        active BOOLEAN DEFAULT true NOT NULL,
        type TEXT,
        category TEXT,
        price TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    console.log("✅ Table 'banners' créée");

    // Création de la table collections
    await pool.query(`
      CREATE TABLE IF NOT EXISTS collections (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        description TEXT,
        movie_ids JSONB,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    console.log("✅ Table 'collections' créée");

    // Création de la table content
    await pool.query(`
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
        language VARCHAR(10) NOT NULL,
        quality VARCHAR(10) NOT NULL,
        media_type VARCHAR(10) NOT NULL,
        rating INTEGER,
        active BOOLEAN DEFAULT true NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    console.log("✅ Table 'content' créée");

    // Création de la table episodes
    await pool.query(`
      CREATE TABLE IF NOT EXISTS episodes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
        season_number INTEGER NOT NULL,
        episode_number INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        odysee_url TEXT,
        mux_playback_id TEXT,
        mux_url TEXT,
        duration INTEGER,
        release_date TEXT,
        active BOOLEAN DEFAULT true NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    console.log("✅ Table 'episodes' créée");

    // Création de la table notifications
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'info' NOT NULL,
        read BOOLEAN DEFAULT false NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    console.log("✅ Table 'notifications' créée");

    // Création de la table user_sessions
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        session_start TIMESTAMP DEFAULT NOW() NOT NULL,
        session_end TIMESTAMP,
        is_active BOOLEAN DEFAULT true NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    console.log("✅ Table 'user_sessions' créée");

    // Création de la table view_tracking
    await pool.query(`
      CREATE TABLE IF NOT EXISTS view_tracking (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        movie_id INTEGER NOT NULL,
        view_duration INTEGER,
        view_date TIMESTAMP DEFAULT NOW() NOT NULL,
        session_id UUID REFERENCES user_sessions(id),
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    console.log("✅ Table 'view_tracking' créée");

    // Création de la table comments
    await pool.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
        comment TEXT NOT NULL,
        rating INTEGER,
        approved BOOLEAN DEFAULT true NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    console.log("✅ Table 'comments' créée");

    // Création des index
    await pool.query(`CREATE INDEX IF NOT EXISTS favorites_user_id_idx ON favorites(user_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS user_preferences_user_id_idx ON user_preferences(user_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON subscriptions(user_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS payments_user_id_idx ON payments(user_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS content_tmdb_id_idx ON content(tmdb_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS episodes_content_id_idx ON episodes(content_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON notifications(user_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS user_sessions_user_id_idx ON user_sessions(user_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS view_tracking_user_id_idx ON view_tracking(user_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS comments_content_id_idx ON comments(content_id);`);
    await pool.query(`CREATE INDEX IF NOT EXISTS comments_user_id_idx ON comments(user_id);`);
    
    console.log("✅ Index créés");

    // Insertion d'un utilisateur admin par défaut
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@streamflix.com';
    const adminPassword = process.env.ADMIN_PASSWORD || '$2a$10$rVHGOjDj9AaDBTQqB4l8Zu1O9pF2z8n7H2J9v4Q6x7Y8z9A0b1C2e'; // "admin123" hashé
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    
    const adminResult = await pool.query(
      `INSERT INTO users (username, email, password, role) 
       VALUES ($1, $2, $3, 'admin') 
       ON CONFLICT (email) DO NOTHING 
       RETURNING id`,
      [adminUsername, adminEmail, adminPassword]
    );
    
    if (adminResult.rows.length > 0) {
      console.log("✅ Utilisateur admin créé");
    } else {
      console.log("ℹ️  Utilisateur admin déjà existant");
    }

    console.log("🎉 Base de données initialisée avec succès!");
  } catch (error) {
    console.error("❌ Erreur lors de l'initialisation de la base de données:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Exécution du script si appelé directement
if (require.main === module) {
  initDatabase();
}

export { initDatabase };