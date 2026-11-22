// New-content glow: a soft metallic glow on a scroll area's bottom or top edge, with ripples spreading out of it, to say
// something new arrived past it (a message below, newer items above). Louder than scrollFade's quiet "there's more", and only for a while.
// Styles live in css/effects.css (.edge-glow). Call it right after adding the content, as spotlight() is called:
//
//   messages.push(message)
//   edgeGlow(list)                                   // glows below for 3s, or until scrolled to the bottom
//   edgeGlow('feed', { side: 'above', announce: '3 new items above' })
//   const stop = edgeGlow(window, { duration: Infinity })   // held until scrolled to the end, or stop()
//
// area: the scroll area: an element, its id, or window (the page). side: 'below' (default) | 'above'.
// duration: how long the ripples keep coming, in ms (default 3000); Infinity keeps them until the edge is reached or
//   stop() is called. The line on the edge lasts as long as they do; the glow on the edge fades well before, after
//   --edge-glow-hold (default 1200ms).
// announce: text for screen readers (the polite live region, lib/announce.js); the glow itself is decorative.
//
// It waits a tick for the new content to be drawn, then does nothing if the area is already at that edge (the new
// content is in view). Otherwise it ends early once the area is scrolled to that edge. Ending, the glow on the edge
// fades (if it hasn't yet), no new ripples start, the rings under way spread out to their end, and the line on the edge
// fades out as they do.
// Calling it again for the same area and side while it shows keeps the one glow, lights the edge again and starts its
// time again. Returns stop(), which ends it that way.
//
// The glow is an overlay in the top layer (inside the open dialog that holds the area, so it shows over it), laid over
// the area's visible box, so the area's own mask (scrollFade) doesn't fade it, and it never adds to the content. Under
// reduced motion there are no ripples: a still glow on the edge comes and goes.

import { tick } from 'svelte'
import { observeSize } from './observe.js'
import { announce as say } from './announce.js'

/** @typedef {'below' | 'above'} Side */
/** How many ripples it lays: they take turns, each a third of a ring's spread after the last (css/effects.css). */
const RINGS = 3

/** Live glows, by area and side, so a second call refreshes the first. @type {WeakMap<HTMLElement | Window, Map<Side, { refresh: () => void, stop: () => void }>>} */
const live = new WeakMap()

const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
/** The longest an ending can take (the edge's fade, 700ms, or a ring's spread, 2400ms, in css/effects.css), with room. */
const ENDING = 3000

/** A node's CSS animations by name. @param {Element} node @param {string} name */
const animations = (node, name, subtree = false) =>
  node.getAnimations({ subtree }).filter((a) => /** @type {CSSAnimation} */ (a).animationName === name)

/** @param {HTMLElement | Window | string} area */
function resolve(area) {
  const el = typeof area === 'string' ? document.getElementById(area) : area
  if (!el) return null
  if (el === document.body || el === document.documentElement || el === document.scrollingElement) return window
  return el
}

/**
 * @param {HTMLElement | Window | string} area
 * @param {{ side?: Side, duration?: number, announce?: string }} [opts]
 * @returns {() => void} stop: fades it out
 */
export function edgeGlow(area, { side = 'below', duration = 3000, announce } = {}) {
  let cancelled = false
  /** @type {() => void} */
  let stopNow = () => {
    cancelled = true
  }
  const stop = () => stopNow()

  tick().then(() => {
    if (cancelled) return
    const scroller = resolve(area)
    if (!scroller) return
    if (announce) say(announce)

    const existing = live.get(scroller)?.get(side)
    if (existing) {
      existing.refresh()
      stopNow = existing.stop
      return
    }
    stopNow = show(scroller, side, duration)
  })
  return stop
}

/**
 * Lays the overlay and keeps it on the area's edge. Returns its stop.
 * @param {HTMLElement | Window} scroller
 * @param {Side} side
 * @param {number} duration
 */
