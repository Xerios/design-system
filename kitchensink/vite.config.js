import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'

// The kitchen sink imports the design system by its package name, exactly as an app does, but those imports resolve
// to the library's source (../src) rather than its built dist/, so an edit there shows here at once (hot reload).
const src = fileURLToPath(new URL('../src', import.meta.url))
const page = (/** @type {string} */ file) => fileURLToPath(new URL(file, import.meta.url))
const { name } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))

export default defineConfig({
  // Relative asset URLs, so the build works from any path: the GitHub Pages site lives under /design-system/.
  base: './',
  plugins: [
    svelte(),
    // The pages' titles name the package: %PACKAGE% in the HTML.
    { name: 'package-name', transformIndexHtml: (html) => html.replaceAll('%PACKAGE%', name) },
  ],
  resolve: {
    alias: [
      { find: /^@xerios\/design-system$/, replacement: `${src}/index.js` },
      { find: /^@xerios\/design-system\/(.*)$/, replacement: `${src}/$1` },
    ],
    // One Svelte runtime for the app and the library source it reaches through the alias.
    dedupe: ['svelte'],
  },
  // Two pages: the kitchen sink (index.html) and the demo screen the README's screenshot is taken of (demo.html).
  build: { rolldownOptions: { input: { main: page('index.html'), demo: page('demo.html') } } },
  server: { fs: { allow: ['..'] } },
})
