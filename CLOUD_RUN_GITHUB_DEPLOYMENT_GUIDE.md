# 🚀 Complete Guide: Deploy miniERP to Google Cloud Run from GitHub

This comprehensive guide will walk you through deploying your miniERP application to Google Cloud Run using GitHub Actions for automated CI/CD.

## 📋 Prerequisites

Before starting, ensure you have:

1. **Google Cloud Account** with billing enabled
2. **GitHub Repository** with your miniERP code
3. **gcloud CLI** installed locally (for initial setup)
4. **Docker** installed locally (for testing)

## 🏗️ Architecture Overview

Your miniERP application consists of:
- **8 Backend Services** (Node.js/TypeScript + Express)
- **7 Frontend Applications** (React + Vite)
- **1 Shared Database** (PostgreSQL with Prisma ORM)
- **API Gateway** (Cloud Load Balancer)

## 📝 Step-by-Step Deployment Guide

### Step 1: Set Up Google Cloud Project

#### 1.1 Create a New GCP Project

```bash
# Set your project ID (replace with your desired project ID)
export PROJECT_ID="your-minierp-project-id"
export REGION="us-central1"

# Create a new project
gcloud projects create $PROJECT_ID

# Set the project as active
gcloud config set project $PROJECT_ID

# Enable billing (you'll need to do this in the GCP Console)
echo "Please enable billing for project $PROJECT_ID in the GCP Console"
```

#### 1.2 Enable Required APIs

```bash
# Enable all required APIs
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable secretmanager.googleapis.com
gcloud services enable monitoring.googleapis.com
gcloud services enable logging.googleapis.com
```

### Step 2: Create Service Account for GitHub Actions

#### 2.1 Create Service Account

```bash
# Create service account
gcloud iam service-accounts create github-actions \
  --display-name="GitHub Actions Service Account" \
  --description="Service account for GitHub Actions deployment"

# Get the service account email
export SA_EMAIL="github-actions@$PROJECT_ID.iam.gserviceaccount.com"
```

#### 2.2 Grant Required Permissions

```bash
# Grant necessary roles
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
```

#### 2.3 Create and Download Service Account Key

```bash
# Create service account key
gcloud iam service-accounts keys create github-actions-key.json \
  --iam-account=$SA_EMAIL

# Display the key (copy this to GitHub Secrets)
cat github-actions-key.json
```

### Step 3: Configure GitHub Repository Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions, and add these secrets:

#### 3.1 Required Secrets

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `GCP_PROJECT_ID` | Your Google Cloud Project ID | `your-minierp-project-id` |
| `GCP_SA_KEY` | Service Account JSON key | `{"type": "service_account", ...}` |
| `DB_ROOT_PASSWORD` | Database root password | `your-secure-password-123` |
| `JWT_SECRET` | JWT signing secret | `your-jwt-secret-key-456` |

#### 3.2 How to Add Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret with the name and value from the table above

### Step 4: Set Up Cloud SQL Database

#### 4.1 Create Cloud SQL Instance

```bash
# Create Cloud SQL PostgreSQL instance
gcloud sql instances create miniERP-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=$REGION \
  --root-password=$DB_ROOT_PASSWORD \
  --storage-type=SSD \
  --storage-size=10GB \
  --backup-start-time=03:00

# Create database
gcloud sql databases create miniERP --instance=miniERP-db
```

#### 4.2 Create Database Secrets

```bash
# Create database URL secret
echo "postgresql://postgres:$DB_ROOT_PASSWORD@/miniERP?host=/cloudsql/$PROJECT_ID:$REGION:miniERP-db" | \
gcloud secrets create database-secret --data-file=-

# Create JWT secret
echo "$JWT_SECRET" | \
gcloud secrets create jwt-secret --data-file=-
```

### Step 5: Update Service Configurations

#### 5.1 Update Cloud Run Deployment Script

Update the `deploy-cloudrun.sh` script with your project ID:

```bash
# Edit the script
nano deploy-cloudrun.sh

# Change line 9 from:
PROJECT_ID="your-minierp-project-id"
# To:
PROJECT_ID="your-actual-project-id"
```

#### 5.2 Update Cloud Run YAML Configuration

Update the `cloudrun-deploy.yaml` file with your project ID:

```bash
# Replace all instances of "your-minierp-project-id" and "PROJECT_ID" 
# with your actual project ID
sed -i 's/your-minierp-project-id/your-actual-project-id/g' cloudrun-deploy.yaml
sed -i 's/PROJECT_ID/your-actual-project-id/g' cloudrun-deploy.yaml
```

### Step 6: Test Local Deployment (Optional)

Before deploying via GitHub Actions, you can test locally:

```bash
# Make the deployment script executable
chmod +x deploy-cloudrun.sh

# Run the deployment script
./deploy-cloudrun.sh
```

### Step 7: Deploy via GitHub Actions

#### 7.1 Push to Main Branch

```bash
# Add all files
git add .

# Commit changes
git commit -m "Add Cloud Run deployment configuration"

# Push to main branch (this will trigger the GitHub Action)
git push origin main
```

#### 7.2 Monitor Deployment

1. Go to your GitHub repository
2. Click **Actions** tab
3. Click on the running workflow "Deploy to Google Cloud Run"
4. Monitor the deployment progress

