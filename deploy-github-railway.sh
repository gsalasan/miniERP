#!/bin/bash

# Railway GitHub Deployment Script for miniERP
# This script deploys all services to Railway directly from GitHub repository

set -e

echo "🚀 Railway GitHub Deployment for miniERP"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Railway CLI is installed
check_railway_cli() {
    print_status "Checking Railway CLI installation..."
    if ! command -v railway &> /dev/null; then
        print_error "Railway CLI is not installed. Please install it first:"
        echo "npm install -g @railway/cli"
        exit 1
    fi
    print_success "Railway CLI is installed"
}

# Check if user is logged in to Railway
check_railway_auth() {
    print_status "Checking Railway authentication..."
    if ! railway whoami &> /dev/null; then
        print_error "Not logged in to Railway. Please login first:"
        echo "railway login"
        exit 1
    fi
    print_success "Authenticated with Railway"
}

# Check if repository is clean
check_git_status() {
    print_status "Checking Git repository status..."
    
    if [ -n "$(git status --porcelain)" ]; then
        print_warning "Repository has uncommitted changes."
        echo "Please commit your changes before deploying:"
        echo "git add ."
        echo "git commit -m 'Your commit message'"
        echo "git push origin main"
        exit 1
    fi
    
    print_success "Repository is clean and ready for deployment"
}

# Deploy backend services from GitHub
deploy_backend_services() {
    print_status "Deploying backend services from GitHub..."
    
    services=(
        "identity-service"
        "crm-service"
        "finance-service"
        "hr-service"
        "engineering-service"
        "inventory-service"
        "procurement-service"
        "project-service"
    )
    
    for service in "${services[@]}"; do
        print_status "Deploying $service from GitHub..."
        railway up --service "$service" --source github &
    done
    
    # Wait for all backend services to deploy
    print_status "Waiting for backend services to deploy..."
    wait
    
    print_success "Backend services deployed from GitHub"
}

# Run database migrations
run_migrations() {
    print_status "Running database migrations..."
    
    # Run migrations on identity service (which has the main database schema)
    railway run --service identity-service npx prisma migrate deploy
    railway run --service identity-service npx prisma generate
    
    print_success "Database migrations completed"
}

# Deploy frontend services from GitHub
deploy_frontend_services() {
    print_status "Deploying frontend services from GitHub..."
    
    frontends=(
        "main-frontend"
        "crm-frontend"
        "finance-frontend"
        "hr-frontend"
        "engineering-frontend"
        "procurement-frontend"
        "project-frontend"
    )
    
    for frontend in "${frontends[@]}"; do
        print_status "Deploying $frontend from GitHub..."
        railway up --service "$frontend" --source github &
    done
    
    # Wait for all frontend services to deploy
    print_status "Waiting for frontend services to deploy..."
    wait
    
    print_success "Frontend services deployed from GitHub"
}

# Health check
health_check() {
    print_status "Performing health checks..."
    
    # Get service URLs
    services=(
        "identity-service"
        "crm-service"
        "finance-service"
        "hr-service"
        "main-frontend"
        "crm-frontend"
        "finance-frontend"
        "hr-frontend"
    )
    
    for service in "${services[@]}"; do
        print_status "Checking $service health..."
        
        # Get service URL
        url=$(railway status --service "$service" | grep -o 'https://[^[:space:]]*' | head -1)
        
        if [ -n "$url" ]; then
            if curl -f -s "$url/health" > /dev/null; then
                print_success "$service is healthy at $url"
            else
                print_warning "$service health check failed at $url"
            fi
        else
            print_warning "Could not get URL for $service"
        fi
    done
}

# Main deployment function
main() {
    echo "Starting GitHub deployment process..."
    echo ""
    
    # Pre-deployment checks
    check_railway_cli
    check_railway_auth
    check_git_status
    
    echo ""
    print_status "Starting deployment from GitHub..."
    
    # Deploy services
    deploy_backend_services
    echo ""
    
    run_migrations
    echo ""
    
    deploy_frontend_services
    echo ""
    
    # Health checks
    health_check
    echo ""
    
    print_success "🎉 GitHub deployment completed successfully!"
    echo ""
    echo "Your miniERP application is now running on Railway!"
    echo "All services deployed directly from your GitHub repository."
    echo ""
    echo "Next steps:"
    echo "1. Check service status: railway status"
    echo "2. View logs: railway logs --service service-name"
    echo "3. Set environment variables in Railway dashboard"
    echo "4. Test your application endpoints"
    echo ""
    echo "🔗 GitHub Integration Benefits:"
    echo "  • Automatic deployments on push to main branch"
    echo "  • Full deployment history in GitHub"
    echo "  • Easy rollback to previous commits"
    echo "  • Team collaboration on deployments"
}

# Run main function
main "$@"
