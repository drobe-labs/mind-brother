import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.mindbrother.app',
  appName: 'Mind Brother',
  webDir: 'dist',
  server: {
    // For development: uncomment to use local dev server
    // url: 'http://mind-brother-production.up.railway.app:5173',
    // cleartext: true
    
    // For production: use your production backend URL
    androidScheme: 'https',
    iosScheme: 'https',
  },
  ios: {
    // Scroll behavior
    scrollEnabled: true,
    // Allow WebView to extend behind status bar
    contentInset: 'automatic',
    // Keyboard handling
    allowsLinkPreview: true,
  },
  android: {
    // Enable mixed content for local development
    allowMixedContent: true,
    // WebView settings
    backgroundColor: '#1a1a2e',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1a1a2e',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      // iOS specific
      splashFullScreen: true,
      splashImmersive: true,
    },
    Keyboard: {
      // Resize viewport when keyboard appears
      resize: 'body',
      // iOS keyboard style
      style: 'dark',
    },
  },
};

export default config;
