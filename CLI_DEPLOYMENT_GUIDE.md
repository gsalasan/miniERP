# 🚀 Railway CLI Deployment Guide for miniERP

## Quick Deploy from CLI

### Step 1: Install Railway CLI
```bash
npm install -g @railway/cli
railway login
```

### Step 2: Initialize Project
```bash
# Create new Railway project
railway init

# Add PostgreSQL database
railway add postgresql

# Get database URL
railway variables
```

### Step 3: Deploy Services

#### Deploy Backend Services
```bash
# Identity Service
cd services/identity-service
railway up
railway variables set NODE_ENV=production
railway variables set DATABASE_URL=${{Postgres.DATABASE_URL}}

# CRM Service
cd ../crm-service
railway up
railway variables set NODE_ENV=production
railway variables set DATABASE_URL=${{Postgres.DATABASE_URL}}

# Finance Service
cd ../finance-service
railway up
railway variables set NODE_ENV=production
railway variables set DATABASE_URL=${{Postgres.DATABASE_URL}}

# HR Service
cd ../hr-service
railway up
railway variables set NODE_ENV=production
railway variables set DATABASE_URL=${{Postgres.DATABASE_URL}}
```

#### Run Database Migrations
```bash
cd services/identity-service
railway run npx prisma migrate deploy
railway run npx prisma generate
```

#### Deploy Frontend Services
```bash
# Main Frontend
cd frontend/apps/main-frontend
railway up
railway variables set NODE_ENV=production

# CRM Frontend
cd ../crm-frontend
railway up
railway variables set NODE_ENV=production

# Finance Frontend
cd ../finance-frontend
railway up
railway variables set NODE_ENV=production

# HR Frontend
cd ../hr-frontend
railway up
railway variables set NODE_ENV=production
```

### Step 4: Check Status
```bash
# Check all services
railway status

# View logs
railway logs

# Connect to service
railway connect

# View variables
railway variables
```

## Environment Variables

### Backend Services
- `DATABASE_URL` - PostgreSQL connection string
- `NODE_ENV` - production
- `JWT_SECRET` - Your secret key
- `CORS_ORIGIN` - Your frontend URL

### Frontend Services
- `VITE_API_URL` - Backend API URL
- `VITE_IDENTITY_URL` - Identity service URL
- `VITE_CRM_URL` - CRM service URL
- `VITE_FINANCE_URL` - Finance service URL
- `NODE_ENV` - production

## Useful Commands

```bash
# Deploy current directory
railway up

# View deployment logs
railway logs

# Connect to database
railway connect postgresql

# Run commands in service
railway run <command>

# Check service status
railway status

# View service metrics
railway metrics

# Link to existing service
railway link

# Show service URL
railway domain
```

## Troubleshooting

```bash
# View recent logs
railway logs --tail 100

# Check service health
railway status

# Restart service
railway restart

# View build logs
railway logs --build

# Connect to container
railway shell
```
