// Spotlight: point at one element on screen (a setting someone was sent to) with a brief accent flash.
// Styles live in css/effects.css ([data-spotlight]). Nothing is needed on the components involved; call it right after
// opening whatever holds the element:
//
//   openSettings();
//   spotlight('settings-access');
//
// Waits (up to `timeout` ms) for the element with that id to be in the page, or for a collapsed toggle that names it in
// aria-controls (Collapsible's header, which drops its body while closed), so whatever holds it may still be opening or
// loading. It then reveals the element: the toggle is clicked, so the section opens the way a click would, state
// callbacks included, and any closed <details> around it (CollapsibleAdvanced, or a plain one) is opened. Once any
// opening animation has finished it scrolls the element into view and flashes it. Under reduced motion the flash is a
// static tint for the same time. Resolves to the element, or null if it never turned up.

import { tick } from 'svelte'

const DURATION = 1800 // keep in step with the animation in css/effects.css
const SWEEP = 900 // keep in step with spotlight-sweep in css/effects.css

/**
 * The quick shimmer round the element's edge as the flash comes up: a ring laid over it in the top layer (so it shows
 * inside a dialog, and leaves the element's own ::before / ::after alone), swept once by CSS and then removed. It
 * follows the element every frame, since the page may still be scrolling to it.
 * @param {HTMLElement} node
 */
function sweep(node) {
  const ring = document.createElement('span')
  ring.className = 'spotlight-ring'
  ring.setAttribute('aria-hidden', 'true')
  ring.setAttribute('popover', 'manual')
  ring.setAttribute('data-top-layer', '')
  ring.style.borderRadius = getComputedStyle(node).borderRadius
  ;(node.closest('dialog') ?? document.body).append(ring)
  ring.showPopover?.()
  let frameId = 0
  const place = () => {
    const r = node.getBoundingClientRect()
    Object.assign(ring.style, { top: `${r.top}px`, left: `${r.left}px`, width: `${r.width}px`, height: `${r.height}px` })
    frameId = requestAnimationFrame(place)
  }
  place()
  setTimeout(() => {
    cancelAnimationFrame(frameId)
    ring.remove()
  }, SWEEP)
}
const frame = () => new Promise((resolve) => requestAnimationFrame(() => resolve()))
const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

/** Resolves to what `find` returns once it returns something, checking on every DOM change; null after `timeout` ms. */
function waitFor(find, timeout) {
  const found = find()
  if (found) return Promise.resolve(found)
  return new Promise((resolve) => {
    const done = (value) => {
      observer.disconnect()
      clearTimeout(timer)
      resolve(value)
    }
    const observer = new MutationObserver(() => {
      const value = find()
      if (value) done(value)
    })
    observer.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-expanded', 'id'] })
    const timer = setTimeout(() => done(null), timeout)
  })
}

/** @param {string} id @param {{ timeout?: number }} [opts] how long to wait for it to appear (default 5000ms) */
export async function spotlight(id, { timeout = 5000 } = {}) {
  const toggleSelector = `[aria-controls~="${CSS.escape(id)}"][aria-expanded="false"]`
  const found = await waitFor(() => document.getElementById(id) ?? document.querySelector(toggleSelector), timeout)
  if (!(found instanceof HTMLElement)) return null
  let node = found
  if (node.id !== id) {
    node.click()
    await tick()
    node = document.getElementById(id)
    if (!node) return null
  }
  for (let details = node.closest('details:not([open])'); details; details = details.parentElement?.closest('details:not([open])') ?? null) {
    details.open = true
  }

  // Let an opening transition start, then finish, so the scroll lands on the element's full height.
  await frame()
  await Promise.all(node.getAnimations().map((animation) => animation.finished.catch(() => {})))
  node.scrollIntoView({ block: 'nearest', behavior: reduced() ? 'auto' : 'smooth' })

  // Restart the flash if it is already running.
  node.removeAttribute('data-spotlight')
  void node.offsetWidth
  node.setAttribute('data-spotlight', '')
  if (!reduced()) sweep(node)
  const target = node
  setTimeout(() => target.removeAttribute('data-spotlight'), DURATION)
  return node
}
