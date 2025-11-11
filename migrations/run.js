const fs = require("fs-extra");
const path = require("path");
const { Client } = require("pg");
const crypto = require("crypto");
require("dotenv").config();

async function runMigrations() {
  const dbConfig = {
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: parseInt(process.env.PGPORT, 10),
  };
  const client = new Client(dbConfig);

  function calculateChecksum(content) {
    return crypto.createHash("sha256").update(content, "utf8").digest("hex");
  }

  try {
    await client.connect();
    console.log("Connected to database");
    // Create migrations table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        checksum VARCHAR(64)
      );
    `);

    // Get all SQL files in migrations folder that match the pattern V{number}_{description}.sql
    const migrationsDir = path.join(__dirname);
    const files = await fs.readdir(migrationsDir);
    const sqlFiles = files.filter((file) => /^V\d+_.+\.sql$/.test(file)).sort();

    // Get all executed migrations
    const executedResult = await client.query("SELECT name, checksum FROM public.migrations");
    const executedMigrations = new Map(executedResult.rows.map((row) => [row.name, row.checksum]));

    console.log(`Checking ${sqlFiles.length} migration files...`);
    for (const file of sqlFiles) {
      const filePath = path.join(migrationsDir, file);
      const sql = await fs.readFile(filePath, "utf8");
      const checksum = calculateChecksum(sql);

      if (executedMigrations.has(file)) {
        const storedChecksum = executedMigrations.get(file);
        if (storedChecksum && storedChecksum !== checksum) {
          console.error(
            `Checksum mismatch for migration ${file}. File has been modified after execution.`
          );
          console.error(`Stored: ${storedChecksum}\nCurrent: ${checksum}`);
          process.exit(1);
        } else if (!storedChecksum) {
          console.warn(
            `Migration ${file} executed but no checksum stored (legacy). Skipping verification.`
          );
        }
      } else {
        console.log(`Running migration: ${file}`);
        await client.query(sql);
        await client.query("INSERT INTO public.migrations (name, checksum) VALUES ($1, $2)", [
          file,
          checksum,
        ]);
        console.log(`Migration ${file} completed`);
      }
    }

    console.log("All migrations checked and up to date");
  } catch (err) {
    console.error("Error running migrations:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();
