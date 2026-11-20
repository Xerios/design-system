/**
 * Controls aren't content. Where base.css turns text selection off (buttons, lists, menus, pickers, labels…), these
 * document listeners also cancel the browser's own drag and right-click menu, so pressing and dragging a control can't
 * pick up its label or a link, and a right-click doesn't offer Back, Reload or Save over it. Content keeps both: text,
 * toasts, alerts, and anything a component sets back to user-select: text (a pinned InfoTip). Text fields and links
 * keep their menu (paste, open in a new tab), an element marked draggable="true" keeps its drag, a contextMenu
 * attachment still opens its menu, and Shift + right-click always gets the browser's menu (to inspect an element).
 * The ContextMenu singleton installs both on the document.
 */

/** @param {EventTarget | null} target */
const elementOf = (target) => (target instanceof Element ? target : target instanceof Node ? target.parentElement : null)

/**
 * Whether text in el can be selected, resolved as the browser does: the nearest user-select that isn't auto wins
 * (Chromium inherits the property, Firefox doesn't, so walk up). Editable elements always can.
 * @param {Element} el
 */
export function selectable(el) {
  for (let node = el; node; node = node.parentElement) {
    if (node instanceof HTMLElement && node.isContentEditable) return true
    const style = getComputedStyle(node)
    const value = style.userSelect || style.webkitUserSelect
    if (value && value !== 'auto') return value !== 'none'
  }
  return true
}

/** contextmenu listener: no browser menu over a control. @param {MouseEvent} e */
export function noControlMenu(e) {
  if (e.defaultPrevented || e.shiftKey) return
  const el = elementOf(e.target)
  if (!el || el.closest('a[href]') || selectable(el)) return
  e.preventDefault()
}

/** dragstart listener: a control's label, link or image isn't dragged out. @param {DragEvent} e */
export function noControlDrag(e) {
  const el = elementOf(e.target)
  if (!el || el.closest('[draggable="true"]') || selectable(el)) return
  e.preventDefault()
}
