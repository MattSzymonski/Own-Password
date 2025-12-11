#!/bin/sh

if [ "$NODE_ENV" = "production" ]; then
  echo "🔧 Injecting frontend environment variables into built frontend files..."
  
  # List of frontend environment variables to inject
  # Ensure these match docker-compose env keys
  FRONTEND_VARS="APP_NAME REQUIRE_APP_PASSWORD HIDE_APP_LOGO SINGLE_COLLECTION_FILE BACKEND_URL"
  
  for var in $FRONTEND_VARS; do
    value=$(eval echo \$$var)
    placeholder="__${var}__"
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