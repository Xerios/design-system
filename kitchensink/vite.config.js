import { fileURLToPath } from 'node:url'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'

// The kitchen sink imports the design system by its package name, exactly as an app does, but those imports resolve
// to the library's source (../src) rather than its built dist/, so an edit there shows here at once (hot reload).
const src = fileURLToPath(new URL('../src', import.meta.url))

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: [
      { find: /^@xerios\/design-system$/, replacement: `${src}/index.js` },
      { find: /^@xerios\/design-system\/(.*)$/, replacement: `${src}/$1` },
    ],
    // One Svelte runtime for the app and the library source it reaches through the alias.
    dedupe: ['svelte'],
  },
  server: { fs: { allow: ['..'] } },
})
