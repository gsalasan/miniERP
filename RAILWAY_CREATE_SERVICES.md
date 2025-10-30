# 🚀 Creating Services on Railway CLI

## When Services Don't Exist Yet

If a service doesn't exist on Railway, you need to create it first before deploying. Here's how:

### Method 1: Create Service with Specific Name

```bash
# Create a new service with a specific name
railway add --service identity-service

# Create service with environment variables
railway add --service crm-service --variables "NODE_ENV=production" --variables "PORT=3002"

# Create service and link to GitHub repo
railway add --service finance-service --repo "your-username/miniERP"
```

### Method 2: Create Service from Current Directory

```bash
# Navigate to service directory
cd services/identity-service

# Create and deploy in one command
railway up

# This will:
# 1. Create a new service if it doesn't exist
# 2. Deploy the current directory to that service
```

### Method 3: Create Service with Docker Image

```bash
# Create service from Docker image
railway add --service identity-service --image "node:18-alpine"

# Create service with specific variables
railway add --service crm-service --image "node:18-alpine" --variables "NODE_ENV=production"
```

## Complete Deployment Workflow

### Step 1: Initialize Project
```bash
# Create new Railway project
railway init

# Add PostgreSQL database
railway add --database postgres
```

### Step 2: Create and Deploy Backend Services

```bash
# Identity Service (create first - has database schema)
cd services/identity-service
railway add --service identity-service
railway variables set DATABASE_URL=${{Postgres.DATABASE_URL}}
railway variables set NODE_ENV=production
railway variables set PORT=4000
railway up
cd ../..

# CRM Service
cd services/crm-service
railway add --service crm-service
railway variables set DATABASE_URL=${{Postgres.DATABASE_URL}}
railway variables set NODE_ENV=production
railway variables set PORT=3002
railway up
cd ../..

# Finance Service
cd services/finance-service
railway add --service finance-service
railway variables set DATABASE_URL=${{Postgres.DATABASE_URL}}
railway variables set NODE_ENV=production
railway variables set PORT=3003
railway up
cd ../..

# HR Service
cd services/hr-service
railway add --service hr-service
railway variables set DATABASE_URL=${{Postgres.DATABASE_URL}}
railway variables set NODE_ENV=production
railway variables set PORT=3004
railway up
cd ../..

# Engineering Service
cd services/engineering-service
railway add --service engineering-service
railway variables set DATABASE_URL=${{Postgres.DATABASE_URL}}
railway variables set NODE_ENV=production
railway variables set PORT=3005
railway up
cd ../..

# Inventory Service
cd services/inventory-service
railway add --service inventory-service
railway variables set DATABASE_URL=${{Postgres.DATABASE_URL}}
railway variables set NODE_ENV=production
railway variables set PORT=3006
railway up
cd ../..

# Procurement Service
cd services/procurement-service
railway add --service procurement-service
railway variables set DATABASE_URL=${{Postgres.DATABASE_URL}}
railway variables set NODE_ENV=production
railway variables set PORT=3007
railway up
cd ../..

# Project Service
cd services/project-service
railway add --service project-service
railway variables set DATABASE_URL=${{Postgres.DATABASE_URL}}
railway variables set NODE_ENV=production
railway variables set PORT=3008
railway up
cd ../..
```

### Step 3: Run Database Migrations
```bash
cd services/identity-service
railway run npx prisma migrate deploy
railway run npx prisma generate
cd ../..
```

### Step 4: Create and Deploy Frontend Services

```bash
# Main Frontend
cd frontend/apps/main-frontend
railway add --service main-frontend
railway variables set NODE_ENV=production
railway variables set PORT=3000
railway up
cd ../../..

# CRM Frontend
cd frontend/apps/crm-frontend
railway add --service crm-frontend
railway variables set NODE_ENV=production
railway variables set PORT=3010
railway up
cd ../../..

# Finance Frontend
cd frontend/apps/finance-frontend
railway add --service finance-frontend
railway variables set NODE_ENV=production
railway variables set PORT=3011
railway up
cd ../../..

# HR Frontend
cd frontend/apps/hr-frontend
railway add --service hr-frontend
railway variables set NODE_ENV=production
railway variables set PORT=3012
railway up
cd ../../..

# Engineering Frontend
cd frontend/apps/engineering-frontend
railway add --service engineering-frontend
railway variables set NODE_ENV=production
railway variables set PORT=3013
railway up
cd ../../..

# Procurement Frontend
cd frontend/apps/procurement-frontend
railway add --service procurement-frontend
railway variables set NODE_ENV=production
railway variables set PORT=3014
railway up
cd ../../..

# Project Frontend
cd frontend/apps/project-frontend
railway add --service project-frontend
railway variables set NODE_ENV=production
railway variables set PORT=3015
railway up
cd ../../..
```

## Automated Script for Creating Services

```bash
#!/bin/bash

echo "🚀 Creating Railway Services for miniERP"

# Check Railway CLI
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not installed. Install with: npm install -g @railway/cli"
    exit 1
fi

# Check authentication
if ! railway whoami &> /dev/null; then
    echo "❌ Not logged in to Railway. Run: railway login"
    exit 1
fi

echo "✅ Railway CLI ready"

# Create backend services
echo "📦 Creating backend services..."
services=("identity-service" "crm-service" "finance-service" "hr-service" "engineering-service" "inventory-service" "procurement-service" "project-service")

for service in "${services[@]}"; do
    echo "  → Creating $service..."
    cd "services/$service"
    railway add --service "$service" --variables "NODE_ENV=production"
    railway variables set DATABASE_URL='${{Postgres.DATABASE_URL}}'
    cd ../..
done

# Create frontend services
echo "🌐 Creating frontend services..."
frontends=("main-frontend" "crm-frontend" "finance-frontend" "hr-frontend" "engineering-frontend" "procurement-frontend" "project-frontend")

for frontend in "${frontends[@]}"; do
    echo "  → Creating $frontend..."
    cd "frontend/apps/$frontend"
    railway add --service "$frontend" --variables "NODE_ENV=production"
    cd ../../..
done

echo "✅ All services created!"
echo "📊 Check status: railway status"
```

## Useful Commands

### Service Management
```bash
# List all services
railway status

# Create new service
railway add --service service-name

# Link existing service
railway link

# Remove service
railway remove

# Rename service
railway rename
```

### Environment Variables
```bash
# Set variables during creation
railway add --service my-service --variables "NODE_ENV=production" --variables "PORT=3000"

# Set variables after creation
railway variables set NODE_ENV=production
railway variables set PORT=3000

# View all variables
railway variables

# Remove variable
railway variables unset NODE_ENV
```

### Deployment
```bash
# Deploy current directory
railway up

# Deploy with specific service
railway up --service service-name

# Deploy from GitHub
railway up --source github

# Deploy with Docker
railway up --dockerfile Dockerfile.prod
```

## Troubleshooting

### Service Already Exists
```bash
# If service exists, link to it
railway link

# Or use existing service
railway up --service existing-service-name
```

### Service Not Found
```bash
# Create the service first
railway add --service service-name

# Then deploy
railway up
```

### Database Connection Issues
```bash
# Ensure DATABASE_URL is set
railway variables set DATABASE_URL='${{Postgres.DATABASE_URL}}'

# Check database status
railway connect postgresql
```

## Quick Reference

```bash
# 1. Initialize project
railway init

# 2. Add database
railway add --database postgres

# 3. Create service
railway add --service service-name

# 4. Set variables
railway variables set KEY=value

# 5. Deploy
railway up

# 6. Check status
railway status
```

This approach ensures all services are created properly before deployment!
