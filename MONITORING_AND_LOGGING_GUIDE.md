# LocalCart - Monitoring & Logging Guide

## 🌐 All Service URLs & Login Credentials

| Service | URL | Username | Password | Purpose |
|---------|-----|----------|----------|---------|
| **Frontend** | http://localhost:3000 | - | - | User Interface |
| **Backend API** | http://localhost:8080 | - | - | REST API |
| **Adminer** | http://localhost:8081 | `localcart` | `localcart` | Database Manager |
| **Grafana** | http://localhost:3001 | `admin` | `admin` | Dashboards & Logs |
| **Prometheus** | http://localhost:9090 | - | - | Metrics Database |
| **Loki** | http://localhost:3100 | - | - | Log Aggregation |
| **N8N** | http://localhost:5678 | `admin` | `changeme123` | Workflow Automation |

---

## 1️⃣ ADMINER - Database Management

### How to Access:
1. **Open:** http://localhost:8081
2. **Login Form:**
   - **System:** PostgreSQL
   - **Server:** `localcart-postgres` (or `postgres` or `localhost`)
   - **Username:** `localcart`
   - **Password:** `localcart`
   - **Database:** `localcart`

### What You Can Do:
- ✅ View all database tables
- ✅ Browse user registrations
- ✅ Execute SQL queries
- ✅ Check orders, products, etc.

### Quick Checks:
```sql
-- See all registered users
SELECT id, email, first_name, last_name, is_active, created_at 
FROM users 
ORDER BY created_at DESC;

-- Check roles
SELECT * FROM roles;

-- See all products
SELECT * FROM products;
```

---

## 2️⃣ GRAFANA - Dashboards & Log Viewer

### How to Access:
1. **Open:** http://localhost:3001
2. **Login:**
   - **Username:** `admin`
   - **Password:** `admin`
3. **First time:** It may ask you to change password (you can skip)

### View Application Logs (BEST WAY!):

#### Method 1: Explore Logs
1. Click **"Explore"** (compass icon on left sidebar)
2. **Select data source:** Loki (from dropdown at top)
3. **Query logs:**
   - Click "Label filters" button
   - Select: `job` = `localcart-app`
   - Click "Run query"
4. **You'll see all backend logs!**

#### Method 2: Log Query Examples
In the Explore view, use these queries:

```logql
# All application logs
{job="localcart-app"}

# Only ERROR logs
{job="localcart-app"} |= "ERROR"

# Registration attempts
{job="localcart-app"} |= "register"

# Authentication logs
{job="localcart-app"} |= "login" or {job="localcart-app"} |= "authentication"

# Last 5 minutes
{job="localcart-app"} | json | __error__=""
```

#### Method 3: Filter by Log Level
```logql
# Errors only
{job="localcart-app"} | json | level="ERROR"

# Info logs
{job="localcart-app"} | json | level="INFO"

# Warnings
{job="localcart-app"} | json | level="WARN"
```

### View Metrics & Performance:

1. Click **"Dashboards"** (four squares icon)
2. You should see pre-configured dashboards:
   - **LocalCart Application Metrics**
   - **JVM Metrics**
   - **HTTP Request Metrics**

If you don't see dashboards, you can create one:
1. Click "+ Create" → "Dashboard"
2. Add panel
3. Select **Prometheus** as data source
4. Use queries like:
   - `http_server_requests_seconds_count` - Request count
   - `jvm_memory_used_bytes` - Memory usage
   - `system_cpu_usage` - CPU usage

---

## 3️⃣ LOKI - Log Aggregation System

### Direct Access:
**URL:** http://localhost:3100

**Note:** Loki doesn't have a web UI - it's an API. Use Grafana to view logs (Method 2 above)

### Check if Loki is Working:
```powershell
# Check Loki health
curl http://localhost:3100/ready

# Check if logs are being received
curl http://localhost:3100/loki/api/v1/labels
```

### View Raw Logs:
```powershell
# Query logs via API
curl -G -s "http://localhost:3100/loki/api/v1/query_range" --data-urlencode 'query={job="localcart-app"}' | ConvertFrom-Json | Select-Object -ExpandProperty data
```

---

## 4️⃣ PROMETHEUS - Metrics Database

### How to Access:
**Open:** http://localhost:9090

### What You Can See:

#### View Application Metrics:
1. Go to **"Graph"** tab
2. Enter these queries in the search box:

**HTTP Requests:**
```promql
# Total requests per second
rate(http_server_requests_seconds_count[1m])

# Average response time
rate(http_server_requests_seconds_sum[1m]) / rate(http_server_requests_seconds_count[1m])

# Requests by endpoint
http_server_requests_seconds_count{uri="/api/v1/auth/register"}
```

**JVM Metrics:**
```promql
# Memory usage
jvm_memory_used_bytes

# CPU usage
process_cpu_usage

# Thread count
jvm_threads_live
```

**Database Connection Pool:**
```promql
# Active connections
hikaricp_connections_active

# Connection acquisition time
hikaricp_connections_acquire_seconds
```

#### View Targets:
1. Click **"Status"** → **"Targets"**
2. You'll see:
   - **localcart-backend** (should be UP)
   - If DOWN, backend isn't exposing metrics

