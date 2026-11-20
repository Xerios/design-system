import { durations, motion } from './motion.js'

/**
 * Animates an element's size when what it shows changes, so it reshapes into its new content instead of jumping (a
 * button becoming the file it picked). Call it while a component initialises, with the element and the value whose
 * change reshapes it:
 *
 *   let box = $state()
 *   morph(() => box, () => file)
 *
 * The element is measured before the DOM updates and after; its width and height then run from the old size to the
 * new one, the content clipped to the box meanwhile. Everything else (radius, colours) is left to CSS transitions on
 * it. Standard curve, 300ms; nothing under reduced motion. Give the content no outro: while it plays, the old content
 * is still in the box, and the new size would be measured with it.
 *
 * @param {() => HTMLElement | undefined} node
 * @param {() => unknown} key
 */
export function morph(node, key) {
  /** @type {DOMRect | null} */
  let before = null

  $effect.pre(() => {
    key()
    before = node()?.getBoundingClientRect() ?? null
  })

  $effect(() => {
    key()
    const element = node()
    const from = before
    before = null
    const duration = motion(durations.medium2)
    if (!element || !from || !duration) return
    const to = element.getBoundingClientRect()
    if (Math.abs(from.width - to.width) < 1 && Math.abs(from.height - to.height) < 1) return
    element.animate(
      [
        { width: `${from.width}px`, height: `${from.height}px`, overflow: 'clip' },
        { width: `${to.width}px`, height: `${to.height}px`, overflow: 'clip' },
      ],
      // Material 3's standard curve (easings.standard.standard), as CSS: a WAAPI easing can't be a function.
      { duration, easing: 'cubic-bezier(0.2, 0, 0, 1)' },
    )
  })
}
