# deploy-dashboard.ps1 - Deploy fanzzer-dashboard to Cloudflare Pages
param(
    [switch]$Production = $false
)

Write-Host "🔧 Building dashboard..." -ForegroundColor Blue
npm run build

if ($Production) {
    Write-Host "🚀 Deploying to production..." -ForegroundColor Yellow
    npm run deploy:production
} else {
    Write-Host "🚀 Deploying to development..." -ForegroundColor Yellow  
    npm run deploy
}

Write-Host "✅ Dashboard deployed!" -ForegroundColor Green
Write-Host "🌐 Available at: https://fanzzer-dashboard.pages.dev" -ForegroundColor Cyan

# Test dashboard access
Write-Host "🔍 Testing dashboard access..." -ForegroundColor Blue
Start-Sleep -Seconds 5

try {
    $response = Invoke-WebRequest -Uri "https://fanzzer-dashboard.pages.dev" -Method GET -MaximumRedirection 0
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Dashboard accessible!" -ForegroundColor Green
    }
} catch {
    if ($_.Exception.Response.StatusCode -eq 'Found') {
        Write-Host "✅ Dashboard accessible (redirected)!" -ForegroundColor Green
    } else {
        Write-Host "⚠️ Dashboard test failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "🎉 Dashboard deployment complete!" -ForegroundColor Green