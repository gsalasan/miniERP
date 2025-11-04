#!/bin/bash

# Seed Google Cloud SQL Database Script for miniERP
# This script generates all Prisma schemas, runs migrations, and seeds the database to Cloud SQL

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Seed Google Cloud SQL Database${NC}"
echo "================================================"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo -e "${YELLOW}🔍 Checking prerequisites...${NC}"

if ! command_exists gcloud; then
    echo -e "${RED}❌ gcloud CLI is not installed. Please install it first.${NC}"
    echo "Visit: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

if ! command_exists node; then
    echo -e "${RED}❌ Node.js is not installed. Please install it first.${NC}"
    exit 1
fi

if ! command_exists npm; then
    echo -e "${RED}❌ npm is not installed. Please install it first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All prerequisites met${NC}"
echo ""

# Check if user is authenticated with gcloud
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo -e "${YELLOW}🔐 Please authenticate with Google Cloud:${NC}"
    gcloud auth login
fi

# Check for Application Default Credentials (required for Cloud SQL Proxy)
echo -e "${YELLOW}🔐 Checking Application Default Credentials...${NC}"
if ! gcloud auth application-default print-access-token >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Application Default Credentials not found${NC}"
    echo "Cloud SQL Proxy requires Application Default Credentials."
    echo "Setting them up now..."
    gcloud auth application-default login
    echo -e "${GREEN}✅ Application Default Credentials configured${NC}"
else
    echo -e "${GREEN}✅ Application Default Credentials found${NC}"
fi
echo ""

# Get configuration from environment or prompt
PROJECT_ID=${GCP_PROJECT_ID:-}
REGION=${GCP_REGION:-us-central1}
INSTANCE_NAME=${DB_INSTANCE_NAME:-minierp-db}
DATABASE_NAME=${DB_NAME:-minierp}
DB_USER=${DB_USER:-root}
DB_PASSWORD=${DB_ROOT_PASSWORD:-}

if [ -z "$PROJECT_ID" ]; then
    echo -e "${YELLOW}📋 Please provide Google Cloud Project ID:${NC}"
    read -p "Project ID: " PROJECT_ID
fi

if [ -z "$DB_PASSWORD" ]; then
    echo -e "${YELLOW}🔐 Please provide database root password:${NC}"
    read -s -p "Database Password: " DB_PASSWORD
    echo ""
fi

# Set gcloud project
echo -e "${YELLOW}📦 Setting Google Cloud project to: $PROJECT_ID${NC}"
gcloud config set project "$PROJECT_ID"
echo -e "${GREEN}✅ Project set${NC}"
echo ""

# Install dependencies
echo -e "${YELLOW}📦 Installing npm dependencies...${NC}"
npm install
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Check for Cloud SQL Proxy
CLOUD_SQL_PROXY_PATH=""
if command_exists cloud-sql-proxy; then
    CLOUD_SQL_PROXY_PATH="cloud-sql-proxy"
    echo -e "${GREEN}✅ Cloud SQL Proxy found in PATH${NC}"
elif [ -f "./cloud-sql-proxy" ]; then
    CLOUD_SQL_PROXY_PATH="./cloud-sql-proxy"
    echo -e "${GREEN}✅ Cloud SQL Proxy found in current directory${NC}"
else
    echo -e "${YELLOW}📥 Downloading Cloud SQL Proxy...${NC}"
    
    # Detect OS
    OS="$(uname -s | tr '[:upper:]' '[:lower:]')"
    ARCH="$(uname -m)"
    
    if [ "$ARCH" = "x86_64" ]; then
        ARCH="amd64"
    fi
    
    CLOUD_SQL_PROXY_VERSION="v2.8.0"
    
    if [ "$OS" = "linux" ]; then
        CLOUD_SQL_PROXY_URL="https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/${CLOUD_SQL_PROXY_VERSION}/cloud-sql-proxy.linux.${ARCH}"
    elif [ "$OS" = "darwin" ]; then
        CLOUD_SQL_PROXY_URL="https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/${CLOUD_SQL_PROXY_VERSION}/cloud-sql-proxy.darwin.${ARCH}"
    else
        echo -e "${RED}❌ Unsupported OS: $OS${NC}"
        exit 1
    fi
    
    curl -o cloud-sql-proxy "$CLOUD_SQL_PROXY_URL"
    chmod +x cloud-sql-proxy
    CLOUD_SQL_PROXY_PATH="./cloud-sql-proxy"
    echo -e "${GREEN}✅ Cloud SQL Proxy downloaded${NC}"
