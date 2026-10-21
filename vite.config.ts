import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) }
  },
  server: {
    host: '0.0.0.0',
    port: 32991,
    strictPort: true,
    allowedHosts: ['.preview.with.woa.com', '.devnet-preview.with.woa.com']
  },
  preview: {
    host: '0.0.0.0',
    port: 32991,
    strictPort: true,
    allowedHosts: ['.preview.with.woa.com', '.devnet-preview.with.woa.com']
  },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: {
          echarts: ['echarts/core', 'echarts/charts', 'echarts/components', 'echarts/renderers'],
          vendor: ['vue', 'element-plus']
        }
      }
    }
  }
});
