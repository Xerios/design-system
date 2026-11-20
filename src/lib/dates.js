// Calendar dates for the pickers, as ISO strings ('2026-11-18'): a day, not an instant, so no time zone can move it.
// All arithmetic runs in UTC; nothing here reads the local clock except today().

import { runs } from './runs.js'

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

/** The day of `days` nearest before (or on) `day`, else the first after it; null when `days` is empty.
 *  @param {string} day @param {string[]} days */
export function nearest(day, days) {
  const sorted = days.toSorted(compare)
  return sorted.findLast((d) => d <= day) ?? sorted[0] ?? null
}

/**
 * Ready-made spans for DateRangePicker, ending today: [{ label, range() }], range() giving [from, to].
 * @returns {{ label: string, range: () => [string, string] }[]}
 */
export function rangeShortcuts() {
  const now = today()
  /** The last n days, today included. @param {number} n @returns {[string, string]} */
  const last = (n) => [addDays(now, 1 - n), now]
  return [
    { label: 'Last 7 days', range: () => last(7) },
    { label: 'Last 30 days', range: () => last(30) },
    { label: 'Last 60 days', range: () => last(60) },
    { label: 'Last 90 days', range: () => last(90) },
    { label: 'This year', range: () => [`${now.slice(0, 4)}-01-01`, now] },
  ]
}

/** From the first to the last of some dates (sorted), or null for none. @param {string[]} dates @returns {[string, string] | null} */
const span = (dates) => (dates.length ? [dates[0], /** @type {string} */ (dates.at(-1))] : null)

/**
 * Ready-made spans for DateRangeSelect, over its dates (oldest first): [{ label, range(dates) }], range giving
 * [from, to], or null when the dates don't have it. "This month" goes by the local day (dayOf).
 * @returns {{ label: string, range: (dates: string[]) => [string, string] | null }[]}
 */
export function dateListShortcuts() {
  const month = today().slice(0, 7)
  return [
    { label: 'Most recent', range: (dates) => span(dates.slice(-1)) },
    { label: 'Last 3', range: (dates) => (dates.length >= 3 ? span(dates.slice(-3)) : null) },
    { label: 'This month', range: (dates) => span(dates.filter((d) => dayOf(d).startsWith(month))) },
  ]
}

/**
 * A day relative to today, from an id such as '-3d' (3 days ago), '-2w' (2 weeks ago), '-1m' (a month ago) or '+1d'
 * (tomorrow); an ISO day is returned as it is; null for anything else. What a date filter stores when it means "3 days
 * ago" rather than a fixed day, so the filter stays true to its label as the days pass.
 * @param {string} id
 * @returns {string | null}
 */
export function relativeDay(id) {
  if (parse(id)) return id
  const m = /^([+-]\d+)([dwm])$/.exec(id ?? '')
  if (!m) return null
  const n = Number(m[1])
  return m[2] === 'm' ? addMonths(today(), n) : addDays(today(), m[2] === 'w' ? n * 7 : n)
}

/**
 * Ready-made relative days for a date filter (FilterBar): [{ value, label }], value an id for relativeDay.
 * @returns {{ value: string, label: string }[]}
 */
export function datePresets() {
  return [
    { value: '-1d', label: '1 day ago' },
    { value: '-3d', label: '3 days ago' },
    { value: '-1w', label: '1 week ago' },
    { value: '-2w', label: '2 weeks ago' },
    { value: '-1m', label: '1 month ago' },
    { value: '-3m', label: '3 months ago' },
  ]
}

const utc = { timeZone: 'UTC' }
/** '18 Nov 2026' in the user's language. @param {string} day */
export const formatDay = (day) => new Intl.DateTimeFormat(undefined, { ...utc, dateStyle: 'medium' }).format(parse(day) ?? undefined)
/** 'Wednesday 18 November 2026', for screen readers. @param {string} day */
export const speakDay = (day) => new Intl.DateTimeFormat(undefined, { ...utc, dateStyle: 'full' }).format(parse(day) ?? undefined)
/** @param {number} n */
const pad = (n) => String(n).padStart(2, '0')
/** The ISO day a value falls on where the user is: a day as it is, an ISO moment ('2026-11-18T23:30:00Z') by the
 *  local clock. @param {string} value */
export function dayOf(value) {
  const date = value.length > 10 ? new Date(value) : null
  if (!date || Number.isNaN(date.getTime())) return value.slice(0, 10)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}
/** A day as DD/MM/YYYY ('18/11/2026') or, for an ISO moment, with the time where the user is ('18/11/2026 15:30').
 *  time: false leaves a moment's time out; year: false leaves the year out ('18/11').
 *  @param {string} value @param {{ time?: boolean, year?: boolean }} [show] */
export function formatWhen(value, { time = true, year = true } = {}) {
  const day = dayOf(value)
  const text = `${day.slice(8, 10)}/${day.slice(5, 7)}${year ? `/${day.slice(0, 4)}` : ''}`
  const date = value.length > 10 && time ? new Date(value) : null
  return date && !Number.isNaN(date.getTime()) ? `${text} ${pad(date.getHours())}:${pad(date.getMinutes())}` : text
}
/**
 * Splits days or moments, in their order (either way), into a run per month, wherever the month or the year differs
 * from the date before: [{ key: '2026-11', label, items: [{ item, index }] }]. label: the month in full, with the
 * year unless it is this year ('November', 'December 2025'). Moments go by their local day (dayOf).
 * @param {string[]} values
 */
export function monthRuns(values) {
  const year = today().slice(0, 4)
  return runs(values, (value) => dayOf(value).slice(0, 7)).map(({ key, items }) => ({
    key,
    items,
    label: key.startsWith(year)
      ? new Intl.DateTimeFormat(undefined, { ...utc, month: 'long' }).format(parse(`${key}-01`) ?? undefined)
      : formatMonth(`${key}-01`),
  }))
}
/** 'November 2026'. @param {string} day */
export const formatMonth = (day) => new Intl.DateTimeFormat(undefined, { ...utc, month: 'long', year: 'numeric' }).format(parse(day) ?? undefined)
/** Short and long weekday names for a week row of days. @param {string[]} week */
export const weekdayNames = (week) =>
  week.map((day) => ({
    short: new Intl.DateTimeFormat(undefined, { ...utc, weekday: 'narrow' }).format(parse(day) ?? undefined),
    long: new Intl.DateTimeFormat(undefined, { ...utc, weekday: 'long' }).format(parse(day) ?? undefined),
  }))

/**
 * How dates are typed: day, month, year with slashes ('18/11/2026'), whatever the locale (its order differs between
 * countries, so 11/12 would read two ways), and a placeholder spelling it out ('DD/MM/YYYY').
 * @returns {{ order: ('day' | 'month' | 'year')[], sep: string, placeholder: string }}
 */
export function inputFormat() {
  return { order: ['day', 'month', 'year'], sep: '/', placeholder: 'DD/MM/YYYY' }
}

/** A day as it is typed, DD/MM/YYYY ('18/11/2026'). @param {string} day */
export function formatInput(day) {
  const date = parse(day)
  if (!date) return ''
  const { order, sep } = inputFormat()
  const value = { day: String(date.getUTCDate()).padStart(2, '0'), month: String(date.getUTCMonth() + 1).padStart(2, '0'), year: String(date.getUTCFullYear()) }
  return order.map((part) => value[part]).join(sep)
}

/**
 * Reads a typed date: ISO ('2026-11-18'), or three numbers as day, month, year with any separators ('18/11/2026',
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
