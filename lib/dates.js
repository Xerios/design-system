// Calendar dates for the pickers, as ISO strings ('2026-11-18'): a day, not an instant, so no time zone can move it.
// All arithmetic runs in UTC; nothing here reads the local clock except today().

/** @param {string | null | undefined} iso @returns {Date | null} */
export function parse(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? '')
  if (!m) return null
  const date = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]))
  // 2026-02-31 is not a day.
  return date.getUTCMonth() === +m[2] - 1 ? date : null
}

/** @param {Date} date */
export const iso = (date) => date.toISOString().slice(0, 10)

/** Today where the user is, as an ISO day. */
export function today() {
  const now = new Date()
  return iso(new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())))
}

/** @param {string} day @param {number} n */
export function addDays(day, n) {
  const date = /** @type {Date} */ (parse(day))
  date.setUTCDate(date.getUTCDate() + n)
  return iso(date)
}

/** The same day n months on, or the month's last day when it has fewer (31 Jan + 1 month = 28 Feb). @param {string} day @param {number} n */
export function addMonths(day, n) {
  const date = /** @type {Date} */ (parse(day))
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + n, 1))
  const last = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate()
  target.setUTCDate(Math.min(date.getUTCDate(), last))
  return iso(target)
}

/** The first of the day's month. @param {string} day */
export const monthOf = (day) => `${day.slice(0, 7)}-01`

/** 0 Sunday … 6 Saturday. @param {string} day */
export const weekday = (day) => /** @type {Date} */ (parse(day)).getUTCDay()

/** The first day of the week where the user is: 1 Monday (the default) … 7 Sunday, as Intl reports it. */
export function firstDayOfWeek() {
  try {
    const locale = /** @type {any} */ (new Intl.Locale(navigator.language))
    const info = locale.getWeekInfo?.() ?? locale.weekInfo
    return info?.firstDay ?? 1
  } catch {
    return 1
  }
}

/** The weeks to draw for a month: 6 rows of 7 ISO days, starting on the locale's first day of the week.
 *  @param {string} month any day in it */
export function monthGrid(month) {
  const first = monthOf(month)
  const start = ((firstDayOfWeek() % 7) + 7) % 7 // Intl's 7 (Sunday) is getUTCDay's 0
  const lead = (weekday(first) - start + 7) % 7
  const from = addDays(first, -lead)
  return Array.from({ length: 6 }, (_week, w) => Array.from({ length: 7 }, (_day, d) => addDays(from, w * 7 + d)))
}

/** @param {string} a @param {string} b */
export const compare = (a, b) => (a < b ? -1 : a > b ? 1 : 0)

/** @param {string} day @param {string | null | undefined} min @param {string | null | undefined} max */
export const within = (day, min, max) => (!min || day >= min) && (!max || day <= max)

/** @param {string} day @param {string | null | undefined} min @param {string | null | undefined} max */
export const clamp = (day, min, max) => (min && day < min ? min : max && day > max ? max : day)

const utc = { timeZone: 'UTC' }
/** '18 Nov 2026' in the user's language. @param {string} day */
export const formatDay = (day) => new Intl.DateTimeFormat(undefined, { ...utc, dateStyle: 'medium' }).format(parse(day) ?? undefined)
/** 'Wednesday 18 November 2026', for screen readers. @param {string} day */
export const speakDay = (day) => new Intl.DateTimeFormat(undefined, { ...utc, dateStyle: 'full' }).format(parse(day) ?? undefined)
/** 'November 2026'. @param {string} day */
export const formatMonth = (day) => new Intl.DateTimeFormat(undefined, { ...utc, month: 'long', year: 'numeric' }).format(parse(day) ?? undefined)
/** Short and long weekday names for a week row of days. @param {string[]} week */
export const weekdayNames = (week) =>
  week.map((day) => ({
    short: new Intl.DateTimeFormat(undefined, { ...utc, weekday: 'narrow' }).format(parse(day) ?? undefined),
    long: new Intl.DateTimeFormat(undefined, { ...utc, weekday: 'long' }).format(parse(day) ?? undefined),
  }))

/**
 * How dates are typed where the user is: the order of day, month and year and the separator, read from the locale's
 * numeric date ('18/11/2026', '11/18/2026', '18.11.2026'), and a placeholder spelling it out ('DD/MM/YYYY').
 * @returns {{ order: ('day' | 'month' | 'year')[], sep: string, placeholder: string }}
 */
export function inputFormat() {
  const parts = new Intl.DateTimeFormat(undefined, { ...utc, day: '2-digit', month: '2-digit', year: 'numeric' }).formatToParts(Date.UTC(2026, 10, 18))
  const order = /** @type {('day' | 'month' | 'year')[]} */ (
    parts.filter((p) => p.type === 'day' || p.type === 'month' || p.type === 'year').map((p) => p.type)
  )
  const sep = parts.find((p) => p.type === 'literal')?.value.trim() || '/'
  const names = { day: 'DD', month: 'MM', year: 'YYYY' }
  return { order, sep, placeholder: order.map((part) => names[part]).join(sep) }
}

/** A day as it is typed, in the locale's numeric form ('18/11/2026'). @param {string} day */
export function formatInput(day) {
  const date = parse(day)
  if (!date) return ''
  const { order, sep } = inputFormat()
  const value = { day: String(date.getUTCDate()).padStart(2, '0'), month: String(date.getUTCMonth() + 1).padStart(2, '0'), year: String(date.getUTCFullYear()) }
  return order.map((part) => value[part]).join(sep)
}

/**
 * Reads a typed date: ISO ('2026-11-18'), or three numbers in the locale's order with any separators ('18/11/2026',
 * '18.11.26', '18 11 2026'). A two-digit year is this century. Returns the ISO day, or null if it isn't a real date.
 * @param {string} text
 */
export function parseInput(text) {
  const typed = text.trim()
  if (!typed) return null
  if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(typed)) {
    const [y, m, d] = typed.split('-')
    return parse(`${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`) ? `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}` : null
  }
  const numbers = typed.split(/\D+/).filter(Boolean)
  if (numbers.length !== 3) return null
  const { order } = inputFormat()
  /** @type {Record<string, string>} */
  const got = Object.fromEntries(order.map((part, i) => [part, numbers[i]]))
  let year = got.year
  if (year.length <= 2) year = String(2000 + Number(year))
  if (year.length !== 4) return null
  const day = `${year}-${got.month.padStart(2, '0')}-${got.day.padStart(2, '0')}`
  return parse(day) ? day : null
}
