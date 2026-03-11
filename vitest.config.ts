import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['__tests__/**/*.{test,spec}.{js,ts,tsx}'],
    setupFiles: ['./__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      include: [
        'backend/src/**/*.{ts,tsx}',
        'frontend/src/**/*.{ts,tsx}',
      ],
      exclude: [
        'backend/src/**/*.d.ts',
        'frontend/src/**/*.d.ts',
        'node_modules/**',
        '**/dist/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@backend': path.resolve(__dirname, './backend/src'),
      '@frontend': path.resolve(__dirname, './frontend/src'),
      'axios': path.resolve(__dirname, './frontend/node_modules/axios/index.js'),
    },
  },
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify('http://localhost:3000'),
    'import.meta.env.DEV': JSON.stringify(true),
  },
})
