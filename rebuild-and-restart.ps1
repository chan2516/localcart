#!/usr/bin/env pwsh
# Rebuild and restart LocalCart Docker stack after code changes.
# Usage examples:
#   .\rebuild-and-restart.ps1
#   .\rebuild-and-restart.ps1 -NoCache
#   .\rebuild-and-restart.ps1 -SkipDown

param(
    [switch]$NoCache,
    [switch]$SkipDown,
    [switch]$SkipHealthChecks,
    [int]$HealthTimeoutSeconds = 180
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Write-Step {
    param([string]$Message)
    Write-Host "`n=== $Message ===" -ForegroundColor Cyan
}

function Write-Ok {
    param([string]$Message)
    Write-Host "[OK] $Message" -ForegroundColor Green
}

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Yellow
}

function Wait-ForContainerReady {
    param(
        [Parameter(Mandatory = $true)][string]$ContainerName,
        [int]$TimeoutSeconds = 180
    )

    $elapsed = 0
    while ($elapsed -lt $TimeoutSeconds) {
        $running = docker inspect -f "{{.State.Running}}" $ContainerName 2>$null
        if ($running -ne 'true') {
            Start-Sleep -Seconds 3
            $elapsed += 3
            continue
        }

        $health = docker inspect -f "{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}" $ContainerName 2>$null
        if ($health -eq 'healthy' -or $health -eq 'none') {
            Write-Ok "$ContainerName is ready (health: $health)"
            return
        }

        Start-Sleep -Seconds 3
        $elapsed += 3
    }

    throw "Timed out waiting for $ContainerName to be ready."
}

# Always run from repository root (script location).
$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $repoRoot

Write-Step "Checking prerequisites"
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw 'Docker is not installed or not on PATH.'
}

docker compose version | Out-Null
Write-Ok 'Docker and Docker Compose are available.'

if (-not $SkipDown) {
    Write-Step "Stopping existing containers"
    docker compose down --remove-orphans
    Write-Ok 'Existing containers stopped.'
} else {
    Write-Info 'SkipDown enabled; keeping currently running containers until rebuild/up.'
}

Write-Step "Building images"
$buildArgs = @('compose', 'build')
if ($NoCache) {
    $buildArgs += '--no-cache'
}
& docker @buildArgs
Write-Ok 'Images built successfully.'

Write-Step "Starting stack"
docker compose up -d
Write-Ok 'Containers started.'

if (-not $SkipHealthChecks) {
    Write-Step "Waiting for key services"
    Wait-ForContainerReady -ContainerName 'localcart-postgres' -TimeoutSeconds $HealthTimeoutSeconds
    Wait-ForContainerReady -ContainerName 'localcart-redis' -TimeoutSeconds $HealthTimeoutSeconds
    Wait-ForContainerReady -ContainerName 'localcart-backend' -TimeoutSeconds $HealthTimeoutSeconds
    Wait-ForContainerReady -ContainerName 'localcart-frontend' -TimeoutSeconds $HealthTimeoutSeconds
}

Write-Step "Done"
Write-Host "Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "Backend:  http://localhost:8080" -ForegroundColor White
Write-Host "Health:   http://localhost:8080/actuator/health" -ForegroundColor White
Write-Host "`nTip: run 'docker compose ps' to verify all services." -ForegroundColor DarkGray
