/**
 * Kitchen sink: lays a grid's items out as masonry, each one tucked under the item above it instead of waiting for the
 * tallest item in the row. The grid keeps its own columns and gap, and its items keep their column spans (a span takes
 * the first place in order where its columns are all free, so a `1 / -1` item starts a fresh row).
 *
 *   <div class="demos" {@attach masonry}>…</div>
 *
 * How: the grid's rows become 1px tall, and each item spans as many of them as it is tall plus the gap, re-measured
 * whenever an item or the grid changes size. Items keep their order: each goes in the column that frees up first after
 * the one before it. The grid must align its items to the start (`align-items: start`), or they stretch to fill the rows
 * they span and keep growing. With a single column there is nothing to tuck under, and the grid is left as it is.
 * @param {HTMLElement} grid
 */
export function masonry(grid) {
  // Read before the rows' gap is taken over: the gap the items leave under them.
  const gap = parseFloat(getComputedStyle(grid).rowGap) || 0
  const items = () => /** @type {HTMLElement[]} */ ([...grid.children])
  let on = false

  function layout() {
    const columns = getComputedStyle(grid).gridTemplateColumns.trim().split(/\s+/).length
    if (on !== columns > 1) {
      on = columns > 1
      grid.style.gridAutoRows = on ? '1px' : ''
      grid.style.rowGap = on ? '0px' : ''
      // The last item in each column leaves its gap under it too: take it back, so the grid ends where its items do.
      grid.style.marginBottom = on ? `${-gap}px` : ''
    }
    // All the measuring first, then all the writing, so the browser lays the page out once.
    const heights = items().map((item) => item.getBoundingClientRect().height)
    items().forEach((item, i) => (item.style.gridRowEnd = on ? `span ${Math.ceil(heights[i] + gap)}` : ''))
  }

  const resized = new ResizeObserver(layout)
  const watch = () => {
    resized.disconnect()
    resized.observe(grid)
    for (const item of items()) resized.observe(item)
  }
  // Items added or removed later are measured too.
  const added = new MutationObserver(watch)
  added.observe(grid, { childList: true })
  watch()

  return () => {
    added.disconnect()
    resized.disconnect()
    grid.style.gridAutoRows = grid.style.rowGap = grid.style.marginBottom = ''
    for (const item of items()) item.style.gridRowEnd = ''
  }
}
