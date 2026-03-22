const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

console.log("[DB Upgrade] Starting database schema check...");

// Try to parse DATABASE_URL if provided, else define fallback
const dbUrl = process.env.DATABASE_URL || "file:./data/dev.db";
let dbPath = dbUrl;
if (dbUrl.startsWith("file:")) {
  dbPath = dbUrl.replace("file:", "");
}

// Ensure the directory exists
const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

try {
  const db = new Database(dbPath, { timeout: 8000 });

  // Create system_logs table if missing
  db.exec(`
    CREATE TABLE IF NOT EXISTS system_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      level TEXT NOT NULL,
      message TEXT NOT NULL,
      details TEXT,
      source TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);
  console.log("[DB Upgrade] Ensured system_logs table exists.");

  // Check and add legacy_id to clients table
  try {
    const tableInfo = db.prepare("PRAGMA table_info(clients)").all();
    if (tableInfo.length > 0) {
      if (!tableInfo.find((c) => c.name === "legacy_id")) {
        db.exec("ALTER TABLE clients ADD COLUMN legacy_id INTEGER;");
        console.log("[DB Upgrade] Added legacy_id column to clients table.");
      } else {
        console.log("[DB Upgrade] legacy_id column already exists.");
      }
    } else {
      console.log(
        "[DB Upgrade] clients table does not exist yet; Drizzle will handle it.",
      );
    }
  } catch (e) {
    console.error("[DB Upgrade] Could not check clients schema:", e.message);
  }

  db.close();
  console.log("[DB Upgrade] Database schema check completed successfully.");
} catch (error) {
  console.error("[DB Upgrade] Failed to access or upgrade database:", error);
}
