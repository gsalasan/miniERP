# Next Steps After Service Creation

## ✅ Services Created Successfully!

Now that all services are created, here's how to deploy them:

## Step 1: Verify Services

```bash
# List all services in your project
railway status --all

# Or check in Railway dashboard
# https://railway.app/project/endearing-spirit
```

## Step 2: Set Up Database Connection

```bash
# Get your database URL
railway variables

# For each backend service, set DATABASE_URL
cd services/identity-service
railway link
railway variables set DATABASE_URL='${{Postgres.DATABASE_URL}}'
railway variables set NODE_ENV=production
railway variables set PORT=4000
cd ../..
```

## Step 3: Run Database Migrations

```bash
cd services/identity-service
railway link
railway run npx prisma migrate deploy
railway run npx prisma generate
cd ../..
```

## Step 4: Deploy All Services

### Option A: Deploy Each Service Manually
```bash
# Identity Service
cd services/identity-service
railway link
railway up
cd ../..

# CRM Service
cd services/crm-service
railway link
railway up
cd ../..

# Repeat for all services...
```

### Option B: Use Deployment Script
```bash
# Run the deployment script
./deploy-cli.sh
```

## Step 5: Deploy Frontend Services

```bash
# Main Frontend
cd frontend/apps/main-frontend
railway link
railway up
cd ../../..

# CRM Frontend
cd frontend/apps/crm-frontend
railway link
railway up
cd ../../..

# Repeat for all frontends...
```

## Environment Variables to Set

### Backend Services (set for each):
```bash
railway variables set DATABASE_URL='${{Postgres.DATABASE_URL}}'
railway variables set NODE_ENV=production
railway variables set JWT_SECRET=your-secret-key-here
railway variables set CORS_ORIGIN=https://your-main-frontend.railway.app
```

### Frontend Services (set for each):
```bash
railway variables set NODE_ENV=production
railway variables set VITE_API_URL=https://your-backend.railway.app
railway variables set VITE_IDENTITY_URL=https://your-identity.railway.app
railway variables set VITE_CRM_URL=https://your-crm.railway.app
```

## Quick Deployment Commands

```bash
# 1. Link and deploy identity service first
cd services/identity-service
railway link
railway variables set DATABASE_URL='${{Postgres.DATABASE_URL}}'
railway up

# 2. Run migrations
railway run npx prisma migrate deploy

# 3. Deploy other services
cd ../crm-service && railway link && railway up && cd ../..
cd ../finance-service && railway link && railway up && cd ../..

# 4. Deploy frontends
cd ../../frontend/apps/main-frontend && railway link && railway up && cd ../../..
```

## Check Deployment Status

```bash
# View all services
railway status --all

# View specific service logs
railway logs --service identity-service

# Get service URLs
railway domain --service identity-service
```

## Your Project Info
- **Project Name**: endearing-spirit
- **Environment**: production
- **Status**: Services created, ready for deployment
