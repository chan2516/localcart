#!/bin/bash

# LocalCart Quick Start Script
# This script will help you set up and run the entire application

set -e

echo "=========================================="
echo "  LocalCart Application - Quick Start"
echo "=========================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
log_info() {
    echo -e "${BLUE}ℹ️  INFO: $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ SUCCESS: $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  WARNING: $1${NC}"
}

log_error() {
    echo -e "${RED}❌ ERROR: $1${NC}"
}

# Step 1: Check prerequisites
echo ""
echo "STEP 1: Checking Prerequisites..."
echo "-----------------------------------"

if ! command -v docker &> /dev/null; then
    log_error "Docker is not installed!"
    exit 1
fi
log_success "Docker is installed"

if ! command -v docker-compose &> /dev/null; then
    log_error "Docker Compose is not installed!"
    exit 1
fi
log_success "Docker Compose is installed"

if ! command -v mvn &> /dev/null && [ ! -f "./mvnw" ]; then
    log_error "Maven is not installed and mvnw is not found!"
    exit 1
fi
log_success "Maven/mvnw is available"

# Step 2: Check .env file
echo ""
echo "STEP 2: Checking Environment Configuration..."
echo "----------------------------------------------"

if [ ! -f ".env" ]; then
    log_warning ".env file not found! Creating from template..."
    cat > .env << 'EOF'
POSTGRES_DB=localcart
POSTGRES_USER=localcart
POSTGRES_PASSWORD=localcart

DB_HOST=postgres
DB_PORT=5432
DB_NAME=localcart
DB_USER=localcart
DB_PASSWORD=localcart

REDIS_HOST=redis
REDIS_PORT=6379

JWT_SECRET=dev-secret-key-change-in-production-with-32-byte-base64-encoded-key
SPRING_PROFILES_ACTIVE=dev

STRIPE_API_KEY=sk_test_your_test_stripe_key_here
STRIPE_PUBLIC_KEY=pk_test_your_public_key_here
STRIPE_WEBHOOK_SECRET=whsec_test_your_webhook_secret_here

PAYMENT_ENCRYPTION_KEY=dev-insecure-key-change-in-production-12345678901234567890

SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASSWORD=
SMTP_AUTH=false
SMTP_STARTTLS=false
SMTP_FROM=no-reply@localcart.com

APP_PASSWORD_RESET_URL=http://localhost:3000/reset?token=

N8N_WEBHOOK_URL=http://n8n:5678/webhook
N8N_WEBHOOK_ENABLED=true

AUTOMATION_ENABLED=true
LOW_STOCK_THRESHOLD=10
ABANDONED_CART_HOURS=24
REVIEW_REQUEST_DAYS=7
EOF
    log_success ".env file created successfully"
else
    log_success ".env file exists"
fi

# Step 3: Start Docker services
echo ""
echo "STEP 3: Starting Docker Services..."
echo "------------------------------------"

log_info "Starting PostgreSQL, Redis, N8N, Prometheus, and Grafana..."
docker-compose up -d

# Wait for PostgreSQL to be healthy
log_info "Waiting for PostgreSQL to be healthy..."
sleep 5
retry_count=0
max_retries=30
while [ $retry_count -lt $max_retries ]; do
    if docker exec localcart-postgres pg_isready -U localcart -d localcart > /dev/null 2>&1; then
        log_success "PostgreSQL is healthy"
        break
    fi
    retry_count=$((retry_count + 1))
    echo -ne "\rWaiting... ($retry_count/$max_retries)"
    sleep 1
done

if [ $retry_count -eq $max_retries ]; then
    log_error "PostgreSQL failed to start after 30 seconds"
    echo ""
    echo "Checking Docker logs..."
    docker-compose logs postgres
    exit 1
fi

log_success "All Docker services are running"

# Step 4: Build the application
echo ""
echo "STEP 4: Building the Application..."
echo "-------------------------------------"

log_info "Building with Maven (this may take 2-3 minutes)..."

if [ -f "./mvnw" ]; then
    ./mvnw clean package -DskipTests
else
    mvn clean package -DskipTests
fi

if [ -f "target/localcart-0.0.1-SNAPSHOT.jar" ]; then
    log_success "Application built successfully"
else
    log_error "Build failed! JAR file not found."
    exit 1
fi

# Step 5: Display summary and next steps
echo ""
echo "=========================================="
echo "  ✅ Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo ""
echo "1️⃣  Run the application (dev mode):"
echo "   ${BLUE}./mvnw spring-boot:run${NC}"
echo ""
echo "2️⃣  Or run the built JAR directly:"
echo "   ${BLUE}java -jar target/localcart-0.0.1-SNAPSHOT.jar --spring.profiles.active=dev${NC}"
echo ""
echo "3️⃣  Access the application:"
echo "   API:           ${BLUE}http://localhost:8080${NC}"
echo "   Swagger UI:    ${BLUE}http://localhost:8080/swagger-ui.html${NC}"
echo "   Database:      ${BLUE}http://localhost:8081${NC} (Adminer)"
echo "   Prometheus:    ${BLUE}http://localhost:9090${NC}"
echo "   Grafana:       ${BLUE}http://localhost:3001${NC} (admin/admin)"
echo "   N8N:           ${BLUE}http://localhost:5678${NC} (admin/changeme123)"
echo ""
echo "4️⃣  Database credentials:"
echo "   Server:   postgres (docker container)"
echo "   User:     localcart"
echo "   Password: localcart"
echo "   Database: localcart"
echo ""
echo "5️⃣  Test the API:"
echo "   ${BLUE}curl http://localhost:8080/actuator/health${NC}"
echo ""
echo "=========================================="
echo ""
echo "For detailed documentation, see: ${BLUE}SETUP_AND_RUNNING_GUIDE.md${NC}"
echo ""

log_success "Everything is ready! Start the application with one of the commands above."
