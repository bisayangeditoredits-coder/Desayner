#!/usr/bin/env pwsh
# Helper script to copy views migration to clipboard for easy Supabase setup

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📋 Views Tracking Migration Setup" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Check if migration file exists
$migrationFile = "views_tracking_migration.sql"
if (-Not (Test-Path $migrationFile)) {
    Write-Host "❌ ERROR: $migrationFile not found in current directory" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Found $migrationFile" -ForegroundColor Green
Write-Host ""

# Copy to clipboard
$content = Get-Content $migrationFile -Raw
$content | Set-Clipboard

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host "✅ Migration SQL copied to clipboard!" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Green
Write-Host ""

Write-Host "📖 NEXT STEPS:" -ForegroundColor Yellow
Write-Host "1. Open Supabase: https://app.supabase.com/" -ForegroundColor White
Write-Host "2. Go to SQL Editor → New Query" -ForegroundColor White
Write-Host "3. Paste the migration (Ctrl+V)" -ForegroundColor White
Write-Host "4. Click RUN button" -ForegroundColor White
Write-Host "5. Wait for success message ✅" -ForegroundColor White
Write-Host ""

Write-Host "⏱️  Migration takes ~10 seconds to complete" -ForegroundColor Cyan
Write-Host ""

Write-Host "📝 What the migration adds:" -ForegroundColor Magenta
Write-Host "  • views_count column to projects table" -ForegroundColor White
Write-Host "  • views_count column to inspirations table" -ForegroundColor White
Write-Host "  • Performance indexes for sorting" -ForegroundColor White
Write-Host "  • Atomic RPC functions for safe increments" -ForegroundColor White
Write-Host ""

Write-Host "✨ After running: Views will show & persist correctly!" -ForegroundColor Green
