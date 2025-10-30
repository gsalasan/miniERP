# Multi-stage build for production
FROM node:22-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
## No prisma directory present for this service; skip copying

# Install all dependencies (including dev dependencies for build)
RUN npm ci || npm install --no-fund --no-audit

# Copy source code
COPY . .

## Skip Prisma client generation (no prisma schema present)

# Build the application
RUN npm run build

# Production stage
FROM node:22-alpine AS runner

# Set working directory
WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copy package files
COPY package*.json ./
## No prisma directory; nothing to copy

# Install only production dependencies
RUN npm ci --only=production || npm install --omit=dev --no-fund --no-audit && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder --chown=nextjs:nodejs /app/dist ./dist
## No Prisma client artifacts to copy

# Switch to non-root user
USER nextjs

# Expose port (Cloud Run will override this)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Start the application in production mode
CMD ["npm", "start"]
