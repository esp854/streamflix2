import { config } from "dotenv";
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

// Charger les variables d'environnement
config();

// Use the DATABASE_URL from environment variables
const databaseUrl = process.env.DATABASE_URL || 'postgresql://postgres:1234@localhost:5432/streamkji?sslmode=disable';

export const pool = new Pool({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false }
});
export const db = drizzle(pool, { schema });