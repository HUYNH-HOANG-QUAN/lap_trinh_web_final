#!/bin/sh
# entrypoint.sh — Chạy SQL init rồi mới start Node app

echo "[Entrypoint] Running DB init script..."
node /app/sql-scripts/init-db.js
INIT_EXIT=$?

if [ $INIT_EXIT -ne 0 ]; then
  echo "[Entrypoint] DB init failed. Starting app anyway (tables may already exist)..."
fi

echo "[Entrypoint] Starting Node app..."
exec node dist/index.js
