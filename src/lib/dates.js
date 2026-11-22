// Calendar dates for the pickers, as ISO strings ('2026-11-18'): a day, not an instant, so no time zone can move it.
// All arithmetic runs in UTC; nothing here reads the local clock except today().

import { attempt } from 'any-date-parser'
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

/** The days of the weekend where the user is, 1 Monday … 7 Sunday, as Intl reports it (default Saturday and Sunday). */
export function weekendDays() {
  try {
    const locale = /** @type {any} */ (new Intl.Locale(navigator.language))
    const info = locale.getWeekInfo?.() ?? locale.weekInfo
    return /** @type {number[]} */ (info?.weekend ?? [6, 7])
  } catch {
    return [6, 7]
  }
}

/** The weeks to draw for a month: 6 rows of 7 ISO days, starting on weekStart (1 Monday … 7 Sunday; by default the
 *  locale's first day of the week).
 *  @param {string} month any day in it @param {number} [weekStart] */
export function monthGrid(month, weekStart = firstDayOfWeek()) {
  const first = monthOf(month)
  const start = ((weekStart % 7) + 7) % 7 // Intl's 7 (Sunday) is getUTCDay's 0
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
/** Whether a value is an ISO moment (with a time) rather than a day. @param {string} value */
const isMoment = (value) => value.length > 10 && !Number.isNaN(new Date(value).getTime())
/** A moment's time where the user is ('15:30'). @param {string} value */
const timeOf = (value) => {
  const date = new Date(value)
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`
}
/** The month's short name in the user's language ('Nov'). @param {string} day */
const shortMonth = (day) => new Intl.DateTimeFormat(undefined, { ...utc, month: 'short' }).format(parse(monthOf(day)) ?? undefined)
/** '3 Nov', from an ISO day. @param {string} day */
const dayMonth = (day) => `${Number(day.slice(8, 10))} ${shortMonth(day)}`

/**
 * A day or moment for reading, with the month's short name: '18 Nov', '18 Nov 2025' (the year only when it isn't this
 * year), '18 Nov 15:30' for a moment (its time where the user is). time: false leaves a moment's time out; year: true or
 * false forces the year in or out.
 * @param {string} value @param {{ time?: boolean, year?: boolean }} [show]
 */
export function formatShort(value, { time = true, year } = {}) {
  const day = dayOf(value)
  const withYear = year ?? day.slice(0, 4) !== today().slice(0, 4)
  const text = `${dayMonth(day)}${withYear ? ` ${day.slice(0, 4)}` : ''}`
  return time && isMoment(value) ? `${text} ${timeOf(value)}` : text
}

/**
 * A span of days or moments for reading, as short as it can be said, the month by its short name and what both ends
 * share written once:
 *   '18 Nov'                      one day
 *   '3–18 Nov'                    one month
 *   '28 Oct – 3 Nov'              one year
 *   '28 Dec 2025 – 3 Jan 2026'    across years
 *   '14:30–16:00 18 Nov'          one day, two times
 *   '17 Nov 14:30 – 18 Nov 09:00' times on different days
 * The year shows once, at the end, when both ends are in the same year but not this one; on both when they differ.
 * time(value): whether to show that end's time (moments only); by default every moment's. One end empty: 'From 3 Nov',
 * 'Until 18 Nov'; both: ''.
 * @param {string} from @param {string} to @param {{ time?: (value: string) => boolean }} [show]
 */
export function formatSpan(from, to, { time = () => true } = {}) {
  if (!from || !to) return from ? `From ${formatShort(from)}` : to ? `Until ${formatShort(to)}` : ''
  const [a, b] = [dayOf(from), dayOf(to)]
  const [yearA, yearB] = [a.slice(0, 4), b.slice(0, 4)]
  const yearAtEnd = yearA !== yearB || yearB !== today().slice(0, 4)
  const end = yearAtEnd ? ` ${yearB}` : ''
  const [timeA, timeB] = [isMoment(from) && time(from), isMoment(to) && time(to)]
  if (a === b) {
    if (timeA && timeB && timeOf(from) !== timeOf(to)) return `${timeOf(from)}–${timeOf(to)} ${dayMonth(b)}${end}`
    return `${dayMonth(b)}${end}${timeA || timeB ? ` ${timeOf(timeA ? from : to)}` : ''}`
  }
  const first = formatShort(from, { time: timeA, year: yearA !== yearB })
  const last = formatShort(to, { time: timeB, year: yearAtEnd })
  if (timeA || timeB || yearA !== yearB) return `${first} – ${last}`
  if (a.slice(5, 7) === b.slice(5, 7)) return `${Number(a.slice(8, 10))}–${last}`
  return `${first} – ${last}`
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
 * Reads a typed date with any-date-parser: numbers day first, whatever the locale ('18/11/2026', '18.11.26',
 * '18 11 2026', '18/11' for this year), ISO ('2026-11-18'), month names ('18 Nov 2026', 'November 18', in English or
 * the user's language) and words ('today', 'tomorrow', '3 days ago'). A missing year is this year. Returns the ISO
 * day, or null if it isn't a real date.
 * @param {string} text
 */
export function parseInput(text) {
  const typed = text.trim()
  if (!typed) return null
  // en-GB reads numbers day first, as the placeholder asks; the user's own locale then catches month names in their
  // language.
  const locales = new Set(['en-GB', ...(typeof navigator === 'undefined' ? [] : [navigator.language])])
  for (const locale of locales) {
    const got = attempt(typed, locale)
    if (got.invalid || !got.day || !got.month) continue
    const year = got.year ?? Number(today().slice(0, 4))
    const day = `${String(year).padStart(4, '0')}-${pad(got.month)}-${pad(got.day)}`
    return parse(day) ? day : null
  }
  return null
}
