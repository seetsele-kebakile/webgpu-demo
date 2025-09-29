import { defineConfig } from 'vite'

export default defineConfig({
  base: '/webgpu-demo/',  // Must match your repo name
  build: {
    outDir: 'dist',
  }
})