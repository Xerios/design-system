// One context menu for the whole app (mount <ContextMenu /> once, at the root). Elements opt in with the `contextMenu`
// attachment:
//   <li {@attach contextMenu(() => rowMenu(row), 'Row actions')}>
// Right-click, Shift+F10 or the keyboard Menu key opens it. Inputs keep the browser's own menu.
//
// Item shape: { label, icon?, action?, href?, hint?, checked?, disabled?, danger?, children?: Item[] } or { separator: true }

/**
 * @typedef {object} MenuItem
 * @property {string} [label]
 * @property {() => unknown} [action]
 * @property {string} [href]
 * @property {string} [hint]
 * @property {boolean} [checked]
 * @property {boolean} [disabled]
 * @property {boolean} [danger]
 * @property {MenuItem[]} [children]
 * @property {boolean} [separator]
 * @property {string} [icon] an Icon name, in the column on the left (a checked item shows its check there instead)
 */

export const menu = $state({ open: false, x: 0, y: 0, items: [], label: '', trigger: null })
let returnFocus = null
let anchor = null,
  anchorRect = null // the element the menu belongs to, and where it was

// The element a right-click / Menu key menu acts on gets [data-menu-target] while it's open (outlined in css/base.css).
let target = null
function setTarget(el) {
  target?.removeAttribute('data-menu-target')
  target = el
  target?.setAttribute('data-menu-target', '')
}

export function openMenu(x, y, items, label = 'Actions', origin = null) {
  if (!items?.length) return
  setTarget(null)
  returnFocus = origin?.matches?.(':focus-within') ? document.activeElement : origin?.querySelector?.('button, a, [tabindex]') || origin
  anchor = origin
  anchorRect = origin?.getBoundingClientRect?.() ?? null
  Object.assign(menu, { open: true, x, y, items, label })
}

/** Open below a visible trigger (the "More actions" button), aligned to its right edge. */
export function openMenuFrom(button, items, label) {
  const r = button.getBoundingClientRect()
  openMenu(r.right - 220, r.bottom + 4, items, label, button)
  menu.trigger = button
}

/** True once the element the menu belongs to has scrolled away from where the menu was opened. */
export function anchorMoved() {
  if (!anchor || !anchorRect || !document.contains(anchor)) return true
  const r = anchor.getBoundingClientRect()
  return Math.abs(r.top - anchorRect.top) > 4 || Math.abs(r.left - anchorRect.left) > 4
}

export function closeMenu({ restoreFocus = true } = {}) {
  if (!menu.open) return
  menu.open = false
  menu.items = []
  menu.trigger = null
  setTarget(null)
  if (restoreFocus && returnFocus && document.contains(returnFocus)) returnFocus.focus?.()
  returnFocus = null
}

const isField = (el) => el?.closest?.('input, textarea, select, [contenteditable="true"]')

/** Svelte attachment factory. getItems runs at open time, so the menu always reflects current state. */
export const contextMenu = (getItems, label) => (node) => {
  const fromPointer = (e) => {
    if (isField(e.target)) return // keep copy/paste on text fields
    const items = getItems()
    if (!items?.length) return
    e.preventDefault()
    e.stopPropagation()
    openMenu(e.clientX, e.clientY, items, label, node)
    setTarget(node)
  }
  const fromKey = (e) => {
    if (!(e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10')) || isField(e.target)) return
    const items = getItems()
    if (!items?.length) return
    e.preventDefault()
    e.stopPropagation()
    const r = (e.target instanceof Element ? e.target : node).getBoundingClientRect()
    openMenu(r.left + Math.min(24, r.width / 2), r.top + Math.min(r.height, 32), items, label, node)
    setTarget(node)
  }
  node.addEventListener('contextmenu', fromPointer)
  node.addEventListener('keydown', fromKey)
  return () => {
    node.removeEventListener('contextmenu', fromPointer)
    node.removeEventListener('keydown', fromKey)
  }
}
