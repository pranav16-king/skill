# ==============================================================================
# DPDP Form Auditor - Master Orchestration Script (PowerShell)
# Starts MongoDB (if installed/available), FastAPI backend, and React Vite frontend.
# ==============================================================================

[CmdletBinding()]
param (
    [switch]$NoBrowser = $false,
    [int]$BackendPort = 8000,
    [int]$FrontendPort = 5173
)

$ErrorActionPreference = "Continue"
$RootPath = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host "                DPDP FORM AUDITOR - STARTUP RUNNER                     " -ForegroundColor Cyan
Write-Host "        Digital Personal Data Protection Act, 2023 Compliance           " -ForegroundColor DarkCyan
Write-Host "========================================================================" -ForegroundColor Cyan
Write-Host "Root Directory: $RootPath" -ForegroundColor Gray

# ------------------------------------------------------------------------------
# 1. MongoDB Service Check / Attempt Start
# ------------------------------------------------------------------------------
Write-Host "`n[1/3] Checking MongoDB Database Service..." -ForegroundColor Yellow
$mongoService = Get-Service -Name "*mongo*" -ErrorAction SilentlyContinue | Select-Object -First 1

if ($mongoService) {
    if ($mongoService.Status -ne "Running") {
        Write-Host "  Starting Windows Service '$($mongoService.Name)'..." -ForegroundColor Gray
        Start-Service -Name $mongoService.Name -ErrorAction SilentlyContinue
    }
}

# Test connection on port 27017
$tcpTest = $false
try {
    $socket = New-Object System.Net.Sockets.TcpClient
    $asyncResult = $socket.BeginConnect("127.0.0.1", 27017, $null, $null)
    $success = $asyncResult.AsyncWaitHandle.WaitOne(1000, $false)
    if ($success -and $socket.Connected) {
        $tcpTest = $true
        $socket.EndConnect($asyncResult)
    }
    $socket.Close()
} catch {
    $tcpTest = $false
}

if ($tcpTest) {
    Write-Host "  MongoDB is ONLINE on localhost:27017 (persistent cluster mode enabled)." -ForegroundColor Green
} else {
    Write-Host "  MongoDB server is offline on localhost:27017." -ForegroundColor Yellow
    Write-Host "  Backend will seamlessly operate with local persistent JSON storage (backend/data/audits.json)." -ForegroundColor Gray
}

# ------------------------------------------------------------------------------
# 2. Launch FastAPI Backend Server (Port 8000)
# ------------------------------------------------------------------------------
Write-Host "`n[2/3] Launching FastAPI Backend on http://localhost:$BackendPort..." -ForegroundColor Yellow
$BackendDir = Join-Path $RootPath "backend"

$backendProcess = Start-Process -FilePath "python" `
    -ArgumentList "-m uvicorn app.main:app --host 0.0.0.0 --port $BackendPort --reload" `
    -WorkingDirectory $BackendDir `
    -PassThru

Write-Host "  Backend Process ID: $($backendProcess.Id)" -ForegroundColor Gray
Write-Host "  API Docs available: http://localhost:$BackendPort/docs" -ForegroundColor Gray

# ------------------------------------------------------------------------------
# 3. Launch React Vite Frontend (Port 5173)
# ------------------------------------------------------------------------------
Write-Host "`n[3/3] Launching React Frontend on http://localhost:$FrontendPort..." -ForegroundColor Yellow
$FrontendDir = Join-Path $RootPath "frontend"

$frontendProcess = Start-Process -FilePath "npx" `
    -ArgumentList "vite --port $FrontendPort --host" `
    -WorkingDirectory $FrontendDir `
    -PassThru

Write-Host "  Frontend Process ID: $($frontendProcess.Id)" -ForegroundColor Gray

# ------------------------------------------------------------------------------
# Dashboard Summary
# ------------------------------------------------------------------------------
Write-Host "`n========================================================================" -ForegroundColor Green
Write-Host "                 SERVICES ARE CONCURRENTLY ACTIVE                       " -ForegroundColor Green
Write-Host "========================================================================" -ForegroundColor Green
Write-Host "  Frontend Web UI    : http://localhost:$FrontendPort" -ForegroundColor Cyan
Write-Host "  Backend FastAPI    : http://localhost:$BackendPort" -ForegroundColor Cyan
Write-Host "  API Documentation  : http://localhost:$BackendPort/docs" -ForegroundColor Cyan
Write-Host "  API Health Status  : http://localhost:$BackendPort/api/health" -ForegroundColor Cyan
Write-Host "========================================================================" -ForegroundColor Green
Write-Host "Press Ctrl+C or close this window to stop all services.`n" -ForegroundColor DarkGray

if (-not $NoBrowser) {
    Start-Sleep -Seconds 2
    Start-Process "http://localhost:$FrontendPort"
}

# Register cleanup on exit
try {
    while ($true) {
        Start-Sleep -Seconds 1
        if ($backendProcess.HasExited -or $frontendProcess.HasExited) {
            Write-Host "`nOne of the service processes has exited. Terminating remaining services..." -ForegroundColor Yellow
            break
        }
    }
} finally {
    Write-Host "`nShutting down backend and frontend processes..." -ForegroundColor DarkYellow
    if ($backendProcess -and -not $backendProcess.HasExited) {
        Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
    }
    if ($frontendProcess -and -not $frontendProcess.HasExited) {
        Stop-Process -Id $frontendProcess.Id -Force -ErrorAction SilentlyContinue
    }
    Write-Host "All processes cleanly stopped." -ForegroundColor Gray
}
