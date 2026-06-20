/**
 * init-db.js — Chạy SQL init script trước khi app start
 * Usage: node sql-scripts/init-db.js
 */
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");

const config = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "3306"),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  multipleStatements: true,
};

async function main() {
  const sqlFile = path.join(__dirname, "..", "sql-init.sql");
  const sql = fs.readFileSync(sqlFile, "utf8");

  console.log("[InitDB] Connecting to MySQL...");
  const connection = await mysql.createConnection(config);
  console.log("[InitDB] Connected.");

  try {
    console.log("[InitDB] Running SQL init script...");
    await connection.query(sql);
    console.log("[InitDB] SQL script executed successfully.");
  } catch (err) {
    if (err.code === "ER_TABLE_EXISTS_ERROR") {
      console.log("[InitDB] Table already exists, skipping.");
    } else {
      console.error("[InitDB] SQL error:", err.message);
      process.exit(1);
    }
  } finally {
    await connection.end();
  }
}

main().catch((err) => {
  console.error("[InitDB] Fatal:", err.message);
  process.exit(1);
});
