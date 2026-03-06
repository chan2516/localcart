#!/bin/bash

# ============================================================
# LocalCart Backend - API Smoke & Flow Tests
# ============================================================
# Verifies auth (register/login), public catalog endpoints,
# and authenticated user endpoints using realistic request data.
# ============================================================

set -u

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

API_BASE_URL="http://localhost:8080/api/v1"
HEALTH_URL="http://localhost:8080/actuator/health"

TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
SKIPPED_TESTS=0

ACCESS_TOKEN=""
REFRESH_TOKEN=""
USER_ID=""
TEST_EMAIL=""
TEST_PASSWORD="TestPass123!"
PRODUCT_ID=""
CATEGORY_ID=""
ADDRESS_ID=""
ORDER_ID=""

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
  echo -e "${GREEN}PASS${NC}: $1\n"
}

print_failure() {
  FAILED_TESTS=$((FAILED_TESTS + 1))
  echo -e "${RED}FAIL${NC}: $1\n"
}

print_skip() {
  SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
  echo -e "${YELLOW}SKIP${NC}: $1\n"
}

perform_request() {
  # Usage:
  # perform_request METHOD URL JSON_BODY AUTH_TOKEN
  local method="$1"
  local url="$2"
  local body="$3"
  local auth_token="$4"

  local tmp_file
  tmp_file=$(mktemp)

  local status
  if [[ -n "$body" ]]; then
    if [[ -n "$auth_token" ]]; then
      status=$(curl -sS -o "$tmp_file" -w "%{http_code}" -X "$method" "$url" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $auth_token" \
        -d "$body")
    else
      status=$(curl -sS -o "$tmp_file" -w "%{http_code}" -X "$method" "$url" \
        -H "Content-Type: application/json" \
        -d "$body")
    fi
  else
    if [[ -n "$auth_token" ]]; then
      status=$(curl -sS -o "$tmp_file" -w "%{http_code}" -X "$method" "$url" \
        -H "Authorization: Bearer $auth_token")
    else
      status=$(curl -sS -o "$tmp_file" -w "%{http_code}" -X "$method" "$url")
    fi
  fi

  RESPONSE_STATUS="$status"
  RESPONSE_BODY=$(cat "$tmp_file")
  rm -f "$tmp_file"
}

expect_status() {
  # Usage: expect_status "200|201" "description"
  local expected_regex="$1"
  local description="$2"

  if [[ "$RESPONSE_STATUS" =~ ^($expected_regex)$ ]]; then
    print_success "$description (HTTP $RESPONSE_STATUS)"
    return 0
  fi

  print_failure "$description (expected $expected_regex, got $RESPONSE_STATUS)"
  if [[ -n "$RESPONSE_BODY" ]]; then
    echo "$RESPONSE_BODY" | jq . 2>/dev/null || echo "$RESPONSE_BODY"
  fi
  return 1
}

extract_tokens() {
  ACCESS_TOKEN=$(echo "$RESPONSE_BODY" | jq -r '.accessToken // empty')
  REFRESH_TOKEN=$(echo "$RESPONSE_BODY" | jq -r '.refreshToken // empty')
  USER_ID=$(echo "$RESPONSE_BODY" | jq -r '.userId // empty')

  if [[ -z "$ACCESS_TOKEN" || -z "$REFRESH_TOKEN" ]]; then
    print_failure "Could not extract auth tokens from response"
    echo "$RESPONSE_BODY" | jq . 2>/dev/null || echo "$RESPONSE_BODY"
    return 1
  fi

  echo "  User ID: $USER_ID"
  echo "  Access Token: ${ACCESS_TOKEN:0:45}..."
  return 0
}

require_tools() {
  if ! command -v curl >/dev/null 2>&1; then
    echo "curl is required but not installed"
    exit 1
  fi
  if ! command -v jq >/dev/null 2>&1; then
    echo "jq is required but not installed"
    exit 1
  fi
}

require_tools

print_header "SECTION 1: HEALTH CHECK"

print_test "Verify API is running"
perform_request "GET" "$HEALTH_URL" "" ""
if expect_status "200" "API health endpoint"; then
  echo "$RESPONSE_BODY" | jq .
fi

print_header "SECTION 2: AUTHENTICATION"

TEST_EMAIL="testuser_$(date +%s)@example.com"

print_test "Register new user"
perform_request "POST" "$API_BASE_URL/auth/register" "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\",\"firstName\":\"Test\",\"lastName\":\"User\",\"phoneNumber\":\"+1-555-0100\"}" ""
if expect_status "200|201" "User registration"; then
  echo "$RESPONSE_BODY" | jq .
  extract_tokens || true
fi

print_test "Login with newly registered user"
perform_request "POST" "$API_BASE_URL/auth/login" "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}" ""
if expect_status "200" "User login"; then
  echo "$RESPONSE_BODY" | jq .
  extract_tokens || true
fi

print_test "Get current user profile"
if [[ -z "$ACCESS_TOKEN" ]]; then
  print_skip "Profile check skipped (missing access token)"
else
  perform_request "GET" "$API_BASE_URL/auth/profile" "" "$ACCESS_TOKEN"
  if expect_status "200" "Authenticated profile endpoint"; then
    echo "$RESPONSE_BODY" | jq .
  fi
fi

print_test "Refresh access token"
if [[ -z "$REFRESH_TOKEN" ]]; then
  print_skip "Refresh skipped (missing refresh token)"
else
  perform_request "POST" "$API_BASE_URL/auth/refresh" "{\"refreshToken\":\"$REFRESH_TOKEN\"}" ""
  if expect_status "200" "Token refresh"; then
    echo "$RESPONSE_BODY" | jq .
    NEW_ACCESS_TOKEN=$(echo "$RESPONSE_BODY" | jq -r '.accessToken // empty')
    if [[ -n "$NEW_ACCESS_TOKEN" ]]; then
      ACCESS_TOKEN="$NEW_ACCESS_TOKEN"
    fi
  fi
fi

print_header "SECTION 3: PUBLIC CATALOG ENDPOINTS"

print_test "List categories"
perform_request "GET" "$API_BASE_URL/categories" "" ""
if expect_status "200" "Categories list"; then
  echo "$RESPONSE_BODY" | jq .
  CATEGORY_ID=$(echo "$RESPONSE_BODY" | jq -r '(.categories[0]?.id // .[0]?.id // empty)')
fi

print_test "Get category by ID"
if [[ -z "$CATEGORY_ID" ]]; then
  print_skip "Category-by-id skipped (no category found in list response)"
else
  perform_request "GET" "$API_BASE_URL/categories/$CATEGORY_ID" "" ""
  if expect_status "200" "Category details"; then
    echo "$RESPONSE_BODY" | jq .
  fi
fi

print_test "List products"
perform_request "GET" "$API_BASE_URL/products?page=0&size=10" "" ""
if expect_status "200" "Products list"; then
  echo "$RESPONSE_BODY" | jq .
  PRODUCT_ID=$(echo "$RESPONSE_BODY" | jq -r '(.products[0]?.id // .content[0]?.id // .[0]?.id // empty)')
fi

print_test "Search products"
perform_request "GET" "$API_BASE_URL/products/search?q=test" "" ""
if expect_status "200" "Products search"; then
  echo "$RESPONSE_BODY" | jq .
fi

print_test "Get product by ID"
if [[ -z "$PRODUCT_ID" ]]; then
  print_skip "Product-by-id skipped (no product found in list response)"
else
  perform_request "GET" "$API_BASE_URL/products/$PRODUCT_ID" "" ""
  if expect_status "200" "Product details"; then
    echo "$RESPONSE_BODY" | jq .
  fi
fi

print_header "SECTION 4: AUTHENTICATED USER FLOW"

print_test "Get current cart"
if [[ -z "$ACCESS_TOKEN" ]]; then
  print_skip "Cart check skipped (missing access token)"
else
  perform_request "GET" "$API_BASE_URL/cart" "" "$ACCESS_TOKEN"
  if expect_status "200" "Cart retrieval"; then
    echo "$RESPONSE_BODY" | jq .
  fi
fi

print_test "Add item to cart"
if [[ -z "$ACCESS_TOKEN" || -z "$PRODUCT_ID" ]]; then
  print_skip "Add-to-cart skipped (missing access token or product id)"
else
  perform_request "POST" "$API_BASE_URL/cart/add-item" "{\"productId\":$PRODUCT_ID,\"quantity\":2}" "$ACCESS_TOKEN"
  if expect_status "200|201" "Add item to cart"; then
    echo "$RESPONSE_BODY" | jq .
  fi
fi

print_test "List user addresses"
if [[ -z "$ACCESS_TOKEN" ]]; then
  print_skip "Address list skipped (missing access token)"
else
  perform_request "GET" "$API_BASE_URL/addresses" "" "$ACCESS_TOKEN"
  if expect_status "200" "Addresses list"; then
    echo "$RESPONSE_BODY" | jq .
  fi
fi

print_test "Create address"
if [[ -z "$ACCESS_TOKEN" ]]; then
  print_skip "Create address skipped (missing access token)"
else
  perform_request "POST" "$API_BASE_URL/addresses" "{\"street\":\"123 Main Street\",\"apartment\":\"Apt 5B\",\"city\":\"New York\",\"state\":\"NY\",\"country\":\"United States\",\"zipCode\":\"10001\",\"addressType\":\"SHIPPING\",\"isDefault\":false}" "$ACCESS_TOKEN"
  if expect_status "200|201" "Create address"; then
    echo "$RESPONSE_BODY" | jq .
    ADDRESS_ID=$(echo "$RESPONSE_BODY" | jq -r '.id // .addressId // empty')
  fi
fi

print_test "List user orders"
if [[ -z "$ACCESS_TOKEN" ]]; then
  print_skip "Orders list skipped (missing access token)"
else
  perform_request "GET" "$API_BASE_URL/orders?page=0&size=10" "" "$ACCESS_TOKEN"
  if expect_status "200" "Orders list"; then
    echo "$RESPONSE_BODY" | jq .
    ORDER_ID=$(echo "$RESPONSE_BODY" | jq -r '.orders[0].id // .content[0].id // empty')
  fi
fi

print_test "Get order details"
if [[ -z "$ACCESS_TOKEN" || -z "$ORDER_ID" ]]; then
  print_skip "Order details skipped (no existing order found)"
else
  perform_request "GET" "$API_BASE_URL/orders/$ORDER_ID" "" "$ACCESS_TOKEN"
  if expect_status "200" "Order details"; then
    echo "$RESPONSE_BODY" | jq .
  fi
fi

print_test "Track order"
if [[ -z "$ACCESS_TOKEN" || -z "$ORDER_ID" ]]; then
  print_skip "Order tracking skipped (no existing order found)"
else
  perform_request "GET" "$API_BASE_URL/orders/$ORDER_ID/track" "" "$ACCESS_TOKEN"
  if expect_status "200" "Order tracking"; then
    echo "$RESPONSE_BODY" | jq .
  fi
fi

print_test "Payment health check"
if [[ -z "$ACCESS_TOKEN" ]]; then
  print_skip "Payment health skipped (missing access token)"
else
  perform_request "GET" "$API_BASE_URL/payments/health" "" "$ACCESS_TOKEN"
  if expect_status "200|503" "Payment health endpoint"; then
    echo "$RESPONSE_BODY" | jq .
  fi
fi

print_header "TEST SUMMARY"

echo -e "Total Tests:   ${BLUE}$TOTAL_TESTS${NC}"
echo -e "Passed:        ${GREEN}$PASSED_TESTS${NC}"
echo -e "Failed:        ${RED}$FAILED_TESTS${NC}"
echo -e "Skipped:       ${YELLOW}$SKIPPED_TESTS${NC}"

if [ "$FAILED_TESTS" -eq 0 ]; then
  echo -e "\n${GREEN}ALL EXECUTED TESTS PASSED${NC}\n"
  exit 0
else
  echo -e "\n${RED}SOME TESTS FAILED${NC}\n"
  exit 1
fi
