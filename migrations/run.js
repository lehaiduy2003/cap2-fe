const fs = require("fs-extra");
const path = require("path");
const { Client } = require("pg");
require("dotenv").config();

async function runMigrations() {
  const client = new Client({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: parseInt(process.env.PGPORT, 10),
  });

  try {
    await client.connect();
    console.log("Connected to database");
    // Create migrations table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Get all SQL files in migrations folder that match the pattern V{number}_{description}.sql
    const migrationsDir = path.join(__dirname);
    const files = await fs.readdir(migrationsDir);
    const sqlFiles = files.filter((file) => /^V\d+_.+\.sql$/.test(file)).sort();

    // Get all executed migrations
    const executedResult = await client.query("SELECT name FROM public.migrations");
    const executedMigrations = new Set(executedResult.rows.map((row) => row.name));

    // Filter out migrations that have already been executed
    const pendingMigrations = sqlFiles.filter((file) => !executedMigrations.has(file));
    if (pendingMigrations.length === 0) {
      console.log("No pending migrations to run");
      return;
    }
    console.log(`Start running ${pendingMigrations.length} pending migrations...`);
    for (const file of pendingMigrations) {
      const filePath = path.join(migrationsDir, file);
      const sql = await fs.readFile(filePath, "utf8");
      console.log(`Running migration: ${file}`);
      await client.query(sql);
      await client.query("INSERT INTO public.migrations (name) VALUES ($1)", [file]);
      console.log(`Migration ${file} completed`);
    }

    console.log("All migrations completed successfully");
  } catch (err) {
    console.error("Error running migrations:", err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();
