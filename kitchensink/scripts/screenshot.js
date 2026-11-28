// Takes the README's screenshot: `pnpm screenshot [out.png] [--light]` (at the repo root), after
// `pnpm build:kitchensink`. Runs on Bun (1.4.5 or later), whose built-in WebView drives a Chromium over the DevTools
// Protocol, so there is no npm dependency for it. Serves the built kitchen sink (kitchensink/dist), opens its demo page
// (demo.html) at 1440×900 and twice the pixel density, in the dark theme with motion reduced, waits for the web fonts,
// and writes the PNG to out.png (relative to where pnpm was run; kitchensink/dist/screenshot.png by default, beside the
// site, where the Pages workflow publishes it and the README shows it from). Fails, writing nothing, if the page throws,
// logs an error or a file is missing. --light takes it in the light theme instead.
// The browser: one already on this machine, never downloaded, found by Bun: BUN_CHROME_PATH if set, else Chrome or
// Chromium on the PATH (google-chrome-stable, chromium, …) or in the usual install places.
import { resolve } from 'node:path'

const dist = resolve(import.meta.dir, '../dist')
const [arg] = Bun.argv.slice(2).filter((a) => !a.startsWith('--'))
// pnpm runs the script in kitchensink/; INIT_CWD is where it was run from.
const out = arg ? resolve(process.env.INIT_CWD ?? process.cwd(), arg) : `${dist}/screenshot.png`
const scheme = Bun.argv.includes('--light') ? 'light' : 'dark'
const [width, height] = [1440, 900]

if (!(await Bun.file(`${dist}/demo.html`).exists())) throw new Error('no kitchensink/dist/demo.html: run `pnpm build:kitchensink` first')

// Both are disposed (the browser closed, the server stopped) when the script ends, an error included.
// The build uses relative asset URLs (base './' in vite.config.js), so it is served from the root whatever path Pages
// puts it under. The path is used undecoded: the URL parser has already resolved any "..", so it stays inside dist/.
using server = Bun.serve({
  hostname: '127.0.0.1',
  port: 0,
  fetch: (req) => new Response(Bun.file(dist + new URL(req.url).pathname)),
  error: () => new Response('Not found', { status: 404 }), // a missing file
})

// What the page reported going wrong.
const errors = []

using view = new Bun.WebView({
  width,
  height,
  // Chrome on every platform (Bun would use WebKit on macOS, which has no DevTools Protocol for the settings below).
  // Always a fresh browser, never one the user has open. No Chromium sandbox: the page is our own build, and CI
  // runners and containers often can't give Chromium the namespaces its sandbox needs.
  backend: { type: 'chrome', url: false, argv: ['--no-sandbox'] },
  // The page's console.error calls: strings as they are, objects as DevTools describes them (an Error with its stack).
  console: (type, ...args) => {
    if (type === 'error') errors.push(args.map((a) => (typeof a === 'object' && a ? (a.description ?? '').split('\n')[0] : String(a))).join(' '))
  },
})
await view.navigate('about:blank') // cdp() needs one navigation first

// CDP events arrive as DOM events, their params in event.data.
view.addEventListener('Runtime.exceptionThrown', ({ data: { exceptionDetails: d } }) =>
  errors.push(d.exception?.description?.split('\n')[0] ?? d.text),
)
// The browser's own favicon request is not the page's.
view.addEventListener('Network.responseReceived', ({ data: { response } }) => {
  if (response.status >= 400 && !response.url.endsWith('/favicon.ico')) errors.push(`${response.status} ${response.url}`)
})
// Chrome sends a domain's events only once it is enabled. Bun enables Runtime itself, for the console option.
await view.cdp('Network.enable')

await view.cdp('Emulation.setEmulatedMedia', {
  features: [
    { name: 'prefers-color-scheme', value: scheme },
    { name: 'prefers-reduced-motion', value: 'reduce' },
  ],
})
await view.cdp('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 2, mobile: false })

await view.navigate(`${server.url}demo.html`) // resolves on the load event
// The web fonts, then two frames for the layout they cause, then a moment for anything the page does after mounting.
await view.evaluate('document.fonts.ready.then(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))))')
await Bun.sleep(400)
if (errors.length) throw new Error(`the demo page logged errors:\n  ${errors.join('\n  ')}`)

await Bun.write(out, await view.screenshot()) // a PNG; Bun.write makes the folder if need be
console.log(`screenshot: ${scheme} theme, written to ${out}`)
