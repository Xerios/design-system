<script>
  /**
   * A floating "back to top" button. It rises in at the bottom corner of a scroll area once you are a screenful down
   * (or `after` px), and scrolls back to the top when pressed. A pill with an up arrow and its label. (Always labelled:
   * ad and annoyance blockers hide icon-only buttons named "Back to top", so a round one could vanish for some users.)
   *
   *   <main class="page">…long content… <ScrollToTop /></main>
   *   <div class="list" style="overflow: auto">…rows… <ScrollToTop label="Back to the first row" /></div>
   *
   * Put it last inside the area it scrolls. It watches the nearest scrolling ancestor, or the window when there is none
   * (it then floats over the viewport's bottom corner, portalled to <body>); `target` names another. In a scroll
   * container it floats from a zero-height sticky strip, so it adds nothing to the content's height (a gap, in a flex or
   * grid container with one).
   *
   * label: its visible text (default 'Back to top').
   * after: how far down, in px, it appears (default: one screenful of the area).
   * align: 'end' (the bottom corner, default) | 'center'.
   * target: the scroll area (an element, or window), if not the nearest scrolling ancestor.
   * Other attributes, class and attachments go to the <button>.
   *
   * Scrolling is smooth, or instant under reduced motion. Keyboard: Tab to it, Enter or Space. The focus then moves to
   * the first thing you can tab to in the area (the page, for the window), so Tab carries on from the top instead of
   * from a button that has gone.
   */
  import ScrollButton from './ScrollButton.svelte'
  import { prefersReducedMotion } from 'svelte/motion'

  /**
   * @typedef {object} Props
   * @property {string} [label]
   * @property {number} [after]
   * @property {'end' | 'center'} [align]
   * @property {HTMLElement | Window} [target]
   */
  /** @type {Props & Omit<import('svelte/elements').HTMLButtonAttributes, keyof Props>} */
  let { label = 'Back to top', after, ...rest } = $props()

  const TABBABLE =
    'a[href], button:not(:disabled), input:not(:disabled, [type="hidden"]), select:not(:disabled), textarea:not(:disabled), summary, [contenteditable=""], [contenteditable="true"], [tabindex]:not([tabindex="-1"])'

  /**
   * @param {HTMLElement | Window} scroller
   * @param {{ top: number, max: number, page: number }} _metrics
   * @param {HTMLButtonElement} button
   */
  function toTop(scroller, _metrics, button) {
    scroller.scrollTo({ top: 0, behavior: prefersReducedMotion.current ? 'instant' : 'smooth' })
    const area = scroller === window ? document.body : /** @type {HTMLElement} */ (scroller)
    const first = [...area.querySelectorAll(TABBABLE)].find(
      (el) => el !== button && el instanceof HTMLElement && !el.closest('[inert]') && el.checkVisibility(),
    )
    if (first instanceof HTMLElement) first.focus({ preventScroll: true })
    else button.blur()
  }
</script>

<ScrollButton {label} icon="arrowUpBold" shown={(m) => m.top > (after ?? m.page)} go={toTop} {...rest} showLabel />
