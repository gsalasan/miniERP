# 🚀 Quick Railway GitHub Deployment Reference

## Prerequisites Checklist
- [ ] GitHub repository with miniERP code
- [ ] Railway account created
- [ ] Railway CLI installed (`npm install -g @railway/cli`)
- [ ] Railway login completed (`railway login`)

## Quick Deployment Steps

### 1. Prepare Repository
```bash
# Commit all changes
git add .
git commit -m "Add Railway Docker deployment configuration"
git push origin main
```

### 2. Railway Project Setup
```bash
# Create Railway project
railway init

# Add PostgreSQL database
railway add postgresql

# Get database URL
railway variables
```

### 3. Deploy Services (Choose One Method)

#### Method A: Automated Script
```bash
# Run the automated deployment script
./deploy-github-railway.sh
```

#### Method B: Manual Deployment
```bash
# Deploy backend services
railway up --service identity-service --source github
railway up --service crm-service --source github
railway up --service finance-service --source github
railway up --service hr-service --source github
railway up --service engineering-service --source github
railway up --service inventory-service --source github
railway up --service procurement-service --source github
railway up --service project-service --source github

# Run database migrations
railway run --service identity-service npx prisma migrate deploy

# Deploy frontend services
railway up --service main-frontend --source github
railway up --service crm-frontend --source github
railway up --service finance-frontend --source github
railway up --service hr-frontend --source github
railway up --service engineering-frontend --source github
railway up --service procurement-frontend --source github
railway up --service project-frontend --source github
```

#### Method C: GitHub Actions (Automatic)
- Push to main branch triggers automatic deployment
- No manual intervention required
- Full CI/CD pipeline with testing and deployment

### 4. Set Environment Variables

#### Backend Services
```bash
DATABASE_URL=${{Postgres.DATABASE_URL}}
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key
CORS_ORIGIN=https://your-main-frontend.railway.app
```

#### Frontend Services
```bash
VITE_API_URL=https://your-backend-service.railway.app
VITE_IDENTITY_URL=https://your-identity-service.railway.app
VITE_CRM_URL=https://your-crm-service.railway.app
VITE_FINANCE_URL=https://your-finance-service.railway.app
```

### 5. Verify Deployment
```bash
# Check service status
railway status

# View logs
railway logs --service identity-service

# Test health endpoints
curl https://your-service.railway.app/health
```

## Expected URLs
After deployment, you'll get URLs like:
- **Main Dashboard**: `https://main-frontend-production.railway.app`
- **Identity Service**: `https://identity-service-production.railway.app`
- **CRM Service**: `https://crm-service-production.railway.app`
- **Finance Service**: `https://finance-service-production.railway.app`

## Troubleshooting
- **Build Failures**: Check Dockerfile syntax and dependencies
- **Service Communication**: Verify environment variables
- **Database Connection**: Ensure DATABASE_URL is set correctly
- **CORS Issues**: Check CORS_ORIGIN environment variable

## Benefits of GitHub Integration
- ✅ **Automatic Deployments**: Deploy on every push to main branch
- ✅ **Version Control**: Full deployment history in GitHub
- ✅ **Collaboration**: Team members can trigger deployments
- ✅ **Rollback**: Easy rollback to previous commits
- ✅ **CI/CD**: Integrated with GitHub Actions

Your miniERP application will be fully deployed from GitHub using Docker containers! 🎉
