# LocalCart Monitoring & Logging Guide

## 🎯 Overview

LocalCart now includes **production-grade monitoring and logging** with:
- ✅ **Prometheus** - Metrics collection
- ✅ **Grafana** - Visualization dashboards
- ✅ **Loki** - Log aggregation
- ✅ **Promtail** - Log shipping
- ✅ **Micrometer** - Application metrics
- ✅ **Structured JSON Logging** - Machine-readable logs
- ✅ **Distributed Tracing** - Request tracking across services

---

## 📊 Architecture

```
┌─────────────────┐
│  Spring Boot    │
│   Application   │
│                 │
│ • Micrometer    │
│ • Logback       │
│ • Actuator      │
└────────┬────────┘
         │
         ├─── Metrics ──────► Prometheus ──────► Grafana
         │                                           │
         └─── Logs ─────────► Promtail ────► Loki ──┘
```

---

## 🚀 Quick Start

### 1. Start Monitoring Stack

```bash
# Start all services (PostgreSQL, Redis, Prometheus, Grafana, Loki)
docker-compose up -d

# Check status
docker-compose ps
```

### 2. Start Spring Boot Application

```bash
# Build and run
cd /workspaces/localcart
./mvnw spring-boot:run
```

### 3. Access Monitoring Tools

| Service | URL | Credentials |
|---------|-----|-------------|
| **Grafana** | http://localhost:3001 | admin / admin |
| **Prometheus** | http://localhost:9090 | - |
| **Loki** | http://localhost:3100 | - |
| **Spring Boot Actuator** | http://localhost:8080/actuator | - |
| **Metrics (Prometheus format)** | http://localhost:8080/actuator/prometheus | - |

---

## 📈 Available Metrics

### Spring Boot Default Metrics

Access at: `http://localhost:8080/actuator/metrics`

- **JVM Metrics**
  - `jvm.memory.used` - Memory usage
  - `jvm.gc.pause` - Garbage collection pauses
  - `jvm.threads.live` - Active thread count

- **HTTP Metrics**
  - `http.server.requests` - Request count & duration
  - `http.request.duration` - Custom request timing

- **Database Metrics**
  - `hikaricp.connections.active` - Active DB connections
  - `hikaricp.connections.pending` - Waiting connections

### Custom Business Metrics

Implemented in `BusinessMetrics` class:

```java
// Order metrics
business.orders.created          // Total orders created
business.orders.cancelled        // Total orders cancelled
business.orders.processing.time  // Order processing duration

// Payment metrics
business.payments.success        // Successful payments
business.payments.failed         // Failed payments
business.payments.processing.time // Payment processing duration

// Product metrics
business.products.created        // Total products created

// User metrics
business.users.registered        // Total users registered

// Vendor metrics
business.vendors.approved        // Total vendors approved
```

---

## 📝 Structured Logging

### Log Format (JSON)

All logs are emitted in JSON format for easy parsing:

```json
{
  "@timestamp": "2026-02-10T12:30:45.123Z",
  "level": "INFO",
  "service": "localcart",
  "env": "dev",
  "logger_name": "com.localcart.service.OrderService",
  "thread_name": "http-nio-8080-exec-1",
  "message": "Order created successfully",
  "correlationId": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
  "requestId": "req-12345",
  "requestUri": "/api/v1/orders",
  "requestMethod": "POST",
  "clientIp": "172.18.0.1",
  "userId": "user123",
  "vendorId": "vendor456",
  "trace_id": "abc123",
  "span_id": "def456"
}
```

### Log Levels

- `ERROR` - Application errors, exceptions
- `WARN` - Warning conditions
- `INFO` - Informational messages (default)
- `DEBUG` - Debug information (enabled for `com.localcart` package)
- `TRACE` - Detailed trace information (SQL parameters)

### Log Files

Logs are written to:
- **Console**: Stdout (JSON format)
- **File**: `logs/localcart.json` (rotated daily, 30-day retention)

---

## 🔍 Querying Logs with Loki

### Access Loki in Grafana

1. Go to http://localhost:3001
2. Navigate to **Explore**
3. Select **Loki** datasource

### Example LogQL Queries

```logql
# All logs from localcart
{job="localcart"}

# Error logs only
{job="localcart"} |= "ERROR"

# Logs for specific user
{job="localcart"} | json | userId="user123"

# Failed payments
{job="localcart"} | json | message=~"payment.*failed"

# Logs with correlation ID
{job="localcart"} | json | correlationId="a1b2c3d4-e5f6-7890-1234-567890abcdef"

# High response times
{job="localcart"} | json | duration > 1000

# Logs from last hour with ERROR level
{job="localcart"} | json | level="ERROR" [1h]
```

---

## 📊 Grafana Dashboards

### Pre-configured Datasources

- **Prometheus** - Metrics
- **Loki** - Logs

### Suggested Dashboard Panels

#### 1. **Application Health**
- Request rate (requests/sec)
- Response times (p50, p95, p99)
- Error rate (%)
- Active connections

#### 2. **Business Metrics**
- Orders created (per hour)
- Payment success rate
- Product creation rate
- User registration rate

#### 3. **System Resources**
- JVM memory usage
- GC pause times
- Thread count
- CPU usage

