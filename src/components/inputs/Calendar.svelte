<script>
  /**
   * One month of days to pick from: the grid inside DatePicker and DateRangePicker (use those; this is their part).
   * Days are ISO strings ('2026-11-18'), see lib/dates.js.
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
   * A hairline runs down the grid where the workdays meet the weekend (the user's locale's, Saturday and Sunday by
   * default).
   * weekStart: the day weeks start on, 1 Monday (the default) … 7 Sunday, or 'locale' for the user's locale's first day.
   * autofocus: take the focus (on `focus`) when it appears. label: names the grid with the month.
   * The previous / next arrows stop at the first and last page holding a day that can be picked. The mouse wheel or a
   * trackpad turns the pages too (down: next, up: previous), with the same stops.
   * Keyboard, as the ARIA date picker grid: arrows move a day or a week, Home / End to the week's ends, PageUp /
   * PageDown a month (with Shift a year), Enter or Space picks. Moving past the month turns the page.
   * The month and the year in the head are dropdowns (Select, ghost): the months that hold a day that can be picked,
   * and the years from min to max (without them, 3 years back to 1 ahead, and the year shown when it is further), with
   * a search field when there are more than 8. Picking a year whose
   * month has nothing to pick moves to its nearest month that does. Keyboard in them: as Select's.
   */
  import { tick, untrack } from 'svelte'
  import Button from '../Button.svelte'
  import DashOutline from '../DashOutline.svelte'
  import Select from './Select.svelte'
  import { durations, motion } from '../../lib/motion.js'
  import { addDays, addMonths, firstDayOfWeek, weekday, weekendDays, monthGrid, monthOf, formatMonth, parse, speakDay, weekdayNames, within, today, compare } from '../../lib/dates.js'

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
   * @property {number | 'locale'} [weekStart]
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
    weekStart = 1,
    autofocus = false,
    label = '',
  } = $props()

  const uid = $props.id()
  const now = today()
  const weeks = $derived(monthGrid(month, weekStart === 'locale' ? firstDayOfWeek() : weekStart))
  const names = $derived(weekdayNames(weeks[0]))
  const weekend = new Set(weekendDays())
  /** Per column: whether it is a weekend day (as Intl numbers them, Sunday 7). */
  const weekendCols = $derived(weeks[0].map((day) => weekend.has(weekday(day) || 7)))
  /** Whether a hairline runs down a column's start: where the workdays and the weekend meet. @param {number} col */
  const split = (col) => col > 0 && weekendCols[col] !== weekendCols[col - 1]
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

  /*
   * Turning the page scrolls the grid, as one strip of weeks. Two months next to each other share a week or two: those
   * glide from where they were to where they are now, the weeks leaving fade out under the day names and the new ones
   * slide in. A jump with no week in common (another month or year picked) slides by the whole grid, the way the months
   * run: a later month comes up from below, an earlier one down from above.
   * The strip is two copies of the grid (the old one, copied before the update, and the new one) in a clipped layer
   * over the real grid, which stays in place, unseen (opacity, so its focus stays), for keys and the pointer. Another
   * turn mid-way cuts it short and starts again from the real grid. Nothing under reduced motion.
   */
  /** The page shown ('2026-11-01'). */
  const pageKey = () => monthOf(month)
  /** The grid the page is drawn in (the days' tbody). */
  const grid = () => /** @type {HTMLElement | null | undefined} */ (root?.querySelector('[data-page]'))
  /** Where each cell of a grid sits, by its data-key. @param {HTMLElement} page */
  const cellTops = (page) => new Map([...page.querySelectorAll('[data-key]')].map((cell) => [cell.getAttribute('data-key'), cell.getBoundingClientRect().top]))
  /** A copy of a grid to lay in the layer: a tbody inside a copy of its table (no rows), anything else on its own.
   *  @param {HTMLElement} page */
  function copyOf(page) {
    const copy = /** @type {HTMLElement} */ (page.cloneNode(true))
    copy.style.opacity = ''
    if (page.tagName !== 'TBODY') return copy
    const shell = /** @type {HTMLElement} */ (/** @type {HTMLElement} */ (page.parentElement).cloneNode(false))
    shell.append(copy)
    return shell
  }

  /** The page before it turned: its key, a copy of its grid, and where its cells sat. */
  /** @type {{ key: string, copy: HTMLElement, tops: Map<string | null, number> } | null} */
  let before = null
  /** The turn playing now, to cut short. @type {{ layer: HTMLElement, page: HTMLElement } | null} */
  let turning = null
  /** The page the grid shows, as of the last update (by the time the pre-effect runs, the state is already the next). */
  /** @type {string | null} */
  let shown = null

  function settle() {
    if (!turning) return
    turning.layer.remove()
    turning.page.style.opacity = ''
    turning = null
  }

  // Before the DOM updates for a new page: copy the grid as it still is.
  $effect.pre(() => {
    pageKey()
    untrack(() => {
      settle()
      const page = grid()
      before = shown && page ? { key: shown, copy: copyOf(page), tops: cellTops(page) } : null
    })
  })
  $effect(() => {
    const key = pageKey()
    untrack(() => {
      scrollPage(key)
      shown = key
    })
  })

  /** @param {string} key the page now shown */
  function scrollPage(key) {
    const from = before
    before = null
    const page = grid()
    const duration = motion(durations.medium1)
    if (!from || from.key === key || !page || !root || !duration) return
    // How far the strip moved: by a cell both pages show (the new page's first, or the old page's first), else by the
    // whole grid and the gap between its rows, in the direction the pages run.
    const tops = cellTops(page)
    const [first] = tops.keys()
    const [oldFirst] = from.tops.keys()
    const gap = parseFloat(getComputedStyle(page).rowGap) || 0
    const forward = from.key < key
    const shift = from.tops.has(first)
      ? /** @type {number} */ (from.tops.get(first)) - /** @type {number} */ (tops.get(first))
      : tops.has(oldFirst)
        ? /** @type {number} */ (from.tops.get(oldFirst)) - /** @type {number} */ (tops.get(oldFirst))
        : (forward ? 1 : -1) * (page.offsetHeight + gap)
    if (!shift) return

    const box = root.getBoundingClientRect()
    const area = page.getBoundingClientRect()
    const layer = document.createElement('div')
    layer.setAttribute('aria-hidden', 'true')
    layer.inert = true
    Object.assign(layer.style, {
      position: 'absolute',
      left: `${area.left - box.left}px`,
      top: `${area.top - box.top}px`,
      width: `${area.width}px`,
      height: `${area.height}px`,
      overflow: 'clip',
      pointerEvents: 'none',
    })
    /** Lays a copy at the top of the layer. @param {HTMLElement} copy */
    const strip = (copy) => {
      Object.assign(copy.style, { position: 'absolute', top: '0', left: '0', width: '100%', margin: '0' })
      layer.append(copy)
      return copy
    }
    const old = strip(from.copy)
    const now = strip(copyOf(page))
    root.append(layer)
    page.style.opacity = '0'
    const run = { layer, page }
    turning = run
    // M3's standard curve (easings.standard.standard): the pages begin and end on screen.
    const timing = { duration, easing: 'cubic-bezier(0.2, 0, 0, 1)' }
    old.animate([{ translate: '0 0', opacity: 1 }, { translate: `0 ${-shift}px`, opacity: 0 }], timing)
    now.animate([{ translate: `0 ${shift}px` }, { translate: '0 0' }], timing).finished.then(
      () => turning === run && settle(),
      () => {},
    )
  }

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

  /** The months of the shown year that hold a day to pick (and the shown one), for the month dropdown. */
  const monthOptions = $derived(
    monthNames.map((name, m) => ({ value: m, label: name.long })).filter(({ value: m }) => m === monthIndex(month) || monthOpen(yearOf(month), m)),
  )
  /** The years from min to max (without them, 3 back and 1 ahead, stretched to the year shown) that hold a day to pick,
   *  for the year dropdown. */
  const yearOptions = $derived.by(() => {
    const shown = yearOf(month)
    const first = min ? yearOf(min) : Math.min(yearOf(now) - 3, shown)
    const last = max ? yearOf(max) : Math.max(yearOf(now) + 1, shown)
    return Array.from({ length: Math.max(0, last - first + 1) }, (_y, i) => first + i)
      .filter((y) => y === shown || yearOpen(y))
      .map((y) => ({ value: y, label: String(y) }))
  })

  /** @param {number} m */
  function pickMonth(m) {
    focus = dayIn(yearOf(month), m)
    month = monthOf(focus)
  }
  /** Moves to year y, in the same month, or the nearest one that holds a day to pick. @param {number} y */
  function pickYear(y) {
    const want = monthIndex(month)
    const months = [...Array(12).keys()].filter((m) => monthOpen(y, m))
    const m = months.length ? months.reduce((best, m) => (Math.abs(m - want) < Math.abs(best - want) ? m : best)) : want
    focus = dayIn(y, m)
    month = monthOf(focus)
  }

  /** Moves the focus to a day, turning the page when it lies in another month. @param {string} day */
  async function moveTo(day) {
    focus = day
    if (monthOf(day) !== monthOf(month)) month = monthOf(day)
    onpoint?.(day)
    await tick()
    table?.querySelector(`[data-day="${day}"]`)?.focus()
  }

  /** The arrow buttons turn the page a month and keep the focus; the focus day moves with them. */
  /** @param {number} n */
  async function turn(n) {
    if (!canTurn(n)) return
    const arrow = root?.querySelector(`[data-turn="${n}"]`)
    const pressed = !!arrow && arrow === document.activeElement
    focus = addMonths(focus, n)
    month = monthOf(focus)
    // Reaching the limit disables the pressed arrow, which drops the focus; hand it to the other one.
    if (pressed && !canTurn(n)) {
      await tick()
      root?.querySelector(`[data-turn="${-n}"]`)?.focus()
    }
  }
  /** Whether the page before (-1) or after (1) holds a day that can be picked. @param {number} n */
  function canTurn(n) {
    const next = addMonths(monthOf(month), n)
    return monthOpen(yearOf(next), monthIndex(next))
  }

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

  /**
   * Attachment: the wheel turns the page, down to the next month (as the arrows do) and up to the previous, stopping where they do. The wheel's travel adds up to a notch before a page turns, and a turn
   * waits for the last one's scroll to play out (about four a second), so a trackpad's glide doesn't race through the
   * months. Not passive: the page behind
   * doesn't scroll while the pointer is over the calendar. A pinch (ctrlKey) is left to zoom.
   * @param {HTMLElement} node
   */
  function wheelTurns(node) {
    let travel = 0
    let last = 0
    /** @param {WheelEvent} e */
    const onwheel = (e) => {
      if (e.ctrlKey || Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return
      e.preventDefault()
      travel += e.deltaMode === WheelEvent.DOM_DELTA_LINE ? e.deltaY * 16 : e.deltaMode === WheelEvent.DOM_DELTA_PAGE ? e.deltaY * 400 : e.deltaY
      // One turn at a time: as long as a turn's scroll plays.
      if (Math.abs(travel) < 50 || e.timeStamp - last < durations.medium1) return
      last = e.timeStamp
      const n = Math.sign(travel)
      travel = 0
      void turn(n)
    }
    node.addEventListener('wheel', onwheel, { passive: false })
    return () => node.removeEventListener('wheel', onwheel)
  }

  /** Attachment: takes the focus when the calendar appears, if asked to. @param {HTMLTableElement} node */
  function takeFocus(node) {
    if (autofocus) void tick().then(() => node.querySelector('[tabindex="0"]')?.focus())
  }
</script>

<div bind:this={root} class="calendar" {@attach wheelTurns}>
  <span id="{uid}-label" class="sr-only">{label}</span>
  <span id="{uid}-month" class="sr-only" aria-live="polite">{formatMonth(month)}</span>
  <div class="head">
    <Button iconOnly icon="caretLeft" label="Previous month" data-turn="-1" disabled={!canTurn(-1)} onclick={() => turn(-1)} />
    <!-- The month and the year, in the locale's order. -->
    <span class="title">
      {#each headParts as part (part.type)}
        {#if part.type === 'month'}
          <Select class="head-pick" ghost hideLabel search={false} id="{uid}-month-pick" label="Month" options={monthOptions} bind:value={() => monthIndex(month), pickMonth} />
        {:else}
          <Select class="head-pick data" ghost hideLabel id="{uid}-year-pick" label="Year" options={yearOptions} bind:value={() => yearOf(month), pickYear} />
        {/if}
      {/each}
    </span>
    <Button iconOnly icon="caretRight" label="Next month" data-turn="1" disabled={!canTurn(1)} onclick={() => turn(1)} />
  </div>
  <table bind:this={table} role="grid" aria-labelledby="{uid}-label {uid}-month" {onkeydown} {@attach takeFocus}>
    <thead>
      <tr>
        {#each names as name, i (i)}<th scope="col" abbr={name.long} class:split={split(i)}>{name.short}</th>{/each}
      </tr>
    </thead>
    <tbody data-page>
      {#each weeks as week (week[0])}
        <tr>
          {#each week as day, col (day)}
            {@const inMonth = monthOf(day) === monthOf(month)}
            {@const chosen = selected.includes(day)}
            {@const inRange = !!span && day >= span[0] && day <= span[1]}
            {@const edge = isEnd(day)}
            {@const between = inRange && !edge}
            <td role="gridcell" aria-selected={chosen || inRange} class:split={split(col)}>
              <button
                type="button"
                data-day={day}
                data-key={day}
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
</div>

<style>
  /* A picker: its headings and day names are chrome, not text to copy (base.css). */
  .calendar {
    user-select: none;
    -webkit-user-select: none;
    /* A day's width: the cells sit edge to edge, so a range's outline slices (slice()) line up by it. */
    --day: 32px;
    /* Holds the layer the weeks scroll in as the page turns. */
    position: relative;
    display: grid;
    gap: var(--space-2);
    /* As wide as the days, whatever the month: the panel keeps its size as the pages turn. */
    width: calc(var(--day) * 7);
  }
  .head {
    display: flex;
    align-items: center;
    gap: 2px;
  }
  .title {
    flex: 1 1 auto;
    display: flex;
    align-items: center;
    gap: 2px;
    min-width: 0;
  }
  /* The month's dropdown takes the room the year's leaves, so a long month name doesn't widen the head. */
  .title > :global(.field:has(.head-pick:not(.data))) {
    flex: 1 1 0;
  }
  /* The month and year dropdowns: ghost Selects, as tight as the head needs (a Select's button is 120px at least). */
  .title :global(.trigger.head-pick) {
    gap: 6px;
    min-width: 0;
    min-height: 28px;
    padding: 0 4px 0 8px;
    font-weight: var(--w-semibold);
  }
  .title :global(.trigger.head-pick.data) {
    font-family: var(--font-data);
    font-variant-numeric: tabular-nums;
  }
  table {
    border-collapse: collapse;
  }
  /* A hairline under the day names, across the grid. */
  th {
    width: 32px;
    height: 24px;
    border-bottom: 1px solid var(--line);
    font-size: 11px;
    font-weight: var(--w-medium);
    color: var(--faint);
  }
  td {
    padding: 1px 0;
  }
  tbody tr:first-child td {
    padding-top: 4px;
  }
  /* A hairline down the grid where the workdays meet the weekend, drawn inside the cell's edge so it takes no width
     (a range's bar and its outline slices stay a day wide); a day's fill (hover, chosen, a range) covers it. */
  .split {
    box-shadow: inset 1px 0 var(--line);
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
