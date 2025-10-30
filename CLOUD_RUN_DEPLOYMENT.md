# Google Cloud Run Deployment Guide for miniERP

This guide provides step-by-step instructions for deploying the miniERP application to Google Cloud Run.

## 🏗️ Architecture Overview

The miniERP application consists of:
- **8 Backend Services** (Node.js/TypeScript + Express)
- **7 Frontend Applications** (React + Vite)
- **1 Shared Database** (PostgreSQL with Prisma ORM)
- **API Gateway** (Cloud Load Balancer)

## 📋 Prerequisites

1. **Google Cloud Account** with billing enabled
2. **gcloud CLI** installed and configured
3. **Docker** installed locally (for testing)
4. **Node.js 22+** installed locally

## 🚀 Quick Deployment

### 1. Set Up Google Cloud Project

```bash
# Set your project ID
export PROJECT_ID="your-gcp-project-id"
export REGION="us-central1"

# Set the project
gcloud config set project $PROJECT_ID

# Enable required APIs
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable sqladmin.googleapis.com
```

### 2. Deploy Services

```bash
# Make the deployment script executable
chmod +x deploy-cloudrun.sh

# Run the deployment script
./deploy-cloudrun.sh
```

## 🔧 Manual Deployment Steps

### 1. Build and Deploy Identity Service

```bash
# Build the container
gcloud builds submit --tag gcr.io/$PROJECT_ID/identity-service:latest ./services/identity-service/

# Deploy to Cloud Run
gcloud run deploy identity-service \
  --image gcr.io/$PROJECT_ID/identity-service:latest \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --cpu 1 \
  --max-instances 10 \
  --set-env-vars NODE_ENV=production,PORT=8080
```

### 2. Deploy Other Services

Repeat the same process for:
- `engineering-service`
- `crm-service`
- `finance-service`
- `hr-service`
- `inventory-service` (when implemented)
- `procurement-service` (when implemented)
- `project-service` (when implemented)

## 🗄️ Database Setup

### 1. Create Cloud SQL PostgreSQL Instance

```bash
# Create Cloud SQL instance
gcloud sql instances create miniERP-db \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=$REGION \
  --root-password=your-secure-password

# Create database
gcloud sql databases create miniERP --instance=miniERP-db
```

### 2. Set Up Database Secrets

```bash
# Create database URL secret
echo "postgresql://postgres:your-secure-password@/miniERP?host=/cloudsql/PROJECT_ID:REGION:miniERP-db" | \
gcloud secrets create database-secret --data-file=-

# Create JWT secret
echo "your-jwt-secret-key" | \
gcloud secrets create jwt-secret --data-file=-
```

### 3. Update Service Deployments with Secrets

```bash
# Update identity service with secrets
gcloud run services update identity-service \
  --region=$REGION \
  --set-secrets DATABASE_URL=database-secret:latest,JWT_SECRET=jwt-secret:latest
```

## 🌐 API Gateway Setup

### 1. Create Cloud Load Balancer

```yaml
# api-gateway.yaml
apiVersion: networking.gke.io/v1
kind: ManagedCertificate
metadata:
  name: miniERP-ssl-cert
spec:
  domains:
    - api.minierp.com
---
apiVersion: networking.gke.io/v1
kind: FrontendConfig
metadata:
  name: miniERP-frontend-config
spec:
  redirectToHttps:
    enabled: true
---
apiVersion: v1
kind: Service
metadata:
  name: miniERP-api-gateway
  annotations:
    cloud.google.com/neg: '{"ingress": true}'
    networking.gke.io/managed-certificates: miniERP-ssl-cert
spec:
  type: LoadBalancer
  ports:
  - port: 80
    targetPort: 8080
    protocol: TCP
  - port: 443
    targetPort: 8080
    protocol: TCP
  selector:
    app: miniERP-api-gateway
```

### 2. Configure Nginx for Cloud Run

```nginx
# nginx-cloudrun.conf
events {
    worker_connections 1024;
}

http {
    upstream identity-service {
        server identity-service-xxxxx-uc.a.run.app:443;
    }
    
    upstream engineering-service {
        server engineering-service-xxxxx-uc.a.run.app:443;
    }
    
    # ... other services
    
    server {
        listen 8080;
        server_name _;
        
        location /api/identity/ {
            proxy_pass https://identity-service/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        # ... other service routes
    }
}
```

## 🎨 Frontend Deployment

### Option 1: Cloud Storage + CDN (Recommended)

