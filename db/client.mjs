import path from "node:path";
import { mkdir } from "node:fs/promises";

const databaseKey = Symbol.for("marginly.database");

function result(value) {
  return {
    rows: value.rows,
    rowCount: value.rowCount ?? value.affectedRows ?? value.rows.length,
  };
}

function createDatabase() {
  if (process.env.RENDER && !process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL is required on Render. Attach a PostgreSQL database before starting Marginly.",
    );
  }

  // Defer opening a connection until a request or migration actually needs it.
  // Next.js can import this module during its build without database credentials.
  let connection;
  const remote = Boolean(process.env.DATABASE_URL);
  async function connect() {
    if (!connection) {
      connection = remote
        ? import("pg").then(({ default: pg }) => {
            const pool = new pg.Pool({
              connectionString: process.env.DATABASE_URL,
              max: 5,
              idleTimeoutMillis: 30000,
              connectionTimeoutMillis: 10000,
            });
            pool.on("error", (error) =>
              console.error("Idle database connection failed", error.message),
            );
            return pool;
          })
        : import("@electric-sql/pglite").then(async ({ PGlite }) => {
            const directory = path.resolve(
              process.env.PGLITE_DATA_DIR || ".data/postgres",
            );
            await mkdir(directory, { recursive: true });
            return new PGlite(directory);
          });
    }
    return connection;
  }

  return {
    async query(sql, values = []) {
      const db = await connect();
      return result(await db.query(sql, values));
    },
    async transaction(statements) {
      const db = await connect();
      if (!remote) {
        return db.transaction(async (tx) => {
          const results = [];
          for (const statement of statements) {
            results.push(
              result(await tx.query(statement.sql, statement.values || [])),
            );
          }
          return results;
        });
      }
      const client = await db.connect();
      try {
        await client.query("BEGIN");
        const results = [];
        for (const statement of statements) {
          results.push(
            result(await client.query(statement.sql, statement.values || [])),
          );
        }
        await client.query("COMMIT");
        return results;
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    },
    async close() {
      if (!connection) return;
      const db = await connection;
      if (remote) await db.end();
      else await db.close();
      connection = undefined;
      delete globalThis[databaseKey];
    },
  };
}

export function database() {
  // One pool per Node process, including during development hot reloads.
  return (globalThis[databaseKey] ??= createDatabase());
}
