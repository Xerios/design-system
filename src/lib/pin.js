// Holding a floating layer where it opened, beside the button it is anchored to (CSS anchor positioning), while the
// page around the button changes: what AnchoredPanel's panels (Popover, FilterBar, FilterChip) use.
//
//   <div style:position-anchor="--my-anchor" {@attach pinToAnchor(button)}>…</div>
//
// A layer placed with position-anchor and position-area follows its button: when the button grows (a value written
// into it), or moves along its row or to the next line (a chip added before it), the layer jumps with it, or flips to
// its other side. pinToAnchor(button) is an attachment that takes those moves back:
// - Once the layer has settled, its side of the button is fixed (position-area set to the one the browser chose,
//   position-try-fallbacks none) and its margins from the button set to the exact distance; when the button moves (or
//   in the few frames after, as the browser may re-place the layer late), they are set again to put it back. Margins,
//   not a transform: they move its layout box, so its edges and text are painted on the very pixels they were.
// - Where the layer isn't placed by position-area (position-area: none, e.g. spanning a narrow window with top:
//   anchor(bottom)), only its distance below or above the button is held.
// - The button's moves are measured in its frame (the nearest scroll container or offset parent around it), so
//   scrolling still carries the layer along with the button. The layer's own changes (another step, a new size) are
//   kept; if one would take it out of the window, it is placed afresh. Nothing is checked while the layer animates (its
//   box is scaled then), and a resize of the window starts it over.
// - It sets --anchor-w on the layer: the button's width as it opened, for a min-width that doesn't follow the button.
// The layer is expected to be position: fixed (in the top layer, say) and to set its own margins only in its stylesheet:
// inline margins, position-area and position-try-fallbacks are the attachment's.

const near = (/** @type {number} */ a, /** @type {number} */ b) => Math.abs(a - b) < 0.01
const PROPS = ['position-area', 'position-try-fallbacks', 'margin-left', 'margin-right', 'margin-top', 'margin-bottom']

/**
 * Attachment: holds an anchor-positioned layer where it opened, beside `anchor`, as the page around the anchor changes.
 * @param {HTMLElement} anchor the button the layer is anchored to
 * @returns {(node: HTMLElement) => () => void}
 */
export const pinToAnchor = (anchor) => (node) => {
  const el = anchor
  /** The button's frame: the nearest scroll container or offset parent around it. */
  const frameOf = () => {
    for (let p = el.parentElement; p; p = p.parentElement) {
      if (p === el.offsetParent || p === document.body) return p
      const { overflowX, overflowY } = getComputedStyle(p)
      if (overflowX !== 'visible' || overflowY !== 'visible') return p
    }
    return document.body
  }
  let around = frameOf()
  /** Where the frame's content starts in the window. */
  const origin = () => {
    const r = around.getBoundingClientRect()
    return { x: r.left - around.scrollLeft, y: r.top - around.scrollTop }
  }
  const box = () => {
    const a = el.getBoundingClientRect()
    const o = origin()
    return { x: a.left - o.x, y: a.top - o.y, w: a.width, h: a.height, o, a }
  }
  let last = box(),
    /** Frames left in which a move of the layer is still the button's doing. */
    settling = 0,
    /** Where the layer is in the frame's content, and its size. @type {{ x: number, y: number, w: number, h: number } | null} */
    held = null,
    pinned = false,
    /** Whether the layer is placed by position-area (else only its distance below or above is held), as it was pinned. */
    byArea = true,
    // Without position-area: the margins set so far, below or above the button.
    mt = 0,
    mb = 0
  node.style.setProperty('--anchor-w', `${last.w}px`)

  const unpin = () => {
    for (const prop of PROPS) node.style.removeProperty(prop)
    pinned = false
    held = null
    settling = mt = mb = 0
  }

  /** Puts the layer at left, top (in the window): its side of the button kept, its margins the distance to it.
   *  @param {DOMRect} p the layer @param {DOMRect} a the button @param {number} left @param {number} top */
  const place = (p, a, left, top) => {
    if (!pinned) byArea = getComputedStyle(node).getPropertyValue('position-area') !== 'none'
    const end = Math.abs(p.right - a.right) < Math.abs(p.left - a.left)
    const above = (p.top + p.bottom) / 2 < (a.top + a.bottom) / 2
    const set = (/** @type {string} */ prop, /** @type {string} */ value) => node.style.setProperty(prop, value)
    if (byArea) {
      set('position-area', `${above ? 'block-start' : 'block-end'} ${end ? 'span-inline-start' : 'span-inline-end'}`)
      set('position-try-fallbacks', 'none')
      set('margin-left', end ? '0px' : `${left - a.left}px`)
      set('margin-right', end ? `${a.right - (left + p.width)}px` : '0px')
      set('margin-top', above ? '0px' : `${top - a.bottom}px`)
      set('margin-bottom', above ? `${a.top - (top + p.height)}px` : '0px')
    } else if (above) set('margin-bottom', `${(mb -= top - p.top)}px`)
    else set('margin-top', `${(mt += top - p.top)}px`)
    pinned = true
  }

  let frame = requestAnimationFrame(function check() {
    frame = requestAnimationFrame(check)
    if (!el.isConnected || node.getAnimations().length) return
    const now = box()
    if (!now.w && !now.h) return // not laid out (hidden): leave it until it is
    const moved = !(near(now.x, last.x) && near(now.y, last.y) && near(now.w, last.w) && near(now.h, last.h))
    last = now
    if (moved) settling = 3
    else if (settling) settling--
    const p = node.getBoundingClientRect()
    const at = { x: p.left - now.o.x, y: p.top - now.o.y, w: p.width, h: p.height }
    const resized = !!held && !(near(at.w, held.w) && near(at.h, held.h))
    // At rest, or the layer's own change (a new size): where it is now is where it stays. Pinned there at once, as it
    // first settles: Chrome paints a box's far edge a pixel apart once its place is set this way, so that happens as it
    // opens rather than when the button first moves.
    if (!held || (!moved && (!settling || resized))) {
      if (pinned && resized && (p.right > innerWidth || p.bottom > innerHeight || p.left < 0 || p.top < 0)) return unpin()
      held = at
      if (!pinned) place(p, now.a, p.left, p.top)
      return
    }
    held = { ...held, w: at.w, h: at.h }
    if (near(at.x, held.x) && near(at.y, held.y)) return
    // Back where it was, in the window now.
    place(p, now.a, held.x + now.o.x, held.y + now.o.y)
  })

  // A resize of the window moves things for a reason of its own (and may change how the layer is placed): start over.
  const follow = () => {
    unpin()
    around = frameOf()
    last = box()
  }
  addEventListener('resize', follow)
  return () => {
    cancelAnimationFrame(frame)
    removeEventListener('resize', follow)
  }
}