function show(scroller, side, duration) {
  const win = scroller === window
  const box = win ? document.documentElement : /** @type {HTMLElement} */ (scroller)

  /** Whether the area is at the edge the glow is about, so what arrived there is in view. */
  const atEdge = () => {
    const top = win ? window.scrollY : box.scrollTop
    return side === 'below' ? box.scrollHeight - box.clientHeight - top <= 1 : top <= 1
  }
  if (atEdge()) return () => {}

  const el = document.createElement('span')
  el.className = `edge-glow ${side}`
  // The glow on the edge (the bloom is its pseudo-element), which fades first; the ripples and the line on the edge (the
  // overlay's own pseudo-element) outlast it.
  const main = document.createElement('span')
  main.className = 'edge-glow-main'
  const waves = document.createElement('span')
  waves.className = 'edge-glow-waves'
  waves.style.setProperty('--n', String(RINGS))
  for (let i = 0; i < RINGS; i++) {
    const wave = document.createElement('span')
    wave.className = 'edge-glow-wave'
    wave.style.setProperty('--i', String(i))
    waves.append(wave)
  }
  el.append(main, waves)
  el.setAttribute('aria-hidden', 'true')
  el.setAttribute('popover', 'manual')
  el.setAttribute('data-top-layer', '')
  if (!win) {
    // Its reach and hold, if the area sets them (the overlay isn't inside it, so doesn't inherit them), and its corners.
    const cs = getComputedStyle(box)
    for (const prop of ['--edge-glow-size', '--edge-glow-hold']) {
      const value = cs.getPropertyValue(prop).trim()
      if (value) el.style.setProperty(prop, value)
    }
    el.style.borderRadius = cs.borderRadius
  }
  const host = (win ? null : box.closest('dialog[open]')) ?? document.body
  host.append(el)
  el.showPopover?.()

  // The area's visible box, inside its border and clear of its scrollbars.
  const place = () => {
    if (win) {
      Object.assign(el.style, { top: '0px', left: '0px', width: `${box.clientWidth}px`, height: `${window.innerHeight}px` })
      return
    }
    const r = box.getBoundingClientRect()
    Object.assign(el.style, {
      top: `${r.top + box.clientTop}px`,
      left: `${r.left + box.clientLeft}px`,
      width: `${box.clientWidth}px`,
      height: `${box.clientHeight}px`,
    })
  }
  let frame = 0
  const schedule = () => {
    frame ||= requestAnimationFrame(() => {
      frame = 0
      place()
    })
  }
  const scrolled = () => {
    if (atEdge()) leave()
  }
  place()

  // Any scroll can move the area (the page, a panel around it); its own also checks whether the edge was reached.
  document.addEventListener('scroll', schedule, { capture: true, passive: true })
  scroller.addEventListener('scroll', scrolled, { passive: true })
  window.addEventListener('resize', schedule)
  const unsize = win ? () => {} : observeSize(box, schedule)

  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timer
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let fallback
  /** Set while it ends, and changed by a refresh, so an ending it interrupted doesn't remove it. */
  let ending = 0
  /** The edge's fade, its hold, and the ripples, kept from the first ending: a cancelled animation leaves the element's list. */
  /** @type {Animation | undefined} */
  let fade
  let hold = 0
  /** @type {Animation[]} */
  let rings = []
  const arm = () => {
    clearTimeout(timer)
    if (Number.isFinite(duration)) timer = setTimeout(leave, duration)
  }

  function remove() {
    clearTimeout(timer)
    clearTimeout(fallback)
    cancelAnimationFrame(frame)
    document.removeEventListener('scroll', schedule, { capture: true })
    scroller.removeEventListener('scroll', scrolled)
    window.removeEventListener('resize', schedule)
    unsize()
    el.remove()
    const sides = live.get(scroller)
    sides?.delete(side)
    if (sides?.size === 0) live.delete(scroller)
  }
  function leave() {
    if (ending || !el.isConnected) return
    clearTimeout(timer)
    if (!fade) {
      fade = animations(main, 'edge-glow-out')[0]
      hold = Number(fade?.effect?.getTiming().delay) || 0
      rings = animations(el, 'edge-glow-ripple', true)
    }
    // Reduced motion: nothing runs, so there is nothing to finish.
    if (reduced() || (!fade && !rings.length)) return remove()
    const token = (ending = performance.now())

    // The glow on the edge fades from now, if it is still holding.
    const at = Number(fade?.currentTime) || 0
    if (fade && at < hold) fade.effect?.updateTiming({ delay: at })
    // Each ring spreading finishes its spread; the ones still waiting to start don't. The line fades over the time the
    // last one has left, so it goes out with it.
    let left = 0
    for (const ring of rings) {
      const timing = ring.effect?.getComputedTiming()
      if (!timing || timing.currentIteration == null || Number(timing.localTime) < Number(timing.delay)) ring.cancel()
      else {
        ring.effect?.updateTiming({ iterations: timing.currentIteration + 1 })
        const after = ring.effect?.getComputedTiming()
        left = Math.max(left, Number(after?.endTime) - Number(after?.localTime) || 0)
      }
    }
    el.style.setProperty('--edge-glow-line-out', `${Math.max(300, Math.round(left))}ms`)
    el.setAttribute('data-ending', '')
    const end = () => {
      if (ending === token) remove()
    }
    Promise.all([fade, ...rings].map((a) => a?.finished.catch(() => {}))).then(end)
    fallback = setTimeout(end, ENDING)
  }
  /** Lights the edge again and keeps the ripples coming, from the start of its time. */
  function refresh() {
    ending = 0
    clearTimeout(fallback)
    el.removeAttribute('data-ending')
    if (fade) {
      fade.effect?.updateTiming({ delay: hold })
      fade.currentTime = 0
      fade.play()
    }
    for (const ring of rings) {
      ring.effect?.updateTiming({ iterations: Infinity })
      if (ring.playState !== 'running') ring.play()
    }
    arm()
  }

  if (!live.has(scroller)) live.set(scroller, new Map())
  live.get(scroller)?.set(side, { refresh, stop: leave })
  arm()
  return leave
}
