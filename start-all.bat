@echo off
REM LocalCart - Start All Services (Windows Batch)
REM This starts all services using Docker Compose

echo =========================================
echo   LocalCart - Starting All Services
echo =========================================
echo.

echo Starting all Docker services (Backend, Frontend, Database, Redis, Monitoring)...
docker-compose up -d --build

echo.
echo Waiting for services to initialize...
echo This may take 2-3 minutes for first-time build...
timeout /t 30 /nobreak > nul

echo.
echo Checking service status...
docker-compose ps

echo.
echo =========================================
echo   ALL SERVICES STARTED!
echo =========================================
echo.
echo Service URLs:
echo   Frontend:    http://localhost:3000
echo   Backend API: http://localhost:8080
echo   API Docs:    http://localhost:8080/swagger-ui.html
echo   API Health:  http://localhost:8080/actuator/health
echo   Adminer:     http://localhost:8081
echo   Grafana:     http://localhost:3001 (admin/admin)
echo   Prometheus:  http://localhost:9090
echo   Loki:        http://localhost:3100
echo   N8N:         http://localhost:5678 (admin/changeme123)
echo.
echo To view logs:
echo   All services:     docker-compose logs -f
echo   Backend only:     docker-compose logs -f backend
echo   Frontend only:    docker-compose logs -f frontend
echo.
echo To stop all services:
echo   docker-compose down
echo.
echo To restart a specific service:
echo   docker-compose restart backend
echo   docker-compose restart frontend
echo.
pause
