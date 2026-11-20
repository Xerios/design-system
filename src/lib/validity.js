/**
 * Attachment that ties an <input> or <textarea> to the browser's constraint validation, so a field has one
 * invalid state whether the app or a native constraint (required, pattern, minlength…) found the problem.
 *
 *   <input {@attach validity(() => error, (message) => (native = message))} />
 *
 * error(): the app's own message, '' when there is none. It becomes the control's custom validity, so the
 * control matches :invalid / :user-invalid and the form's checkValidity() fails while it is set.
 * report(message): called with the browser's message when a native constraint fails, and with '' once the
 * field is edited or the app clears its error. A field is checked only when its form is validated (submit,
 * checkValidity, reportValidity), never for being left or while it is typed in.
 *
 * The browser's own bubble is suppressed, since the field shows the message itself; in its place the first
 * invalid control of the form takes the focus.
 */
export function validity(error, report) {
  return (node) => {
    const message = error() || ''
    node.setCustomValidity(message)
    if (!message) report('')

    const invalid = (event) => {
      event.preventDefault()
      report(node.validity.customError ? '' : node.validationMessage)
      if (node.form?.querySelector(':invalid') === node) node.focus()
    }
    const clear = () => report('')

    node.addEventListener('invalid', invalid)
    node.addEventListener('input', clear)
    return () => {
      node.removeEventListener('invalid', invalid)
      node.removeEventListener('input', clear)
    }
  }
}
