# =============================================================================
# PathPilot Frontend Dockerfile — Multi-Stage Production Build
# Stage 1: Build React/Vite app with Node.js
# Stage 2: Serve static assets via Nginx (no Node.js at runtime)
# =============================================================================

# ── Stage 1: Builder ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy manifests first — separate layer for npm install caching.
# npm ci: clean install, uses package-lock.json exactly, no surprises.
COPY package.json package-lock.json ./
RUN npm ci --prefer-offline

# Build-time API URL — Nginx will proxy /api/v1 → backend:8000
# This means the browser always calls the same origin (no CORS needed).
ARG VITE_API_URL=/api/v1
ENV VITE_API_URL=$VITE_API_URL

# Copy source and build
COPY . .
RUN npm run build

# ── Stage 2: Nginx Serve ──────────────────────────────────────────────────────
FROM nginx:1.27-alpine

# Remove default Nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our custom Nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

# Nginx runs in foreground
CMD ["nginx", "-g", "daemon off;"]
