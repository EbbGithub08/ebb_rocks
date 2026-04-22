import mysql from "mysql2/promise";

let pool = null;

/**
 * Shared MySQL pool for API routes. Returns null until DB_* env vars are set.
 * Wire `getPool()` into routes when you implement comments, users, and admin.
 */
export function getPool() {
  const connectionUri = process.env.DATABASE_URL;
  const host = process.env.DB_HOST;
  const database = process.env.DB_NAME;
  if (!connectionUri && (!host || !database)) {
    return null;
  }

  if (!pool) {
    const baseConfig = {
      waitForConnections: true,
      connectionLimit: 10,
    };

    if (connectionUri) {
      const parsed = new URL(connectionUri);
      pool = mysql.createPool({
        host: parsed.hostname,
        port: Number(parsed.port) || 3306,
        user: decodeURIComponent(parsed.username),
        password: decodeURIComponent(parsed.password),
        database: parsed.pathname.replace(/^\//, ""),
        ...baseConfig,
      });
    } else {
      pool = mysql.createPool({
        host,
        port: Number(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD ?? "",
        database,
        ...baseConfig,
      });
    }
  }

  return pool;
}
