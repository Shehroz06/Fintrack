#!/usr/bin/env bash
# Starts the FinTrack backend and frontend together.
# Usage: ./run.sh
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

if [ ! -f "$BACKEND_DIR/.env" ]; then
  echo "Missing backend/.env — copying from backend/.env.example."
  echo "Edit backend/.env (DB_PASSWORD, JWT_SECRET) before continuing."
  cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
  exit 1
fi

if [ ! -d "$BACKEND_DIR/node_modules" ]; then
  echo "Installing backend dependencies..."
  (cd "$BACKEND_DIR" && npm install)
fi

if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
  echo "Installing frontend dependencies..."
  (cd "$FRONTEND_DIR" && npm install)
fi

cleanup() {
  echo "Stopping FinTrack..."
  kill "$BACKEND_PID" "$FRONTEND_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

(cd "$BACKEND_DIR" && npm start) &
BACKEND_PID=$!

(cd "$FRONTEND_DIR" && npm start) &
FRONTEND_PID=$!

echo "Backend:  http://localhost:5000"
echo "Frontend: http://localhost:3000"

wait "$BACKEND_PID" "$FRONTEND_PID"
