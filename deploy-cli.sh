#!/bin/bash

# Railway CLI Deployment Script for miniERP
# Deploys all services to Railway using CLI

echo "🚀 Deploying miniERP to Railway via CLI"
echo "========================================"

# Check Railway CLI
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not installed. Install with: npm install -g @railway/cli"
    exit 1
fi

echo "✅ Railway CLI installed"

# Check authentication
if ! railway whoami &> /dev/null; then
    echo "❌ Not logged in to Railway. Run: railway login"
    exit 1
fi

echo "✅ Authenticated with Railway"
echo ""

# Deploy Identity Service first
echo "📦 Deploying Identity Service..."
cd services/identity-service
railway up --detach
railway variables set NODE_ENV=production
railway variables set PORT=4000
cd ../..

# Run migrations
echo "🗄️  Running database migrations..."
cd services/identity-service
railway run npx prisma migrate deploy
railway run npx prisma generate
cd ../..

# Deploy other backend services
echo "📦 Deploying backend services..."
services=("crm-service" "finance-service" "hr-service" "engineering-service" "inventory-service" "procurement-service" "project-service")

for service in "${services[@]}"; do
    echo "  → Deploying $service..."
    cd "services/$service"
    railway up --detach
    railway variables set NODE_ENV=production
    cd ../..
done

# Deploy frontend services
echo "🌐 Deploying frontend services..."
frontends=("main-frontend" "crm-frontend" "finance-frontend" "hr-frontend" "engineering-frontend" "procurement-frontend" "project-frontend")

for frontend in "${frontends[@]}"; do
    echo "  → Deploying $frontend..."
    cd "frontend/apps/$frontend"
    railway up --detach
    railway variables set NODE_ENV=production
    cd ../../..
done

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📊 Check status: railway status"
echo "📝 View logs: railway logs"
echo "🔗 Service URLs: railway domain"
