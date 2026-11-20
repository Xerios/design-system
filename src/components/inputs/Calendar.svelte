<script>
  /**
   * One month of days to pick from: the grid inside DatePicker and DateRangePicker (use those; this is their part).
   * Days are ISO strings ('2026-11-18'), see lib/dates.js. Weeks start on the user's locale's first day.
   *
   *   <Calendar bind:month bind:focus selected={[value]} onpick={(day) => (value = day)} label="Start date" />
   *
   * month (bindable): any day in the month shown. focus (bindable): the day that holds the keyboard focus.
   * selected: the chosen days. range: [from, to] to tint the days between (a range picker), or null. The range is
   * drawn as one bar per week (Linear's timeline bars): its ends solid, the days between tinted with the brand colour
   * blending out of each end, strongest beside it. pending: the range is still being chosen, its second end following
   * the pointer: only its selected end is solid, and the rest is a proposal, a dashed outline and a tint fading in from
   * that end towards the other (Linear's bar tails).
   * min, max: the first and last day that can be picked; others show but can't be picked.
   * allowed: the only days that can be picked (within min and max), or null for every day.
   * onpick(day). onpoint(day): the day under the pointer or focus, for a range picker's preview.
   * autofocus: take the focus (on `focus`) when it appears. label: names the grid with the month.
   * The previous / next arrows stop at the first and last page holding a day that can be picked.
   * Keyboard, as the ARIA date picker grid: arrows move a day or a week, Home / End to the week's ends, PageUp /
   * PageDown a month (with Shift a year), Enter or Space picks. Moving past the month turns the page.
   * The month and the year in the head are buttons: they swap the grid for the twelve months, or a page of twelve
   * years (picking a year then shows its months, picking a month its days). There, arrows move a cell or a row,
   * PageUp / PageDown a year (or a page of years), Enter or Space picks, Esc goes back to the days.
   */
  import { tick } from 'svelte'
  import Button from '../Button.svelte'
  import DashOutline from '../DashOutline.svelte'
  import { tooltip } from '../../lib/tooltip.js'
  import { addDays, addMonths, monthGrid, monthOf, formatMonth, parse, speakDay, weekdayNames, within, today, compare } from '../../lib/dates.js'

  /**
   * @typedef {object} Props
   * @property {string} month bindable
   * @property {string} focus bindable
   * @property {string[]} [selected]
   * @property {[string, string] | null} [range]
   * @property {boolean} [pending]
   * @property {string | null} [min]
   * @property {string | null} [max]
   * @property {string[] | null} [allowed]
   * @property {(day: string) => void} onpick
   * @property {(day: string) => void} [onpoint]
   * @property {boolean} [autofocus]
   * @property {string} [label]
   */
  /** @type {Props} */
  let {
    month = $bindable(),
    focus = $bindable(),
    selected = [],
    range = null,
    pending = false,
    min = null,
    max = null,
    allowed = null,
    onpick,
    onpoint,
    autofocus = false,
    label = '',
  } = $props()

  const uid = $props.id()
  const now = today()
  const weeks = $derived(monthGrid(month))
  const names = $derived(weekdayNames(weeks[0]))
  const span = $derived(range ? range.toSorted(compare) : null)
  /** Days since the epoch, for counting the days in a range. @param {string} day */
  const dayNumber = (day) => Date.parse(day) / 864e5
  /** While pending: whether the solid (selected) end is the range's first day, so the tail runs forward. */
  const fromStart = $derived(!!span && selected.includes(span[0]))
  /** A range's end shown solid: both ends, or while pending only the selected one. @param {string} day */
  const isEnd = (day) => !!span && (pending ? selected.includes(day) && (day === span[0] || day === span[1]) : day === span[0] || day === span[1])
  /**
   * How strong the brand tint is at a point t of the range (0 its first day, 1 its last), in percent: strongest beside
   * the solid ends and easing off in the middle; while pending, fading in from the solid end towards the pointer.
   * @param {number} t
   */
  const strength = (t) => (pending ? 20 * (fromStart ? t : 1 - t) : 24 - 32 * Math.min(t, 1 - t))
  /** @param {number} p */
  const mix = (p) => `color-mix(in srgb, var(--brand) ${Math.round(p * 10) / 10}%, transparent)`
  /**
   * A day's piece of the tint: a gradient from where the day before left off to where the day after picks up, so the
   * pieces read as one blend along the range, week after week.
   * @param {string} day
   */
  /**
   * Where a pending day's slice of the dashed outline falls: the outline is the whole of this week's bar (from the
   * range's start or the week's first day to its end or the week's last), and the day shows its own part of it, so the
   * dashes run on unbroken from day to day.
   * @param {string} day @param {number} col @param {number} days in the week
   */
  function slice(day, col, days) {
    if (!span) return ''
    const before = Math.min(col, dayNumber(day) - dayNumber(span[0]))
    const after = Math.min(days - 1 - col, dayNumber(span[1]) - dayNumber(day))
    return `--dash-x: calc(var(--day) * ${-before}); --dash-width: calc(var(--day) * ${before + after + 1}); --dash-radius: var(--r)`
  }

  function tint(day) {
    if (!span) return undefined
    const length = Math.max(1, dayNumber(span[1]) - dayNumber(span[0]))
    const at = dayNumber(day) - dayNumber(span[0])
    const clamp = (/** @type {number} */ t) => Math.min(1, Math.max(0, t))
    return `linear-gradient(to right, ${mix(strength(clamp((at - 0.5) / length)))}, ${mix(strength(clamp((at + 0.5) / length)))})`
  }
  /** The allowed days within min and max, or null when every day in them is. */
  const open = $derived(allowed ? allowed.filter((day) => within(day, min, max)) : null)
  const openSet = $derived(open ? new Set(open) : null)
  /** @param {string} day */
  const can = (day) => (openSet ? openSet.has(day) : within(day, min, max))
  /** @type {HTMLTableElement | undefined} */
  let table = $state()
  /** @type {HTMLDivElement | undefined} */
  let root = $state()

  /** What the grid shows: the month's days, the year's months, or a page of twelve years. */
  /** @type {'days' | 'months' | 'years'} */
  let view = $state('days')
  /** The first year on the years page. */
  let yearsFrom = $state(0)

  /** @param {string} day */
  const yearOf = (day) => Number(day.slice(0, 4))
  /** 0 January … 11 December. @param {string} day */
  const monthIndex = (day) => Number(day.slice(5, 7)) - 1
  const utc = { timeZone: 'UTC' }
  const monthNames = Array.from({ length: 12 }, (_m, i) => ({
    short: new Intl.DateTimeFormat(undefined, { ...utc, month: 'short' }).format(Date.UTC(2026, i, 1)),
    long: new Intl.DateTimeFormat(undefined, { ...utc, month: 'long' }).format(Date.UTC(2026, i, 1)),
  }))
  /** The month and the year as the head shows them, in the locale's order ('November', '2026'). */
  const headParts = $derived(
    new Intl.DateTimeFormat(undefined, { ...utc, month: 'long', year: 'numeric' })
      .formatToParts(parse(month) ?? undefined)
      .filter((part) => part.type === 'month' || part.type === 'year'),
  )
  const years = $derived(Array.from({ length: 12 }, (_y, i) => yearsFrom + i))

  /** The focus day moved into month m (0–11) of year y, keeping its day where that month has it. @param {number} y @param {number} m */
  const dayIn = (y, m) => addMonths(focus, (y - yearOf(focus)) * 12 + m - monthIndex(focus))
  /** Whether any day of month m (0–11) of year y can be picked. @param {number} y @param {number} m */
  function monthOpen(y, m) {
    const first = `${y}-${String(m + 1).padStart(2, '0')}-01`
    if (open) return open.some((day) => day.startsWith(first.slice(0, 8)))
    return !(max && first > max) && !(min && addDays(addMonths(first, 1), -1) < min)
  }
  /** @param {number} y */
  const yearOpen = (y) => (open ? open.some((day) => day.startsWith(`${y}-`)) : true) && !(max && `${y}-01-01` > max) && !(min && `${y}-12-31` < min)

  /** Switches the grid and puts the focus on its focus cell. @param {'days' | 'months' | 'years'} next */
  async function showView(next) {
    if (next !== 'days') {
      // The focus day may sit in a neighbouring month's overflow; bring it into the shown one.
      focus = dayIn(yearOf(month), monthIndex(month))
      month = monthOf(focus)
    }
    if (next === 'years') yearsFrom = yearOf(focus) - 4
    view = next
    await tick()
    root?.querySelector('[tabindex="0"]')?.focus()
  }

  /** @param {number} m */
  function pickMonth(m) {
    if (!monthOpen(yearOf(month), m)) return
    focus = dayIn(yearOf(month), m)
    month = monthOf(focus)
    void showView('days')
  }
  /** @param {number} y */
  function pickYear(y) {
    if (!yearOpen(y)) return
    focus = dayIn(y, monthIndex(focus))
    month = monthOf(focus)
    void showView('months')
  }

  /** Moves the focus in the months or years grid (n months), paging the years along. @param {number} n */
  async function moveCell(n) {
    focus = addMonths(focus, n)
    month = monthOf(focus)
    const y = yearOf(focus)
    if (view === 'years' && (y < yearsFrom || y >= yearsFrom + 12)) yearsFrom += Math.floor((y - yearsFrom) / 12) * 12
    await tick()
    root?.querySelector('[tabindex="0"]')?.focus()
  }

  /** @param {KeyboardEvent} e */
  function onCellKey(e) {
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      void showView('days')
      return
    }
    const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -3, ArrowDown: 3, PageUp: -12, PageDown: 12 }[e.key]
    if (!step) return
    e.preventDefault()
    void moveCell(view === 'years' ? step * 12 : step)
  }

  /** Moves the focus to a day, turning the page when it lies in another month. @param {string} day */
  async function moveTo(day) {
    focus = day
    if (monthOf(day) !== monthOf(month)) month = monthOf(day)
    onpoint?.(day)
    await tick()
    table?.querySelector(`[data-day="${day}"]`)?.focus()
  }

  /** The arrow buttons turn the page (a month, a year or twelve years) and keep the focus; the focus day moves with them. */
  /** @param {number} n */
  async function turn(n) {
    if (!canTurn(n)) return
    const months = view === 'days' ? n : view === 'months' ? n * 12 : n * 144
    focus = addMonths(focus, months)
    month = monthOf(focus)
    if (view === 'years') yearsFrom += n * 12
    // Reaching the limit disables the pressed arrow, which drops the focus; hand it to the other one.
    if (!canTurn(n)) {
      await tick()
      root?.querySelector(`[data-turn="${-n}"]`)?.focus()
    }
  }
  /** Whether the page before (-1) or after (1) holds a day that can be picked. @param {number} n */
  function canTurn(n) {
    if (view === 'years') return yearOpen(n < 0 ? yearsFrom - 1 : yearsFrom + 12)
    if (view === 'months') return yearOpen(yearOf(month) + n)
    const next = addMonths(monthOf(month), n)
    return monthOpen(yearOf(next), monthIndex(next))
  }
  const turnLabel = $derived({ days: 'month', months: 'year', years: 'years' }[view])

  /** @param {KeyboardEvent} e */
  function onkeydown(e) {
    const row = weeks.find((week) => week.includes(focus)) ?? weeks[0]
    const next = {
      ArrowLeft: () => addDays(focus, -1),
      ArrowRight: () => addDays(focus, 1),
      ArrowUp: () => addDays(focus, -7),
      ArrowDown: () => addDays(focus, 7),
      Home: () => row[0],
      End: () => row[6],
      PageUp: () => addMonths(focus, e.shiftKey ? -12 : -1),
      PageDown: () => addMonths(focus, e.shiftKey ? 12 : 1),
    }[e.key]
    if (next) {
      e.preventDefault()
      void moveTo(next())
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      pick(focus)
    }
  }

  /** @param {string} day */
  function pick(day) {
    if (!can(day)) return
    focus = day
    onpick(day)
  }

  /** Attachment: takes the focus when the calendar appears, if asked to. @param {HTMLTableElement} node */
  function takeFocus(node) {
    if (autofocus) void tick().then(() => node.querySelector('[tabindex="0"]')?.focus())
  }
