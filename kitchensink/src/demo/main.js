// The demo page (demo.html): one app-like screen built only from the design system, for the README screenshot
// (`pnpm screenshot`) and to see the parts working together. The kitchen sink (index.html) shows each part on its own.
// oxlint-disable-next-line import/no-unassigned-import -- registers the two typefaces' @font-face rules
import '@xerios/design-system/fonts.js'
// oxlint-disable-next-line import/no-unassigned-import -- the design system's global layer: tokens, base, effects, atoms
import '@xerios/design-system/css/index.css'
import { mount } from 'svelte'
import DemoApp from './DemoApp.svelte'
import { registerAppIcons } from '../icons.js'
import { registerDemoIcons } from './icons.js'

registerAppIcons()
registerDemoIcons()
mount(DemoApp, { target: document.getElementById('app') })
