/**
 * Attachment for a radio group with roving focus: put it on the role="radiogroup" element around role="radio" buttons,
 * where only the chosen one is tabbable (tabindex 0, the others -1). Arrows move to the next or previous option and
 * choose it, wrapping round; Home and End go to the first and last. Choosing is a click on that option, so the option's
 * own onclick does the work.
 *
 *   <div role="radiogroup" aria-label="View" {@attach radioKeys}>
 *     {#each options as o (o.value)}
 *       <button type="button" role="radio" aria-checked={o.value === value} tabindex={o.value === value ? 0 : -1}
 *         onclick={() => onchange(o.value)}>{o.label}</button>
 *     {/each}
 *   </div>
 *
 * @param {HTMLElement} node
 */
export function radioKeys(node) {
  /** @param {KeyboardEvent} e */
  const onkeydown = (e) => {
    const radios = /** @type {HTMLButtonElement[]} */ ([...node.querySelectorAll('[role="radio"]')]).filter(
      (radio) => !radio.disabled && radio.closest('[role="radiogroup"]') === node,
    )
    const at = radios.indexOf(/** @type {HTMLButtonElement} */ (/** @type {Element} */ (e.target).closest?.('[role="radio"]')))
    if (at < 0) return
    const n = radios.length
    const next = { ArrowRight: at + 1, ArrowDown: at + 1, ArrowLeft: at - 1 + n, ArrowUp: at - 1 + n, Home: 0, End: n - 1 }[e.key]
    if (next === undefined) return
    e.preventDefault()
    e.stopPropagation()
    const radio = radios[next % n]
    radio.focus()
    radio.click()
  }
  node.addEventListener('keydown', onkeydown)
  return () => node.removeEventListener('keydown', onkeydown)
}
