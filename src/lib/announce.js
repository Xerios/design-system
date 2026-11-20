// The page's one polite live region, for screen reader announcements that nothing else carries: a field's error once
// it is left, a tag added or removed. One region for the whole page: a live region per message, or one that only
// appears with its message, is not reliably read out.
//
//   announce('Enter a name')                  read out after a short pause (default 500ms), so it doesn't cut into
//                                             whatever the next focused control announces
//   announce('Added docs', { delay: 0 })      right away
//   cancelAnnouncement()                      drop a pending one (the error was fixed before it was read)
//
// Errors shown by a failed submit aren't announced here: moving the focus to the first invalid field reads them.
// Critical failures that need interrupting (a save that failed) use role="alert" instead (ErrorMessage, inline).

/** @type {HTMLElement | null} */
let region = null
/** @type {ReturnType<typeof setTimeout> | undefined} */
let timer

/** The region, inside the topmost modal dialog if one is open: everything outside a modal is inert and isn't read. */
function ensureRegion() {
  if (!region) {
    region = document.createElement('div')
    region.setAttribute('aria-live', 'polite')
    region.className = 'sr-only'
    region.dataset.announcer = ''
  }
  const modals = document.querySelectorAll('dialog:modal')
  const host = modals[modals.length - 1] ?? document.body
  if (region.parentNode !== host) host.append(region)
  return region
}

/**
 * @param {string} text
 * @param {{ delay?: number }} [options]
 */
export function announce(text, { delay = 500 } = {}) {
  if (typeof document === 'undefined' || !text) return
  const live = ensureRegion()
  clearTimeout(timer)
  // Emptied first, so the same text said twice is read twice.
  live.textContent = ''
  timer = setTimeout(() => (live.textContent = text), Math.max(delay, 50))
}

export function cancelAnnouncement() {
  clearTimeout(timer)
  if (region) region.textContent = ''
}