#### 4. **Database Performance**
- Query execution time
- Connection pool utilization
- Slow queries (>1s)

---

## 🔧 Using Metrics in Code

### 1. Method Timing with @Timed

```java
import io.micrometer.core.annotation.Timed;

@Service
public class OrderService {
    
    @Timed(value = "order.create", description = "Time taken to create an order")
    public Order createOrder(OrderRequest request) {
        // Business logic
    }
}
```

### 2. Custom Business Metrics

```java
@Service
@RequiredArgsConstructor
public class OrderService {
    
    private final BusinessMetrics metrics;
    
    public Order createOrder(OrderRequest request) {
        long startTime = System.currentTimeMillis();
        
        try {
            Order order = processOrder(request);
            
            // Record success metrics
            metrics.recordOrderCreated();
            metrics.recordOrderProcessingTime(System.currentTimeMillis() - startTime);
            
            return order;
        } catch (Exception e) {
            // Record failure metrics
            log.error("Order creation failed", e);
            throw e;
        }
    }
}
```

### 3. Custom Counters

```java
metrics.recordCounter(
    "business.cart.abandoned", 
    "Number of abandoned carts",
    "userId", userId
);
```

---

## 🔍 Correlation IDs

Every HTTP request automatically gets:
- **Correlation ID** - Tracks request across services
- **Request ID** - Unique ID for this specific request
- **Trace ID & Span ID** - For distributed tracing

### How it Works

1. Client sends request (optional: include `X-Correlation-ID` header)
2. `LoggingFilter` intercepts and adds correlation ID
3. ID is added to MDC (Mapped Diagnostic Context)
4. All logs automatically include the correlation ID
5. Response includes `X-Correlation-ID` header

### Usage

```bash
# Send request with correlation ID
curl -H "X-Correlation-ID: my-unique-id" \
  http://localhost:8080/api/v1/products

# Response will include the same ID
X-Correlation-ID: my-unique-id
```

---

## 🚨 Alerts (Future Enhancement)

Prometheus supports alerting rules. Example:

```yaml
# prometheus-alerts.yml
groups:
  - name: localcart
    rules:
      - alert: HighErrorRate
        expr: rate(http_server_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        annotations:
          summary: "High error rate detected"
          
      - alert: SlowResponse
        expr: histogram_quantile(0.95, http_server_requests_seconds_bucket) > 2
        for: 5m
        annotations:
          summary: "95th percentile response time > 2s"
```

---

## 📖 Best Practices

### 1. **Logging**
- ✅ Use structured logging (JSON)
- ✅ Include correlation IDs for request tracking
- ✅ Log at appropriate levels (ERROR for exceptions, INFO for business events)
- ✅ Avoid logging sensitive data (passwords, tokens, PII)

### 2. **Metrics**
- ✅ Use business metrics for KPIs (orders, payments, signups)
- ✅ Use technical metrics for performance (response times, errors)
- ✅ Add relevant tags for filtering (userId, vendorId, status)
- ✅ Keep metric names consistent (use dots: `business.orders.created`)

### 3. **Performance**
- ✅ Async logging enabled (non-blocking)
- ✅ Log rotation configured (30-day retention)
- ✅ Metrics scraping interval: 15 seconds
- ✅ Use @Timed for critical operations only

---

## 🛠️ Troubleshooting

### Check if Prometheus is scraping metrics

```bash
# Check targets
curl http://localhost:9090/api/v1/targets

# Should show: localcart app at http://host.docker.internal:8080/actuator/prometheus
```

### Check if logs are being shipped to Loki

```bash
# Query Loki directly
curl -G http://localhost:3100/loki/api/v1/query \
  --data-urlencode 'query={job="localcart"}' \
  --data-urlencode 'limit=10'
```

### Verify actuator endpoints

```bash
# List all actuator endpoints
curl http://localhost:8080/actuator

# Check health
curl http://localhost:8080/actuator/health

# Check metrics
curl http://localhost:8080/actuator/metrics

# Get Prometheus metrics
curl http://localhost:8080/actuator/prometheus
```

---

## 📚 Additional Resources

- [Micrometer Documentation](https://micrometer.io/docs)
- [Prometheus Query Language (PromQL)](https://prometheus.io/docs/prometheus/latest/querying/basics/)
- [LogQL (Loki Query Language)](https://grafana.com/docs/loki/latest/logql/)
- [Grafana Dashboards](https://grafana.com/grafana/dashboards/)
- [Spring Boot Actuator](https://docs.spring.io/spring-boot/docs/current/reference/html/actuator.html)

---

## ✅ What's Implemented

- ✅ Prometheus metrics collection
- ✅ Grafana visualization
- ✅ Loki log aggregation  
- ✅ Promtail log shipping
- ✅ Structured JSON logging
- ✅ Correlation ID tracking
- ✅ Custom business metrics
- ✅ Request timing interceptor
- ✅ Distributed tracing setup
- ✅ Log file rotation

## 🔜 Future Enhancements

- ⏳ Grafana dashboard templates
- ⏳ Prometheus alerting rules
- ⏳ AlertManager integration
- ⏳ Jaeger for distributed tracing UI
- ⏳ Custom Grafana plugins
- ⏳ Log-based metrics

---

**🎉 You now have production-grade monitoring and logging!**
