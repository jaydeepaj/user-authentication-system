# ── Stage 1: Build ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files first for better layer caching
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production && npm cache clean --force

# Copy application source
COPY . .

# ── Stage 2: Production ────────────────────────────────────────────────────────
FROM node:20-alpine AS production

# Install security updates
RUN apk upgrade --no-cache

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeuser -u 1001 -G nodejs

WORKDIR /app

# Copy built node_modules from builder
COPY --from=builder --chown=nodeuser:nodejs /app/node_modules ./node_modules

# Copy application files
COPY --chown=nodeuser:nodejs . .

# Remove unnecessary files
RUN rm -rf tests/ docs/ .env.example

# Set environment
ENV NODE_ENV=production
ENV PORT=5000

# Expose port
EXPOSE 5000

# Switch to non-root user
USER nodeuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# Start server
CMD ["node", "server.js"]
