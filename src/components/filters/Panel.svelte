<script>
  /**
   * Internal to filters/: the floating panel a filter's value editor and the add button's field list open in. It sits
   * in the top layer (above modal dialogs), anchored under its button with CSS anchor positioning (flipping above, or
   * to end at the button's right edge, where there is no room), grows out of the button and fades as it closes.
   * The owner gives its button `style:anchor-name={name}` and renders this while open.
   *
   *   <Panel anchor={button} name="--filter-x" label="Health" onclose={(refocus) => …}>…</Panel>
   *
   * anchor: the button it belongs to. name: that button's anchor-name. label: the panel's accessible name.
   * onclose(refocus): asked to close: Esc (refocus true), a press outside it and its button (false), Tab or Shift+Tab
   * past its last or first control (true, so the Tab carries on from the button).
   * As it opens, the focus goes to its first control unless the content takes it (OptionList does).
   */
  import { tick } from 'svelte'
  import { topLayer } from '../../lib/dom.js'
  import { pop } from '../../lib/motion.js'

  /**
   * @typedef {object} Props
   * @property {HTMLElement} anchor
   * @property {string} name
   * @property {string} label
   * @property {(refocus: boolean) => void} onclose
   * @property {import('svelte').Snippet} children
   */
  /** @type {Props & Omit<import('svelte/elements').HTMLAttributes<HTMLDivElement>, keyof Props>} */
  let { anchor, name, label, onclose, children, class: className, ...rest } = $props()
  /** @type {HTMLDivElement | undefined} */
  let panel = $state()

  const focusable = 'input, textarea, button:not(:disabled), [href], [tabindex]:not([tabindex="-1"])'

  /** Attachment: once the content is in, puts the focus on its first control unless it took the focus itself. */
  const settle = (/** @type {HTMLElement} */ node) => {
    tick().then(() => {
      if (!node.contains(document.activeElement)) /** @type {HTMLElement | null} */ (node.querySelector(focusable) ?? node).focus({ preventScroll: true })
    })
  }

  /** @param {PointerEvent} e */
  function outside(e) {
    const target = /** @type {Element} */ (e.target)
    if (panel?.contains(target) || anchor?.contains(target) || target.closest?.('.ctx-menu, .tooltip, [data-floating]')) return
    onclose(false)
  }

  /** @param {KeyboardEvent} e */
  function onkeydown(e) {
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      onclose(true)
    } else if (e.key === 'Tab' && panel) {
      const stops = /** @type {HTMLElement[]} */ ([...panel.querySelectorAll(focusable)]).filter(
        (el) => el.tabIndex >= 0 && el.checkVisibility(),
      )
      const at = stops.indexOf(/** @type {HTMLElement} */ (document.activeElement))
      // Past either end: back on the button first, so the browser's Tab moves on from there (the panel sits at the end of
      // <body>, where a Tab would otherwise go next).
      if (at < 0 || (e.shiftKey ? at === 0 : at === stops.length - 1)) onclose(true)
    }
  }
</script>

<svelte:document onpointerdowncapture={outside} />

<div
  bind:this={panel}
  class={['filter-panel', className]}
  style:position-anchor={name}
  role="dialog"
  aria-label={label}
  tabindex="-1"
  data-floating
  {...rest}
  {@attach topLayer(anchor)}
  {@attach settle}
  transition:pop={{ from: anchor }}
  {onkeydown}
>
  {@render children()}
</div>

<style>
  .filter-panel {
    position: fixed;
    z-index: calc(var(--z-overlay) + 1);
    position-area: block-end span-inline-end;
    position-try-fallbacks:
      flip-block,
      flip-inline,
      flip-block flip-inline;
    position-visibility: anchors-visible;
    /* A touch to the left of the field, so the list's text lines up under the field's own (mirrored when it flips to
       end at the field's right edge: a flip swaps the inline margins too), and as much wider, so it overhangs the
       field's right edge by the same amount. */
    margin-inline-start: calc(var(--space-1) * -1);
    margin-block: 4px;
    display: flex;
    flex-direction: column;
    width: max-content;
    min-width: max(calc(anchor-size(width) + var(--space-1) * 2), 240px);
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
    color: var(--fg-2);
  }
  .filter-panel:focus {
    outline: none;
  }
  @media (forced-colors: active) {
    .filter-panel {
      border-color: CanvasText;
    }
  }
</style>
