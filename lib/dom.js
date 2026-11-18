/** Small DOM helpers shared by floating and modal components. */

/** Attachment: moves the node to <body>, so scrolling, clipping or sticky ancestors can't clip or cover it. */
export const portal = (node) => {
  document.body.appendChild(node)
  return () => node.remove()
}

/**
 * Attachment: shows a floating node in the top layer (Popover API), so it draws above modal dialogs and their backdrop,
 * which no z-index can. It goes into the <dialog> around `from` if there is one (everything outside a modal dialog is
 * inert, so it couldn't be pointed at, clicked or selected there), else <body>. The top layer stacks in the order things
 * are shown: a layer that must sit above one shown after it has to be shown again (re-created). base.css resets the
 * popover's default box on [data-top-layer]; give the node position: fixed and place it as usual.
 */
export const topLayer = (from) => (node) => {
  node.setAttribute('popover', 'manual')
  node.setAttribute('data-top-layer', '')
  ;(from?.closest('dialog') ?? document.body).appendChild(node)
  node.showPopover?.()
  return () => node.remove()
}

/**
 * Attachment: like portal, but moves the node into the nearest [data-layer-root] ancestor of `from` (else <body>).
 * Use it for layers that must stack against siblings inside an isolated container (the app shell isolates its header
 * and view card, so a scrim on <body> would cover the header and the panel it opened).
 */
export const portalNear = (from) => (node) => {
  ;(from?.closest('[data-layer-root]') ?? document.body).appendChild(node)
  return () => node.remove()
}

/** @param {MouseEvent} e */
const onBackdrop = (e) => {
  if (e.target !== e.currentTarget) return false
  const r = /** @type {Element} */ (e.currentTarget).getBoundingClientRect()
  return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom
}

/**
 * Handlers for a modal <dialog> (spread them onto it) that close it on a backdrop click, but only when the press both
 * started and ended on the backdrop: dragging a text selection or an input's caret out of the dialog doesn't close it.
 * The backdrop is told apart by where the pointer is, not only by the event's target: the dialog is the target for its
 * own padding and gaps too, so a press there would otherwise count as outside.
 */
export function backdropClose(close) {
  let downOnBackdrop = false
  return {
    onpointerdown: (e) => (downOnBackdrop = onBackdrop(e)),
    onclick: (e) => {
      if (downOnBackdrop && onBackdrop(e)) close()
      downOnBackdrop = false
    },
  }
}

/**
 * Handlers for a modal <dialog> whose Esc must go through `request` (to ask about unsaved work first) instead of
 * closing it. Spread them next to backdropClose. Esc is taken at keydown, before the browser turns it into a close
 * request: Chrome lets a page cancel that only once per user activation, and Esc is not one, so a quick second Esc
 * would close the dialog regardless. Other close requests (a back gesture) still arrive as `cancel` and are held
 * there, as far as the browser allows. An Esc a control inside has already handled (preventDefault) is left alone.
 */
export function closeRequests(request) {
  return {
    onkeydown: (e) => {
      if (e.key !== 'Escape' || e.defaultPrevented || composing(e)) return
      e.preventDefault()
      request()
    },
    oncancel: (e) => {
      e.preventDefault()
      request()
    },
  }
}

/**
 * True while the key belongs to an input method (IME) composition: Enter there confirms the composed text and Esc
 * cancels it, so a field's own Enter, Esc or Backspace handling must leave the key alone. keyCode 229 covers Safari,
 * which delivers compositionend before the confirming Enter (WebKit bug 165004), so isComposing is already false.
 *
 *   function onkeydown(e) { if (composing(e)) return; if (e.key === 'Enter') … }
 *
 * @param {KeyboardEvent} e
 */
export function composing(e) {
  return e.isComposing || e.keyCode === 229
}
