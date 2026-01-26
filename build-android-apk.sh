#!/bin/bash

# Build Android APK Script
# This script builds the Android APK with all the latest changes

echo "🔨 Building Mind Brother Android APK..."
echo ""

# Step 1: Build web assets
echo "📦 Step 1: Building web assets..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Web build failed!"
    exit 1
fi

# Step 2: Sync with Capacitor
echo ""
echo "🔄 Step 2: Syncing with Capacitor..."
npx cap sync android

if [ $? -ne 0 ]; then
    echo "❌ Capacitor sync failed!"
    exit 1
fi

# Step 3: Build Android APK
echo ""
echo "🤖 Step 3: Building Android APK..."
cd android
./gradlew assembleDebug -x lintVitalAnalyzeRelease

if [ $? -ne 0 ]; then
    echo "❌ Android build failed!"
    exit 1
fi

# Step 4: Copy APK to desktop
echo ""
echo "📱 Step 4: Copying APK to desktop..."
APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
DESKTOP_PATH="$HOME/Desktop/MindBrother.apk"

if [ -f "$APK_PATH" ]; then
    cp "$APK_PATH" "$DESKTOP_PATH"
    echo "✅ APK copied to: $DESKTOP_PATH"
    ls -lh "$DESKTOP_PATH"
else
    echo "❌ APK not found at: $APK_PATH"
    exit 1
fi

echo ""
echo "🎉 Build complete! APK is on your desktop as MindBrother.apk"


