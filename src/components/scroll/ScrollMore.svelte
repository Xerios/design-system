<script>
  /**
   * A floating cue that there is more below: a round button with a gently bobbing down arrow, at the middle of a scroll
   * area's bottom edge, while content runs on past it. Pressing it scrolls on by most of a screenful (or to the end, with
   * `toEnd`). `showLabel` makes it a pill with the label beside the arrow.
   *
   *   <div class="pane" style="overflow: auto">…long content… <ScrollMore /></div>
   *   <div class="log" style="overflow: auto">…messages… <ScrollMore until="end" toEnd showLabel label="Latest" /></div>
   *
   * Put it last inside the area it scrolls. It watches the nearest scrolling ancestor, or the window when there is none
   * (portalled to <body>, over the viewport's bottom edge); `target` names another. In a scroll container it floats from
   * a zero-height sticky strip, so it adds nothing to the content's height (a gap, in a flex or grid container with one).
   * For a quieter hint with no button, fade the area's edge with the `scrollFade` attachment instead.
   *
   * label: its name (default 'More below'): the visible text with `showLabel`, else its aria-label and tooltip.
   * showLabel: the pill with the label (default: the round icon-only button).
   * until: 'scrolled' (default) shows it only until the area has been scrolled a little, a cue for a first look;
   *   'end' shows it whenever more is below (a log or chat, where it means "there is newer below").
   * toEnd: pressing goes to the end rather than a screenful on.
   * align: 'center' (default) | 'end' (the bottom corner).
   * target: the scroll area (an element, or window), if not the nearest scrolling ancestor.
   * Other attributes, class and attachments go to the <button>.
   *
   * Scrolling is smooth, or instant under reduced motion, which also stills the arrow. Keyboard: Tab to it, Enter or
   * Space; while it has the keyboard focus it stays, so it can be pressed again, and goes once the focus moves on.
   */
  import ScrollButton from './ScrollButton.svelte'
  import { prefersReducedMotion } from 'svelte/motion'

  /**
   * @typedef {object} Props
   * @property {string} [label]
   * @property {boolean} [showLabel]
   * @property {'scrolled' | 'end'} [until]
   * @property {boolean} [toEnd]
   * @property {'end' | 'center'} [align]
   * @property {HTMLElement | Window} [target]
   */
  /** @type {Props & Omit<import('svelte/elements').HTMLButtonAttributes, keyof Props>} */
  let { label = 'More below', until = 'scrolled', toEnd = false, align = 'center', ...rest } = $props()

  /** Whether there is more below, and (until: 'scrolled') nobody has scrolled yet beyond a nudge. */
  const shown = (/** @type {{ top: number, max: number, page: number }} */ m) =>
    m.max - m.top > 2 && (until === 'end' || m.top < Math.min(m.page / 4, 120))

  /**
   * @param {HTMLElement | Window} scroller
   * @param {{ top: number, max: number, page: number }} m
   */
  function onward(scroller, m) {
    // Most of a screenful, so the last lines seen stay in view to read on from.
    const top = toEnd ? m.max : Math.min(m.max, m.top + m.page * 0.85)
    scroller.scrollTo({ top, behavior: prefersReducedMotion.current ? 'instant' : 'smooth' })
  }
</script>

<ScrollButton {label} icon="arrowDownBold" {align} cue keepFocused {shown} go={onward} {...rest} />
