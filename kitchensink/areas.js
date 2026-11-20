// The kitchen sink's areas, in page order: what KitchenSink draws and KitchenSinkNav links to. Things you interact with
// come first, then things that show content and state, then the atoms and foundations everything is built from.
export const AREAS = [
  { id: 'actions', label: 'Actions' },
  { id: 'inputs', label: 'Inputs' },
  { id: 'overlays', label: 'Overlays' },
  { id: 'content', label: 'Content' },
  { id: 'feedback', label: 'Feedback' },
  { id: 'atoms', label: 'Atoms' },
  { id: 'typography', label: 'Typography' },
  { id: 'foundations', label: 'Foundations' },
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
