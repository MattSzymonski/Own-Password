# ---------- Build Stage ----------
FROM node:22-slim AS builder

WORKDIR /app

# Install dependencies
COPY backend/package.json /app/backend/
COPY frontend/package.json /app/frontend/
RUN cd /app/backend && npm install
RUN cd /app/frontend && npm install

# Copy source and build
COPY backend /app/backend
COPY frontend /app/frontend
# Debug: ensure SW exists
RUN ls -al /app/frontend/src

RUN cd /app/backend && npm run build
RUN cd /app/frontend && npm run build

# ---------- Runtime Stage ----------
FROM node:22-slim 

WORKDIR /app

# Install dependencies
RUN apt-get update && apt-get install -y curl
# <PUT DEPENDENCIES HERE IF NEEDED>

# Copy only built files and production dependencies
COPY --from=builder /app/backend/dist /app/backend/dist
COPY --from=builder /app/frontend/dist /app/frontend/dist

# Reinstall only prod deps (optional)
COPY backend/package.json /app/backend/
COPY frontend/package.json /app/frontend/
RUN cd /app/backend && npm install --omit=dev
RUN cd /app/frontend && npm install --omit=dev

COPY entrypoint.sh /app/entrypoint.sh
ENTRYPOINT ["/app/entrypoint.sh"]
