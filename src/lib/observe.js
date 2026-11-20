// Shared observers: one ResizeObserver per box model and one IntersectionObserver per set of options, for every element
// that asks, rather than one each. The browser measures every observed element either way; sharing saves the per-
// observer bookkeeping and turns a batch of changes into one callback instead of one per element, which counts once a
// page has a lot of them (a long list of rows, each watching whether its label is cut off).
//
//   {@attach (node) => observeSize(node, (entry) => (cut = node.scrollWidth > node.clientWidth))}
//   const stop = observeVisibility(node, (entry) => (inView = entry.isIntersecting), { rootMargin: '200px' })
//
// Each returns a function that stops observing (return it from an attachment). A callback gets the element's latest
// entry: when one batch holds several for an element, only the last, which is its current state. Like a fresh observer,
// it is called once soon after subscribing, also when the element was already observed for someone else. One callback
// throwing doesn't stop the others; the error is reported.

/**
 * One shared observer and its subscribers.
 * @template {ResizeObserverEntry | IntersectionObserverEntry} E
 * @typedef {{ observer: { observe: (el: Element) => void, unobserve: (el: Element) => void }, subs: Map<Element, Set<(entry: E) => void>>, last: Map<Element, E> }} Shared
 */

/**
 * Calls each element's subscribers with its last entry in the batch.
 * @template {ResizeObserverEntry | IntersectionObserverEntry} E
 * @param {Shared<E>} shared
 * @param {E[]} entries
 */
function deliver(shared, entries) {
  /** @type {Map<Element, E>} */
  const latest = new Map()
  for (const entry of entries) latest.set(entry.target, entry)
  for (const [el, entry] of latest) {
    const subs = shared.subs.get(el)
    if (!subs) continue
    shared.last.set(el, entry)
    for (const callback of [...subs]) {
      try {
        callback(entry)
      } catch (error) {
        reportError(error)
      }
    }
  }
}

/**
 * Adds a subscriber; returns its unsubscribe.
 * @template {ResizeObserverEntry | IntersectionObserverEntry} E
 * @param {Shared<E>} shared
 * @param {Element} el
 * @param {(entry: E) => void} callback
 */
function subscribe(shared, el, callback) {
  let subs = shared.subs.get(el)
  if (subs) {
    // Already observed: the observer won't report it again until it changes, so hand over what it last reported (a
    // report still pending reaches every subscriber when it lands).
    queueMicrotask(() => {
      const entry = shared.last.get(el)
      if (entry && shared.subs.get(el)?.has(callback)) callback(entry)
    })
  } else {
    subs = new Set()
    shared.subs.set(el, subs)
    shared.observer.observe(el)
  }
  subs.add(callback)
  return () => {
    if (!subs.delete(callback) || subs.size) return
    shared.subs.delete(el)
    shared.last.delete(el)
    shared.observer.unobserve(el)
  }
}

/** @type {Map<string, Shared<ResizeObserverEntry>>} */
const sizes = new Map()

/** @param {ResizeObserverBoxOptions} box */
function sizeObserver(box) {
  let shared = sizes.get(box)
  if (!shared) {
    /** @type {Shared<ResizeObserverEntry>} */
    const made = { observer: /** @type {any} */ (null), subs: new Map(), last: new Map() }
    const ro = new ResizeObserver((entries) => deliver(made, entries))
    made.observer = { observe: (el) => ro.observe(el, { box }), unobserve: (el) => ro.unobserve(el) }
    sizes.set(box, (shared = made))
  }
  return shared
}

/** Whether the browser reports device pixels (not Safari): observing with that box throws where it doesn't. */
let devicePixels = /** @type {boolean | undefined} */ (undefined)
function supportsDevicePixels() {
  if (devicePixels === undefined) {
    const probe = new ResizeObserver(() => {})
    try {
      probe.observe(document.documentElement, { box: 'device-pixel-content-box' })
      devicePixels = true
    } catch {
      devicePixels = false
    }
    probe.disconnect()
  }
  return devicePixels
}

/**
 * Calls back when an element's size changes, and once on subscribing.
 * `box` as for ResizeObserver (default 'content-box'); 'device-pixel-content-box' falls back to 'content-box' where the
 * browser doesn't support it, so check `entry.devicePixelContentBoxSize` before using it.
 * @param {Element} el
 * @param {(entry: ResizeObserverEntry) => void} callback
 * @param {{ box?: ResizeObserverBoxOptions }} [options]
 * @returns {() => void} stops observing
 */
export function observeSize(el, callback, { box = 'content-box' } = {}) {
  if (box === 'device-pixel-content-box' && !supportsDevicePixels()) box = 'content-box'
  return subscribe(sizeObserver(box), el, callback)
}

/** @type {Map<string, Shared<IntersectionObserverEntry>>} */
const views = new Map()

/**
 * Calls back when an element enters or leaves the viewport (or crosses a threshold), and once on subscribing.
 * `rootMargin` and `threshold` as for IntersectionObserver; elements with the same options share an observer. The root
 * is always the viewport: for a scroll container as root, make an IntersectionObserver of its own.
 * @param {Element} el
 * @param {(entry: IntersectionObserverEntry) => void} callback
 * @param {{ rootMargin?: string, threshold?: number | number[] }} [options]
 * @returns {() => void} stops observing
 */
export function observeVisibility(el, callback, { rootMargin = '0px', threshold = 0 } = {}) {
  const key = `${rootMargin}|${threshold}`
  let shared = views.get(key)
  if (!shared) {
    /** @type {Shared<IntersectionObserverEntry>} */
    const made = { observer: /** @type {any} */ (null), subs: new Map(), last: new Map() }
    made.observer = new IntersectionObserver((entries) => deliver(made, entries), { rootMargin, threshold })
    views.set(key, (shared = made))
  }
  return subscribe(shared, el, callback)
}
