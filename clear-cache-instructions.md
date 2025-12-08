# Cache Clearing Instructions

## Browser Cache Clearing

### Chrome/Edge:
1. Open DevTools (F12 or Cmd+Option+I on Mac)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"
   OR
4. Go to Settings → Privacy and Security → Clear browsing data
5. Select "Cached images and files"
6. Click "Clear data"

### Firefox:
1. Open DevTools (F12 or Cmd+Option+I on Mac)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"
   OR
4. Go to Settings → Privacy & Security → Clear Data
5. Check "Cached Web Content"
6. Click "Clear"

### Safari:
1. Open DevTools (Cmd+Option+I)
2. Right-click the refresh button
3. Select "Empty Caches"
   OR
4. Go to Safari → Preferences → Advanced
5. Check "Show Develop menu in menu bar"
6. Go to Develop → Empty Caches

## Application Cache Clearing

The FitnessWorkout component now has:
- ✅ Automatic cache clearing on component mount
- ✅ Manual "Clear Cache" button in the setup screen
- ✅ Cache-busting headers on all API requests
- ✅ No-cache fetch options

## Service Worker Cache (if applicable)

If you have a service worker:
1. Open DevTools → Application tab
2. Click "Service Workers" in the left sidebar
3. Click "Unregister" for any registered workers
4. Click "Clear storage" → "Clear site data"

## Hard Refresh Shortcuts

- **Windows/Linux**: Ctrl + Shift + R or Ctrl + F5
- **Mac**: Cmd + Shift + R



