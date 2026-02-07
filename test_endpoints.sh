#!/bin/bash

# ============================================================
# LocalCart Backend - Comprehensive Testing Script
# ============================================================
# This script tests all implemented endpoints
# Run from project root: bash test_endpoints.sh
# ============================================================

set -e

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# API Base URL
API_BASE_URL="http://localhost:8080/api/v1"
HEALTH_URL="http://localhost:8080/actuator/health"

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# ============================================================
# Helper Functions
# ============================================================

print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_test() {
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -e "${YELLOW}[TEST $TOTAL_TESTS]${NC} $1"
}

print_success() {
    PASSED_TESTS=$((PASSED_TESTS + 1))
    echo -e "${GREEN}✓ PASS${NC}: $1\n"
}

print_failure() {
    FAILED_TESTS=$((FAILED_TESTS + 1))
    echo -e "${RED}✗ FAIL${NC}: $1\n"
}

print_info() {
    echo -e "${BLUE}→${NC} $1"
}

# Save token for subsequent requests
save_token() {
    local response=$1
    ACCESS_TOKEN=$(echo "$response" | jq -r '.accessToken' 2>/dev/null)
    REFRESH_TOKEN=$(echo "$response" | jq -r '.refreshToken' 2>/dev/null)
    USER_ID=$(echo "$response" | jq -r '.userId' 2>/dev/null)
    
    if [[ "$ACCESS_TOKEN" != "null" && ! -z "$ACCESS_TOKEN" ]]; then
        echo -e "${GREEN}✓ Tokens saved${NC}"
        echo "  Access Token: ${ACCESS_TOKEN:0:50}..."
        echo "  User ID: $USER_ID"
    else
        echo -e "${RED}✗ Failed to extract tokens${NC}"
        echo "Response: $response"
        return 1
    fi
}

# ============================================================
# Health Check
# ============================================================

print_header "SECTION 1: HEALTH CHECK"

print_test "Verify API is running"
HEALTH_RESPONSE=$(curl -s -X GET "$HEALTH_URL")
if echo "$HEALTH_RESPONSE" | jq . > /dev/null 2>&1; then
    print_success "API is running and healthy"
    echo "$HEALTH_RESPONSE" | jq .
else
    print_failure "API is not responding. Make sure Spring Boot is running on port 8080"
    echo "Start with: mvn spring-boot:run"
    exit 1
fi

# ============================================================
# Section 2: AUTHENTICATION TESTS
# ============================================================

print_header "SECTION 2: AUTHENTICATION SERVICES"

# Test 2.1: User Registration
print_test "Register new user"
REGISTER_RESPONSE=$(curl -s -X POST "$API_BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser_'$(date +%s)'@example.com",
    "password": "TestPass123!",
    "firstName": "Test",
    "lastName": "User",
    "phoneNumber": "+1-555-0100"
  }')

if echo "$REGISTER_RESPONSE" | jq . > /dev/null 2>&1; then
    print_success "User registered successfully"
    echo "$REGISTER_RESPONSE" | jq .
    save_token "$REGISTER_RESPONSE"
else
    print_failure "Failed to register user"
    echo "$REGISTER_RESPONSE"
    exit 1
fi

# Test 2.2: User Login
print_test "Login with registered user"
LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "TestPass123!"
  }')

if echo "$LOGIN_RESPONSE" | jq . > /dev/null 2>&1; then
    print_success "User login successful"
    echo "$LOGIN_RESPONSE" | jq . | head -20
else
    print_failure "Failed to login"
    echo "$LOGIN_RESPONSE"
fi

