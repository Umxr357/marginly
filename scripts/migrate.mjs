import fs from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { database } from "../db/client.mjs";

// Node's loader preserves variables already supplied by Render or the shell.
try {
  process.loadEnvFile(".env.local");
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

const db = database();
const directory = fileURLToPath(new URL("../db/migrations/", import.meta.url));

try {
  await db.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    version TEXT PRIMARY KEY,
    checksum TEXT NOT NULL,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
  const applied = new Map(
    (
      await db.query("SELECT version, checksum FROM schema_migrations")
    ).rows.map((row) => [row.version, row.checksum]),
  );
  const files = (await fs.readdir(directory))
    .filter((file) => file.endsWith(".sql"))
    .sort();
  for (const version of files) {
    const sql = (
      await fs.readFile(
        new URL(`../db/migrations/${version}`, import.meta.url),
        "utf8",
      )
    ).replaceAll("\r\n", "\n");
    const checksum = createHash("sha256").update(sql).digest("hex");
    if (applied.has(version)) {
      if (applied.get(version) !== checksum)
        throw new Error(
          `Migration ${version} changed after it was applied. Restore it and add a new migration instead.`,
        );
      continue;
    }
    const statements = sql
      .split("--> statement-breakpoint")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((statement) => ({ sql: statement }));
    statements.push({
      sql: "INSERT INTO schema_migrations (version, checksum) VALUES ($1, $2)",
      values: [version, checksum],
    });
    await db.transaction(statements);
    console.log(`Applied ${version}`);
  }
  console.log("Database migrations complete.");
} catch (error) {
  console.error("Database migration failed:", error.message);
  process.exitCode = 1;
} finally {
  await db.close();
}
