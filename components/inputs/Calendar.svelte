<script>
  /**
   * One month of days to pick from: the grid inside DatePicker and DateRangePicker (use those; this is their part).
   * Days are ISO strings ('2026-11-18'), see lib/dates.js. Weeks start on the user's locale's first day.
   *
   *   <Calendar bind:month bind:focus selected={[value]} onpick={(day) => (value = day)} label="Start date" />
   *
   * month (bindable): any day in the month shown. focus (bindable): the day that holds the keyboard focus.
   * selected: the chosen days. range: [from, to] to tint the days between (a range picker), or null.
   * min, max: the first and last day that can be picked; others show but can't be picked.
   * onpick(day). onpoint(day): the day under the pointer or focus, for a range picker's preview.
   * autofocus: take the focus (on `focus`) when it appears. label: names the grid with the month.
   * Keyboard, as the ARIA date picker grid: arrows move a day or a week, Home / End to the week's ends, PageUp /
   * PageDown a month (with Shift a year), Enter or Space picks. Moving past the month turns the page.
   */
  import { tick } from 'svelte'
  import Button from '../Button.svelte'
  import { addDays, addMonths, monthGrid, monthOf, formatMonth, speakDay, weekdayNames, within, today, compare } from '../../lib/dates.js'

  /**
   * @typedef {object} Props
   * @property {string} month bindable
   * @property {string} focus bindable
   * @property {string[]} [selected]
   * @property {[string, string] | null} [range]
   * @property {string | null} [min]
   * @property {string | null} [max]
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
    min = null,
    max = null,
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
  /** @type {HTMLTableElement | undefined} */
  let table = $state()

  /** Moves the focus to a day, turning the page when it lies in another month. @param {string} day */
  async function moveTo(day) {
    focus = day
    if (monthOf(day) !== monthOf(month)) month = monthOf(day)
    onpoint?.(day)
    await tick()
    table?.querySelector(`[data-day="${day}"]`)?.focus()
  }

  /** The month buttons turn the page and keep the focus; the grid's focus day moves with them. @param {number} n */
  function turn(n) {
    focus = addMonths(focus, n)
    month = monthOf(focus)
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
    if (!within(day, min, max)) return
    focus = day
    onpick(day)
  }

  /** Attachment: takes the focus when the calendar appears, if asked to. @param {HTMLTableElement} node */
  function takeFocus(node) {
    if (autofocus) void tick().then(() => node.querySelector('[tabindex="0"]')?.focus())
  }
</script>

<div class="calendar">
  <span id="{uid}-label" class="sr-only">{label}</span>
  <div class="head">
    <Button iconOnly icon="caretLeft" label="Previous month" onclick={() => turn(-1)} />
    <span id="{uid}-month" class="month" aria-live="polite">{formatMonth(month)}</span>
    <Button iconOnly icon="caretRight" label="Next month" onclick={() => turn(1)} />
  </div>
  <table bind:this={table} role="grid" aria-labelledby="{uid}-label {uid}-month" {onkeydown} {@attach takeFocus}>
    <thead>
      <tr>
        {#each names as name, i (i)}<th scope="col" abbr={name.long}>{name.short}</th>{/each}
      </tr>
    </thead>
    <tbody>
      {#each weeks as week (week[0])}
        <tr>
          {#each week as day (day)}
            {@const inMonth = monthOf(day) === monthOf(month)}
            {@const chosen = selected.includes(day)}
            {@const between = span ? day > span[0] && day < span[1] : false}
            {@const edge = span ? day === span[0] || day === span[1] : false}
            <td role="gridcell" aria-selected={chosen || between || edge}>
              <button
                type="button"
                data-day={day}
                class="day"
                class:outside={!inMonth}
                class:chosen={chosen || edge}
                class:between
                tabindex={day === focus ? 0 : -1}
                aria-label={speakDay(day)}
                aria-current={day === now ? 'date' : undefined}
                aria-disabled={within(day, min, max) ? undefined : 'true'}
                onclick={() => pick(day)}
                onpointerenter={() => onpoint?.(day)}
                onfocus={() => onpoint?.(day)}>{Number(day.slice(8))}</button
              >
            </td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  .calendar {
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
  .month {
    font-weight: var(--w-semibold);
    color: var(--fg);
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
    width: 32px;
    height: 30px;
    padding: 0;
    border: 0;
    border-radius: var(--r);
    background: none;
    color: var(--fg-2);
    font: var(--w-medium) 12px var(--font-data);
    font-variant-numeric: tabular-nums;
    transition: background-color var(--dur-fast) var(--ease-out);
  }
  .day:hover:not([aria-disabled='true']) {
    background: var(--fill-3);
    color: var(--fg);
  }
  .outside {
    color: var(--faint);
  }
  [aria-current='date'] {
    box-shadow: inset 0 0 0 1px var(--accent-line);
  }
  .between {
    border-radius: 0;
    background: var(--accent-soft);
    color: var(--fg);
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
