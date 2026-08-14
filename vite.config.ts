import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// BASE_PATH is '/' once the custom domain (admin.ljwebmanagement.com) is
// live; until then, GitHub Pages serves this as a project page under
// /admin.ljwebmanagement.com/, so asset URLs need that prefix.
export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [react()],
})
