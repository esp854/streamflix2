"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.pool = void 0;
var dotenv_1 = require("dotenv");
var pg_1 = require("pg");
var node_postgres_1 = require("drizzle-orm/node-postgres");
var schema = require("@shared/schema");
// Charger les variables d'environnement
(0, dotenv_1.config)();
// Use the DATABASE_URL from environment variables
var databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
}
exports.pool = new pg_1.Pool({
    connectionString: databaseUrl,
    ssl: { rejectUnauthorized: false }
});
exports.db = (0, node_postgres_1.drizzle)(exports.pool, { schema: schema });
