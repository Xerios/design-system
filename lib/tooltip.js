/**
 * Attachment: a small tooltip for a control, on hover and on keyboard focus. Required on every button whose
 * meaning is not spelled out in visible text: icon-only buttons, and terse toggles such as "Live".
 *
 *   <button class="icon-btn" aria-label="Refresh" {@attach tooltip('Refresh')}>…</button>
 *   <button class="icon-btn" aria-label="Search" {@attach tooltip('Search', { shortcut: '/' })}>…</button>
 *   <button … {@attach tooltip('Replace', { detail: file.name })}>…</button>
 *
 * text: what the control does, sentence case. No text, no tooltip. shortcut: shown as a key cap after it.
 * detail: a second line under the text, which then turns bold: what the action applies to, in full where the control
 * cuts it short (a long file name). It wraps anywhere, so a name with no spaces still fits.
 * The tooltip is not the accessible name: keep the aria-label. When the text says more than the name, it is
 * also announced as the control's description.
 *
 * It opens in the top layer (Popover API), so it shows above modal dialogs, under the control or above it when
 * there is no room, with an arrow pointing at the control. Escape, a press, scrolling or leaving the control closes it. Touch input never opens it.
 * It fades in and out (css/atoms.css); a closing tip is removed once its fade has ended.
 */
let count = 0

export function tooltip(text, { shortcut = null, detail = null } = {}) {
  return (node) => {
    if (!text) return
    const id = `tooltip-${++count}`
    const said = detail ? `${text} ${detail}` : text
    const describes = said !== node.getAttribute('aria-label') && said !== node.textContent?.trim()
    let tip = null
    let leaving = null // the tip fading out, if any

    function show() {
      if (tip) return
      // Coming straight back: the old tip goes at once, so there is never two with this id.
      leaving?.remove()
      leaving = null
      tip = document.createElement('div')
      tip.id = id
      tip.className = 'tooltip'
      tip.setAttribute('role', 'tooltip')
      tip.setAttribute('popover', 'manual')
      if (detail) {
        // Two lines. The space between them isn't drawn (they are grid items) but keeps the words apart when the tip
        // is read out as the control's description.
        const lines = document.createElement('span')
        lines.className = 'tooltip-lines'
        const head = document.createElement('strong')
        head.textContent = text
        const rest = document.createElement('span')
        rest.textContent = detail
        lines.append(head, ' ', rest)
        tip.append(lines)
      } else tip.textContent = text
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
      const above = r.bottom + h + 16 > innerHeight && r.top > h + 16
      const left = Math.max(8, Math.min(r.left + r.width / 2 - w / 2, innerWidth - w - 8))
      tip.style.left = `${left}px`
      tip.style.top = `${above ? r.top - h - 8 : r.bottom + 8}px`
      // The arrow points back at the control's centre, even when the tip is pushed in from the window's edge.
      tip.dataset.arrow = above ? 'down' : 'up'
      tip.style.setProperty('--arrow-x', `${r.left + r.width / 2 - left}px`)
      if (describes) node.setAttribute('aria-describedby', id)
      addEventListener('scroll', hide, true)
    }
    function hide() {
      if (!tip) return
      // Closed first, so it fades out (css/atoms.css), then removed when that has ended;
      // at once with no fade (reduced motion, or no popover support).
      const old = (leaving = tip)
      tip = null
      if (old.hidePopover && old.matches(':popover-open')) old.hidePopover()
      Promise.all(old.getAnimations().map((a) => a.finished))
        .catch(() => {})
        .finally(() => {
          old.remove()
          if (leaving === old) leaving = null
        })
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