fi
echo ""

# Start Cloud SQL Proxy in background
echo -e "${YELLOW}🔌 Starting Cloud SQL Proxy...${NC}"
INSTANCE_CONNECTION="$PROJECT_ID:$REGION:$INSTANCE_NAME"
echo "Instance connection: $INSTANCE_CONNECTION"

# Verify instance exists
echo -e "${YELLOW}🔍 Verifying Cloud SQL instance exists...${NC}"
if ! gcloud sql instances describe "$INSTANCE_NAME" --project="$PROJECT_ID" >/dev/null 2>&1; then
    echo -e "${RED}❌ Cloud SQL instance '$INSTANCE_NAME' not found in project '$PROJECT_ID'${NC}"
    echo "Please verify:"
    echo "  - Instance name is correct: $INSTANCE_NAME"
    echo "  - Project ID is correct: $PROJECT_ID"
    echo "  - You have access to the instance"
    exit 1
fi
echo -e "${GREEN}✅ Cloud SQL instance verified${NC}"
echo ""

# Initialize port variable
DB_PORT=${DB_PORT:-5432}

# Check if port is already in use
echo -e "${YELLOW}🔍 Checking if port $DB_PORT is available...${NC}"
PORT_IN_USE=false
if lsof -i :"$DB_PORT" >/dev/null 2>&1 || nc -z localhost "$DB_PORT" 2>/dev/null; then
    PORT_IN_USE=true
    echo -e "${YELLOW}⚠️  Port $DB_PORT is already in use${NC}"
    
    # Try to identify what's using the port
    if command_exists lsof; then
        PROCESS=$(lsof -i :"$DB_PORT" -t 2>/dev/null | head -1 || echo "")
        if [ -n "$PROCESS" ]; then
            PROCESS_NAME=$(ps -p "$PROCESS" -o comm= 2>/dev/null || echo "unknown")
            echo "  Process using port $DB_PORT: PID $PROCESS ($PROCESS_NAME)"
            
            # Check if it's a Cloud SQL Proxy
            if echo "$PROCESS_NAME" | grep -qi "cloud-sql-proxy\|cloudsql"; then
                echo -e "${YELLOW}  Detected: Cloud SQL Proxy is already running${NC}"
                echo "  Options:"
                echo "    1. Use the existing proxy (if it's connected to the same instance)"
                echo "    2. Stop the existing proxy and start a new one"
                echo ""
                read -p "  Kill existing Cloud SQL Proxy and start new one? (y/N): " KILL_EXISTING
                if [ "$KILL_EXISTING" = "y" ] || [ "$KILL_EXISTING" = "Y" ]; then
                    echo "  Stopping existing Cloud SQL Proxy (PID: $PROCESS)..."
                    kill "$PROCESS" 2>/dev/null || true
                    sleep 2
                    PORT_IN_USE=false
                else
                    echo -e "${YELLOW}  Using existing Cloud SQL Proxy${NC}"
                    PROXY_PID=$PROCESS
                    SKIP_PROXY_START=true
                fi
            # Check if it's PostgreSQL
            elif echo "$PROCESS_NAME" | grep -qi "postgres"; then
                echo -e "${YELLOW}  Detected: PostgreSQL is running on port 5432${NC}"
                echo "  This might be a local PostgreSQL instance."
                echo ""
                read -p "  Use a different port for Cloud SQL Proxy? (Y/n): " USE_DIFFERENT_PORT
                if [ "$USE_DIFFERENT_PORT" != "n" ] && [ "$USE_DIFFERENT_PORT" != "N" ]; then
                    DB_PORT=5433
                    echo -e "${YELLOW}  Using port $DB_PORT for Cloud SQL Proxy${NC}"
                    echo -e "${YELLOW}  Note: You'll need to update DATABASE_URL to use port $DB_PORT${NC}"
                else
                    read -p "  Stop local PostgreSQL and use port 5432? (y/N): " KILL_POSTGRES
                    if [ "$KILL_POSTGRES" = "y" ] || [ "$KILL_POSTGRES" = "Y" ]; then
                        echo "  Stopping PostgreSQL (PID: $PROCESS)..."
                        kill "$PROCESS" 2>/dev/null || true
                        sleep 2
                        PORT_IN_USE=false
                    else
                        echo -e "${RED}  Cannot proceed - port 5432 is in use${NC}"
                        exit 1
                    fi
                fi
            else
                echo "  Unknown process using port 5432"
                read -p "  Kill process $PROCESS and use port 5432? (y/N): " KILL_PROCESS
                if [ "$KILL_PROCESS" = "y" ] || [ "$KILL_PROCESS" = "Y" ]; then
                    kill "$PROCESS" 2>/dev/null || true
                    sleep 2
                    PORT_IN_USE=false
                else
                    echo -e "${RED}  Cannot proceed - port 5432 is in use${NC}"
                    exit 1
                fi
            fi
        fi
    fi
