#!/bin/bash

# Railway Docker Deployment Script for miniERP
# This script automates the deployment of all services to Railway using Docker

set -e

echo "🐳 Starting Railway Docker Deployment for miniERP"
echo "=================================================="

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

# Deploy backend services
deploy_backend_services() {
    print_status "Deploying backend services..."
    
    services=(
        "services/identity-service:identity-service"
        "services/crm-service:crm-service"
        "services/finance-service:finance-service"
        "services/hr-service:hr-service"
        "services/engineering-service:engineering-service"
        "services/inventory-service:inventory-service"
        "services/procurement-service:procurement-service"
        "services/project-service:project-service"
    )
    
    for service in "${services[@]}"; do
        IFS=':' read -r path name <<< "$service"
        print_status "Deploying $name..."
        
        if [ -d "$path" ]; then
            cd "$path"
            railway up --service "$name" &
            cd - > /dev/null
        else
            print_warning "Directory $path not found, skipping $name"
        fi
    done
    
    # Wait for all backend services to deploy
    print_status "Waiting for backend services to deploy..."
    wait
    
    print_success "Backend services deployed"
}

# Run database migrations
run_migrations() {
    print_status "Running database migrations..."
    
    # Run migrations on identity service (which has the main database schema)
    railway run --service identity-service npx prisma migrate deploy
    railway run --service identity-service npx prisma generate
    
    print_success "Database migrations completed"
}

# Deploy frontend applications
deploy_frontend_services() {
    print_status "Deploying frontend applications..."
    
    frontends=(
        "frontend/apps/main-frontend:main-frontend"
        "frontend/apps/crm-frontend:crm-frontend"
        "frontend/apps/finance-frontend:finance-frontend"
        "frontend/apps/hr-frontend:hr-frontend"
        "frontend/apps/engineering-frontend:engineering-frontend"
        "frontend/apps/procurement-frontend:procurement-frontend"
        "frontend/apps/project-frontend:project-frontend"
    )
    
    for frontend in "${frontends[@]}"; do
        IFS=':' read -r path name <<< "$frontend"
        print_status "Deploying $name..."
        
        if [ -d "$path" ]; then
            cd "$path"
            railway up --service "$name" &
            cd - > /dev/null
        else
            print_warning "Directory $path not found, skipping $name"
        fi
    done
    
    # Wait for all frontend services to deploy
    print_status "Waiting for frontend services to deploy..."
    wait
    
    print_success "Frontend applications deployed"
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
    echo "Starting deployment process..."
    echo ""
    
    # Pre-deployment checks
    check_railway_cli
    check_railway_auth
    
    echo ""
    print_status "Starting deployment..."
    
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
    
    print_success "🎉 Deployment completed successfully!"
    echo ""
    echo "Your miniERP application is now running on Railway with Docker containers!"
    echo ""
    echo "Next steps:"
    echo "1. Check service status: railway status"
    echo "2. View logs: railway logs --service service-name"
    echo "3. Set environment variables in Railway dashboard"
    echo "4. Test your application endpoints"
}

# Run main function
main "$@"
