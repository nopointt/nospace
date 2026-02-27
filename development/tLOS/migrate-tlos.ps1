param()
$Source = "C:\Users\noadmin\.tLOS"
$Target = "C:\Users\noadmin\nospace\development\tLOS\core"
$Exclude = @("target", "node_modules", ".temp", "temp")

Write-Host ""
Write-Host "  tLOS Migration" -ForegroundColor Cyan
Write-Host "  $Source  ->  $Target" -ForegroundColor DarkGray
Write-Host ""

if (-not (Test-Path $Source)) {
    Write-Host "  ERROR: Source not found: $Source" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $Target)) {
    New-Item -ItemType Directory -Path $Target -Force | Out-Null
    Write-Host "  created  $Target" -ForegroundColor Green
} else {
    Write-Host "  exists   $Target" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "  Copying files..." -ForegroundColor Cyan
Write-Host ""

$robocopyArgs = @($Source, $Target, "/E", "/COPYALL", "/NP", "/NFL", "/XD") + $Exclude
robocopy @robocopyArgs
$exitCode = $LASTEXITCODE

Write-Host ""

if ($exitCode -le 7) {
    Write-Host "  DONE (robocopy exit: $exitCode)" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Verifying..." -ForegroundColor Cyan

    $checks = @(
        "grid.bat",
        "grid.ps1",
        "kernel\Cargo.toml",
        "shell\frontend\package.json",
        ".git\HEAD"
    )

    $allOk = $true
    foreach ($check in $checks) {
        $path = Join-Path $Target $check
        if (Test-Path $path) {
            Write-Host "  ok    $check" -ForegroundColor Green
        } else {
            Write-Host "  MISS  $check" -ForegroundColor Red
            $allOk = $false
        }
    }

    Write-Host ""
    if ($allOk) {
        Write-Host "  All checks passed." -ForegroundColor Green
        Write-Host "  Next: cd $Target && grid.bat run" -ForegroundColor Cyan
    } else {
        Write-Host "  Some files missing - check manually before deleting source." -ForegroundColor Yellow
    }
} else {
    Write-Host "  ERROR robocopy exit code: $exitCode" -ForegroundColor Red
    Write-Host "  Source preserved, nothing deleted." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
