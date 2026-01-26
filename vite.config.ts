import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react()
  ],
  resolve: {
    dedupe: ['react', 'react-dom'], // Ensure single React instance to fix "Invalid hook call"
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: ['react', 'react-dom'], // Force include to ensure single instance
  },
  define: {
    // Fallback for Node.js environment variables in browser
    global: 'globalThis',
  },
  server: {
    port: 5173,
    host: true, // Allow connections from any host
    strictPort: false, // Allow port switching if 5173 is taken
  },
});