</script>

<div bind:this={root} class="calendar">
  <span id="{uid}-label" class="sr-only">{label}</span>
  <span id="{uid}-month" class="sr-only" aria-live="polite">{view === 'years' ? `${yearsFrom} – ${yearsFrom + 11}` : view === 'months' ? yearOf(month) : formatMonth(month)}</span>
  <div class="head">
    <Button iconOnly icon="caretLeft" label="Previous {turnLabel}" data-turn="-1" disabled={!canTurn(-1)} onclick={() => turn(-1)} />
    <span class="title">
      {#if view === 'years'}
        <span class="range">{yearsFrom} – {yearsFrom + 11}</span>
      {:else}
        {#each headParts as part (part.type)}
          {#if part.type === 'month' && view === 'days'}
            <button type="button" class="pick" {@attach tooltip('Choose month')} onclick={() => showView('months')}>{part.value}</button>
          {:else if part.type === 'year'}
            <button type="button" class="pick" {@attach tooltip('Choose year')} onclick={() => showView('years')}>{part.value}</button>
          {/if}
        {/each}
      {/if}
    </span>
    <Button iconOnly icon="caretRight" label="Next {turnLabel}" data-turn="1" disabled={!canTurn(1)} onclick={() => turn(1)} />
  </div>
  {#if view === 'months'}
    <!-- The keys are its buttons' (arrows move between them, Esc goes back to the days). -->
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div class="cells" role="group" aria-labelledby="{uid}-label {uid}-month" onkeydown={onCellKey}>
      {#each monthNames as name, m (m)}
        <button
          type="button"
          class="cell"
          class:chosen={m === monthIndex(month)}
          tabindex={m === monthIndex(focus) ? 0 : -1}
          aria-label="{name.long} {yearOf(month)}"
          aria-current={m === monthIndex(month) ? 'true' : undefined}
          aria-disabled={monthOpen(yearOf(month), m) ? undefined : 'true'}
          onclick={() => pickMonth(m)}>{name.short}</button
        >
      {/each}
    </div>
  {:else if view === 'years'}
    <!-- The keys are its buttons' (arrows move between them, Esc goes back to the days). -->
    <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
    <div class="cells" role="group" aria-labelledby="{uid}-label {uid}-month" onkeydown={onCellKey}>
      {#each years as y (y)}
        <button
          type="button"
          class="cell data"
          class:chosen={y === yearOf(month)}
          tabindex={y === yearOf(focus) ? 0 : -1}
          aria-current={y === yearOf(month) ? 'true' : undefined}
          aria-disabled={yearOpen(y) ? undefined : 'true'}
          onclick={() => pickYear(y)}>{y}</button
        >
      {/each}
    </div>
  {:else}
  <table bind:this={table} role="grid" aria-labelledby="{uid}-label {uid}-month" {onkeydown} {@attach takeFocus}>
    <thead>
      <tr>
        {#each names as name, i (i)}<th scope="col" abbr={name.long}>{name.short}</th>{/each}
      </tr>
    </thead>
    <tbody>
      {#each weeks as week (week[0])}
        <tr>
          {#each week as day, col (day)}
            {@const inMonth = monthOf(day) === monthOf(month)}
            {@const chosen = selected.includes(day)}
            {@const inRange = !!span && day >= span[0] && day <= span[1]}
            {@const edge = isEnd(day)}
            {@const between = inRange && !edge}
            <td role="gridcell" aria-selected={chosen || inRange}>
              <button
                type="button"
                data-day={day}
                class="day"
                class:outside={!inMonth}
                class:chosen={chosen || edge}
                class:between
                class:bar-start={inRange && (day === span?.[0] || col === 0)}
                class:bar-end={inRange && (day === span?.[1] || col === week.length - 1)}
                style:--tint={between ? tint(day) : undefined}
                tabindex={day === focus ? 0 : -1}
                aria-label={speakDay(day)}
                aria-current={day === now ? 'date' : undefined}
                aria-disabled={can(day) ? undefined : 'true'}
                onclick={() => pick(day)}
                onpointerenter={() => onpoint?.(day)}
                onfocus={() => onpoint?.(day)}
                >{Number(day.slice(8))}{#if pending && between}<DashOutline style={slice(day, col, week.length)} />{/if}</button
              >
            </td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
  {/if}
</div>

<style>
  /* A picker: its headings and day names are chrome, not text to copy (base.css). */
  .calendar {
    user-select: none;
    -webkit-user-select: none;
    /* A day's width: the cells sit edge to edge, so a range's outline slices (slice()) line up by it. */
    --day: 32px;
    display: grid;
    gap: var(--space-2);
    width: max-content;
  }
  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
  }
  .title {
    display: flex;
    align-items: center;
    gap: 2px;
    font-weight: var(--w-semibold);
    color: var(--fg);
  }
  .range {
    font-family: var(--font-data);
    font-variant-numeric: tabular-nums;
  }
  .pick {
    min-height: 24px;
    padding: 0 var(--space-1);
    border: 0;
    border-radius: var(--r);
    background: none;
    color: inherit;
    font: inherit;
    transition: background-color var(--dur-fast) var(--ease-out);
  }
  .pick:hover {
    background: var(--control-3);
  }
  .pick:focus-visible,
  .cell:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: -2px;
  }
  /* Twelve months or years, in the width of the day grid (7 × 32px). */
  .cells {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 2px;
    width: 224px;
  }
  .cell {
    min-height: 40px;
    padding: 0;
    border: 0;
    border-radius: var(--r);
    background: none;
    color: var(--fg);
    font: var(--w-medium) 12px var(--font-body);
    transition: background-color var(--dur-fast) var(--ease-out);
  }
  .cell.data {
    font-family: var(--font-data);
    font-variant-numeric: tabular-nums;
  }
  .cell:hover:not([aria-disabled='true']) {
    background: var(--control-3);
  }
  .cell[aria-disabled='true'] {
    color: var(--faint);
    text-decoration: line-through;
    cursor: default;
  }
  table {
    border-collapse: collapse;
  }
  th {
    width: 32px;
    height: 24px;
    font-size: 11px;
    font-weight: var(--w-medium);
    color: var(--muted);
  }
  td {
    padding: 1px 0;
  }
  .day {
    display: grid;
    place-items: center;
    width: var(--day);
    height: 30px;
    padding: 0;
    border: 0;
    border-radius: var(--r);
    background: none;
    color: var(--fg);
    font: var(--w-medium) 12px var(--font-data);
    font-variant-numeric: tabular-nums;
    transition: background-color var(--dur-fast) var(--ease-out);
  }
  .day:hover:not([aria-disabled='true']) {
    background: var(--control-3);
  }
  .outside {
    color: var(--faint);
  }
  [aria-current='date'] {
    box-shadow: inset 0 0 0 1px var(--accent-line);
  }
  /* A range: one bar per week, rounded only where it starts or ends (the range's ends, the week's ends). Between its
     ends, each day's piece of the blended tint (--tint, from tint()); the day under the pointer lights up on top. */
  .day {
    position: relative;
  }
  .between {
    border-radius: 0;
    background: var(--tint);
    color: var(--fg);
  }
  .between:hover:not([aria-disabled='true']) {
    background:
      linear-gradient(var(--control-3), var(--control-3)),
      var(--tint);
  }
  .bar-start {
    border-start-end-radius: 0;
    border-end-end-radius: 0;
  }
  .bar-end {
    border-start-start-radius: 0;
    border-end-start-radius: 0;
  }
  .between.bar-start,
  .chosen.bar-start {
    border-start-start-radius: var(--r);
    border-end-start-radius: var(--r);
  }
  .between.bar-end,
  .chosen.bar-end {
    border-start-end-radius: var(--r);
    border-end-end-radius: var(--r);
  }
  .chosen,
  .chosen:hover:not([aria-disabled='true']) {
    background: var(--brand);
    color: var(--accent-ink);
  }
  .day[aria-disabled='true'] {
    color: var(--faint);
    text-decoration: line-through;
    cursor: default;
  }
  .day:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: -2px;
  }
  @media (forced-colors: active) {
    .chosen {
      background: Highlight;
      color: HighlightText;
    }
    .between {
      outline: 1px solid Highlight;
      outline-offset: -1px;
    }
  }
</style>
