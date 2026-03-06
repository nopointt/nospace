# Start Harkly CX Platform Demo
# Runs Rust API on :3000 + Next.js on :3001

$RustDir = "$PSScriptRoot/../cx-platform"
$WebDir = $PSScriptRoot

Write-Host "Starting Rust API on http://localhost:3000 ..."
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$RustDir'; cargo run -- serve --port 3000"

Write-Host "Waiting 8 seconds for API to start..."
Start-Sleep -Seconds 8

Write-Host "Starting Next.js on http://localhost:3001 ..."
Write-Host ""
Write-Host "Demo ready at: http://localhost:3001"
Write-Host ""

Set-Location $WebDir
npm run dev
