#!/bin/bash

# Google Cloud Run Deployment Script for miniERP
# This script builds and deploys all services to Google Cloud Run

set -e

# Configuration
PROJECT_ID="your-minierp-project-id"
REGION="us-central1"
SERVICES=("identity-service" "engineering-service" "crm-service" "finance-service" "hr-service")

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting miniERP Cloud Run Deployment${NC}"

# Check if gcloud is installed and authenticated
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI is not installed. Please install it first.${NC}"
    exit 1
fi

# Set the project
echo -e "${YELLOW}📋 Setting project to $PROJECT_ID${NC}"
gcloud config set project $PROJECT_ID

# Enable required APIs
echo -e "${YELLOW}🔧 Enabling required APIs${NC}"
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable sqladmin.googleapis.com

# Build and deploy each service
for service in "${SERVICES[@]}"; do
    echo -e "${YELLOW}🔨 Building and deploying $service${NC}"
    
    # Build the container
    echo -e "${YELLOW}  📦 Building container image${NC}"
    gcloud builds submit --tag gcr.io/$PROJECT_ID/$service:latest ./services/$service/
    
    # Deploy to Cloud Run
    echo -e "${YELLOW}  🚀 Deploying to Cloud Run${NC}"
    gcloud run deploy $service \
        --image gcr.io/$PROJECT_ID/$service:latest \
        --platform managed \
        --region $REGION \
        --allow-unauthenticated \
        --port 8080 \
        --memory 512Mi \
        --cpu 1 \
        --max-instances 10 \
        --min-instances 0 \
        --concurrency 100 \
        --timeout 300 \
        --set-env-vars NODE_ENV=production,PORT=8080 \
        --set-secrets DATABASE_URL=database-secret:latest,JWT_SECRET=jwt-secret:latest
    
    echo -e "${GREEN}  ✅ $service deployed successfully${NC}"
done

echo -e "${GREEN}🎉 All services deployed successfully!${NC}"
echo -e "${YELLOW}📝 Next steps:${NC}"
echo "1. Set up Cloud SQL PostgreSQL database"
echo "2. Create secrets for DATABASE_URL and JWT_SECRET"
echo "3. Set up Cloud Load Balancer for API gateway"
echo "4. Deploy frontend applications to Cloud Storage or separate Cloud Run services"
echo "5. Configure custom domain and SSL certificates"