# Test 2.3: Get User Profile
print_test "Get current user profile"
PROFILE_RESPONSE=$(curl -s -X GET "$API_BASE_URL/auth/profile" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

if echo "$PROFILE_RESPONSE" | jq . > /dev/null 2>&1; then
    print_success "User profile retrieved"
    echo "$PROFILE_RESPONSE" | jq .
else
    print_failure "Failed to get user profile"
    echo "$PROFILE_RESPONSE"
fi

# Test 2.4: Refresh Token
print_test "Refresh access token"
REFRESH_RESPONSE=$(curl -s -X POST "$API_BASE_URL/auth/refresh" \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\": \"$REFRESH_TOKEN\"}")

if echo "$REFRESH_RESPONSE" | jq . > /dev/null 2>&1; then
    print_success "Token refreshed successfully"
    NEW_ACCESS_TOKEN=$(echo "$REFRESH_RESPONSE" | jq -r '.accessToken')
    echo "New Access Token: ${NEW_ACCESS_TOKEN:0:50}..."
else
    print_failure "Failed to refresh token"
    echo "$REFRESH_RESPONSE"
fi

# ============================================================
# Section 3: PRODUCT CONTROLLER TESTS
# ============================================================

print_header "SECTION 3: PRODUCT SERVICES"

# Test 3.1: List Products
print_test "List all products (paginated)"
PRODUCTS_RESPONSE=$(curl -s -X GET "$API_BASE_URL/products?page=0&size=10")

if echo "$PRODUCTS_RESPONSE" | jq . > /dev/null 2>&1; then
    print_success "Products list retrieved"
    echo "$PRODUCTS_RESPONSE" | jq . | head -20
else
    print_failure "Failed to list products"
    echo "$PRODUCTS_RESPONSE"
fi

# Test 3.2: Get Single Product
print_test "Get product by ID"
GET_PRODUCT_RESPONSE=$(curl -s -X GET "$API_BASE_URL/products/1")

if echo "$GET_PRODUCT_RESPONSE" | jq . > /dev/null 2>&1; then
    print_success "Product retrieved"
    echo "$GET_PRODUCT_RESPONSE" | jq .
else
    print_failure "Failed to get product"
    echo "$GET_PRODUCT_RESPONSE"
fi

# Test 3.3: Search Products
print_test "Search products by query"
SEARCH_RESPONSE=$(curl -s -X GET "$API_BASE_URL/products/search?q=laptop&category=1")

if echo "$SEARCH_RESPONSE" | jq . > /dev/null 2>&1; then
    print_success "Product search executed"
    echo "$SEARCH_RESPONSE" | jq .
else
    print_failure "Failed to search products"
    echo "$SEARCH_RESPONSE"
fi

# ============================================================
# Section 4: CATEGORY CONTROLLER TESTS
# ============================================================

print_header "SECTION 4: CATEGORY SERVICES"

# Test 4.1: List Categories
print_test "List all categories"
CATEGORIES_RESPONSE=$(curl -s -X GET "$API_BASE_URL/categories")

if echo "$CATEGORIES_RESPONSE" | jq . > /dev/null 2>&1; then
    print_success "Categories list retrieved"
    echo "$CATEGORIES_RESPONSE" | jq .
else
    print_failure "Failed to list categories"
    echo "$CATEGORIES_RESPONSE"
fi

# Test 4.2: Get Single Category
print_test "Get category by ID"
GET_CATEGORY_RESPONSE=$(curl -s -X GET "$API_BASE_URL/categories/1")

if echo "$GET_CATEGORY_RESPONSE" | jq . > /dev/null 2>&1; then
    print_success "Category retrieved"
    echo "$GET_CATEGORY_RESPONSE" | jq .
else
    print_failure "Failed to get category"
    echo "$GET_CATEGORY_RESPONSE"
fi

# ============================================================
# Section 5: CART CONTROLLER TESTS
# ============================================================

print_header "SECTION 5: SHOPPING CART SERVICES"

# Test 5.1: Get Current Cart
print_test "Get current user's shopping cart"
CART_RESPONSE=$(curl -s -X GET "$API_BASE_URL/cart" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

if echo "$CART_RESPONSE" | jq . > /dev/null 2>&1; then
    print_success "Cart retrieved"
    echo "$CART_RESPONSE" | jq .
else
    print_failure "Failed to get cart"
    echo "$CART_RESPONSE"
fi

# Test 5.2: Add to Cart
print_test "Add product to cart"
ADD_TO_CART_RESPONSE=$(curl -s -X POST "$API_BASE_URL/cart/add-item" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": 1,
    "quantity": 2
  }')

if echo "$ADD_TO_CART_RESPONSE" | jq . > /dev/null 2>&1; then
    print_success "Product added to cart"
    echo "$ADD_TO_CART_RESPONSE" | jq .
else
    print_failure "Failed to add to cart"
    echo "$ADD_TO_CART_RESPONSE"
fi

# ============================================================
# Section 6: ADDRESS CONTROLLER TESTS
# ============================================================

print_header "SECTION 6: ADDRESS MANAGEMENT SERVICES"

# Test 6.1: List Addresses
print_test "List user's addresses"
ADDRESSES_RESPONSE=$(curl -s -X GET "$API_BASE_URL/addresses" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

if echo "$ADDRESSES_RESPONSE" | jq . > /dev/null 2>&1; then
    print_success "Addresses retrieved"
    echo "$ADDRESSES_RESPONSE" | jq .
else
    print_failure "Failed to list addresses"
    echo "$ADDRESSES_RESPONSE"
fi

# Test 6.2: Create New Address
print_test "Create new shipping address"
CREATE_ADDRESS_RESPONSE=$(curl -s -X POST "$API_BASE_URL/addresses" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "street": "123 Main Street",
    "apartment": "Apt 5B",
    "city": "New York",
    "state": "NY",
    "country": "United States",
    "zipCode": "10001",
    "addressType": "SHIPPING",
    "isDefault": false
  }')

if echo "$CREATE_ADDRESS_RESPONSE" | jq . > /dev/null 2>&1; then
    print_success "Address created"
    echo "$CREATE_ADDRESS_RESPONSE" | jq .
    ADDRESS_ID=$(echo "$CREATE_ADDRESS_RESPONSE" | jq -r '.addressId' 2>/dev/null)
else
    print_failure "Failed to create address"
    echo "$CREATE_ADDRESS_RESPONSE"
fi

# ============================================================
# Section 7: ORDER CONTROLLER TESTS
# ============================================================

print_header "SECTION 7: ORDER MANAGEMENT SERVICES"

# Test 7.1: List Orders
print_test "List user's orders"
ORDERS_RESPONSE=$(curl -s -X GET "$API_BASE_URL/orders?page=0&size=10" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

if echo "$ORDERS_RESPONSE" | jq . > /dev/null 2>&1; then
    print_success "Orders list retrieved"
    echo "$ORDERS_RESPONSE" | jq .
else
    print_failure "Failed to list orders"
    echo "$ORDERS_RESPONSE"
fi

# Test 7.2: Get Single Order
print_test "Get order details by ID"
GET_ORDER_RESPONSE=$(curl -s -X GET "$API_BASE_URL/orders/1" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

if echo "$GET_ORDER_RESPONSE" | jq . > /dev/null 2>&1; then
    print_success "Order retrieved"
    echo "$GET_ORDER_RESPONSE" | jq .
else
    print_failure "Failed to get order"
    echo "$GET_ORDER_RESPONSE"
fi

# Test 7.3: Track Order
print_test "Track order status"
TRACK_ORDER_RESPONSE=$(curl -s -X GET "$API_BASE_URL/orders/1/track" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

if echo "$TRACK_ORDER_RESPONSE" | jq . > /dev/null 2>&1; then
    print_success "Order tracked"
    echo "$TRACK_ORDER_RESPONSE" | jq .
else
    print_failure "Failed to track order"
    echo "$TRACK_ORDER_RESPONSE"
fi

# ============================================================
# Section 8: PAYMENT CONTROLLER TESTS
# ============================================================

print_header "SECTION 8: PAYMENT SERVICES"

# Test 8.1: Initiate Payment
print_test "Initiate payment for order"
PAYMENT_RESPONSE=$(curl -s -X POST "$API_BASE_URL/payments/initiate" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": 1,
    "orderNumber": "ORD-2026-001",
    "amount": 599.99,
    "currency": "USD",
    "paymentMethod": "CREDIT_CARD",
    "cardNumber": "4242424242424242",
    "cardHolderName": "Test User",
    "expiryMonth": "12",
    "expiryYear": "2025",
    "cvv": "123"
  }')

if echo "$PAYMENT_RESPONSE" | jq . > /dev/null 2>&1; then
    print_success "Payment initiated"
    echo "$PAYMENT_RESPONSE" | jq .
    PAYMENT_ID=$(echo "$PAYMENT_RESPONSE" | jq -r '.paymentId' 2>/dev/null)
else
    print_failure "Failed to initiate payment"
    echo "$PAYMENT_RESPONSE"
fi

# Test 8.2: Get Payment Details
print_test "Get payment details"
GET_PAYMENT_RESPONSE=$(curl -s -X GET "$API_BASE_URL/payments/1" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

if echo "$GET_PAYMENT_RESPONSE" | jq . > /dev/null 2>&1; then
    print_success "Payment details retrieved"
    echo "$GET_PAYMENT_RESPONSE" | jq .
else
    print_failure "Failed to get payment details"
    echo "$GET_PAYMENT_RESPONSE"
fi

# ============================================================
# Test Summary
# ============================================================

print_header "TEST SUMMARY"

echo -e "Total Tests:   ${BLUE}$TOTAL_TESTS${NC}"
echo -e "Passed:        ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed:        ${RED}$FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}✓ ALL TESTS PASSED!${NC}\n"
    exit 0
else
    echo -e "\n${RED}✗ SOME TESTS FAILED${NC}\n"
    exit 1
fi