```bash
# Build frontend applications
cd frontend/apps/main-frontend
npm run build

# Upload to Cloud Storage
gsutil -m cp -r dist/* gs://minierp-frontend-bucket/

# Set up CDN
gcloud compute url-maps create miniERP-cdn \
  --default-backend-bucket=minierp-frontend-bucket
```

### Option 2: Cloud Run Services

```bash
# Create Dockerfile for each frontend
# Deploy as separate Cloud Run services
gcloud run deploy main-frontend \
  --source ./frontend/apps/main-frontend \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated
```

## 🔒 Security Configuration

### 1. IAM Roles

```bash
# Create service account for Cloud Run
gcloud iam service-accounts create miniERP-service-account

# Grant necessary permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:minierp-service-account@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/cloudsql.client"
```

### 2. VPC Configuration

```bash
# Create VPC connector for Cloud SQL access
gcloud compute networks vpc-access connectors create miniERP-connector \
  --region=$REGION \
  --subnet=default \
  --subnet-project=$PROJECT_ID \
  --min-instances=2 \
  --max-instances=3
```

## 📊 Monitoring and Logging

### 1. Enable Cloud Monitoring

```bash
# Enable monitoring APIs
gcloud services enable monitoring.googleapis.com
gcloud services enable logging.googleapis.com
```

### 2. Set Up Alerts

```bash
# Create alerting policy for service health
gcloud alpha monitoring policies create --policy-from-file=alert-policy.yaml
```

## 🧪 Testing Deployment

### 1. Test Health Endpoints

```bash
# Test each service health endpoint
curl https://identity-service-xxxxx-uc.a.run.app/health
curl https://engineering-service-xxxxx-uc.a.run.app/health
curl https://crm-service-xxxxx-uc.a.run.app/health
curl https://finance-service-xxxxx-uc.a.run.app/health
curl https://hr-service-xxxxx-uc.a.run.app/health
```

### 2. Test API Endpoints

```bash
# Test API functionality
curl -X POST https://identity-service-xxxxx-uc.a.run.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

## 🔄 CI/CD Pipeline

### 1. GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to Cloud Run
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Cloud Run
        uses: google-github-actions/deploy-cloudrun@v1
        with:
          service: ${{ matrix.service }}
          image: gcr.io/${{ secrets.GCP_PROJECT_ID }}/${{ matrix.service }}
          region: us-central1
```

## 📈 Scaling Configuration

### 1. Auto-scaling Settings

```bash
# Update service with auto-scaling
gcloud run services update identity-service \
  --region=$REGION \
  --min-instances=1 \
  --max-instances=100 \
  --concurrency=100 \
  --cpu-throttling
```

### 2. Resource Limits

```bash
# Set resource limits
gcloud run services update identity-service \
  --region=$REGION \
  --memory=1Gi \
  --cpu=2 \
  --timeout=300
```

## 🚨 Troubleshooting

### Common Issues

1. **Service won't start**: Check logs with `gcloud run logs tail identity-service --region=$REGION`
2. **Database connection failed**: Verify Cloud SQL instance and connection string
3. **CORS errors**: Update CORS configuration in service code
4. **Memory issues**: Increase memory allocation or optimize code

### Useful Commands

```bash
# View service logs
gcloud run logs tail SERVICE_NAME --region=$REGION

# Update service configuration
gcloud run services update SERVICE_NAME --region=$REGION

# Delete service
gcloud run services delete SERVICE_NAME --region=$REGION

# List all services
gcloud run services list --region=$REGION
```

## 💰 Cost Optimization

1. **Use minimum instances**: Set `--min-instances=0` for non-critical services
2. **Optimize memory**: Start with 256Mi and scale up as needed
3. **Use preemptible instances**: For development environments
4. **Implement caching**: Use Cloud CDN for static assets

## 📚 Additional Resources

- [Google Cloud Run Documentation](https://cloud.google.com/run/docs)
- [Cloud SQL Documentation](https://cloud.google.com/sql/docs)
- [Cloud Load Balancer Documentation](https://cloud.google.com/load-balancing/docs)
- [Prisma Cloud SQL Guide](https://www.prisma.io/docs/guides/database/cloud-sql)

---

## ✅ Deployment Checklist

- [ ] Google Cloud project set up
- [ ] Required APIs enabled
- [ ] Cloud SQL PostgreSQL instance created
- [ ] Database secrets configured
- [ ] All services deployed to Cloud Run
- [ ] Health endpoints tested
- [ ] API gateway configured
- [ ] Frontend applications deployed
- [ ] SSL certificates configured
- [ ] Monitoring and alerting set up
- [ ] CI/CD pipeline configured
- [ ] Security policies applied
- [ ] Performance testing completed
