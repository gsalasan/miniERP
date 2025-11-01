# Multi-stage build for production
FROM node:22-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
## No prisma directory present for this service; skip copying

# Install all dependencies (including dev dependencies for build)
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Copy source code
COPY . .

## Skip Prisma client generation (no prisma schema present)

# Build the application
RUN npm run build

# Production stage
FROM node:22-alpine AS runner

# Set working directory
WORKDIR /app

# Install system deps required by Prisma engines (OpenSSL) and curl for healthcheck
RUN apk add --no-cache openssl curl

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copy package files
COPY package*.json ./
## No prisma directory; nothing to copy

# Install only production dependencies
RUN if [ -f package-lock.json ]; then npm ci --only=production; else npm install --only=production; fi && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist
# Copy Prisma engine artifacts for @prisma/client runtime
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

# Switch to non-root user
USER nextjs

# Expose port (Cloud Run will override this)
EXPOSE 8080

# Set default port explicitly
ENV PORT=8080

# Health check (use curl for Alpine compatibility); allow longer startup
HEALTHCHECK --interval=30s --timeout=5s --start-period=120s --retries=3 \
  CMD curl -fsS http://localhost:8080/health || exit 1

# Start the application in production mode
CMD ["node", "dist/server.js"]