fi

# DB_PORT is already set above

# Clear old log file
> /tmp/cloud-sql-proxy.log

# Start proxy if not using existing one
if [ "$SKIP_PROXY_START" != "true" ]; then
    if [ "$PORT_IN_USE" = "true" ]; then
        echo -e "${RED}❌ Port $DB_PORT is still in use. Please free the port and try again.${NC}"
        exit 1
    fi
    
    # Start proxy
    echo -e "${YELLOW}🚀 Starting Cloud SQL Proxy on port $DB_PORT...${NC}"
    $CLOUD_SQL_PROXY_PATH "$INSTANCE_CONNECTION" --port "$DB_PORT" > /tmp/cloud-sql-proxy.log 2>&1 &
    PROXY_PID=$!
else
    echo -e "${YELLOW}✅ Using existing Cloud SQL Proxy${NC}"
fi

# Wait for proxy to start and check for errors
echo "Waiting for Cloud SQL Proxy to initialize..."
for i in {1..10}; do
    sleep 1
    
    # Check if process is still running
    if ! kill -0 $PROXY_PID 2>/dev/null; then
        echo ""
        echo -e "${RED}❌ Cloud SQL Proxy failed to start${NC}"
        echo ""
        echo "Error log:"
        cat /tmp/cloud-sql-proxy.log
        echo ""
        echo "Common issues:"
        echo "  1. Application Default Credentials not set up"
        echo "     Run: gcloud auth application-default login"
        echo ""
        echo "  2. Instance connection name incorrect"
        echo "     Expected format: PROJECT_ID:REGION:INSTANCE_NAME"
        echo "     Current: $INSTANCE_CONNECTION"
        echo ""
        echo "  3. No access to the Cloud SQL instance"
        echo "     Check IAM permissions for your account"
        exit 1
    fi
    
    # Check if proxy is ready by checking if port is listening
    if lsof -i :"$DB_PORT" >/dev/null 2>&1 || nc -z localhost "$DB_PORT" 2>/dev/null; then
        echo ""
        echo -e "${GREEN}✅ Cloud SQL Proxy started successfully (PID: $PROXY_PID) on port $DB_PORT${NC}"
        break
    fi
    
    # Check for errors in log
    if grep -qi "error\|failed\|fatal" /tmp/cloud-sql-proxy.log 2>/dev/null; then
        echo ""
        echo -e "${RED}❌ Cloud SQL Proxy encountered an error${NC}"
        echo ""
        echo "Error log:"
        cat /tmp/cloud-sql-proxy.log
        echo ""
        kill $PROXY_PID 2>/dev/null || true
        exit 1
    fi
    
    echo -n "."
done

# Final check
if ! kill -0 $PROXY_PID 2>/dev/null; then
    echo ""
    echo -e "${RED}❌ Cloud SQL Proxy failed to start${NC}"
    cat /tmp/cloud-sql-proxy.log
    exit 1
fi

echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo -e "${YELLOW}🧹 Cleaning up...${NC}"
    if [ -n "$PROXY_PID" ] && kill -0 $PROXY_PID 2>/dev/null; then
        kill $PROXY_PID 2>/dev/null || true
        echo -e "${GREEN}✅ Cloud SQL Proxy stopped${NC}"
    fi
}
trap cleanup EXIT INT TERM

# Set database URL (DB_PORT is already set)
export DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@127.0.0.1:$DB_PORT/$DATABASE_NAME"
echo -e "${YELLOW}📋 Database connection URL: postgresql://$DB_USER:***@127.0.0.1:$DB_PORT/$DATABASE_NAME${NC}"

