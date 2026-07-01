import { defineConfig } from 'astro/config';

// Statische site -> perfect voor Cloudflare Pages
export default defineConfig({
  output: 'static',
});
