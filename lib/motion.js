// Motion for Svelte, following Google's Material Design 3 motion rules (m3.material.io/styles/motion):
//   - Two easing sets. Standard (the default) is for small, utility-focused moves: controls, menus, tips, panels.
//     Emphasized is for the transitions that should draw the eye, such as a large surface arriving.
//   - Easing by what the element does: it enters (decelerate), exits (accelerate), or begins and ends on screen
//     (standard). The transitions here pick decelerate or accelerate by direction on their own.
//   - Exits are quicker than entrances, and small or near moves are quicker than large or far ones. The defaults follow
//     M3's pairing of curve and duration (see `defaults`); pass a `duration` from `durations` for smaller things.
// Reduced motion comes from svelte/motion's prefersReducedMotion: every duration here drops to 0 under it, which Svelte
// transitions and tweens do not do on their own.
import { prefersReducedMotion, Tween } from 'svelte/motion'
import { fade as svelteFade, fly as svelteFly, slide as svelteSlide, scale as svelteScale } from 'svelte/transition'
import { flip as svelteFlip } from 'svelte/animate'

/** Duration in ms, or 0 when the user asked for reduced motion. */
export const motion = (ms) => (prefersReducedMotion.current ? 0 : ms)

/** M3's duration tokens, in ms. Short for small things (selection controls, tips, chips), medium for things that
 *  cover more of the screen (menus, panels, expanding sections), long and extra long for full-screen moves. */
export const durations = {
  short1: 50,
  short2: 100,
  short3: 150,
  short4: 200,
  medium1: 250,
  medium2: 300,
  medium3: 350,
  medium4: 400,
  long1: 450,
  long2: 500,
  long3: 550,
  long4: 600,
  extraLong1: 700,
  extraLong2: 800,
  extraLong3: 900,
  extraLong4: 1000,
}

// One axis of a cubic Bézier from (0,0) to (1,1) with control points a and b, and its derivative, at t.
const bez = (t, a, b) => ((1 - 3 * b + 3 * a) * t + (3 * b - 6 * a)) * t * t + 3 * a * t
const slope = (t, a, b) => 3 * (1 - 3 * b + 3 * a) * t * t + 2 * (3 * b - 6 * a) * t + 3 * a

/** Cubic Bézier timing function, as in CSS: maps progress 0–1 to eased progress. */
function cubicBezier(x1, y1, x2, y2) {
  return (x) => {
    if (x <= 0) return 0
    if (x >= 1) return 1
    // Newton's method for the t whose x is the input, falling back to bisection where the slope is flat.
    let t = x
    for (let i = 0; i < 8; i++) {
      const d = bez(t, x1, x2) - x,
        s = slope(t, x1, x2)
      if (Math.abs(d) < 1e-6) return bez(t, y1, y2)
      if (Math.abs(s) < 1e-6) break
      t -= d / s
    }
    let lo = 0,
      hi = 1
    t = x
    while (hi - lo > 1e-6) {
      if (bez(t, x1, x2) < x) lo = t
      else hi = t
      t = (lo + hi) / 2
    }
    return bez(t, y1, y2)
  }
}

// M3's emphasized curve is a path, not one Bézier: an accelerating segment to (1/6, 0.4), then a decelerating one to
// (1, 1). Its segments, scaled to fill the unit square, are exactly the emphasized accelerate and decelerate curves.
const SPLIT = 0.166666
const emphasizedHead = cubicBezier(0.3, 0, 0.8, 0.15)
const emphasizedTail = cubicBezier(0.05, 0.7, 0.1, 1)
const emphasizedCurve = (x) => (x < SPLIT ? 0.4 * emphasizedHead(x / SPLIT) : 0.4 + 0.6 * emphasizedTail((x - SPLIT) / (1 - SPLIT)))

/** M3's easing curves as functions, by set and kind. The standard set's decelerate and accelerate are also the CSS
 *  tokens --ease-enter and --ease-exit. */
export const easings = {
  standard: {
    standard: cubicBezier(0.2, 0, 0, 1),
    decelerate: cubicBezier(0, 0, 0, 1),
    accelerate: cubicBezier(0.3, 0, 1, 1),
  },
  emphasized: {
    standard: emphasizedCurve,
    decelerate: cubicBezier(0.05, 0.7, 0.1, 1),
    accelerate: cubicBezier(0.3, 0, 0.8, 0.15),
  },
}

/** M3's default duration for each curve: how long that kind of move usually takes. */
export const defaults = {
  standard: { standard: durations.medium2, decelerate: durations.medium1, accelerate: durations.short4 },
  emphasized: { standard: durations.long2, decelerate: durations.medium4, accelerate: durations.short4 },
}

