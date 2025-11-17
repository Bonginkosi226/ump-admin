import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/admins': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      },
      '/api/buildings': {
        target: 'https://campus-api-cuut.vercel.app',
        changeOrigin: true,
        secure: true
      },
      '/api/coordinates': {
        target: 'https://campus-api-cuut.vercel.app',
        changeOrigin: true,
        secure: true
      },
      '/api/links': {
        target: 'https://campus-api-cuut.vercel.app',
        changeOrigin: true,
        secure: true
      },
      '/api/upload-image': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      },
      '/api/upload': {
        target: 'https://campus-api-cuut.vercel.app',
        changeOrigin: true,
        secure: true
      },
      '/api/index': {
        target: 'https://campus-api-cuut.vercel.app',
        changeOrigin: true,
        secure: true
      },
      '/api/routes': {
        target: 'https://campus-api-cuut.vercel.app',
        changeOrigin: true,
        secure: true
      },
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      }
    }
  }
});
