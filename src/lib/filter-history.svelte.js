// The filters someone has used, ranked by how often and how lately (frecency): what FilterBar offers as "Recent" in
// its add panel. For now they are kept in memory, for the page's life: a reload starts them over.
//
//   const history = filterHistory('issues')    // in memory, under "filter-history:issues"
//   <FilterBar bind:filters {fields} {history} />  // or history="issues"
//
// storage: where they are kept, { get(key), set(key, value) }, either of which may return a promise; values are plain
// JSON. The default is one memory store for the page (memoryStore() makes another). It is the place a lasting storage
// will plug in.
// Each use adds 1 to a filter's score, and a score halves every `halfLife` days it goes unused, so a filter used often
// a while ago gives way to one used a few times this week. Only the `limit` best are kept.
// history.record(filter) counts a use; history.remove(id) forgets one; history.clear() forgets them all.
// history.ranked: the entries, best first ({ id, field, op, value, uses, score, last }).
// history.collapsed: whether the recent list is folded away (its heading toggles it), kept in the storage too.
// Calling filterHistory twice with the same key and storage gives the same history, so two bars share it.

/** @typedef {{ field: string, op: string, value: any }} Filter */
/** @typedef {Filter & { id: string, uses: number, score: number, last: number }} HistoryEntry */
/** @typedef {{ get: (key: string) => any, set: (key: string, value: any) => any }} FilterStorage */

const DAY = 86_400_000

/** Keeps entries in memory, for the page's life. @returns {FilterStorage} */
export function memoryStore() {
  const map = new Map()
  return { get: (key) => map.get(key) ?? null, set: (key, value) => void map.set(key, value) }
}

/** The page's memory store, the default: histories with the same key share it. */
const pageStore = memoryStore()

/** What identifies a filter: its field, condition and value. @param {Filter} filter */
export const filterId = (filter) => JSON.stringify([filter.field, filter.op ?? null, filter.value ?? null])

export class FilterHistory {
  /** @type {HistoryEntry[]} */
  entries = $state([])
  /** Whether the recent list is folded away. Set it with setCollapsed, which keeps it. */
  collapsed = $state(false)
  #key
  #storage
  #limit
  #halfLife
  /** @type {Promise<void>} */
  #ready

  /**
   * @param {string} key where it is stored ("filter-history:" + key)
   * @param {{ storage?: FilterStorage, limit?: number, halfLife?: number }} [options] halfLife in days (default 14),
   *   limit the entries kept (default 20)
   */
  constructor(key, { storage = pageStore, limit = 20, halfLife = 14 } = {}) {
    this.#key = `filter-history:${key}`
    this.#storage = storage
    this.#limit = limit
    this.#halfLife = halfLife * DAY
    this.#ready = Promise.resolve()
      .then(() => storage.get(this.#key))
      .then((saved) => {
        if (Array.isArray(saved)) this.entries = saved.filter((e) => e && typeof e.field === 'string').map((e) => ({ ...e, id: filterId(e) }))
      })
      .catch(() => {})
    Promise.resolve()
      .then(() => storage.get(`${this.#key}:collapsed`))
      .then((saved) => {
        if (typeof saved === 'boolean') this.collapsed = saved
      })
      .catch(() => {})
  }

  /** A score as it stands at `now`. @param {HistoryEntry} e @param {number} now */
  #rank = (e, now) => e.score * 0.5 ** (Math.max(0, now - e.last) / this.#halfLife)

  /** The entries, best first. */
  get ranked() {
    const now = Date.now()
    return [...this.entries].sort((a, b) => this.#rank(b, now) - this.#rank(a, now))
  }

  /** @param {HistoryEntry[]} next */
  #save(next) {
    const now = Date.now()
    this.entries = next
      .sort((a, b) => this.#rank(b, now) - this.#rank(a, now))
      .slice(0, this.#limit)
    const plain = this.entries.map(({ field, op, value, uses, score, last }) => ({ field, op, value, uses, score, last }))
    Promise.resolve()
      .then(() => this.#storage.set(this.#key, plain))
      .catch(() => {})
  }

  /** Counts a use of a filter. @param {Filter} filter */
  record(filter) {
    const { field, op, value } = $state.snapshot(filter)
    return this.#ready.then(() => {
      const id = filterId({ field, op, value })
      const now = Date.now()
      const was = this.entries.find((e) => e.id === id)
      const entry = was
        ? { ...was, uses: was.uses + 1, score: this.#rank(was, now) + 1, last: now }
        : { id, field, op, value, uses: 1, score: 1, last: now }
      this.#save([entry, ...this.entries.filter((e) => e.id !== id)])
    })
  }

  /** Forgets one filter. @param {string} id an entry's id (filterId) */
  remove(id) {
    return this.#ready.then(() => this.#save(this.entries.filter((e) => e.id !== id)))
  }

  /** Folds the recent list away, or opens it, and keeps that. @param {boolean} collapsed */
  setCollapsed(collapsed) {
    this.collapsed = collapsed
    Promise.resolve()
      .then(() => this.#storage.set(`${this.#key}:collapsed`, collapsed))
      .catch(() => {})
  }

  /** Forgets them all. */
  clear() {
    return this.#ready.then(() => this.#save([]))
  }
}

/** @type {WeakMap<FilterStorage, Map<string, FilterHistory>>} */
const made = new WeakMap()

/**
 * The history kept under `key`: the same one for the same key and storage.
 * @param {string} key
 * @param {{ storage?: FilterStorage, limit?: number, halfLife?: number }} [options]
 */
export function filterHistory(key, options = {}) {
  const storage = options.storage ?? pageStore
  let byKey = made.get(storage)
  if (!byKey) made.set(storage, (byKey = new Map()))
  let history = byKey.get(key)
  if (!history) byKey.set(key, (history = new FilterHistory(key, { ...options, storage })))
  return history
}
