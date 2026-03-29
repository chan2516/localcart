# Admin Development Endpoint Templates

Source references:
- md/API_QUICK_REFERENCE.md
- md/API_ENDPOINTS_REFERENCE.md
- md/FRONTEND_API_GUIDE.md

Base URL: http://localhost:8080/api/v1

## 1. Authentication

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "admin@localcart.com",
  "password": "Pass123!"
}
```

### Refresh Token
```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "<refresh-token>"
}
```

## 2. Admin Dashboard

### Get Dashboard Stats
```http
GET /admin/dashboard
Authorization: Bearer <token>
```

### Get Platform Metrics
```http
GET /admin/metrics?period=MONTH
Authorization: Bearer <token>
```

## 3. User Management

### List Users
```http
GET /admin/users?page=0&size=20
Authorization: Bearer <token>
```

### Manage User (BAN)
```http
POST /admin/users/manage
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": 12,
  "action": "BAN",
  "reason": "Fraudulent activity detected"
}
```

### Manage User (ACTIVATE)
```http
POST /admin/users/manage
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": 12,
  "action": "ACTIVATE"
}
```

## 4. Vendor Management

### Pending Vendor Applications
```http
GET /admin/vendors/pending?page=0&size=10
Authorization: Bearer <token>
```

### Approve Vendor
```http
POST /admin/vendors/approve
Authorization: Bearer <token>
Content-Type: application/json

{
  "vendorId": 7,
  "status": "APPROVED",
  "reason": "Documents verified",
  "commissionRate": 15.00
}
```

### Reject Vendor
```http
POST /admin/vendors/approve
Authorization: Bearer <token>
Content-Type: application/json

{
  "vendorId": 7,
  "status": "REJECTED",
  "reason": "Incomplete KYC"
}
```

### Ban Vendor
```http
POST /admin/vendors/{id}/ban
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "Policy violation"
}
```

### Restore Vendor
```http
POST /admin/vendors/{id}/restore
Authorization: Bearer <token>
```

## 5. Operations and Health

### Application Health
```http
GET /actuator/health
```

### Swagger UI
```http
GET /swagger-ui.html
```

## 6. Local Development Tool Links

- Grafana: http://localhost:3001
- Prometheus: http://localhost:9090
- Adminer: http://localhost:8081
- N8N: http://localhost:5678
- Loki: http://localhost:3100
- Logs file: logs/localcart.json
