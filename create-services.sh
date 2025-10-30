#!/bin/bash

# Railway Service Creation Script for miniERP
# Creates all services on Railway if they don't exist

set -e

echo "🚀 Creating Railway Services for miniERP"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check Railway CLI
check_railway_cli() {
    print_status "Checking Railway CLI installation..."
    if ! command -v railway &> /dev/null; then
        print_error "Railway CLI is not installed. Please install it first:"
        echo "npm install -g @railway/cli"
        exit 1
    fi
    print_success "Railway CLI is installed"
}

# Check authentication
check_railway_auth() {
    print_status "Checking Railway authentication..."
    if ! railway whoami &> /dev/null; then
        print_error "Not logged in to Railway. Please login first:"
        echo "railway login"
        exit 1
    fi
    print_success "Authenticated with Railway"
}

# Initialize project if needed
init_project() {
    print_status "Checking Railway project..."
    
    # Check if we're in a Railway project
    if ! railway status &> /dev/null; then
        print_warning "No Railway project found. Initializing..."
        railway init
        print_success "Railway project initialized"
    else
        print_success "Railway project already exists"
    fi
}

# Add PostgreSQL database
add_database() {
    print_status "Checking PostgreSQL database..."
    
    # Check if PostgreSQL is already added
    if railway status | grep -q "postgres"; then
        print_success "PostgreSQL database already exists"
    else
        print_status "Adding PostgreSQL database..."
        railway add --database postgres
        print_success "PostgreSQL database added"
    fi
}

# Create backend services
create_backend_services() {
    print_status "Creating backend services..."
    
    services=(
        "identity-service:4000"
        "crm-service:3002"
        "finance-service:3003"
        "hr-service:3004"
        "engineering-service:3005"
        "inventory-service:3006"
        "procurement-service:3007"
        "project-service:3008"
    )
    
    for service_info in "${services[@]}"; do
        IFS=':' read -r service port <<< "$service_info"
        print_status "Creating $service..."
        
        if [ -d "services/$service" ]; then
            cd "services/$service"
            
            # Create service if it doesn't exist
            railway add --service "$service" --variables "NODE_ENV=production" --variables "PORT=$port" 2>/dev/null || {
                print_warning "$service might already exist, continuing..."
            }
            
            # Set database URL
            railway variables set DATABASE_URL='${{Postgres.DATABASE_URL}}' 2>/dev/null || true
            
            cd ../..
            print_success "$service created"
        else
            print_warning "Directory services/$service not found, skipping"
        fi
    done
}

# Create frontend services
create_frontend_services() {
    print_status "Creating frontend services..."
    
    frontends=(
        "main-frontend:3000"
        "crm-frontend:3010"
        "finance-frontend:3011"
        "hr-frontend:3012"
        "engineering-frontend:3013"
        "procurement-frontend:3014"
        "project-frontend:3015"
    )
    
    for frontend_info in "${frontends[@]}"; do
        IFS=':' read -r frontend port <<< "$frontend_info"
        print_status "Creating $frontend..."
        
        if [ -d "frontend/apps/$frontend" ]; then
            cd "frontend/apps/$frontend"
            
            # Create service if it doesn't exist
            railway add --service "$frontend" --variables "NODE_ENV=production" --variables "PORT=$port" 2>/dev/null || {
                print_warning "$frontend might already exist, continuing..."
            }
            
            cd ../../..
            print_success "$frontend created"
        else
            print_warning "Directory frontend/apps/$frontend not found, skipping"
        fi
    done
}

# Show service status
show_status() {
    print_status "Service creation summary:"
    echo ""
    railway status
    echo ""
    print_success "🎉 All services created successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Deploy services: ./deploy-cli.sh"
    echo "2. Check status: railway status"
    echo "3. View logs: railway logs"
    echo "4. Set additional environment variables as needed"
}

# Main function
main() {
    echo "Starting service creation process..."
    echo ""
    
    # Pre-checks
    check_railway_cli
    check_railway_auth
    init_project
    add_database
    
    echo ""
    print_status "Creating services..."
    
    # Create services
    create_backend_services
    echo ""
    create_frontend_services
    echo ""
    
    # Show status
    show_status
}

# Run main function
main "$@"