---

## 5️⃣ N8N - Workflow Automation

### How to Access:
1. **Open:** http://localhost:5678
2. **Login:**
   - **Username:** `admin`
   - **Password:** `changeme123`

### If N8N Doesn't Load:

#### Check N8N Status:
```powershell
# See N8N logs
docker logs localcart-n8n --tail 50

# Check if it's running
docker ps | Select-String "n8n"

# Restart if needed
docker restart localcart-n8n
```

#### Common Issues:

**Issue 1: Container not ready yet**
- N8N takes 10-15 seconds to start
- Wait and refresh the page

**Issue 2: Browser cache**
- Clear cache or try incognito mode
- Try: http://127.0.0.1:5678 instead

**Issue 3: Container crashed**
```powershell
# Check logs for errors
docker logs localcart-n8n

# Restart
docker-compose restart n8n
```

### What You Can Do with N8N:
- Create automated workflows
- Send emails on events
- Integrate with external APIs
- Trigger actions based on orders/registrations

---

## 📊 Quick Monitoring Checklist

### Check Everything is Working:

```powershell
# 1. Test all services
curl http://localhost:3000  # Frontend
curl http://localhost:8080/actuator/health  # Backend
curl http://localhost:8081  # Adminer
curl http://localhost:3001  # Grafana
curl http://localhost:9090  # Prometheus
curl http://localhost:3100/ready  # Loki
curl http://localhost:5678  # N8N

# 2. Check Docker services
docker ps

# 3. View logs from all services
docker-compose logs -f --tail=50
```

---

## 🎯 BEST PRACTICES FOR VIEWING LOGS

### Real-Time Application Logs:

**Option 1: Terminal (Current)**
- The terminal where backend is running shows live logs
- ✅ Best for active debugging
- ✅ See errors immediately

**Option 2: Grafana (Historical)**
1. Open: http://localhost:3001
2. Login: admin/admin
3. Go to Explore → Select Loki
4. Query: `{job="localcart-app"}`
5. ✅ Best for searching past logs
6. ✅ Filter by log level, time range

**Option 3: File System**
```powershell
# View log files
Get-Content "logs/application-startup.log" -Tail 100 -Wait
Get-Content "logs/localcart.json" -Tail 50
```

### Debugging Registration Issues:

**In Grafana (http://localhost:3001):**
1. Go to Explore
2. Select Loki
3. Query: `{job="localcart-app"} |= "register" or {job="localcart-app"} |= "ERROR"`
4. Set time range to "Last 15 minutes"
5. Click "Run query"

**You'll see:**
- Registration requests
- Errors during registration
- Success/failure messages
- Full stack traces

---

## 🚀 Quick Start Monitoring Workflow

### When You Start Development:

**Terminal 1:** Backend with logs
```powershell
.\start-backend.ps1
```

**Browser Tab 1:** Application
```
http://localhost:3000
```

**Browser Tab 2:** Grafana for logs
```
http://localhost:3001
Login: admin/admin
Go to: Explore → Loki → Query: {job="localcart-app"}
```

**Browser Tab 3:** Database (when needed)
```
http://localhost:8081
Login: localcart/localcart
```

**Browser Tab 4:** Metrics (when needed)
```
http://localhost:9090
```

### When Something Goes Wrong:

1. **Check backend terminal** - See immediate error
2. **Check Grafana logs** - Search recent errors
3. **Check Adminer** - Verify database state
4. **Check Prometheus** - See if metrics are being collected

---

## 📝 Common Log Queries in Grafana

```logql
# All errors in last hour
{job="localcart-app"} | json | level="ERROR" 

# Registration attempts
{job="localcart-app"} |~ "(?i)register"

# Authentication events
{job="localcart-app"} |~ "(?i)(login|authentication|jwt)"

# Database errors
{job="localcart-app"} |~ "(?i)(sql|hibernate|database)"

# HTTP requests
{job="localcart-app"} | json | http_method="POST"

# Specific user actions
{job="localcart-app"} |~ "user@example.com"

# Performance issues (slow queries)
{job="localcart-app"} |~ "(?i)(slow|timeout|performance)"
```

---

## 🔧 Troubleshooting Access Issues

### If Services Are Not Accessible:

```powershell
# 1. Check which ports are open
netstat -ano | Select-String ":3001|:8081|:9090|:5678"

# 2. Check Docker containers
docker ps -a

# 3. Restart services
docker-compose restart grafana adminer prometheus loki n8n

# 4. View specific service logs
docker logs localcart-grafana
docker logs localcart-n8n
docker logs localcart-loki
```

### Reset Grafana Password:
```powershell
docker exec -it localcart-grafana grafana-cli admin reset-admin-password admin
```

### Reset N8N:
```powershell
docker-compose down
docker volume rm localcart_n8n_data
docker-compose up -d n8n
```

---

## 📚 Learn More

- **Grafana Docs:** https://grafana.com/docs/
- **Loki Query Language:** https://grafana.com/docs/loki/latest/logql/
- **Prometheus Queries:** https://prometheus.io/docs/prometheus/latest/querying/basics/
- **N8N Workflows:** https://docs.n8n.io/

---

**Now try opening Grafana and viewing your logs!** 🎉