### Step 8: Verify Deployment

#### 8.1 Check Deployed Services

```bash
# List all Cloud Run services
gcloud run services list --region=$REGION

# Get service URLs
gcloud run services describe identity-service --region=$REGION --format='value(status.url)'
gcloud run services describe engineering-service --region=$REGION --format='value(status.url)'
# ... repeat for other services
```

#### 8.2 Test Health Endpoints

```bash
# Test each service health endpoint
curl https://identity-service-xxxxx-uc.a.run.app/health
curl https://engineering-service-xxxxx-uc.a.run.app/health
curl https://crm-service-xxxxx-uc.a.run.app/health
curl https://finance-service-xxxxx-uc.a.run.app/health
curl https://hr-service-xxxxx-uc.a.run.app/health
```

### Step 9: Set Up API Gateway (Optional)

#### 9.1 Create Load Balancer

```bash
# Create a global static IP
gcloud compute addresses create miniERP-ip --global

# Get the IP address
gcloud compute addresses describe miniERP-ip --global --format='value(address)'
```

#### 9.2 Configure DNS

Point your domain to the static IP address obtained above.

### Step 10: Set Up Monitoring and Alerts

#### 10.1 Enable Monitoring

```bash
# Enable monitoring APIs
gcloud services enable monitoring.googleapis.com
gcloud services enable logging.googleapis.com
```

#### 10.2 Create Alert Policies

Create alert policies in the GCP Console for:
- High error rates
- High latency
- Service unavailability
- Resource usage

## 🔧 Troubleshooting

### Common Issues and Solutions

#### 1. Service Won't Start

```bash
# Check service logs
gcloud run logs tail identity-service --region=$REGION

# Check service configuration
gcloud run services describe identity-service --region=$REGION
```

#### 2. Database Connection Failed

```bash
# Check Cloud SQL instance
gcloud sql instances describe miniERP-db

# Check database connection
gcloud sql connect miniERP-db --user=postgres --database=miniERP
```

#### 3. Build Failures

```bash
# Check Cloud Build logs
gcloud builds list --limit=10
gcloud builds log [BUILD_ID]
```

#### 4. Permission Issues

```bash
# Check service account permissions
gcloud projects get-iam-policy $PROJECT_ID --flatten="bindings[].members" --filter="bindings.members:$SA_EMAIL"
```

### Useful Commands

```bash
# View all services
gcloud run services list --region=$REGION

# Update a service
gcloud run services update SERVICE_NAME --region=$REGION

# Delete a service
gcloud run services delete SERVICE_NAME --region=$REGION

# View service logs
gcloud run logs tail SERVICE_NAME --region=$REGION

# Check service status
gcloud run services describe SERVICE_NAME --region=$REGION
```

## 💰 Cost Optimization

### 1. Resource Optimization

- Start with minimal resources (256Mi memory, 0.5 CPU)
- Use `--min-instances=0` for non-critical services
- Set appropriate `--max-instances` based on expected load

### 2. Database Optimization

- Use `db-f1-micro` for development
- Upgrade to `db-g1-small` for production
- Enable connection pooling

### 3. Storage Optimization

- Use Cloud CDN for static assets
- Implement caching strategies
- Optimize container images

## 🔄 CI/CD Pipeline Features

The GitHub Actions workflow includes:

- **Automatic deployment** on push to main branch
- **Parallel service deployment** for faster builds
- **Health checks** after deployment
- **Infrastructure setup** (Cloud SQL, secrets)
- **Frontend and backend** deployment
- **Rollback capability** via GitHub Actions

## 📊 Monitoring and Logging

### 1. Cloud Monitoring

- Service health monitoring
- Performance metrics
- Error tracking
- Resource utilization

### 2. Cloud Logging

- Application logs
- Access logs
- Error logs
- Audit logs

## 🚨 Security Best Practices

### 1. Secrets Management

- Use Google Secret Manager
- Rotate secrets regularly
- Limit secret access

### 2. Network Security

- Use VPC connectors
- Configure firewall rules
- Enable SSL/TLS

### 3. IAM Security

- Principle of least privilege
- Regular access reviews
- Service account rotation

## 📚 Next Steps

After successful deployment:

1. **Set up custom domain** and SSL certificates
2. **Configure monitoring** and alerting
3. **Implement backup** strategies
4. **Set up staging** environment
5. **Configure load testing**
6. **Implement security** scanning

## 🆘 Support

If you encounter issues:

1. Check the GitHub Actions logs
2. Review Cloud Run service logs
3. Verify all secrets are correctly set
4. Ensure all APIs are enabled
5. Check service account permissions

---

## ✅ Deployment Checklist

- [ ] Google Cloud project created
- [ ] Required APIs enabled
- [ ] Service account created and configured
- [ ] GitHub secrets configured
- [ ] Cloud SQL instance created
- [ ] Database secrets created
- [ ] GitHub Actions workflow triggered
- [ ] All services deployed successfully
- [ ] Health endpoints tested
- [ ] Monitoring configured
- [ ] Custom domain configured (optional)
- [ ] SSL certificates installed (optional)

**🎉 Congratulations! Your miniERP application is now deployed to Google Cloud Run!**
