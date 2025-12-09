#!/bin/sh

if [ "$NODE_ENV" = "production" ]; then
  echo "🔧 Injecting VITE_ environment variables into built frontend files..."
  env | grep '^VITE_' | while IFS='=' read -r key value; do
    placeholder="__${key}__"
    echo "> Replacing $placeholder with $value"
    find /app/frontend/dist -type f -exec sed -i "s|$placeholder|$value|g" {} +
  done

  echo "Starting backend (serving frontend)..."
  node /app/backend/dist/server.js
else
  echo "Starting frontend and backend in dev mode..."
  npm --prefix frontend run dev -- --host &
  npm --prefix backend run dev &
  wait
fi