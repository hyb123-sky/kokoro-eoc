import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@stores': path.resolve(__dirname, './src/stores'),
      '@services': path.resolve(__dirname, './src/services'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@types': path.resolve(__dirname, './src/types'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api/servicenow': {
        target: 'https://your-instance.service-now.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/servicenow/, '/api'),
        headers: {
          'Authorization': 'Basic YOUR_BASE64_CREDENTIALS'
        }
      }
    }
  }
})
