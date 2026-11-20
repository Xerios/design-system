// The kitchen sink's areas, in page order: what KitchenSink draws and KitchenSinkNav links to. Things you interact with
// come first, then things that show content and state, then the atoms and foundations everything is built from.
export const AREAS = [
  { id: 'actions', label: 'Actions', icon: 'cursorClick' },
  { id: 'inputs', label: 'Inputs', icon: 'textbox' },
  { id: 'overlays', label: 'Overlays', icon: 'stack' },
  { id: 'content', label: 'Content', icon: 'table' },
  { id: 'feedback', label: 'Feedback', icon: 'bell' },
  { id: 'atoms', label: 'Atoms', icon: 'atom' },
  { id: 'typography', label: 'Typography', icon: 'textAa' },
  { id: 'foundations', label: 'Foundations', icon: 'palette' },
]

/**
 * Jumps to an area: scrolls its heading into view, moves the focus there (so Tab carries on from it) and puts it in the
 * address. For the links' onclick; without script they still jump, as plain #anchors.
 * @param {MouseEvent} e
 * @param {string} id
 */
export function jump(e, id) {
  const heading = document.getElementById(`${id}-title`)
  if (!heading) return
  e.preventDefault()
  heading.scrollIntoView({ block: 'start' })
  heading.focus({ preventScroll: true })
  history.replaceState(history.state, '', `#${id}`)
}