# Test database connection
echo -e "${YELLOW}🔍 Testing database connection...${NC}"
if ! node -e "
  import('@prisma/client').then(({ PrismaClient }) => {
    const prisma = new PrismaClient();
    prisma.\$queryRaw\`SELECT version()\`
      .then(() => {
        console.log('✅ Database connection successful');
        return prisma.\$disconnect();
      })
      .catch((err) => {
        console.error('❌ Database connection failed:', err.message);
        prisma.\$disconnect();
        process.exit(1);
      });
  });
" 2>/dev/null; then
    echo -e "${RED}❌ Failed to connect to database${NC}"
    echo "Please check:"
    echo "  - Database instance exists: $INSTANCE_NAME"
    echo "  - Database exists: $DATABASE_NAME"
    echo "  - User credentials are correct"
    exit 1
fi
echo -e "${GREEN}✅ Database connection successful${NC}"
echo ""

# Generate Prisma clients for all schemas
echo -e "${YELLOW}🔧 Generating Prisma clients for all schemas...${NC}"
echo ""

# Generate root schema
if [ -f "prisma/schema.prisma" ]; then
    echo -e "${BLUE}📦 Generating Prisma client for root schema...${NC}"
    npx prisma generate --schema=prisma/schema.prisma
    echo -e "${GREEN}✅ Root schema client generated${NC}"
else
    echo -e "${YELLOW}⚠️  Root schema not found at prisma/schema.prisma${NC}"
fi

# Generate identity-service schema
if [ -f "services/identity-service/prisma/schema.prisma" ]; then
    echo -e "${BLUE}📦 Generating Prisma client for identity-service schema...${NC}"
    (cd services/identity-service && npx prisma generate --schema=prisma/schema.prisma || npx prisma generate)
    echo -e "${GREEN}✅ Identity-service schema client generated${NC}"
else
    echo -e "${YELLOW}⚠️  Identity-service schema not found${NC}"
fi

# Generate crm-service schema
if [ -f "services/crm-service/prisma/schema.prisma" ]; then
    echo -e "${BLUE}📦 Generating Prisma client for crm-service schema...${NC}"
    (cd services/crm-service && npx prisma generate --schema=prisma/schema.prisma || npx prisma generate)
    echo -e "${GREEN}✅ CRM-service schema client generated${NC}"
else
    echo -e "${YELLOW}⚠️  CRM-service schema not found${NC}"
fi

echo ""
echo -e "${GREEN}✅ All Prisma clients generated successfully!${NC}"
echo ""

# Check for failed migrations and resolve them
echo -e "${YELLOW}🔍 Checking for failed migrations...${NC}"
MIGRATION_STATUS=$(npx prisma migrate status --schema=prisma/schema.prisma 2>&1 || echo "")

if echo "$MIGRATION_STATUS" | grep -qi "failed\|P3009"; then
    echo -e "${YELLOW}⚠️  Found failed migrations, attempting to resolve...${NC}"
    
    # Extract failed migration name
    FAILED_MIGRATION=$(echo "$MIGRATION_STATUS" | grep -oP '`\K[^`]+' | head -1 || echo "")
    
    if [ -z "$FAILED_MIGRATION" ]; then
        FAILED_MIGRATION=$(echo "$MIGRATION_STATUS" | grep -oE '[0-9]{14}_[a-zA-Z_]+' | head -1 || echo "")
    fi
    
    if [ -n "$FAILED_MIGRATION" ]; then
        echo "Found failed migration: $FAILED_MIGRATION"
        
        # Check if tables exist
        TABLE_EXISTS=$(node -e "
          import('@prisma/client').then(({ PrismaClient }) => {
            const prisma = new PrismaClient();
            prisma.\$queryRaw\`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('hr_employees', 'hr_attendances', 'hr_leave_requests')\`
              .then((result) => {
                console.log(result.length > 0 ? 'EXISTS=true' : 'EXISTS=false');
                return prisma.\$disconnect();
              })
              .catch(() => {
                console.log('EXISTS=false');
                prisma.\$disconnect();
              });
          });
        " 2>&1 || echo "EXISTS=false")
        
        if echo "$TABLE_EXISTS" | grep -q "EXISTS=true"; then
            echo "Migration tables exist - marking as applied"
            npx prisma migrate resolve --applied "$FAILED_MIGRATION" --schema=prisma/schema.prisma || true
        else
            echo "Migration tables don't exist - marking as rolled-back"
            npx prisma migrate resolve --rolled-back "$FAILED_MIGRATION" --schema=prisma/schema.prisma || true
        fi
    fi
    echo ""
fi

# Run migrations
echo -e "${YELLOW}🔄 Running Prisma migrations...${NC}"
npx prisma migrate deploy --schema=prisma/schema.prisma
echo -e "${GREEN}✅ Migrations completed successfully${NC}"
echo ""

# Verify schema exists
echo -e "${YELLOW}🔍 Verifying database schema...${NC}"
node -e "
  import('@prisma/client').then(({ PrismaClient }) => {
    const prisma = new PrismaClient();
    prisma.\$queryRaw\`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users'\`
      .then((result) => {
        if (result.length > 0) {
          console.log('✅ Database schema verified - users table exists');
          return prisma.\$disconnect();
        } else {
          console.error('❌ Error: users table does not exist!');
          prisma.\$disconnect();
          process.exit(1);
        }
      })
      .catch((err) => {
        console.error('❌ Error verifying schema:', err.message);
        prisma.\$disconnect();
        process.exit(1);
      });
  });
"
echo ""

# Seed database
echo -e "${YELLOW}🌱 Seeding database...${NC}"
echo ""

# Seed users
if [ -f "seed-users.mjs" ]; then
    echo -e "${BLUE}📦 Seeding users...${NC}"
    node seed-users.mjs
    echo -e "${GREEN}✅ Users seeded${NC}"
else
    echo -e "${YELLOW}⚠️  seed-users.mjs not found${NC}"
fi

# Seed tax rates and exchange rates
if [ -f "seed-data.mjs" ]; then
    echo -e "${BLUE}📦 Seeding tax rates and exchange rates...${NC}"
    node seed-data.mjs
    echo -e "${GREEN}✅ Tax rates and exchange rates seeded${NC}"
else
    echo -e "${YELLOW}⚠️  seed-data.mjs not found${NC}"
fi

# Seed journal entries
if [ -f "seed-journal-entries.mjs" ]; then
    echo -e "${BLUE}📦 Seeding journal entries...${NC}"
    node seed-journal-entries.mjs
    echo -e "${GREEN}✅ Journal entries seeded${NC}"
else
    echo -e "${YELLOW}⚠️  seed-journal-entries.mjs not found${NC}"
fi

# Seed invoices
if [ -f "seed-invoices.mjs" ]; then
    echo -e "${BLUE}📦 Seeding invoices...${NC}"
    node seed-invoices.mjs
    echo -e "${GREEN}✅ Invoices seeded${NC}"
else
    echo -e "${YELLOW}⚠️  seed-invoices.mjs not found${NC}"
fi

echo ""

# Verify seeding results
echo -e "${YELLOW}🔍 Verifying seeding results...${NC}"
node -e "
  import('@prisma/client').then(({ PrismaClient }) => {
    const prisma = new PrismaClient();
    Promise.all([
      prisma.users.count(),
      prisma.taxRates.count(),
      prisma.exchangeRates.count(),
      prisma.invoices.count(),
      prisma.chartOfAccounts.count()
    ])
      .then(([userCount, taxCount, exchangeCount, invoiceCount, coaCount]) => {
        console.log('✅ Seeding verification:');
        console.log(\`   Users: \${userCount}\`);
        console.log(\`   Tax Rates: \${taxCount}\`);
        console.log(\`   Exchange Rates: \${exchangeCount}\`);
        console.log(\`   Invoices: \${invoiceCount}\`);
        console.log(\`   Chart of Accounts: \${coaCount}\`);
        return prisma.\$disconnect();
      })
      .catch((err) => {
        console.error('Error verifying seed:', err.message);
        prisma.\$disconnect();
      });
  });
"

echo ""
echo -e "${GREEN}🎉 Database seeding completed successfully!${NC}"
echo "================================================"
echo ""
echo -e "${YELLOW}📋 Summary:${NC}"
echo "  Project ID: $PROJECT_ID"
echo "  Region: $REGION"
echo "  Instance: $INSTANCE_NAME"
echo "  Database: $DATABASE_NAME"
echo ""
echo -e "${YELLOW}💡 Test Login Credentials:${NC}"
echo "  Admin Email: admin@minierp.com"
echo "  Admin Password: admin123"
echo ""

