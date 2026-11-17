// Promise-based stand-ins for window.alert, confirm and prompt, drawn in the design system's own modal dialog by
// <Dialogs /> (mount it once, at the root). They open above any dialog already showing, so a form underneath keeps
// its state. One shows at a time; the next waits its turn.
//
//   await alertDialog({ title: 'Upload failed', body: 'The file is over 50 MB.' })
//   if (await confirmDialog({ title: 'Discard changes?', confirmLabel: 'Discard', danger: true })) close()
//   const name = await promptDialog({ title: 'Rename', label: 'Name', value: old, validate: (v) => (v ? '' : 'Enter a name') })
//
// A bare string is taken as the title. Esc and a backdrop click answer like the cancel button: alert resolves
// undefined, confirm false, prompt null.
//
// Options, all kinds: title, body (a paragraph under it).
//   alert:   okLabel ('OK').
//   confirm: confirmLabel ('OK'), cancelLabel ('Cancel'), danger (red confirm button; the focus starts on cancel).
//   prompt:  label (the field's), value, placeholder, confirmLabel ('OK'), cancelLabel ('Cancel'),
//            validate(value) → message or '' (checked on confirm only, never while typing).

/** The request on screen, if any. Read by <Dialogs />. */
export const dialogs = $state({ current: null })

const waiting = []
let seq = 0

function open(kind, options) {
  const settings = typeof options === 'string' ? { title: options } : { ...options }
  return new Promise((resolve) => {
    waiting.push({ ...settings, kind, id: ++seq, resolve })
    if (!dialogs.current) dialogs.current = waiting.shift()
  })
}

/** Called by <Dialogs /> when the dialog has closed: settles the request and brings on the next. */
export function answer(result) {
  const done = dialogs.current
  if (!done) return
  dialogs.current = waiting.shift() ?? null
  done.resolve(result)
}

/** Resolves once dismissed. */
export const alertDialog = (options) => open('alert', options)
/** Resolves true when confirmed, false otherwise. */
export const confirmDialog = (options) => open('confirm', options)
/** Resolves the entered text, or null when cancelled. */
export const promptDialog = (options) => open('prompt', options)
