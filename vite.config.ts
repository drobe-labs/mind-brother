import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import ttsPlugin from './vite-plugin-tts.js';  // ← Add this

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    ttsPlugin()  // ← Add this
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  define: {
    // Fallback for Node.js environment variables in browser
    global: 'globalThis',
  },
  server: {
    port: 5173,
    host: 'localhost', // Use localhost to avoid network issues
    strictPort: false, // Allow port switching if 5173 is taken
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      clientPort: 5173,
    },
    watch: {
      // Reduce file watching overhead
      usePolling: false,
      interval: 100,
    },
  },
});
