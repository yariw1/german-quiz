import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `base: './'` makes the built index.html use relative asset URLs, so the
// site works whether it's served from `/` or a subpath like
// `/<repo>/` on GitHub Pages.
export default defineConfig({
  plugins: [react()],
  base: './',
});
