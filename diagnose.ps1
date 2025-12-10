#!/usr/bin/env pwsh
# Diagnostic Script for Windows PowerShell
# Quick helper to diagnose MCP connection issues

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "🔍 Supabase Coolify MCP Server - Quick Diagnostics" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Check if .env exists
Write-Host "Checking for .env file..." -ForegroundColor Yellow
if (Test-Path .env) {
    Write-Host "✅ .env file found" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "❌ .env file NOT found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Creating .env from env.example..." -ForegroundColor Yellow
    
    if (Test-Path env.example) {
        Copy-Item env.example .env
        Write-Host "✅ Created .env file" -ForegroundColor Green
        Write-Host ""
        Write-Host "⚠️  You need to edit .env and add your actual credentials!" -ForegroundColor Yellow
        Write-Host "   Run: notepad .env" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Press any key to open .env in notepad..."
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
        notepad .env
        Write-Host ""
        Write-Host "After you've filled in your credentials, run this script again." -ForegroundColor Yellow
        Write-Host ""
        exit
    } else {
        Write-Host "❌ env.example not found either!" -ForegroundColor Red
        Write-Host "   Make sure you're in the project directory." -ForegroundColor Yellow
        exit 1
    }
}

# Quick check of .env contents
Write-Host "Checking .env configuration..." -ForegroundColor Yellow
$envContent = Get-Content .env -Raw

$hasPlaceholder = $false
if ($envContent -match "your-coolify-api-token-here" -or 
    $envContent -match "your-supabase-instance.example.com" -or
    $envContent -match "your-supabase-service-role-key") {
    Write-Host "⚠️  Found placeholder values in .env!" -ForegroundColor Yellow
    Write-Host "   You need to replace them with actual credentials." -ForegroundColor Yellow
    $hasPlaceholder = $true
}

# Check for required variables
$requiredVars = @(
    "COOLIFY_API_URL",
    "COOLIFY_API_TOKEN", 
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY"
)

Write-Host ""
Write-Host "Required environment variables:" -ForegroundColor Yellow
foreach ($var in $requiredVars) {
    $pattern = "$var\s*=\s*(.+)"
    if ($envContent -match $pattern) {
        $value = $Matches[1].Trim()
        if ($value -and $value -ne "") {
            $masked = $value.Substring(0, [Math]::Min(10, $value.Length)) + "..."
            Write-Host "  ✅ $var = $masked" -ForegroundColor Green
        } else {
            Write-Host "  ❌ $var is empty!" -ForegroundColor Red
        }
    } else {
        Write-Host "  ❌ $var not found!" -ForegroundColor Red
    }
}

Write-Host ""

if ($hasPlaceholder) {
    Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Yellow
    Write-Host "⚠️  ACTION REQUIRED" -ForegroundColor Yellow
    Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Your .env file has placeholder values. You need to:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Get your Coolify API token:" -ForegroundColor Cyan
    Write-Host "   - Log into Coolify" -ForegroundColor White
    Write-Host "   - Go to: Keys & Tokens → API Tokens" -ForegroundColor White
    Write-Host "   - Create New Token" -ForegroundColor White
    Write-Host ""
    Write-Host "2. Get your Supabase service role key:" -ForegroundColor Cyan
    Write-Host "   - Go to: https://app.supabase.com" -ForegroundColor White
    Write-Host "   - Select your project → Settings → API" -ForegroundColor White
    Write-Host "   - Copy the SERVICE ROLE key (not anon key!)" -ForegroundColor White
    Write-Host ""
    Write-Host "3. Update your .env file with these values" -ForegroundColor Cyan
    Write-Host ""
    
    $response = Read-Host "Open .env in notepad now? (y/n)"
    if ($response -eq "y" -or $response -eq "Y") {
        notepad .env
        Write-Host ""
        Write-Host "After saving your changes, run this script again." -ForegroundColor Yellow
        Write-Host ""
    }
    exit
}

# Check if Node.js and npm are installed
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js $nodeVersion installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found!" -ForegroundColor Red
    Write-Host "   Install Node.js from: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Check if node_modules exists
Write-Host "Checking dependencies..." -ForegroundColor Yellow
if (!(Test-Path node_modules)) {
    Write-Host "⚠️  Dependencies not installed" -ForegroundColor Yellow
    Write-Host "   Installing dependencies..." -ForegroundColor Cyan
    npm install
    Write-Host ""
}

# Run the TypeScript diagnostic tool
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Running full diagnostic suite..." -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

npm run diagnose

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Diagnostics complete!" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "📖 For detailed troubleshooting, see:" -ForegroundColor Yellow
Write-Host "   - DIAGNOSE_NOW.md (quick start)" -ForegroundColor Cyan
Write-Host "   - TROUBLESHOOTING.md (comprehensive guide)" -ForegroundColor Cyan
Write-Host ""

