// Takes the README's screenshot: `pnpm screenshot [--no-build] [--light]` (at the repo root).
// Builds the kitchen sink, serves the build, opens its demo page (demo.html) in headless Chromium at 1440×900 and twice
// the pixel density, in the dark theme with motion reduced, and writes docs/screenshot.png at the repo root.
// `pnpm release` runs it, so each release's README shows the release as it looks. --no-build serves the current
// kitchensink/dist as it is; --light takes it in the light theme instead.
// The browser: one already on this machine, never downloaded. CHROME_PATH if set; else the newest Chromium in
// Playwright's cache (~/.cache/ms-playwright, or PLAYWRIGHT_BROWSERS_PATH), whatever Playwright version put it there;
// else Chrome, Chromium or Brave on the PATH.
import { existsSync, mkdirSync, readdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright-core'
import { build, preview } from 'vite'

const args = process.argv.slice(2)
const root = fileURLToPath(new URL('..', import.meta.url))
const out = fileURLToPath(new URL('../../docs/screenshot.png', import.meta.url))
const scheme = args.includes('--light') ? 'light' : 'dark'

if (!args.includes('--no-build')) await build({ root, logLevel: 'warn' })
const server = await preview({ root, logLevel: 'warn', preview: { port: 4180, open: false } })
const url = server.resolvedUrls?.local[0]

/** A Chromium-based browser already on this machine (see the top), or undefined. */
function findBrowser() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH
  const cache =
    process.env.PLAYWRIGHT_BROWSERS_PATH ||
    (process.platform === 'darwin' ? join(homedir(), 'Library/Caches/ms-playwright') : join(homedir(), '.cache/ms-playwright'))
  // Newest revision first, the headless shell before the full browser.
  const cached = existsSync(cache)
    ? readdirSync(cache)
        .map((dir) => dir.match(/^(chromium_headless_shell|chromium)-(\d+)$/))
        .filter((m) => m !== null)
        .sort((a, b) => Number(b[2]) - Number(a[2]) || (a[1] === 'chromium_headless_shell' ? -1 : 1))
        .flatMap(([dir]) =>
          [
            'chrome-headless-shell-linux64/chrome-headless-shell',
            'chrome-linux64/chrome',
            'chrome-linux/headless_shell',
            'chrome-linux/chrome',
            'chrome-headless-shell-mac-arm64/chrome-headless-shell',
            'chrome-headless-shell-mac-x64/chrome-headless-shell',
            'chrome-mac/Chromium.app/Contents/MacOS/Chromium',
          ].map((file) => join(cache, dir, file)),
        )
    : []
  const onPath = ['chromium', 'chromium-browser', 'google-chrome-stable', 'google-chrome', 'brave', 'brave-browser', 'brave-origin-beta'].flatMap(
    (name) => (process.env.PATH ?? '').split(':').map((dir) => join(dir, name)),
  )
  return [...cached, ...onPath].find((file) => existsSync(file))
}

const executablePath = findBrowser()
let browser
try {
  if (!executablePath) throw new Error('no Chrome, Chromium or Brave found')
  browser = await chromium.launch({ executablePath })
} catch (err) {
  await server.close()
  console.error(`screenshot: ${String(err instanceof Error ? err.message : err).split('\n')[0]}`)
  console.error('screenshot: set CHROME_PATH to a Chrome or Chromium binary.')
  process.exit(1)
}

try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    colorScheme: scheme,
    reducedMotion: 'reduce',
  })
  const errors = []
  page.on('pageerror', (err) => errors.push(err.message))
  page.on('console', (msg) => msg.type() === 'error' && errors.push(msg.text()))
  await page.goto(new URL('demo.html', url).href, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(400)
  if (errors.length) throw new Error(`the demo page logged errors:\n  ${errors.join('\n  ')}`)
  mkdirSync(dirname(out), { recursive: true })
  await page.screenshot({ path: out, animations: 'disabled' })
  console.log(`screenshot: ${scheme} theme, written to docs/screenshot.png (with ${executablePath})`)
} finally {
  await browser.close()
  await server.close()
}
