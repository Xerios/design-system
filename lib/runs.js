// Splitting a list into sections where something about its items changes (a month, a group, a letter), for lists
// that show a heading wherever an item differs from the one before it. See monthRuns in dates.js.

/**
 * Splits a list, in its order, into runs of neighbours sharing a key: a new run starts wherever an item's key differs
 * from the one before it. Each item keeps its index in the list (for keyboard focus and ids).
 *
 *   runs(['a1', 'a2', 'b1', 'a3'], (s) => s[0])  // [{ key: 'a', items: [a1, a2] }, { key: 'b', … }, { key: 'a', … }]
 *
 * @template T
 * @param {T[]} items
 * @param {(item: T) => string} keyOf
 * @returns {{ key: string, items: { item: T, index: number }[] }[]}
 */
export function runs(items, keyOf) {
  /** @type {{ key: string, items: { item: T, index: number }[] }[]} */
  const out = []
  items.forEach((item, index) => {
    const key = keyOf(item)
    const last = out.at(-1)
    if (last && last.key === key) last.items.push({ item, index })
    else out.push({ key, items: [{ item, index }] })
  })
  return out
}
