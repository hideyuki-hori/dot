import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@dot/schema': path.resolve(__dirname, '../../packages/schema/src/index.ts'),
      '/works': path.resolve(__dirname, '../../works'),
    },
  },
  server: {
    fs: {
      allow: [path.resolve(__dirname, '../..')],
    },
  },
})
