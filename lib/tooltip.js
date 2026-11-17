/**
 * Attachment: a small tooltip for a control, on hover and on keyboard focus. Required on every button whose
 * meaning is not spelled out in visible text: icon-only buttons, and terse toggles such as "Live".
 *
 *   <button class="icon-btn" aria-label="Refresh" {@attach tooltip('Refresh')}>…</button>
 *   <button class="icon-btn" aria-label="Search" {@attach tooltip('Search', { shortcut: '/' })}>…</button>
 *
 * text: what the control does, sentence case. No text, no tooltip. shortcut: shown as a key cap after it.
 * The tooltip is not the accessible name: keep the aria-label. When the text says more than the name, it is
 * also announced as the control's description.
 *
 * It opens in the top layer (Popover API), so it shows above modal dialogs, under the control or above it when
 * there is no room. Escape, a press, scrolling or leaving the control closes it. Touch input never opens it.
 */
let count = 0

export function tooltip(text, { shortcut = null } = {}) {
  return (node) => {
    if (!text) return
    const id = `tooltip-${++count}`
    const describes = text !== node.getAttribute('aria-label') && text !== node.textContent?.trim()
    let tip = null

    function show() {
      if (tip) return
      tip = document.createElement('div')
      tip.id = id
      tip.className = 'tooltip'
      tip.setAttribute('role', 'tooltip')
      tip.setAttribute('popover', 'manual')
      tip.textContent = text
      if (shortcut) {
        const key = document.createElement('kbd')
        key.textContent = shortcut
        tip.append(key)
      }
      // Inside a modal dialog everything outside it is inert, so the tooltip joins the dialog.
      ;(node.closest('dialog') ?? document.body).append(tip)
      tip.showPopover?.()
      const r = node.getBoundingClientRect()
      const w = tip.offsetWidth
      const h = tip.offsetHeight
      const above = r.bottom + h + 12 > innerHeight && r.top > h + 12
      tip.style.left = `${Math.max(8, Math.min(r.left + r.width / 2 - w / 2, innerWidth - w - 8))}px`
      tip.style.top = `${above ? r.top - h - 6 : r.bottom + 6}px`
      if (describes) node.setAttribute('aria-describedby', id)
      addEventListener('scroll', hide, true)
    }
    function hide() {
      if (!tip) return
      tip.remove()
      tip = null
      if (describes) node.removeAttribute('aria-describedby')
      removeEventListener('scroll', hide, true)
    }

    const enter = (event) => event.pointerType !== 'touch' && show()
    const focus = () => node.matches(':focus-visible') && show()
    const key = (event) => event.key === 'Escape' && hide()

    node.addEventListener('pointerenter', enter)
    node.addEventListener('pointerleave', hide)
    node.addEventListener('pointerdown', hide)
    node.addEventListener('focus', focus)
    node.addEventListener('blur', hide)
    node.addEventListener('keydown', key)
    return () => {
      hide()
      node.removeEventListener('pointerenter', enter)
      node.removeEventListener('pointerleave', hide)
      node.removeEventListener('pointerdown', hide)
      node.removeEventListener('focus', focus)
      node.removeEventListener('blur', hide)
      node.removeEventListener('keydown', key)
    }
  }
}
