import { fileURLToPath } from 'url'
import path from 'path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import vike from 'vike/plugin'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react(), vike()],
  resolve: {
    alias: {
      '~': path.resolve(__dirname, './src'),
    },
  },
})
