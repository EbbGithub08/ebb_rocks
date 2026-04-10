import mysql from "mysql2/promise";

let pool = null;

/**
 * Shared MySQL pool for API routes. Returns null until DB_* env vars are set.
 * Wire `getPool()` into routes when you implement comments, users, and admin.
 */
export function getPool() {
  const host = process.env.DB_HOST;
  const database = process.env.DB_NAME;
  if (!host || !database) {
    return null;
  }

  if (!pool) {
    pool = mysql.createPool({
      host,
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD ?? "",
      database,
      waitForConnections: true,
      connectionLimit: 10,
    });
  }

  return pool;
}
