// Scrolling a list to the option the keyboard is on, when the list has sticky group headings (Select's groups,
// DateRangeSelect's months). The browser's scrollIntoView and scroll-padding only know a fixed band at the top, but a
// heading sticks at the list's content edge (inside its padding) and is as tall as its text makes it, so a fixed band
// leaves the option scrolled to partly under it. This measures the heading instead.
//
//   <div role="group"><div class="group-head" data-sticky-head>March</div> …options… </div>
//   reveal(list, list.querySelector(`[data-i="${active}"]`))

/**
 * Scrolls `item` the least it takes to show it whole inside the scrolling `list`: clear of the list's padding, and
 * below the sticky heading of its group if it has one (a [data-sticky-head] in the nearest [role="group"] around it).
 * @param {Element | null | undefined} list
 * @param {Element | null | undefined} item
 */
export function reveal(list, item) {
  if (!list || !item) return
  const style = getComputedStyle(list)
  const edge = list.getBoundingClientRect().top + list.clientTop
  const group = item.closest('[role="group"]')
  const head = group && list.contains(group) ? group.querySelector('[data-sticky-head]') : null
  // Where a stuck heading ends: the list's top padding, the heading's own `top`, then its height.
  const covered = head ? (parseFloat(getComputedStyle(head).top) || 0) + head.getBoundingClientRect().height : 0
  const from = edge + parseFloat(style.paddingTop) + covered
  const to = edge + list.clientHeight - parseFloat(style.paddingBottom)
  const r = item.getBoundingClientRect()
  if (r.top < from) list.scrollTop -= from - r.top
  else if (r.bottom > to) list.scrollTop += Math.min(r.bottom - to, r.top - from)
}
