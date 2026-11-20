// Narrowing a list of options by typed text: what Select and OptionList (filters/) share with their ListSearch field.
//
//   const searchable = $derived(wantsSearch(search, options.length))
//   const shown = $derived(options.filter((o) => matches(o.label, query)))

/** How many options a list holds, at most, before `search: 'auto'` gives it a search field. */
export const SEARCH_AFTER = 8

/**
 * Whether a list gets a search field: 'auto' when it has more than SEARCH_AFTER options, else as given.
 * @param {'auto' | boolean | undefined} search
 * @param {number} count
 */
export const wantsSearch = (search, count) => (search === 'auto' ? count > SEARCH_AFTER : !!search)

/**
 * Whether an option's text matches what was typed: anywhere in it, ignoring case and accents. Empty text matches all.
 * @param {string} text
 * @param {string} query
 */
export function matches(text, query) {
  const q = fold(query.trim())
  return !q || fold(text).includes(q)
}

/** @param {string} s */
const fold = (s) => s.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