/**
 * Wraps a Svelte transition so it follows the rules above. Extra params on top of the wrapped transition's own:
 *   emphasized: use the emphasized set (default standard).
 *   duration: ms, both ways (default: M3's duration for the curve, so 250 in and 200 out, or 400 and 200 emphasized).
 *     Use different in:/out: durations to set each.
 *   curve: 'standard' to use the one curve both ways, for something that grows or shrinks in place (default:
 *     decelerate going in, accelerate going out).
 * Returned as a deferred transition, so even a bidirectional `transition:` learns which way it runs each time.
 */
function material(transition, curve = null) {
  return (node, { emphasized = false, duration, curve: kind = curve, ...params } = {}) =>
    ({ direction }) => {
      const set = emphasized ? 'emphasized' : 'standard'
      const k = kind ?? (direction === 'out' ? 'accelerate' : 'decelerate')
      return transition(node, { ...params, duration: motion(duration ?? defaults[set][k]), easing: easings[set][k] })
    }
}

/** Opacity only. `<div transition:fade>` */
export const fade = material(svelteFade)
/** Fades while moving from an offset (`x`, `y`, `opacity` as in svelte/transition). `<div in:fly={{ y: -6 }}>` */
export const fly = material(svelteFly)
/** Opens and closes the height (or `axis: 'x'`). Standard curve by default, since the block grows in place. */
export const slide = material(svelteSlide, 'standard')
/** Fades while scaling from `start` (0–1). Keep scaling to small things such as chips. */
export const scale = material(svelteScale)

/**
 * For a small floating layer (a dropdown list, a menu, a tip, a date panel) opening out of what it belongs to: it fades
 * while growing from `start` (0–1, default 0.97) out of the point nearest `from`, and while moving `distance` px
 * (default 4) away from it. A small, near move, so quicker than the others: 150ms in on the decelerate curve, 100ms out
 * on the accelerate curve (`duration` sets both).
 *   from: the element it opens from, or a point `{ x, y }` in viewport px (where a context menu was opened). Which side
 *     of it the layer is on (below, above, beside) is measured as the transition starts, so a layer that CSS anchor
 *     positioning flipped still comes out of the right side. Without it, the layer grows from its top-left corner.
 *   `<ul transition:pop={{ from: button }}>`
 */
export function pop(node, { from = null, start = 0.97, distance = 4, duration } = {}) {
  return ({ direction }) => {
    const out = direction === 'out'
    let dx = 0,
      dy = 0,
      ox = 0,
      oy = 0
    if (from) {
      const a = from instanceof Element ? from.getBoundingClientRect() : { left: from.x, right: from.x, top: from.y, bottom: from.y }
      const r = node.getBoundingClientRect()
      if (r.top >= a.bottom - 1) dy = -distance
      else if (r.bottom <= a.top + 1) dy = distance
      else if (r.left >= a.right - 1) dx = -distance
      else if (r.right <= a.left + 1) dx = distance
      // The centre of `from`, held inside the layer's box: the point on its edge closest to where it came from.
      ox = Math.min(Math.max((a.left + a.right) / 2 - r.left, 0), r.width)
      oy = Math.min(Math.max((a.top + a.bottom) / 2 - r.top, 0), r.height)
    }
    return {
      duration: motion(duration ?? (out ? durations.short2 : durations.short3)),
      easing: easings.standard[out ? 'accelerate' : 'decelerate'],
      css: (t, u) => `opacity: ${t}; scale: ${start + (1 - start) * t}; translate: ${u * dx}px ${u * dy}px; transform-origin: ${ox}px ${oy}px;`,
    }
  }
}

/** Moves keyed `{#each}` items to their new place on the standard curve. `animate:flip` */
export function flip(node, rect, { emphasized = false, duration } = {}) {
  const set = emphasized ? 'emphasized' : 'standard'
  return svelteFlip(node, rect, { duration: motion(duration ?? defaults[set].standard), easing: easings[set].standard })
}

/**
 * A Tween from svelte/motion on M3's standard curve, for animating a number (or anything Tween can interpolate) that
 * stays on screen, such as a count or a progress value. Jumps straight to the target under reduced motion.
 *   const width = tween(0);        width.target = 40;        style:width="{width.current}%"
 * Options: emphasized, duration (as for the transitions).
 */
export function tween(value, { emphasized = false, duration } = {}) {
  const set = emphasized ? 'emphasized' : 'standard'
  return new Tween(value, { duration: () => motion(duration ?? defaults[set].standard), easing: easings[set].standard })
}
