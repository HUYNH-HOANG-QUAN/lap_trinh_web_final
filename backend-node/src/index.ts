import "reflect-metadata";
import "dotenv/config";
import app from "./app";
import { initializeDatabase } from "./config/database";
import { seedDefaultUsers } from "./service/seedService";
import { config } from "./config/env";

process.on("unhandledRejection", (reason, promise) => {
  console.error("[UnhandledRejection] Reason:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("[UncaughtException]", err.message);
});

async function main() {
  console.log("[App] Initializing...");

  await initializeDatabase();

  try {
    await seedDefaultUsers();
  } catch (e) {
    console.warn("[Seed] Warning during seeding:", e);
  }

  app.listen(config.port, () => {
    console.log(`[App] ProFit backend running on http://localhost:${config.port}`);
    console.log(`[App] Admin panel: http://localhost:${config.port}/admin`);
  });
}

main().catch((err) => {
  console.error("[App] Fatal error:", err);
  process.exit(1);
});
