# 🔍 Monitoring & Logging Access Guide

## Quick Access URLs

| Service | URL | Purpose |
|---------|-----|---------|
| **Grafana** | http://localhost:3001 | Professional dashboards & log viewer |
| **Prometheus** | http://localhost:9090 | Metrics & monitoring |
| **Loki** | http://localhost:3100 | Log aggregation backend |
| **Adminer** | http://localhost:8081 | Database management |

## 🎯 Grafana - Professional Log Viewing

### Initial Login
- **URL**: http://localhost:3001
- **Username**: `admin`
- **Password**: `admin`

### View Logs (Like Companies Do!)

1. **Go to Explore**
   - Click the compass icon (🧭) in left sidebar
   - Or navigate directly: http://localhost:3001/explore

2. **Select Loki Datasource**
   - Top dropdown: Select "Loki"

3. **Run Your First Query**
   ```logql
   {job="localcart"}
   ```
   - Click "Run query" button
   - Set time range: "Last 1 hour" (top right)

### 📊 Common Log Queries

#### Filter by Log Level
```logql
# Only errors
{job="localcart"} | level="ERROR"

# Errors and warnings
{job="localcart"} | level=~"ERROR|WARN"

# Info logs
{job="localcart"} | level="INFO"
```

#### Search Log Content
```logql
# Find registration attempts
{job="localcart"} |= "registration"

# Find email-related logs
{job="localcart"} |= "email"

# Find exceptions
{job="localcart"} |= "Exception"

# Exclude health checks
{job="localcart"} != "/actuator/health"
```

#### Filter by Logger
```logql
# Controller logs only
{job="localcart"} | logger_name=~".*Controller"

# Service layer logs
{job="localcart"} | logger_name=~".*Service"

# Security logs
{job="localcart"} | logger_name=~".*Security.*"
```

#### Advanced Filtering
```logql
# Errors from UserService
{job="localcart"} | level="ERROR" | logger_name=~".*UserService"

# Registration errors
{job="localcart"} | level="ERROR" |= "registration"

# Errors excluding certain patterns
{job="localcart"} | level="ERROR" != "MailSendException"
```

### 🔢 Log Metrics & Aggregation

```logql
# Count errors per minute
rate({job="localcart"} | level="ERROR" [1m])

# Count logs by level
sum by (level) (count_over_time({job="localcart"} [5m]))

# Error rate
sum(rate({job="localcart"} | level="ERROR" [5m]))

# Top loggers by volume
topk(5, sum by (logger_name) (count_over_time({job="localcart"} [1h])))
```

## 📈 Prometheus - Metrics Monitoring

### Access Prometheus
- **URL**: http://localhost:9090
- No login required

### Essential Queries

#### JVM Memory
```promql
# Memory used
jvm_memory_used_bytes{area="heap"}

# Memory committed
jvm_memory_committed_bytes{area="heap"}

# Memory max
jvm_memory_max_bytes{area="heap"}
```

#### HTTP Request Metrics
```promql
# Total requests
http_server_requests_seconds_count

# Request rate (requests per second)
rate(http_server_requests_seconds_count[5m])

# Average response time
rate(http_server_requests_seconds_sum[5m]) / rate(http_server_requests_seconds_count[5m])

# Requests by endpoint
sum by (uri) (rate(http_server_requests_seconds_count[5m]))

# Error rate (4xx and 5xx)
rate(http_server_requests_seconds_count{status=~"[45].."}[5m])
```

#### System Metrics
```promql
# CPU usage
system_cpu_usage

# Process CPU usage
process_cpu_usage

# Threads
jvm_threads_live_threads

# Garbage collection
rate(jvm_gc_pause_seconds_count[5m])
```

#### Database Connections
```promql
# Active connections
hikaricp_connections_active

# Idle connections  
hikaricp_connections_idle

# Connection pool usage
hikaricp_connections_active / hikaricp_connections_max
```

## 🎨 Creating Professional Dashboards

### In Grafana:

1. **Go to Dashboards** → **"New"** → **"New Dashboard"**

2. **Add Visualization**
   - Click "Add visualization"
   - Select datasource (Loki for logs, Prometheus for metrics)

3. **Example: Error Rate Panel**
   - Datasource: Loki
   - Query: `sum(rate({job="localcart"} | level="ERROR" [5m]))`
   - Panel type: Time series
   - Title: "Error Rate (per minute)"

4. **Example: Response Time Panel**
   - Datasource: Prometheus
   - Query: `rate(http_server_requests_seconds_sum[5m]) / rate(http_server_requests_seconds_count[5m])`
   - Panel type: Gauge
   - Title: "Avg Response Time (seconds)"

5. **Example: Recent Errors**
   - Datasource: Loki
   - Query: `{job="localcart"} | level="ERROR"`
   - Panel type: Logs
   - Title: "Recent Errors"
   - Limit: 50

6. **Save Dashboard**
   - Click disk icon
   - Name: "LocalCart Monitoring"
   - Click "Save"

## 🔔 Setting Up Alerts (Optional)

### Create Alert in Grafana:

1. **Edit a panel** → **"Alert"** tab
2. **Create alert rule**
   - Example: Alert when error rate > 10/minute
   - Query: `sum(rate({job="localcart"} | level="ERROR" [1m]))`
   - Condition: `WHEN last() OF A IS ABOVE 10`

## 🎓 Best Practices

### When Debugging:
1. Start with **Grafana Explore** - easiest to filter and search
2. Use **Prometheus** for performance metrics
3. Use **Adminer** for database state
4. Use `docker logs localcart-backend` for real-time streaming

### For Production Monitoring:
1. Create **dedicated dashboards** for:
   - Application health (errors, response times)
   - Business metrics (registrations, orders)
   - Infrastructure (CPU, memory, DB connections)
2. Set up **alerts** for critical thresholds
3. Use **log levels appropriately**:
   - ERROR: Requires immediate attention
   - WARN: Potential issues
   - INFO: Business events
   - DEBUG: Development only

### Time Ranges:
- **Last 5 minutes**: Real-time debugging
- **Last 1 hour**: Recent issues
- **Last 24 hours**: Daily trends
- **Last 7 days**: Weekly patterns
- **Custom**: For specific incidents

## 🚀 Professional Log Analysis Workflow

### 1. Check Health
```logql
{job="localcart"} |= "ERROR" | logger_name=~".*Health.*"
```

### 2. User Activity
```logql
{job="localcart"} | logger_name=~".*Controller" | level="INFO"
```

### 3. Performance Issues
```promql
histogram_quantile(0.95, rate(http_server_requests_seconds_bucket[5m]))
```

### 4. Database Issues
```logql
{job="localcart"} |= "SQL" | level="ERROR"
```

### 5. Security Events
```logql
{job="localcart"} | logger_name=~".*Security.*|.*Auth.*"
```

## 📱 Quick Commands

```powershell
# View all monitoring containers
docker ps | Select-String "grafana|loki|prometheus|promtail"

# Check Promtail logs (verify it's collecting)
docker logs localcart-promtail --tail 20

# Check Loki health
Invoke-RestMethod -Uri "http://localhost:3100/ready"

# Stream backend logs in terminal
docker logs -f localcart-backend

# View log file size
Get-Item logs\localcart.json | Select-Object Name, @{Name="SizeKB";Expression={[math]::Round($_.Length/1KB,2)}}
```

## 🎯 Your Logs Are Working!

I verified your setup - Loki has received **recent logs** including:
- ✅ Registration attempts
- ✅ Email validation
- ✅ Error tracking
- ✅ Log levels (INFO, WARN, ERROR)

**The logs are there** - you just need to use the right query and time range in Grafana!

---

**Need Help?**
- Logs not showing? Check time range (top right in Grafana)
- Query errors? Make sure you're in "Code" mode, not "Builder"
- No data? Verify: `{job="localcart"}` with time range "Last 1 hour"
