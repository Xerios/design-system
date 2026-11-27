<script>
  /**
   * Internal: the floating panel a button opens (Popover's, a filter's value editor, the filter bar's field list). It
   * sits in the top layer (above modal dialogs and a Popover's scrim), anchored to its button with CSS anchor positioning
   * (it names the button's anchor itself), flipping above or to the other side where there is no room; under 860px it
   * spans the window between the gutters instead. It grows out of the button and fades as it closes, and once open it
   * stays put while the page around it changes: the button growing (a value written into it), moving along its row or
   * onto the next line (a chip added before it; pinToAnchor in lib/pin.js). Scrolling still carries it along with the
   * button. Render it while open.
   *
   *   <AnchoredPanel anchor={button} label="Filters" onclose={(refocus) => …}>…</AnchoredPanel>
   *
   * anchor: the button it belongs to. label: the panel's accessible name. align: which edge of the button it lines up
   * with ('start', the default, or 'end'). placement: 'below' (default) or 'above'. width: a fixed width in px; without
   * it the panel fits its content (240px to 480px, at least as wide as the button was as it opened).
   * onclose(refocus): asked to close: Esc (refocus true), a press outside it and its button (false, see pressedOutside),
   * Tab or Shift+Tab past its last or first control (true, so the Tab carries on from the button).
   * As it opens, the focus goes to its [data-autofocus] control, else its first, unless the content took it (OptionList
   * does). Other attributes (id, class…) and attachments go to the panel.
   */
  import { topLayer, pressedOutside } from '../lib/dom.js'
  import { pop } from '../lib/motion.js'
  import { pinToAnchor } from '../lib/pin.js'

  /**
   * @typedef {object} Props
   * @property {HTMLElement} anchor
   * @property {string} label
   * @property {(refocus: boolean) => void} onclose
   * @property {'start' | 'end'} [align]
   * @property {'below' | 'above'} [placement]
   * @property {number} [width]
   * @property {import('svelte').Snippet} children
   */
  /** @type {Props & Omit<import('svelte/elements').HTMLAttributes<HTMLDivElement>, keyof Props>} */
  let { anchor, label, onclose, align = 'start', placement = 'below', width, children, class: className, ...rest } = $props()
  /** @type {HTMLDivElement | undefined} */
  let panel = $state()

  const uid = $props.id()
  const name = `--panel-${uid}`
  const focusable = 'input:not(:disabled), textarea:not(:disabled), select:not(:disabled), button:not(:disabled), [href], [tabindex]:not([tabindex="-1"])'

  /** Attachment: adds the panel's anchor name to the button's, keeping any it already has. */
  const named = () => {
    const el = anchor
    const before = el.style.getPropertyValue('anchor-name')
    el.style.setProperty('anchor-name', before ? `${before}, ${name}` : name)
    return () => el.style.setProperty('anchor-name', before)
  }

  /**
   * Attachment: a frame after it opens (its content in, the panel laid out and placed), puts the focus on its first
   * control unless the content took it itself.
   */
  const settle = (/** @type {HTMLElement} */ node) => {
    const frame = requestAnimationFrame(() => {
      if (node.contains(document.activeElement)) return
      /** @type {HTMLElement} */
      const first = node.querySelector('[data-autofocus]') ?? node.querySelector(focusable) ?? node
      first.focus({ preventScroll: true })
    })
    return () => cancelAnimationFrame(frame)
  }

  /** @param {KeyboardEvent} e */
  function onkeydown(e) {
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      onclose(true)
    } else if (e.key === 'Tab' && panel) {
      const stops = /** @type {HTMLElement[]} */ ([...panel.querySelectorAll(focusable)]).filter(
        (el) => el.tabIndex >= 0 && (el.checkVisibility?.() ?? true),
      )
      const at = stops.indexOf(/** @type {HTMLElement} */ (document.activeElement))
      // Past either end: back on the button first, so the browser's Tab moves on from there (the panel sits at the end of
      // <body>, where a Tab would otherwise go next). Shift+Tab stops on the button itself.
      if (e.shiftKey ? at <= 0 : at < 0 || at === stops.length - 1) {
        if (e.shiftKey) e.preventDefault()
        onclose(true)
      }
    }
  }
</script>

<svelte:document onpointerdowncapture={(e) => pressedOutside(e, [panel, anchor]) && onclose(false)} />

<div
  bind:this={panel}
  class={['anchored-panel', className]}
  role="dialog"
  aria-label={label}
  tabindex="-1"
  data-floating
  {...rest}
  class:end={align === 'end'}
  class:above={placement === 'above'}
  class:fixed={width != null}
  style:position-anchor={name}
  style:--w={width != null ? `${width}px` : undefined}
  {@attach named}
  {@attach topLayer(anchor)}
  {@attach settle}
  {@attach pinToAnchor(anchor)}
  transition:pop={{ from: anchor }}
  {onkeydown}
>
  {@render children()}
</div>

<style>
  /* On a layer of its own for good (will-change), not only while it grows in or fades out: drawn on one, content at a
     fraction of a device pixel (below a 1px rule at 150% zoom, say) is drawn there, but drawn with the page it is
     rounded to a whole one, so it moved a pixel as the animation started or ended. */
  .anchored-panel {
    will-change: scale, translate;
    position: fixed;
    z-index: calc(var(--z-overlay) + 1);
    position-area: block-end span-inline-end;
    position-try-fallbacks:
      flip-block,
      flip-inline,
      flip-block flip-inline;
    position-visibility: anchors-visible;
    /* A touch to the left of the button, so the content's text lines up under the button's own (mirrored when it flips
       to end at the button's right edge: a flip swaps the inline margins too). */
    margin-inline-start: calc(var(--space-1) * -1);
    margin-block: 4px;
    display: flex;
    flex-direction: column;
    width: max-content;
    min-width: max(calc(var(--anchor-w, anchor-size(width)) + var(--space-1) * 2), 240px);
    max-width: min(480px, calc(100dvw - 16px));
    max-height: min(480px, calc(100dvh - 16px));
    overflow: auto;
    overscroll-behavior: contain;
    border: 1px solid transparent;
    background:
      linear-gradient(var(--elevated), var(--elevated)) padding-box,
      var(--edge-grad-float);
    border-radius: var(--r-lg);
    box-shadow: var(--shadow);
  }
  .end {
    position-area: block-end span-inline-start;
    margin-inline: 0 calc(var(--space-1) * -1);
  }
  .above {
    position-area: block-start span-inline-end;
  }
  .end.above {
    position-area: block-start span-inline-start;
  }
  /* A set width (Popover's): as wide as asked, within the window. */
  .fixed {
    width: min(var(--w), calc(100dvw - 32px));
    min-width: 0;
    max-width: none;
    max-height: min(70dvh, 560px);
  }
  .anchored-panel:focus {
    outline: none;
  }
  /* Narrow: across the window between the gutters, under (or over) the button. */
  @media (max-width: 860px) {
    .anchored-panel,
    .end.above {
      position-area: none;
      position-try-fallbacks: none;
      margin: 0;
      left: var(--gutter-l);
      right: var(--gutter-r);
      width: auto;
      min-width: 0;
      max-width: none;
      top: calc(anchor(bottom) + var(--space-1));
    }
    .above {
      top: auto;
      bottom: calc(anchor(top) + var(--space-1));
    }
  }
  @media (forced-colors: active) {
    .anchored-panel {
      border-color: CanvasText;
    }
  }
</style>
