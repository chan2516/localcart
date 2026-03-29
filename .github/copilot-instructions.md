# Project Guidelines

## Build And Test
- Preferred local startup on Windows: `./start-all-simple.ps1` from repo root.
- Backend run (Windows): `./mvnw.cmd spring-boot:run`
- Backend build (Windows): `./mvnw.cmd clean package -DskipTests`
- Backend run (Linux/macOS): `./mvnw spring-boot:run`
- Backend build (Linux/macOS): `./mvnw clean package -DskipTests`
- Frontend run: `cd frontend && npm install && npm run dev`
- Frontend production build: `cd frontend && npm run build`
- Infra services: use `docker compose ...` (not `docker-compose`) in this repo.
- Infra up/down: `docker compose up -d` and `docker compose down`
- Useful health checks:
  - Backend: `http://localhost:8080/actuator/health`
  - Frontend: `http://localhost:3000`

## Architecture
- Monorepo with Spring Boot backend at `src/main/java/com/localcart` and Next.js frontend at `frontend`.
- Backend layers are organized by responsibility: `config`, `controller`, `service`, `repository`, `entity`, `dto`, `security`, `exception`, `monitoring`.
- Runtime config is in `src/main/resources/application.properties` plus profile-specific files in the same directory.
- Containerized local stack is defined in `docker-compose.yml` (Postgres, Redis, backend, frontend, N8N, Prometheus, Grafana, Loki, Promtail, Adminer).
 
## Conventions
- Treat setup docs as source of truth when README content conflicts.
- Keep backend changes consistent with existing package boundaries under `src/main/java/com/localcart`.
- Prefer small, focused changes over broad refactors unless explicitly requested.
- Do not remove or bypass health checks/dependency ordering in compose services.

## Critical Gotchas
- `.env` at repo root is required for expected local behavior; keep `SPRING_PROFILES_ACTIVE=dev` for local runs.
- Local backend expects Postgres/Redis; ensure `localcart-postgres` and `localcart-redis` are healthy before backend start.
- Backend uses intentional circular-reference allowance (`spring.main.allow-circular-references=true`); do not "fix" this unless asked.
- Structured app logs are written to `logs/localcart.json`; use this file for debugging instead of relying only on console output.
- For backend tests, prefer test profile/H2 setup and keep required test properties aligned with existing test configuration.

## Key Docs (Link, Do Not Duplicate)
- Setup and env: `SETUP_AND_RUNNING_GUIDE.md`
- Quick commands: `md/QUICK_START_COMMANDS.md`
- Run and test flows: `md/TESTING_AND_RUNNING_OVERVIEW.md`
- Backend troubleshooting: `md/BACKEND_DEBUG_GUIDE.md`
- API reference: `md/API_QUICK_REFERENCE.md`
- Architecture and status: `md/COMPLETE_SYSTEM_OVERVIEW.md`, `md/CURRENT_STATUS_SUMMARY.md`
- Automation details: `md/N8N_AUTOMATION_GUIDE.md`