/**
 * Attachment: a small tooltip for a control, on hover and on keyboard focus. Required on every button whose
 * meaning is not spelled out in visible text: icon-only buttons, and terse toggles such as "Live".
 *
 *   <button class="icon-btn" aria-label="Refresh" {@attach tooltip('Refresh')}>…</button>
 *   <button class="icon-btn" aria-label="Search" {@attach tooltip('Search', { shortcut: '/' })}>…</button>
 *   <button … {@attach tooltip('Replace', { detail: file.name })}>…</button>
 *   <button … {@attach tooltip(tip, { press: 'pin' })}>…</button>   (tip: a snippet)
 *
 * content: what the control does, sentence case; or a snippet, for richer content (its children are stacked, and a
 * <strong> first reads as the heading, as with `detail`). No content, no tooltip. shortcut: shown as a key cap after it.
 * detail: a second line under the text, which then turns bold: what the action applies to, in full where the control
 * cuts it short (a long file name). It wraps anywhere, so a name with no spaces still fits.
 * press: what pressing the control does to its tip, for a control whose only job is the tip (InfoTip's ⓘ): 'open' opens
 * it (so a tap on a touch screen shows it), 'pin' pins it open over a dimmed page so its text can be selected, until a
 * press outside it, Escape, scrolling, or pressing the control again (the control gets aria-expanded).
 * placement: 'below' (the default) or 'above' the control; either flips to the other side where there is no room.
 * The tooltip is not the accessible name: keep the aria-label. When the text says more than the name (a snippet always
 * does), it is also announced as the control's description.
 *
 * Every tooltip on the page is the one TooltipLayer (components/TooltipLayer.svelte), mounted on first use and refilled
 * and moved to each control in turn. It opens in the top layer, so it shows above modal dialogs, placed by CSS anchor
 * positioning (css/atoms.css): under the control (or above it, with `placement`), on the other side where there is no room, with an arrow pointing at it. It
 * fades in and goes at once. Leaving the control closes it (unless pinned), as do Escape, a press or a scroll anywhere
 * on the page, and the control's own list opening (a select's). Hovering a control while its list is open never opens it.
 *
 * On a <button> or <a> the browser does the watching: the control gets `interestfor` pointing at the layer, and the
 * layer opens on the browser's interest events (hover, keyboard focus, a long press on a touch screen), so the control
 * carries no listeners of its own. Other elements (a focusable <span>), and browsers without interest invokers, are
 * watched with pointer and focus listeners, where touch never opens it.
 */
import { mount } from 'svelte'
import TooltipLayer from '../components/TooltipLayer.svelte'

/**
 * The mounted layer's exports (see TooltipLayer).
 * @typedef {{ show(entry: object): boolean, hide(entry: object): void, close(entry?: object): void, pin(entry: object): void, track(entry: object): () => void }} Layer
 */
/** @type {Layer | null} */
let layer = null
let count = 0
/** Mounted on the first tooltip attached, not shown: a control pointing at it with `interestfor` needs it in place. */
function theLayer() {
  layer ??= /** @type {any} */ (mount(TooltipLayer, { target: document.body }))
  return /** @type {NonNullable<typeof layer>} */ (layer)
}

/** Whether the browser watches this element's interest itself (interest invokers: buttons and links, in Chromium). */
const watched = (/** @type {HTMLElement} */ node) => 'interestForElement' in node

/**
 * @param {string | import('svelte').Snippet | null | undefined} content
 * @param {{ shortcut?: string | null, detail?: string | null, press?: 'pin' | 'open' | null, placement?: 'below' | 'above' }} [options]
 * @returns {import('svelte/attachments').Attachment<HTMLElement>}
 */
export function tooltip(content, { shortcut = null, detail = null, press = null, placement = 'below' } = {}) {
  return (node) => {
    if (!content) return
    const said = typeof content === 'string' ? (detail ? `${content} ${detail}` : content) : null
    const entry = {
      node,
      content,
      shortcut,
      detail,
      press,
      placement,
      // Its own anchor name, not one shared by all, so a name left behind on a control (a component restoring the
      // anchor names it found) can never draw the tip to it.
      name: `--tooltip-${++count}`,
      describes: said === null || (said !== node.getAttribute('aria-label') && said !== node.textContent?.trim()),
    }
    const tips = theLayer()
    const pressed = () => (press === 'pin' ? tips.pin(entry) : tips.show(entry))
    if (press === 'pin') node.setAttribute('aria-expanded', 'false')
    if (press) node.addEventListener('click', pressed)

    /** @type {() => void} */
    let unwatch
    if (watched(node)) unwatch = tips.track(entry)
    else {
      const enter = (/** @type {PointerEvent} */ event) => event.pointerType !== 'touch' && tips.show(entry)
      const focus = () => node.matches(':focus-visible') && tips.show(entry)
      const leave = () => tips.hide(entry)
      node.addEventListener('pointerenter', enter)
      node.addEventListener('pointerleave', leave)
      node.addEventListener('focus', focus)
      node.addEventListener('blur', leave)
      unwatch = () => {
        node.removeEventListener('pointerenter', enter)
        node.removeEventListener('pointerleave', leave)
        node.removeEventListener('focus', focus)
        node.removeEventListener('blur', leave)
      }
    }
    return () => {
      tips.close(entry)
      unwatch()
      node.removeEventListener('click', pressed)
      if (press === 'pin') node.removeAttribute('aria-expanded')
    }
  }
}
