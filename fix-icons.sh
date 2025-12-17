#!/bin/bash

# Fix for "Circle is not defined" error in GuidedBreathing component

echo "🔧 Fixing lucide-react icons issue..."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this from the project root."
    exit 1
fi

# Kill any running dev servers
echo "🛑 Stopping any running dev servers..."
lsof -ti:5173 | xargs kill -9 2>/dev/null || true
sleep 1

# Clear Vite cache
echo "🧹 Clearing Vite cache..."
rm -rf node_modules/.vite
rm -rf .vite

# Reinstall lucide-react specifically
echo "📦 Reinstalling lucide-react..."
npm uninstall lucide-react
npm install lucide-react@latest

# Verify installation
if npm list lucide-react &>/dev/null; then
    echo "✅ lucide-react installed successfully"
    echo ""
    LUCIDE_VERSION=$(npm list lucide-react --depth=0 | grep lucide-react | awk '{print $2}')
    echo "   Version: $LUCIDE_VERSION"
else
    echo "❌ Failed to install lucide-react"
    exit 1
fi

echo ""
echo "🚀 Restarting dev server..."
npm run dev &

echo ""
echo "⏳ Waiting for server to start..."
for i in {1..20}; do
    sleep 0.5
    if curl -s http://mind-brother-production.up.railway.app:5173 > /dev/null 2>&1; then
        echo "✅ Dev server is running!"
        echo ""
        echo "🎉 Fix complete! Try the breathing exercises now."
        echo ""
        echo "   Open: http://mind-brother-production.up.railway.app:5173"
        exit 0
    fi
done

echo "⚠️  Server took longer than expected to start"
echo "   Check the terminal for any errors"








