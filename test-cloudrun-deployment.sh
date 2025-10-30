#!/bin/bash

# Test Cloud Run Deployment Script for miniERP
# This script tests all deployed services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 Testing Cloud Run Deployment${NC}"
echo "================================================"

# Configuration
PROJECT_ID=${PROJECT_ID:-"your-minierp-project-id"}
REGION=${REGION:-"us-central1"}

# Services to test
SERVICES=("identity-service" "engineering-service" "crm-service" "finance-service" "hr-service")
FRONTENDS=("main-frontend" "crm-frontend" "finance-frontend" "hr-frontend" "identity-frontend" "engineering-frontend" "procurement-frontend" "project-frontend")

# Function to test service health
test_service_health() {
    local service_name=$1
    local service_url=$2
    
    echo -e "${YELLOW}🔍 Testing $service_name...${NC}"
    
    if curl -f -s --max-time 30 "$service_url/health" > /dev/null; then
        echo -e "${GREEN}✅ $service_name is healthy${NC}"
        return 0
    else
        echo -e "${RED}❌ $service_name health check failed${NC}"
        return 1
    fi
}

# Function to get service URL
get_service_url() {
    local service_name=$1
    gcloud run services describe $service_name --region=$REGION --format='value(status.url)' 2>/dev/null || echo ""
}

# Test backend services
echo -e "${YELLOW}🔧 Testing Backend Services${NC}"
echo "----------------------------------------"

backend_failed=0
for service in "${SERVICES[@]}"; do
    service_url=$(get_service_url $service)
    if [ -z "$service_url" ]; then
        echo -e "${RED}❌ $service is not deployed${NC}"
        backend_failed=1
    else
        if ! test_service_health $service $service_url; then
            backend_failed=1
        fi
    fi
done

# Test frontend applications
echo -e "${YELLOW}🎨 Testing Frontend Applications${NC}"
echo "----------------------------------------"

frontend_failed=0
for frontend in "${FRONTENDS[@]}"; do
    frontend_url=$(get_service_url $frontend)
    if [ -z "$frontend_url" ]; then
        echo -e "${RED}❌ $frontend is not deployed${NC}"
        frontend_failed=1
    else
        echo -e "${YELLOW}🔍 Testing $frontend...${NC}"
        if curl -f -s --max-time 30 "$frontend_url" > /dev/null; then
            echo -e "${GREEN}✅ $frontend is accessible${NC}"
        else
            echo -e "${RED}❌ $frontend is not accessible${NC}"
            frontend_failed=1
        fi
    fi
done

# Test API endpoints
echo -e "${YELLOW}🔌 Testing API Endpoints${NC}"
echo "----------------------------------------"

# Test identity service endpoints
identity_url=$(get_service_url "identity-service")
if [ -n "$identity_url" ]; then
    echo -e "${YELLOW}🔍 Testing identity service API...${NC}"
    
    # Test health endpoint
    if curl -f -s --max-time 30 "$identity_url/health" > /dev/null; then
        echo -e "${GREEN}✅ Identity service health endpoint working${NC}"
    else
        echo -e "${RED}❌ Identity service health endpoint failed${NC}"
    fi
    
    # Test API documentation endpoint (if available)
    if curl -f -s --max-time 30 "$identity_url/api/v1/docs" > /dev/null; then
        echo -e "${GREEN}✅ Identity service API docs accessible${NC}"
    else
        echo -e "${YELLOW}⚠️  Identity service API docs not available${NC}"
    fi
fi

# Test finance service endpoints
finance_url=$(get_service_url "finance-service")
if [ -n "$finance_url" ]; then
    echo -e "${YELLOW}🔍 Testing finance service API...${NC}"
    
    if curl -f -s --max-time 30 "$finance_url/health" > /dev/null; then
        echo -e "${GREEN}✅ Finance service health endpoint working${NC}"
    else
        echo -e "${RED}❌ Finance service health endpoint failed${NC}"
    fi
fi

# Summary
echo -e "${BLUE}📊 Test Summary${NC}"
echo "================================================"

if [ $backend_failed -eq 0 ]; then
    echo -e "${GREEN}✅ All backend services are healthy${NC}"
else
    echo -e "${RED}❌ Some backend services failed${NC}"
fi

if [ $frontend_failed -eq 0 ]; then
    echo -e "${GREEN}✅ All frontend applications are accessible${NC}"
else
    echo -e "${RED}❌ Some frontend applications failed${NC}"
fi

# Display service URLs
echo -e "${YELLOW}🌐 Service URLs${NC}"
echo "----------------------------------------"

for service in "${SERVICES[@]}"; do
    service_url=$(get_service_url $service)
    if [ -n "$service_url" ]; then
        echo -e "${BLUE}$service:${NC} $service_url"
    fi
done

echo ""
for frontend in "${FRONTENDS[@]}"; do
    frontend_url=$(get_service_url $frontend)
    if [ -n "$frontend_url" ]; then
        echo -e "${BLUE}$frontend:${NC} $frontend_url"
    fi
done

# Final result
if [ $backend_failed -eq 0 ] && [ $frontend_failed -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed! Deployment is successful.${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed. Please check the logs above.${NC}"
    exit 1
fi
