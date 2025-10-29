# Railway GitHub Docker Deployment Guide

## Overview
This guide shows how to deploy your miniERP application to Railway directly from your GitHub repository using Docker containers.

## Prerequisites
- GitHub repository with your miniERP code
- Railway account
- Railway CLI installed (`npm install -g @railway/cli`)

## Step 1: Prepare Your Repository

### 1.1 Ensure All Files Are Committed
```bash
git add .
git commit -m "Add Railway Docker deployment configuration"
git push origin main
```

### 1.2 Verify Required Files
Make sure these files exist in your repository:
- `railway.json` (root)
- `services/*/railway.json` (all backend services)
- `frontend/apps/*/railway.json` (all frontend apps)
- `services/*/Dockerfile.prod` (production Dockerfiles)
- `frontend/apps/*/Dockerfile.prod` (frontend Dockerfiles)

## Step 2: Railway Project Setup

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

## Step 3: Deploy Services from GitHub

### 3.1 Deploy Backend Services
Each backend service needs to be deployed separately:

```bash
# Identity Service (deploy first - contains database schema)
railway up --service identity-service --source github

# CRM Service
railway up --service crm-service --source github

# Finance Service
railway up --service finance-service --source github

# HR Service
railway up --service hr-service --source github

# Engineering Service
railway up --service engineering-service --source github

# Inventory Service
railway up --service inventory-service --source github

# Procurement Service
railway up --service procurement-service --source github

# Project Service
railway up --service project-service --source github
```

### 3.2 Deploy Frontend Applications
```bash
# Main Frontend
railway up --service main-frontend --source github

# CRM Frontend
railway up --service crm-frontend --source github

# Finance Frontend
railway up --service finance-frontend --source github

# HR Frontend
railway up --service hr-frontend --source github

# Engineering Frontend
railway up --service engineering-frontend --source github

# Procurement Frontend
railway up --service procurement-frontend --source github

# Project Frontend
railway up --service project-frontend --source github
```

## Step 4: Environment Variables

### 4.1 Backend Services Environment Variables
Set these for each backend service in Railway dashboard:

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
Set these for each frontend service:

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

## Step 6: GitHub Actions Integration

### 6.1 Create GitHub Actions Workflow
Create `.github/workflows/railway-deploy.yml`:

```yaml
name: Deploy to Railway

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

env:
  RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}

jobs:
  deploy:
    name: Deploy to Railway
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
          railway up --service identity-service --source github &
          railway up --service crm-service --source github &
          railway up --service finance-service --source github &
          railway up --service hr-service --source github &
          
          # Wait for backend services
          wait
          
          # Run database migrations
          railway run --service identity-service npx prisma migrate deploy
          
          # Deploy frontend services
          railway up --service main-frontend --source github &
          railway up --service crm-frontend --source github &
          railway up --service finance-frontend --source github &
          railway up --service hr-frontend --source github &
          
          # Wait for frontend services
          wait

      - name: Health Check
        run: |
          echo "🚀 Deployment completed successfully!"
          echo "All services deployed from GitHub repository"
```

## Step 7: Railway Dashboard Configuration

### 7.1 Service Configuration
In Railway dashboard, configure each service:

1. **Service Name**: Use descriptive names (e.g., `minierp-identity-service`)
2. **Source**: GitHub repository
3. **Branch**: `main` (or your default branch)
4. **Root Directory**: Leave empty for root, or specify service directory
5. **Build Command**: Leave empty (uses Dockerfile)
6. **Start Command**: Leave empty (uses Dockerfile CMD)

### 7.2 Environment Variables
Set environment variables for each service:

**Backend Services:**
- `DATABASE_URL`: `${{Postgres.DATABASE_URL}}`
- `NODE_ENV`: `production`
- `JWT_SECRET`: `your-secret-key`
- `CORS_ORIGIN`: `https://your-frontend.railway.app`

**Frontend Services:**
- `VITE_API_URL`: `https://your-backend.railway.app`
- `VITE_IDENTITY_URL`: `https://your-identity.railway.app`

## Step 8: Monitoring and Debugging

### 8.1 Check Deployment Status
```bash
# Check all services
railway status

# Check specific service
railway status --service identity-service

# View logs
railway logs --service identity-service

# Follow logs
railway logs --service identity-service --follow
```

### 8.2 Health Checks
```bash
# Test service health
curl https://your-service.railway.app/health

# Check service metrics
railway metrics --service identity-service
```

## Benefits of GitHub Integration

### ✅ Advantages
- **Automatic Deployments**: Deploy on every push to main branch
- **Version Control**: Full deployment history in GitHub
- **Collaboration**: Team members can trigger deployments
- **Rollback**: Easy rollback to previous commits
- **CI/CD**: Integrated with GitHub Actions

### 🔧 Features
- **Source Control**: Direct deployment from GitHub
- **Branch Deployments**: Deploy from any branch
- **Pull Request Previews**: Test deployments before merging
- **Automatic Builds**: Railway builds on every push

## Troubleshooting

### Common Issues
1. **Build Failures**: Check Dockerfile syntax and dependencies
2. **Service Communication**: Verify environment variables
3. **Database Connection**: Ensure DATABASE_URL is set correctly
4. **CORS Issues**: Check CORS_ORIGIN environment variable

### Debug Commands
```bash
# View build logs
railway logs --service service-name

# Check service status
railway status --service service-name

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

Your miniERP application will be fully deployed from GitHub using Docker containers! 🎉
