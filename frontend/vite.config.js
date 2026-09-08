import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    minify: false, // Outputs human-readable, unminified JavaScript code
    sourcemap: true, // Includes source maps mapping directly back to original JSX source files
  },
})
