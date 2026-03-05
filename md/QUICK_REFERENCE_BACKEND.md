# 🚀 LocalCart Backend - Quick Reference Card

## 📊 Status: ✅ RUNNING & HEALTHY

---

## ⚡ Quick Commands

### Start Application
```bash
./start-backend.sh
```

### View Logs
```bash
tail -f logs/application-startup.log  # Real-time
./analyze-logs.sh                      # Auto-analysis
```

### Test API
```bash
# Browser: http://localhost:8080/swagger-ui.html
# Terminal: curl http://localhost:8080/actuator/health
```

### Stop Application
```bash
Ctrl+C  # If running in foreground
# Or: pkill -f spring-boot:run
```

---

## 🌐 Access Points

| Service | URL | Purpose |
|---------|-----|---------|
| **API** | http://localhost:8080 | Backend API |
| **Swagger** | http://localhost:8080/swagger-ui.html | API Documentation |
| **Health** | http://localhost:8080/actuator/health | Service Health |
| **Database** | localhost:5432 | PostgreSQL |
| **Cache** | localhost:6379 | Redis |

---

## 📁 Important Files

| File | Purpose |
|------|---------|
| **`.env`** | Configuration (database credentials, API keys) |
| **`logs/application-startup.log`** | Full application logs |
| **`logs/localcart.json`** | JSON structured logs |
| **`start-backend.sh`** | Easy startup script |
| **`analyze-logs.sh`** | Auto-analyze logs |

---

## 🔍 Common Log Commands

### Find Errors
```bash
grep ERROR logs/application-startup.log
```

### Find Specific Issue
```bash
grep -i "database" logs/application-startup.log
grep -i "redis" logs/application-startup.log
grep -i "auth" logs/application-startup.log
```

### View with Context
```bash
grep -A 10 ERROR logs/application-startup.log
```

### Count Issues
```bash
grep -c ERROR logs/application-startup.log
```

---

## 🐛 Troubleshooting

### Application Won't Start

1. **Check logs:**
   ```bash
   ./analyze-logs.sh
   ```

2. **Common fixes:**
   - Database issue → `docker-compose restart postgres`
   - Port in use → `lsof -i :8080`
   - Restart → `./start-backend.sh`

### Database Error

**Error:** `password authentication failed`

**Fix:**
```bash
docker-compose down -v
docker-compose --env-file .env up -d postgres
```

### Connection Refused

**Fix:**
```bash
# Check services
docker-compose ps

# Restart if needed
docker-compose restart postgres redis
```

---

## 📈 Health Check

```bash
# Quick check
curl http://localhost:8080/actuator/health

# Full health
curl http://localhost:8080/actuator/health | jq .

# Monitor continuously
watch -n 5 curl -s http://localhost:8080/actuator/health
```

---

## 🧪 Test APIs

### Using Swagger UI (Recommended)
1. Open: http://localhost:8080/swagger-ui.html
2. Browse endpoints
3. Click "Try it out"
4. See responses

### Using curl
```bash
# Get all products
curl http://localhost:8080/api/v1/products | jq .

# Register user
curl -X POST http://localhost:8080/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass123"}'

# Login
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass123"}'
```

---

## 🐳 Docker Commands

```bash
# View running containers
docker-compose ps

# View all containers
docker-compose ps -a

# Stop all
docker-compose down

# Stop and clean (DELETE DATA!)
docker-compose down -v

# Start again
docker-compose --env-file .env up -d

# View logs
docker-compose logs -f postgres
docker-compose logs -f redis
```

---

## 📝 Log Levels

- **ERROR**: Something failed (red/critical)
- **WARN**:  Warning/issue (yellow/caution)
- **INFO**: General info (blue/normal)
- **DEBUG**: Detailed info (gray/deep debugging)

---

## 🔑 Environment Variables

Key variables in `.env`:

```
POSTGRES_USER=localcart_user           # Database user
POSTGRES_PASSWORD=localcart_password   # Database password
DB_HOST=localhost                      # Database host
DB_PORT=5432                          # Database port
DB_NAME=localcart                     # Database name

REDIS_HOST=localhost                  # Cache host
REDIS_PORT=6379                       # Cache port

JWT_SECRET=your-secret-key            # JWT signing key
SPRING_PROFILES_ACTIVE=dev            # Profile (dev/prod)
```

---

## ⚙️ Useful Java Process Commands

```bash
# Find Java process
ps aux | grep spring-boot

# Kill process
kill <PID>

# Kill by name
pkill -f spring-boot:run

# See open ports
lsof -i -P | grep LISTEN
```

---

## 🎯 Development Workflow

1. **Start services:**
   ```bash
   ./start-backend.sh
   ```

2. **Monitor logs:**
   ```bash
   tail -f logs/application-startup.log
   ```

3. **Test API:**
   ```bash
   http://localhost:8080/swagger-ui.html
   ```

4. **Make changes:**
   ```bash
   Edit code in src/
   ```

5. **Restart to reload:**
   ```bash
   Ctrl+C
   ./start-backend.sh
   ```

---

## 📊 50+ API Endpoints Available

**Categories:**
- 8 Authentication endpoints
- 7 Product endpoints
- 6 Cart endpoints
- 4 Order endpoints
- 5 Category endpoints
- 6 Address endpoints
- 8 Payment endpoints
- 7 Vendor endpoints
- 12 Admin endpoints

**All documented in:** http://localhost:8080/swagger-ui.html

---

## ✨ Features Included

✅ User authentication (JWT tokens)  
✅ Product catalog (CRUD)  
✅ Shopping cart  
✅ Orders & payments  
✅ Vendor management  
✅ Role-based access  
✅ Email notifications  
✅ Full API documentation  

---

## 📚 Documentation

- **[LOGGING_GUIDE.md](LOGGING_GUIDE.md)** - Detailed logging guide
- **[BACKEND_ISSUE_RESOLUTION.md](BACKEND_ISSUE_RESOLUTION.md)** - This resolution explained
- **[API_QUICK_REFERENCE.md](API_QUICK_REFERENCE.md)** - All endpoints
- **[COMPLETE_SYSTEM_OVERVIEW.md](COMPLETE_SYSTEM_OVERVIEW.md)** - Architecture

---

## 💡 Pro Tips

✓ **Always check logs first** when something doesn't work  
✓ **Use Swagger UI** for testing instead of curl  
✓ **Keep `.env` private** (don't commit to Git)  
✓ **Monitor health endpoint** during development  
✓ **Use jq** for pretty-printing JSON: `jq .`  

---

## ❓ Quick Help

| Issue | Command |
|-------|---------|
| App won't start | `./analyze-logs.sh` |
| Logs running away | `tail -f logs/application-startup.log` |
| Check health | `curl http://localhost:8080/actuator/health` |
| View errors | `grep ERROR logs/application-startup.log` |
| Reset database | `docker-compose down -v` |
| Port conflict | `lsof -i :8080` |

---

**Everything Working? You're all set! 🎉**

**Next: Start the frontend with `cd frontend && npm run dev`**
