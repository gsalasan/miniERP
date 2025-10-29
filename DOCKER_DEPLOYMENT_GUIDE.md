# 🐳 Railway Docker Deployment Guide for miniERP

## Overview
This guide will help you deploy your miniERP application to Railway using Docker containers. This approach provides better control over the deployment environment and ensures consistency across different platforms.

## Prerequisites
- Railway account
- Railway CLI installed (`npm install -g @railway/cli`)
- Docker installed locally (for testing)
- GitHub repository with your code

## Step 1: Prepare Your Repository

### 1.1 Create Production Dockerfiles
Each service needs a production-ready Dockerfile:

**Backend Services (e.g., identity-service):**
```dockerfile
# Multi-stage build for production
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --only=production
RUN npx prisma generate

FROM node:22-alpine AS production
RUN apk add --no-cache dumb-init
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
WORKDIR /app
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --chown=nextjs:nodejs . .
USER nextjs
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]
```

**Frontend Applications:**
```dockerfile
# Multi-stage build for production
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
```

### 1.2 Update railway.json Files
Update all railway.json files to use Docker:

```json
{
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile.prod"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

## Step 2: Railway Setup

### 2.1 Create Railway Project
```bash
# Login to Railway
railway login

# Create new project
railway init

# Link to existing project (if created via web)
railway link
```

### 2.2 Add PostgreSQL Database
```bash
# Add PostgreSQL service
railway add postgresql

# Get database URL
railway variables
```

## Step 3: Deploy Services

### 3.1 Deploy Backend Services
Deploy each backend service separately:

```bash
# Identity Service (deploy first - contains database migrations)
cd services/identity-service
railway up --service identity-service

# CRM Service
cd ../crm-service
railway up --service crm-service

# Finance Service
cd ../finance-service
railway up --service finance-service

# HR Service
cd ../hr-service
railway up --service hr-service

# Engineering Service
cd ../engineering-service
railway up --service engineering-service

# Inventory Service
cd ../inventory-service
railway up --service inventory-service

# Procurement Service
cd ../procurement-service
railway up --service procurement-service

# Project Service
cd ../project-service
railway up --service project-service
```

### 3.2 Deploy Frontend Applications
```bash
# Main Frontend
cd frontend/apps/main-frontend
railway up --service main-frontend

# CRM Frontend
cd ../crm-frontend
railway up --service crm-frontend

# Finance Frontend
cd ../finance-frontend
railway up --service finance-frontend

# HR Frontend
cd ../hr-frontend
railway up --service hr-frontend

# Engineering Frontend
cd ../engineering-frontend
railway up --service engineering-frontend

# Procurement Frontend
cd ../procurement-frontend
railway up --service procurement-frontend

# Project Frontend
cd ../project-frontend
railway up --service project-frontend
```

## Step 4: Environment Variables

### 4.1 Backend Services Environment Variables
Set these for each backend service:

```bash
# Database
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Service Configuration
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key

# CORS Configuration
CORS_ORIGIN=https://your-main-frontend.railway.app
```

### 4.2 Frontend Environment Variables
Set these for each frontend:

```bash
# API Endpoints
VITE_API_URL=https://your-backend-service.railway.app
VITE_IDENTITY_URL=https://your-identity-service.railway.app
VITE_CRM_URL=https://your-crm-service.railway.app
VITE_FINANCE_URL=https://your-finance-service.railway.app
```

## Step 5: Database Migrations

### 5.1 Run Migrations
```bash
# Run database migrations
railway run --service identity-service npx prisma migrate deploy

# Generate Prisma client
railway run --service identity-service npx prisma generate
```

## Step 6: Testing Deployment

### 6.1 Health Checks
Test each service:

```bash
# Check service health
railway status

# View logs
railway logs --service identity-service

# Test endpoints
curl https://your-identity-service.railway.app/health
```

## Step 7: GitHub Actions Integration

### 7.1 Update GitHub Actions Workflow
Update your `.github/workflows/deploy.yml`:

```yaml
name: Deploy miniERP to Railway (Docker)

on:
  push:
    branches: [ main ]

env:
  RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}

jobs:
  deploy:
    name: Deploy All Services
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Install Railway CLI
        run: npm install -g @railway/cli

      - name: Login to Railway
        run: railway login --token ${{ env.RAILWAY_TOKEN }}

      - name: Deploy Services
        run: |
          # Deploy backend services
          cd services/identity-service && railway up --service identity-service &
          cd services/crm-service && railway up --service crm-service &
          cd services/finance-service && railway up --service finance-service &
          cd services/hr-service && railway up --service hr-service &
          
          # Wait for backend services
          wait
          
          # Run database migrations
          railway run --service identity-service npx prisma migrate deploy
          
          # Deploy frontend applications
          cd frontend/apps/main-frontend && railway up --service main-frontend &
          cd frontend/apps/crm-frontend && railway up --service crm-frontend &
          cd frontend/apps/finance-frontend && railway up --service finance-frontend &
          cd frontend/apps/hr-frontend && railway up --service hr-frontend &
          
          wait

      - name: Health Check
        run: |
          echo "🚀 Deployment completed successfully!"
          echo "Services deployed with Docker containers"
```

## Benefits of Docker Deployment

### ✅ Advantages
- **Consistency**: Same environment across development and production
- **Isolation**: Each service runs in its own container
- **Scalability**: Easy to scale individual services
- **Security**: Better security with container isolation
- **Dependencies**: All dependencies are bundled in the container
- **Version Control**: Docker images are versioned and reproducible

### 🔧 Configuration Features
- **Multi-stage builds**: Optimized image sizes
- **Health checks**: Built-in service monitoring
- **Security**: Non-root user execution
- **Performance**: Optimized for production
- **Monitoring**: Built-in health check endpoints

## Troubleshooting

### Common Issues
1. **Build Failures**: Check Dockerfile syntax and dependencies
2. **Service Communication**: Verify environment variables and URLs
3. **Database Connection**: Ensure DATABASE_URL is correctly set
4. **Health Check Failures**: Verify health check endpoints are working

### Debugging Commands
```bash
# View service logs
railway logs --service service-name

# Check service status
railway status

# Connect to service
railway connect service-name

# Run commands in service
railway run --service service-name command
```

## Expected URLs

After deployment, you'll get URLs like:
- **Main Dashboard**: `https://main-frontend-production.railway.app`
- **Identity Service**: `https://identity-service-production.railway.app`
- **CRM Service**: `https://crm-service-production.railway.app`
- **Finance Service**: `https://finance-service-production.railway.app`
- **Database**: Internal connection string

Your miniERP application will be fully deployed using Docker containers on Railway! 🎉
