/**
 * Attachment: marks a control (or a group of them) invalid while it has an error message, and points it at that
 * message, so every field states its error the same way.
 *
 *   <input {@attach invalid(problem && `${id}-error`)} />
 *   <ErrorMessage floating id="{id}-error" message={problem} />
 *
 * errorId: the id of the element holding the message, or a falsy value while there is none.
 * Sets aria-invalid: "true", or "false" while valid (left unset, Firefox and Safari report an empty required field as
 * invalid on load). Used on every control alike, buttons included (Select's trigger), although ARIA 1.2 no longer
 * lists it for every role: one attribute for screen readers, styles (`[aria-invalid='true']`) and scripts that look for
 * the first invalid field. Adds errorId to aria-describedby while there is a message, keeping any other ids there
 * (give the control its own descriptions as a fixed attribute: the attachment edits it after Svelte sets it).
 * Runs again whenever errorId changes.
 *
 * @param {string | false | null | undefined} errorId
 */
export const invalid = (errorId) => (/** @type {Element} */ node) => {
  node.setAttribute('aria-invalid', errorId ? 'true' : 'false')
  if (!errorId) return
  const others = describedBy(node).filter((id) => id !== errorId)
  node.setAttribute('aria-describedby', [...others, errorId].join(' '))
  return () => {
    const rest = describedBy(node).filter((id) => id !== errorId)
    if (rest.length) node.setAttribute('aria-describedby', rest.join(' '))
    else node.removeAttribute('aria-describedby')
  }
}

/** @param {Element} node */
const describedBy = (node) => (node.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean)

/** The selector for the first control to focus after a failed submit: an invalid control, or the first button in an
 *  invalid group. */
export const FIRST_INVALID = ':is(input, textarea, select, button)[aria-invalid="true"], [aria-invalid="true"] button'
