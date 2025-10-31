#!/bin/bash

# Google Cloud Run Setup Script for miniERP
# This script automates the initial GCP setup for Cloud Run deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Google Cloud Run Setup for miniERP${NC}"
echo "================================================"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${RED}❌ gcloud CLI is not installed. Please install it first.${NC}"
    echo "Visit: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo -e "${YELLOW}🔐 Please authenticate with Google Cloud first:${NC}"
    echo "Run: gcloud auth login"
    exit 1
fi

# Get project details
echo -e "${YELLOW}📋 Enter your Google Cloud Project details:${NC}"
read -p "Project ID: " PROJECT_ID
read -p "Region (default: us-central1): " REGION
REGION=${REGION:-us-central1}

# Set project
echo -e "${YELLOW}🔧 Setting project to $PROJECT_ID${NC}"
gcloud config set project $PROJECT_ID

# Enable required APIs
echo -e "${YELLOW}🔧 Enabling required APIs${NC}"
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable secretmanager.googleapis.com
gcloud services enable monitoring.googleapis.com
gcloud services enable logging.googleapis.com

# Create service account
echo -e "${YELLOW}👤 Creating service account for GitHub Actions${NC}"
SA_NAME="github-actions"
SA_EMAIL="$SA_NAME@$PROJECT_ID.iam.gserviceaccount.com"

# Check if service account already exists
if gcloud iam service-accounts describe $SA_EMAIL --quiet 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Service account $SA_EMAIL already exists${NC}"
else
    gcloud iam service-accounts create $SA_NAME \
        --display-name="GitHub Actions Service Account" \
        --description="Service account for GitHub Actions deployment"
    echo -e "${GREEN}✅ Service account created${NC}"
fi

# Grant required permissions
echo -e "${YELLOW}🔐 Granting required permissions${NC}"
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SA_EMAIL" \
    --role="roles/cloudbuild.builds.builder"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SA_EMAIL" \
    --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SA_EMAIL" \
    --role="roles/iam.serviceAccountUser"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SA_EMAIL" \
    --role="roles/cloudsql.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SA_EMAIL" \
    --role="roles/secretmanager.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SA_EMAIL" \
    --role="roles/storage.admin"

echo -e "${GREEN}✅ Permissions granted${NC}"

# Create service account key
echo -e "${YELLOW}🔑 Creating service account key${NC}"
KEY_FILE="github-actions-key.json"
gcloud iam service-accounts keys create $KEY_FILE \
    --iam-account=$SA_EMAIL

echo -e "${GREEN}✅ Service account key created: $KEY_FILE${NC}"

# Get database password
echo -e "${YELLOW}🔐 Database Configuration${NC}"
read -s -p "Enter database root password: " DB_PASSWORD
echo
read -s -p "Enter JWT secret: " JWT_SECRET
echo

# Create Cloud SQL instance
echo -e "${YELLOW}🗄️  Creating Cloud SQL instance${NC}"
if gcloud sql instances describe miniERP-db --quiet 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Cloud SQL instance miniERP-db already exists${NC}"
else
    gcloud sql instances create miniERP-db \
        --database-version=POSTGRES_15 \
        --tier=db-f1-micro \
        --region=$REGION \
        --root-password=$DB_PASSWORD \
        --storage-type=SSD \
        --storage-size=10GB \
        --backup-start-time=03:00
    echo -e "${GREEN}✅ Cloud SQL instance created${NC}"
fi

# Create database
echo -e "${YELLOW}📊 Creating database${NC}"
if gcloud sql databases describe miniERP --instance=miniERP-db --quiet 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Database miniERP already exists${NC}"
else
    gcloud sql databases create miniERP --instance=miniERP-db
    echo -e "${GREEN}✅ Database created${NC}"
fi

# Create secrets
echo -e "${YELLOW}🔐 Creating secrets${NC}"

# Database secret
if gcloud secrets describe database-secret --quiet 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Database secret already exists${NC}"
else
    echo "postgresql://postgres:$DB_PASSWORD@/miniERP?host=/cloudsql/$PROJECT_ID:$REGION:miniERP-db" | \
    gcloud secrets create database-secret --data-file=-
    echo -e "${GREEN}✅ Database secret created${NC}"
fi

# JWT secret
if gcloud secrets describe jwt-secret --quiet 2>/dev/null; then
    echo -e "${YELLOW}⚠️  JWT secret already exists${NC}"
else
    echo "$JWT_SECRET" | \
    gcloud secrets create jwt-secret --data-file=-
    echo -e "${GREEN}✅ JWT secret created${NC}"
fi

# Display service account key
echo -e "${GREEN}🎉 Setup completed successfully!${NC}"
echo "================================================"
echo -e "${YELLOW}📋 Next steps:${NC}"
echo "1. Copy the service account key below to GitHub Secrets as 'GCP_SA_KEY':"
echo "2. Add these secrets to your GitHub repository:"
echo "   - GCP_PROJECT_ID: $PROJECT_ID"
echo "   - GCP_SA_KEY: [content of $KEY_FILE]"
echo "   - DB_ROOT_PASSWORD: $DB_PASSWORD"
echo "   - JWT_SECRET: $JWT_SECRET"
echo ""
echo -e "${YELLOW}🔑 Service Account Key:${NC}"
echo "================================================"
cat $KEY_FILE
echo "================================================"
echo ""
echo -e "${YELLOW}⚠️  Important:${NC}"
echo "- Keep the service account key secure"
echo "- Delete the key file after copying to GitHub: rm $KEY_FILE"
echo "- The GitHub Actions workflow will automatically deploy your services"
echo ""
echo -e "${GREEN}🚀 Ready to deploy! Push your code to the main branch to trigger deployment.${NC}"
