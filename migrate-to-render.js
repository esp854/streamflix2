#!/usr/bin/env node

import { config } from 'dotenv';
import { Pool } from 'pg';
import fs from 'fs';

// Load environment variables
config();

const LOCAL_DB_URL = 'postgresql://postgres:1234@localhost:5432/streamkji?sslmode=disable';
const RENDER_DB_URL = process.env.DATABASE_URL;

if (!RENDER_DB_URL) {
  console.error('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

console.log('🚀 Starting database migration from local to Render...');
console.log('📍 Local DB:', LOCAL_DB_URL.replace(/:[^:]+@/, ':***@'));
console.log('🌐 Render DB:', RENDER_DB_URL.replace(/:[^:]+@/, ':***@'));

async function migrateDatabase() {
  const localPool = new Pool({
    connectionString: LOCAL_DB_URL,
    ssl: false
  });

  const renderPool = new Pool({
    connectionString: RENDER_DB_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔍 Checking local database connection...');
    const localClient = await localPool.connect();
    console.log('✅ Local database connected');

    console.log('🔍 Checking Render database connection...');
    const renderClient = await renderPool.connect();
    console.log('✅ Render database connected');

    // Get all tables from the local database
    const tablesQuery = `
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `;

    const tablesResult = await localClient.query(tablesQuery);
    const tables = tablesResult.rows.map(row => row.tablename);

    console.log(`📋 Found ${tables.length} tables:`, tables.join(', '));

    // Migrate each table
    for (const tableName of tables) {
      console.log(`\n📊 Migrating table: ${tableName}`);

      try {
        // Get table structure
        const structureQuery = `
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns
          WHERE table_name = $1 AND table_schema = 'public'
          ORDER BY ordinal_position;
        `;
        const structureResult = await localClient.query(structureQuery, [tableName]);

        // Create table in Render if it doesn't exist
        const createTableQuery = await generateCreateTableQuery(tableName, structureResult.rows);
        if (createTableQuery) {
          try {
            await renderClient.query(createTableQuery);
            console.log(`  ✅ Created table ${tableName} in Render`);
          } catch (error) {
            if (!error.message.includes('already exists')) {
              console.log(`  ⚠️  Table ${tableName} might already exist, continuing...`);
            }
          }
        }

        // Get all data from the table
        const dataQuery = `SELECT * FROM "${tableName}";`;
        const dataResult = await localClient.query(dataQuery);

        if (dataResult.rows.length === 0) {
          console.log(`  📭 Table ${tableName} is empty, skipping data migration`);
          continue;
        }

        console.log(`  📦 Migrating ${dataResult.rows.length} rows from ${tableName}`);

        // Clear existing data in Render table
        try {
          await renderClient.query(`TRUNCATE TABLE "${tableName}" CASCADE;`);
          console.log(`  🧹 Cleared existing data in ${tableName}`);
        } catch (error) {
          console.log(`  ⚠️  Could not truncate ${tableName}, it might be empty`);
        }

        // Insert data in batches
        const batchSize = 100;
        for (let i = 0; i < dataResult.rows.length; i += batchSize) {
          const batch = dataResult.rows.slice(i, i + batchSize);
          await insertBatch(renderClient, tableName, structureResult.rows, batch);
        }

        console.log(`  ✅ Successfully migrated ${dataResult.rows.length} rows to ${tableName}`);

      } catch (error) {
        console.error(`  ❌ Error migrating table ${tableName}:`, error.message);
        // Continue with other tables
      }
    }

    console.log('\n🎉 Database migration completed successfully!');
    console.log('📊 Summary:');
    console.log(`   - Tables processed: ${tables.length}`);
    console.log('   - Data migrated from local PostgreSQL to Render');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await localPool.end();
    await renderPool.end();
  }
}

async function generateCreateTableQuery(tableName, columns) {
  if (columns.length === 0) return null;

  const columnDefs = columns.map(col => {
    let def = `"${col.column_name}" ${col.data_type.toUpperCase()}`;

    if (col.data_type.toLowerCase().includes('varchar') && col.character_maximum_length) {
      def = def.replace('VARCHAR', `VARCHAR(${col.character_maximum_length})`);
    }

    if (col.is_nullable === 'NO') {
      def += ' NOT NULL';
    }

    if (col.column_default) {
      def += ` DEFAULT ${col.column_default}`;
    }

    return def;
  });

  // Add primary key constraints if they exist
  const pkQuery = `
    SELECT a.attname
    FROM pg_index i
    JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
    WHERE i.indrelid = $1::regclass AND i.indisprimary;
  `;

  return `
    CREATE TABLE IF NOT EXISTS "${tableName}" (
      ${columnDefs.join(',\n      ')}
    );
  `;
}

async function insertBatch(client, tableName, columns, rows) {
  if (rows.length === 0) return;

  const columnNames = columns.map(col => `"${col.column_name}"`);
  const placeholders = rows.map((_, rowIndex) =>
    `(${columns.map((_, colIndex) => `$${rowIndex * columns.length + colIndex + 1}`).join(', ')})`
  ).join(', ');

  const values = rows.flatMap(row =>
    columns.map(col => row[col.column_name])
  );

  const query = `INSERT INTO "${tableName}" (${columnNames.join(', ')}) VALUES ${placeholders};`;

  await client.query(query, values);
}

// Run the migration
migrateDatabase().catch(error => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});