<script>
  /**
   * Internal: the floating button that ScrollToTop and ScrollMore are made of. Not exported; use those two.
   *
   * It finds the scroll area it sits in (the nearest ancestor that scrolls, else the window, or `target`), watches its
   * scroll position and size, and floats at that area's bottom edge while `shown(metrics)` says so. In a scroll
   * container it is a zero-height sticky strip, so it has to be the container's last child (or the last child of a
   * block running the whole length of the content); for the window it is portalled to <body> and fixed to the viewport.
   *
   * label: the button's name: its visible text with `showLabel`, else its aria-label and tooltip. icon: an Icon name.
   * showLabel: a pill with the icon and the label, instead of the round icon-only button.
   * align: 'end' (the bottom corner, default) | 'center' (the middle of the bottom edge).
   * target: the scroll area, if it isn't the nearest scrolling ancestor (an element, or window).
   * shown(metrics): whether to show it; metrics is { top, max, page } in px: the scroll offset, its largest value, and
   *   the visible height.
   * go(scroller, metrics, button): what pressing it does.
   * cue: the icon bobs, to draw the eye (stills under reduced motion).
   * keepFocused: stays while it has keyboard focus even when `shown` turns false, so the focus isn't dropped.
   */
  import Icon from '../Icon.svelte'
  import { portal } from '../../lib/dom.js'
  import { tooltip } from '../../lib/tooltip.js'
  import { fly } from '../../lib/motion.js'
  import { observeSize } from '../../lib/observe.js'

  /**
   * @typedef {{ top: number, max: number, page: number }} Metrics
   * @typedef {object} Props
   * @property {string} label
   * @property {string} icon
   * @property {boolean} [showLabel]
   * @property {'end' | 'center'} [align]
   * @property {HTMLElement | Window} [target]
   * @property {(metrics: Metrics) => boolean} shown
   * @property {(scroller: HTMLElement | Window, metrics: Metrics, button: HTMLButtonElement) => void} go
   * @property {boolean} [cue]
   * @property {boolean} [keepFocused]
   */
  /** @type {Props & Omit<import('svelte/elements').HTMLButtonAttributes, keyof Props>} */
  let {
    label,
    icon,
    showLabel = false,
    align = 'end',
    target,
    shown,
    go,
    cue = false,
    keepFocused = false,
    class: className,
    ...rest
  } = $props()

  /** @type {HTMLElement | Window | undefined} */
  let scroller = $state()
  /** @type {Metrics} */
  let metrics = $state({ top: 0, max: 0, page: 0 })
  let focused = $state(false)
  const inWindow = $derived(scroller === window)
  const visible = $derived(!!scroller && (shown(metrics) || (keepFocused && focused)))

  /** The nearest ancestor that scrolls vertically, else the window. */
  function scrollParent(/** @type {HTMLElement} */ node) {
    for (let el = node.parentElement; el && el !== document.body && el !== document.documentElement; el = el.parentElement) {
      if (/auto|scroll|overlay/.test(getComputedStyle(el).overflowY)) return el
    }
    return window
  }

  /**
   * Attachment on the in-place strip: finds the scroll area and keeps `metrics` up to date. Without `target` it looks
   * again a frame after mounting, when the window resizes, and when an ancestor nearer than the one it follows scrolls:
   * styles can arrive after the strip mounts (a hot reload, a lazily loaded sheet), and a layout can hand scrolling to
   * another box at some widths.
   */
  function track(/** @type {HTMLElement} */ node) {
    const given = target
    /** @type {HTMLElement | Window | undefined} */
    let el
    let stop = () => {}
    const resolve = () => {
      let next = given ?? scrollParent(node)
      if (next === document.body || next === document.documentElement || next === document.scrollingElement) next = window
      if (next === el) return
      stop()
      el = next
      scroller = next
      stop = follow(next)
    }
    resolve()
    if (given) return () => stop()

    const again = requestAnimationFrame(resolve)
    /** @param {Event} event */
    const scrolled = (event) => {
      const t = event.target
      if (t instanceof Element && t !== el && t.contains(node) && (el === window || /** @type {HTMLElement} */ (el).contains(t))) resolve()
    }
    document.addEventListener('scroll', scrolled, { capture: true, passive: true })
    window.addEventListener('resize', resolve)
    return () => {
      cancelAnimationFrame(again)
      document.removeEventListener('scroll', scrolled, { capture: true })
      window.removeEventListener('resize', resolve)
      stop()
    }
  }

  /** Follows one scroll area: its offset and size, and its content's size, into `metrics`. Returns the stop. */
  function follow(/** @type {HTMLElement | Window} */ el) {
    const win = el === window
    const box = win ? document.documentElement : /** @type {HTMLElement} */ (el)

    let frame = 0
    const measure = () => {
      frame = 0
      const top = win ? window.scrollY : box.scrollTop
      const page = box.clientHeight
      metrics = { top, max: Math.max(0, box.scrollHeight - page), page }
    }
    const schedule = () => {
      frame ||= requestAnimationFrame(measure)
    }

    // The content can grow without the box resizing, so watch what holds it too (and children added later).
    const content = win ? document.body : box
    /** @type {(() => void)[]} */
    let sized = []
    const watch = () => {
      for (const stop of sized) stop()
      sized = [box, content, ...content.children].map((child) => observeSize(child, schedule))
      schedule()
    }
    const mutations = new MutationObserver(watch)
    mutations.observe(content, { childList: true })
    el.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    watch()
    measure()

    return () => {
      cancelAnimationFrame(frame)
      for (const stop of sized) stop()
      mutations.disconnect()
      el.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }

  /** @param {MouseEvent & { currentTarget: HTMLButtonElement }} event */
  function press(event) {
    if (scroller) go(scroller, metrics, event.currentTarget)
  }
</script>

{#snippet button()}
  <button
    type="button"
    class={['scroll-btn', align, showLabel && 'labelled', cue && 'cue', className]}
    aria-label={showLabel ? undefined : label}
    {@attach tooltip(showLabel ? '' : label)}
    {...rest}
    onclick={press}
    onfocus={(e) => (focused = e.currentTarget.matches(':focus-visible'))}
    onblur={() => (focused = false)}
    transition:fly|global={{ y: 8 }}
  >
    <span class="glyph"><Icon name={icon} size={showLabel ? 'sm' : 'md'} /></span>
    {#if showLabel}<span>{label}</span>{/if}
  </button>
{/snippet}

<div class="scroll-strip" {@attach track}>
  {#if visible && !inWindow}{@render button()}{/if}
</div>
{#if visible && inWindow}
  <div class="scroll-strip fixed" data-floating {@attach portal}>{@render button()}</div>
{/if}

<style>
  /* A zero-height strip along the scroll area's bottom edge, for the button to float from: sticky inside a scroll
     container (so it adds no height to the content), fixed to the viewport for the window. */
  .scroll-strip {
    position: sticky;
    bottom: 0;
    z-index: var(--z-sticky);
    height: 0;
    user-select: none;
  }
  .scroll-strip.fixed {
    position: fixed;
    inset-inline: 0;
  }

  .scroll-btn {
    position: absolute;
    bottom: var(--space-4);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    min-width: 36px;
    min-height: 36px;
    padding: 0;
    border: 1px solid var(--line-float);
    border-radius: var(--r-pill);
    /* Floating, so opaque underneath: the control tint goes over the elevated surface, not over the page. */
    background: var(--elevated);
    box-shadow: var(--shadow);
    color: var(--fg);
    font-size: 13px;
    font-weight: var(--w-medium);
    line-height: 1;
    white-space: nowrap;
    cursor: pointer;
    scale: 1;
    transition: scale var(--dur) var(--ease-out);
  }
  .scroll-btn.end {
    inset-inline-end: var(--space-4);
  }
  .scroll-btn.center {
    left: 50%;
    translate: -50% 0;
  }
  .scroll-btn.labelled {
    padding-inline: var(--space-3) var(--space-4);
  }
  .scroll-btn:hover {
    background: linear-gradient(var(--control-3), var(--control-3)), var(--elevated);
  }
  .scroll-btn:active {
    background: linear-gradient(var(--control-4), var(--control-4)), var(--elevated);
    scale: 0.96;
  }

  .glyph {
    display: inline-grid;
    place-items: center;
    color: var(--muted);
    transition: color var(--dur) var(--ease-out);
  }
  .scroll-btn:hover .glyph {
    color: var(--fg);
  }

  /* The cue: the arrow drifts down and back, the way it asks you to go. Reduced motion stills it (base.css). */
  .cue .glyph {
    animation: scroll-cue 1.6s var(--ease-out) infinite;
  }
  @keyframes scroll-cue {
    0%,
    100% {
      translate: 0 -1px;
    }
    50% {
      translate: 0 3px;
    }
  }
</style>
