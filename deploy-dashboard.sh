#!/bin/bash
# deploy-dashboard.sh - Deploy fanzzer-dashboard to Cloudflare Pages

# Check for production flag
PRODUCTION=false
for arg in "$@"; do
  case $arg in
    --production)
      PRODUCTION=true
      shift
      ;;
  esac
done

echo "🔧 Building dashboard..."
npm run build

if [ "$PRODUCTION" = true ]; then
    echo "🚀 Deploying to production..."
    npm run deploy:production
else
    echo "🚀 Deploying to development..."  
    npm run deploy
fi

echo "✅ Dashboard deployed!"
echo "🌐 Available at: https://fanzzer-dashboard.pages.dev"

# Test dashboard access
echo "🔍 Testing dashboard access..."
sleep 5

if curl -s -o /dev/null -w "%{http_code}" "https://fanzzer-dashboard.pages.dev" | grep -q "200\|301\|302"; then
    echo "✅ Dashboard accessible!"
else
    echo "⚠️ Dashboard test failed"
fi

echo "🎉 Dashboard deployment complete!"