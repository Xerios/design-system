// oxlint-disable-next-line import/no-unassigned-import -- registers the two typefaces' @font-face rules
import '@xerios/design-system/fonts.js'
// oxlint-disable-next-line import/no-unassigned-import -- the design system's global layer: tokens, base, effects, atoms
import '@xerios/design-system/css/index.css'
import { mount } from 'svelte'
import App from './App.svelte'

mount(App, { target: document.getElementById('app') })
