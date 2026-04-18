# LocalCart Deployment Guide (GitHub Student Pack)

## 1. Current Project Status

- Backend build: working
- Frontend build: working
- Docker local stack: working
- Vendor admin flow: aligned to Approve, Reject, Ban
- n8n automation: intentionally disabled for now (`N8N_WEBHOOK_ENABLED=false`)

## 2. What Was Missing For Cloud Deployment

- No production profile file for backend
- CORS was hardcoded to localhost
- No deployment workflow for Azure Container Apps
- Frontend timeout message was tied to localhost

These have been added/fixed in this repo.

## 3. Student Pack Friendly Target Architecture

- Frontend: Azure Container Apps
- Backend: Azure Container Apps
- Database: Azure Database for PostgreSQL Flexible Server
- Cache: Azure Cache for Redis
- CI/CD: GitHub Actions + OIDC login to Azure

## 4. One-Time Azure Setup

Run these from your machine after `az login`.

```bash
az group create --name localcart-rg --location centralindia

az acr create --resource-group localcart-rg --name localcartacr123 --sku Basic

az containerapp env create \
  --name localcart-env \
  --resource-group localcart-rg \
  --location centralindia

az postgres flexible-server create \
  --name localcart-pg-123 \
  --resource-group localcart-rg \
  --location centralindia \
  --admin-user localcartadmin \
  --admin-password "<strong-password>" \
  --sku-name Standard_B1ms \
  --tier Burstable \
  --version 15

az postgres flexible-server db create \
  --resource-group localcart-rg \
  --server-name localcart-pg-123 \
  --database-name localcart

az redis create \
  --name localcart-redis-123 \
  --resource-group localcart-rg \
  --location centralindia \
  --sku Basic \
  --vm-size c0
```

Create container apps once (bootstrap):

```bash
az containerapp create \
  --name localcart-backend \
  --resource-group localcart-rg \
  --environment localcart-env \
  --image mcr.microsoft.com/k8se/quickstart:latest \
  --ingress external \
  --target-port 8080

az containerapp create \
  --name localcart-frontend \
  --resource-group localcart-rg \
  --environment localcart-env \
  --image mcr.microsoft.com/k8se/quickstart:latest \
  --ingress external \
  --target-port 3000
```

## 5. GitHub OIDC + Secrets Setup

### Required repository secrets

- `AZURE_CLIENT_ID`
- `AZURE_TENANT_ID`
- `AZURE_SUBSCRIPTION_ID`
- `AZURE_RESOURCE_GROUP`
- `AZURE_ACR_NAME`
- `AZURE_BACKEND_APP_NAME`
- `AZURE_FRONTEND_APP_NAME`
- `PUBLIC_API_URL`
- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`
- `REDIS_HOST`
- `REDIS_PORT`
- `JWT_SECRET`
- `APP_CORS_ALLOWED_ORIGINS`
- `LOCAL_PUBLIC_BASE_URL`

## 6. Deploy From GitHub Actions

- Open Actions tab
- Run workflow: `deploy-azure-containerapps`
- After success, use workflow output FQDNs for backend and frontend

## 7. Post-Deployment Checks

- Backend health: `https://<backend-fqdn>/actuator/health`
- Frontend: `https://<frontend-fqdn>`
- Admin login and vendor actions
- Product image upload URLs open correctly

## 8. Recommended Next Steps

- Add custom domain + TLS for frontend
- Set `APP_CORS_ALLOWED_ORIGINS` to your real frontend domain only
- Enable n8n later by setting `N8N_WEBHOOK_ENABLED=true` and activating workflows
- Add staging environment with separate resource group
