# iOS Development Setup Guide for Mind Brother

## Prerequisites Checklist

- [ ] macOS Ventura or later
- [ ] At least 35GB free disk space (Xcode is large!)
- [ ] Apple ID (free)
- [ ] Apple Developer Account ($99/year for App Store distribution, free for testing)

---

## Step 1: Install Xcode

### Option A: App Store (Recommended)
1. Open **App Store** on your Mac
2. Search for **"Xcode"**
3. Click **Get** / **Install**
4. Wait for download (~12-15GB)

### Option B: Direct Download
1. Go to https://developer.apple.com/download/
2. Sign in with Apple ID
3. Download Xcode (faster if App Store is slow)

---

## Step 2: Configure Xcode Command Line Tools

After Xcode installs, run these commands in Terminal:

```bash
# Point xcode-select to Xcode (not just command line tools)
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer

# Accept Xcode license
sudo xcodebuild -license accept

# Verify setup
xcode-select -p
# Should show: /Applications/Xcode.app/Contents/Developer
```

---

## Step 3: Install CocoaPods

CocoaPods manages iOS dependencies:

```bash
# Install CocoaPods (may need sudo)
sudo gem install cocoapods

# If gem fails, try Homebrew:
brew install cocoapods

# Verify installation
pod --version
```

---

## Step 4: Open Xcode Once

1. Open Xcode from Applications
2. Let it install additional components (first launch)
3. Sign in with your Apple ID: **Xcode → Settings → Accounts → Add**

---

## Step 5: Sync & Build Mind Brother for iOS

```bash
# Navigate to project
cd "/Users/dennisroberson/Desktop/Mind Brother"

# Build the web app
npm run build

# Sync to iOS
npx cap sync ios

# Open in Xcode
npx cap open ios
```

---

## Step 6: Configure Signing in Xcode

1. In Xcode, select **App** in the navigator (left sidebar)
2. Go to **Signing & Capabilities** tab
3. Check **Automatically manage signing**
4. Select your **Team** (your Apple ID)
5. If bundle ID conflicts, change it: `com.yourname.mindbrother`

---

## Step 7: Run on Simulator

1. Select a simulator from the device dropdown (e.g., "iPhone 15")
2. Click the **Play** button (▶️)
3. App will build and launch in simulator

---

## Step 8: Run on Physical iPhone

### Enable Developer Mode on iPhone (iOS 16+)
1. Connect iPhone via USB cable
2. Trust the computer when prompted
3. On iPhone: **Settings → Privacy & Security → Developer Mode → Enable**
4. Restart iPhone when prompted

### Build to Device
1. Select your iPhone from device dropdown in Xcode
2. Click Play (▶️)
3. First time: Go to iPhone **Settings → General → VPN & Device Management**
4. Trust your developer certificate
5. Run again

---

## Step 9: TestFlight Distribution (Beta Testing)

### Requirements
- Apple Developer Program membership ($99/year)
- App Store Connect access

### Steps
1. In Xcode: **Product → Archive**
2. Click **Distribute App**
3. Select **App Store Connect → Upload**
4. In App Store Connect: **TestFlight → Add testers**
5. Testers receive email invite to install via TestFlight app

---

## Troubleshooting

### "Xcode not found" error
```bash
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
```

### "Unable to install" on device
- Check bundle ID is unique
- Verify signing team is selected
- Make sure Developer Mode is enabled on iPhone

### "Pod install failed"
```bash
cd ios/App
pod deintegrate
pod install
```

### Build errors after update
```bash
cd "/Users/dennisroberson/Desktop/Mind Brother"
rm -rf ios/App/Pods ios/App/Podfile.lock
npx cap sync ios
```

---

## Quick Reference Commands

| Action | Command |
|--------|---------|
| Build web app | `npm run build` |
| Sync to iOS | `npx cap sync ios` |
| Open Xcode | `npx cap open ios` |
| Live reload | `npx cap run ios --livereload` |
| Clean build | `rm -rf ios/App/Pods && npx cap sync ios` |

---

## Current Status

- ❌ Xcode: **Not Installed**
- ❌ CocoaPods: **Not Installed**
- ❌ xcode-select: Points to CommandLineTools (needs Xcode)

**Next step:** Install Xcode from the App Store


