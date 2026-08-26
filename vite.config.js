import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Bandwidth is the scarce resource on the Firebase Spark plan (360 MB/day of
// hosting transfer), so the build is tuned to ship as few bytes as possible:
// aggressive minification, no sourcemaps in prod, and manual chunks so that a
// return visitor only re-downloads the chunk that actually changed.
export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: { drop_console: true, drop_debugger: true, passes: 2 },
    },
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('firebase') || id.includes('@firebase')) return 'firebase';
          if (id.includes('framer-motion') || id.includes('motion-')) return 'motion';
          if (id.includes('react-router')) return 'router';
          if (id.includes('react-dom') || id.includes('/react/')) return 'react';
          return 'vendor';
        },
      },
    },
  },
});
