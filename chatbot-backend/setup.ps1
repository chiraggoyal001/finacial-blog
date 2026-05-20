# ============================================================
# Financial Chatbot Backend — One-Click Setup Script
# ============================================================
# Run this in PowerShell from the chatbot-backend directory:
#   .\setup.ps1
# ============================================================

Write-Host ""
Write-Host "======================================" -ForegroundColor Cyan
Write-Host " Financial Chatbot Backend Setup" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# Check Python
$pythonVersion = python --version 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Python not found. Install Python 3.11+ from https://python.org" -ForegroundColor Red
    exit 1
}
Write-Host "Found: $pythonVersion" -ForegroundColor Green

# Check .env file
if (-not (Test-Path ".env")) {
    Write-Host "ERROR: .env file not found. Copy .env.example to .env and fill in your keys." -ForegroundColor Red
    exit 1
}

# Check if credentials are set
$envContent = Get-Content ".env" -Raw
if ($envContent -match "PASTE_YOUR") {
    Write-Host ""
    Write-Host "WARNING: Your .env file still has placeholder values!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "You need to set these in chatbot-backend\.env:" -ForegroundColor Yellow
    Write-Host "  1. GEMINI_API_KEY  -> Get from https://aistudio.google.com/apikey" -ForegroundColor White
    Write-Host "  2. DATABASE_URL    -> Your Supabase DB password in the connection string" -ForegroundColor White
    Write-Host ""
    Write-Host "  Your DB password is in: Supabase Dashboard -> Settings -> Database" -ForegroundColor Gray
    Write-Host "  Your Gemini key is in:  Supabase Dashboard -> Edge Functions -> Secrets -> GEMINI_API_KEY" -ForegroundColor Gray
    Write-Host "  (or create new at https://aistudio.google.com/apikey)" -ForegroundColor Gray
    Write-Host ""
    $proceed = Read-Host "Have you filled in both values? (y/n)"
    if ($proceed -ne "y") {
        Write-Host "Please edit .env first, then re-run this script." -ForegroundColor Yellow
        exit 0
    }
}

# Step 1: Create virtual environment
Write-Host ""
Write-Host "[1/4] Creating virtual environment..." -ForegroundColor Cyan
if (-not (Test-Path "venv")) {
    python -m venv venv
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to create venv" -ForegroundColor Red
        exit 1
    }
}
Write-Host "  Virtual environment ready" -ForegroundColor Green

# Step 2: Activate and install dependencies
Write-Host ""
Write-Host "[2/4] Installing Python dependencies (this may take 2-3 minutes)..." -ForegroundColor Cyan
& .\venv\Scripts\pip.exe install -r requirements.txt 2>&1 | ForEach-Object {
    if ($_ -match "Successfully installed") {
        Write-Host "  $_" -ForegroundColor Green
    } elseif ($_ -match "ERROR") {
        Write-Host "  $_" -ForegroundColor Red
    }
}
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: pip install failed" -ForegroundColor Red
    exit 1
}
Write-Host "  Dependencies installed" -ForegroundColor Green

# Step 3: Ingest articles
Write-Host ""
Write-Host "[3/4] Ingesting blog articles into vector database..." -ForegroundColor Cyan
& .\venv\Scripts\python.exe -m scripts.ingest_articles
if ($LASTEXITCODE -ne 0) {
    Write-Host "  WARNING: Article ingestion had issues (server will still work without RAG data)" -ForegroundColor Yellow
} else {
    Write-Host "  Articles ingested successfully" -ForegroundColor Green
}

# Step 4: Start the server
Write-Host ""
Write-Host "[4/4] Starting the chatbot backend server..." -ForegroundColor Cyan
Write-Host ""
Write-Host "======================================" -ForegroundColor Green
Write-Host " Server starting at:" -ForegroundColor Green
Write-Host "   http://localhost:8000" -ForegroundColor White
Write-Host "   API docs: http://localhost:8000/docs" -ForegroundColor White
Write-Host "   Health:   http://localhost:8000/api/health" -ForegroundColor White
Write-Host "" 
Write-Host " Press Ctrl+C to stop the server" -ForegroundColor Gray
Write-Host "======================================" -ForegroundColor Green
Write-Host ""

& .\venv\Scripts\uvicorn.exe app.main:app --reload --host 0.0.0.0 --port 8000
