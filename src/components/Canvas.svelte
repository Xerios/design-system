<script>
  /**
   * A canvas that fills its box and draws with a callback: the backing store follows the box's size at the screen's
   * pixel density, and `draw` paints in CSS pixels. It animates on requestAnimationFrame by default, or draws on demand.
   * For charts, sparklines, generative backgrounds and small visualisations; not a scene graph.
   *
   *   <Canvas class="wave" draw={(ctx, { width, height, time }) => {
   *     ctx.beginPath()
   *     for (let x = 0; x <= width; x += 4) ctx.lineTo(x, height / 2 + Math.sin(x / 40 + time / 400) * height / 4)
   *     ctx.stroke()
   *   }} />
   *
   *   <!-- Static: redrawn when its size or any $state the draw reads changes, and by redraw(). -->
   *   <Canvas animate={false} label="Requests per minute" draw={(ctx, f) => plot(ctx, f, points)} />
   *
   * The box is the component's own element: a block as wide as its container that takes the container's height when that
   * is set, and is 2:1 otherwise. Size it with a class (`height`, `aspect-ratio`). Drawing stops while the box is out of
   * view, the page is hidden, or it has no size, and starts again when it returns.
   *
   * Props:
   *   draw(ctx, frame)  Paints one frame. `frame` holds `width` and `height` (CSS px), `pixelRatio` (device pixels per
   *                     CSS px), `time` (ms of drawing so far, paused time left out), `delta` (ms since the last frame,
   *                     0 on the first and on static draws, capped at 100 so a stall doesn't make a simulation leap),
   *                     `frame` (a count from 0) and `canvas`. For a 2d context the transform is reset to CSS pixels and
   *                     the canvas cleared before each call; for WebGL the viewport is set to the whole canvas.
   *   animate           Redraw every frame (default true). False draws once, then again when the size changes, when any
   *                     $state the draw reads changes, or on redraw(). Reduced motion turns animation into that, drawn at
   *                     the end of `duration` when one is set.
   *   running           False holds the current frame (default true).
   *   duration          Stop animating after this many ms (default Infinity), for an intro that settles. The clock
   *                     starts again when drawing resumes: the box comes back into view, is resized, or running turns on.
   *   fps               Cap on frames per second (default: the display's rate).
   *   pixelRatio        Device pixels per CSS pixel for the backing store (default: the screen's, kept exact as it
   *                     changes). 1 is cheapest; a cap such as Math.min(2, devicePixelRatio) suits heavy fills.
   *   type              '2d' (default), 'webgl' or 'webgl2'. A new canvas is made when it changes.
   *   options           Context attributes, such as { alpha: false }; read when the context is made.
   *   clear             Clear a 2d canvas before each frame (default true); false paints over the last one, for trails.
   *   label             What the drawing shows, for screen readers (role="img"). Without it the canvas is decorative and
   *                     hidden from them. Children are the canvas's fallback content, for a longer text alternative.
   *   canvas, width, height   Bindable, read only: the element and its size in CSS px.
   *
   * Methods, through bind:this: redraw() paints one frame on the next animation frame (for data that isn't $state);
   * restart() sets `time` back to 0 and runs the `duration` clock again.
   *
   * Keyboard: none; it isn't interactive. A consumer that makes it so adds the tabindex, handlers and label.
   */
  import { untrack } from 'svelte'
  import { prefersReducedMotion } from 'svelte/motion'
  import { devicePixelRatio } from 'svelte/reactivity/window'
  import { observeSize, observeVisibility } from '../lib/observe.js'

  /**
   * @typedef {object} Frame
   * @property {number} width
   * @property {number} height
   * @property {number} pixelRatio
   * @property {number} time
   * @property {number} delta
   * @property {number} frame
   * @property {HTMLCanvasElement} canvas
   */
  /** @typedef {CanvasRenderingContext2D | WebGLRenderingContext | WebGL2RenderingContext} Context */
  /**
   * @typedef {object} Props
   * @property {(ctx: any, frame: Frame) => void} draw  ctx is a CanvasRenderingContext2D, or a WebGL(2)RenderingContext by `type`
   * @property {boolean} [animate]
   * @property {boolean} [running]
   * @property {number} [duration]
   * @property {number} [fps]
   * @property {number} [pixelRatio]
   * @property {'2d' | 'webgl' | 'webgl2'} [type]
   * @property {CanvasRenderingContext2DSettings | WebGLContextAttributes} [options]
   * @property {boolean} [clear]
   * @property {string} [label]
   * @property {HTMLCanvasElement} [canvas]
   * @property {number} [width]
   * @property {number} [height]
   * @property {import('svelte').Snippet} [children]
   */
  /** @type {Props & Omit<import('svelte/elements').HTMLAttributes<HTMLDivElement>, keyof Props>} */
  let {
    draw,
    animate = true,
    running = true,
    duration = Infinity,
    fps,
    pixelRatio,
    type = '2d',
    options,
    clear = true,
    label,
    canvas = $bindable(),
    width = $bindable(0),
    height = $bindable(0),
    class: className,
    children,
    ...rest
  } = $props()

  /** @type {Context | null} */
  let ctx = $state.raw(null)
  /** The box's size in device pixels, when the browser reports it (not Safari). */
  let deviceSize = $state.raw(/** @type {[number, number] | null} */ (null))
  let inView = $state(false)
  let pageVisible = $state(true)

  const active = $derived(!!ctx && running && inView && pageVisible && width > 0 && height > 0)
  /** Whether `duration` has run out. Resets, starting the clock again, when drawing resumes or the box is resized. */
  let settled = $derived.by(() => {
    void [width, height, active]
    return false
  })
  const looping = $derived(active && animate && !settled && !prefersReducedMotion.current)

  let time = 0
  let since = 0
  let count = 0
  let last = -1
  let request = 0
  let pending = 0

  /** Sizes the backing store to the box; returns its device pixels per CSS pixel, across and down. @param {HTMLCanvasElement} el */
  function fit(el) {
    const ratio = pixelRatio ?? devicePixelRatio.current ?? 1
    const [w, h] =
      pixelRatio == null && deviceSize ? deviceSize : [Math.max(1, Math.round(width * ratio)), Math.max(1, Math.round(height * ratio))]
    if (el.width !== w || el.height !== h) {
      el.width = w
      el.height = h
    }
    return [w / width, h / height]
  }

  /** @param {number} delta */
  function paint(delta) {
    if (!ctx || !canvas || width <= 0 || height <= 0) return
    const [sx, sy] = fit(canvas)
    if (ctx instanceof CanvasRenderingContext2D) {
      ctx.setTransform(sx, 0, 0, sy, 0, 0)
      if (clear) ctx.clearRect(0, 0, width, height)
    } else {
      ctx.viewport(0, 0, canvas.width, canvas.height)
    }
    draw(ctx, { width, height, pixelRatio: sx, time, delta, frame: count++, canvas })
  }

  /** @param {number} now */
  function tick(now) {
    request = requestAnimationFrame(tick)
    const delta = last < 0 ? 0 : now - last
    // Skip frames that come early for the cap, with a millisecond's grace for the display's jitter.
    if (fps && last >= 0 && delta < 1000 / fps - 1) return
    last = now
    const step = Math.min(delta, 100)
    time += step
    since += step
    paint(step)
    if (since >= duration) settled = true
  }

  // The loop: runs while looping, and restarts its clock each time it resumes.
  $effect(() => {
    if (!looping) return
    last = -1
    since = 0
    request = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(request)
  })

  // A still frame when not looping: tracked, so a resize or a change to any $state the draw reads paints again.
  // Under reduced motion, an animation with a duration shows how it ends rather than how it starts.
  $effect(() => {
    if (!active || looping) return
    if (animate && prefersReducedMotion.current && Number.isFinite(duration)) time = duration
    paint(0)
  })

  export function redraw() {
    if (looping || pending) return
    pending = requestAnimationFrame(() => {
      pending = 0
      if (active) paint(0)
    })
  }

  export function restart() {
    time = 0
    since = 0
    settled = false
  }

  /** Makes the context and watches the box's size and visibility. @param {HTMLCanvasElement} el */
  function setup(el) {
    const own = untrack(() => el.getContext(type, options))
    canvas = el
    ctx = own
    pageVisible = !document.hidden

    const stopSize = observeSize(
      el,
      (entry) => {
        width = entry.contentRect.width
        height = entry.contentRect.height
        const device = entry.devicePixelContentBoxSize?.[0]
        deviceSize = device ? [device.inlineSize, device.blockSize] : null
      },
      { box: 'device-pixel-content-box' },
    )
    const stopView = observeVisibility(el, (entry) => (inView = entry.isIntersecting))

    return () => {
      stopSize()
      stopView()
      cancelAnimationFrame(pending)
      pending = 0
      if (ctx === own) ctx = null
    }
  }
</script>

<svelte:document onvisibilitychange={() => (pageVisible = !document.hidden)} />

<div class={['canvas', className]} {...rest}>
  {#key type}
    <canvas {@attach setup} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : 'true'}>
      {@render children?.()}
    </canvas>
  {/key}
</div>

<style>
  /* The canvas is taken out of flow, so its backing store's size never feeds back into the box's. */
  .canvas {
    position: relative;
    display: block;
    width: 100%;
    height: 100%;
    aspect-ratio: 2 / 1;
    min-width: 0;
  }
  canvas {
    position: absolute;
    inset: 0;
    display: block;
    width: 100%;
    height: 100%;
  }
</style>
