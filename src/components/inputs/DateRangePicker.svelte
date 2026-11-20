<script>
  /**
   * A span of days: two typed days (from, to) in one field, or two presses on a calendar under it.
   *
   *   <DateRangePicker bind:value={stay} id="stay" label="Dates" min={today()} />
   *
   * value (bindable): [from, to] as ISO days, from ≤ to; ['', ''] for none (either end may be empty while typing).
   * min, max: the first and last day allowed. Typing works as DatePicker's, in each end; ends typed the wrong way round
   * swap. placeholder, clearable, error, info, note, hideLabel, disabled: as DatePicker's.
   * On the calendar the first press starts a new range; while choosing the second, the days up to the pointer (or the
   * keyboard focus) are tinted, and a second press before the first swaps them. Closing before the second press keeps
   * the old range. A hint in the panel says which press is next, read out as it changes. Keyboard: as DatePicker's.
   * shortcuts: ready-made spans beside the calendar, [{ label, range() }] with range() giving [from, to]; one press sets
   * it and closes. Default: Last 7, 30, 60 and 90 days, This year (rangeShortcuts in lib/dates.js); [] for
   * none. A span reaching past min or max is cut to them, and one wholly outside is disabled.
   * Other attributes and attachments go to the field's wrapper.
   */
  import Calendar from './Calendar.svelte'
  import DateField from './DateField.svelte'
  import DateInput from './DateInput.svelte'
  import RangeShortcuts from './RangeShortcuts.svelte'
  import { clamp, compare, formatDay, monthOf, rangeShortcuts, today } from '../../lib/dates.js'

  /**
   * @typedef {object} Props
   * @property {[string, string]} [value] bindable
   * @property {string} id
   * @property {string} label
   * @property {string | null} [min]
   * @property {string | null} [max]
   * @property {{ label: string, range: () => [string, string] }[]} [shortcuts]
   * @property {string} [placeholder]
   * @property {boolean} [clearable]
   * @property {boolean} [hideLabel]
   * @property {string} [error]
   * @property {string} [info]
   * @property {string} [note] dimmed text after the label, e.g. '(optional)'
   * @property {boolean} [disabled]
   */
  /** @type {Props & Omit<import('svelte/elements').HTMLAttributes<HTMLDivElement>, keyof Props>} */
  let {
    value = $bindable(['', '']),
    id,
    label,
    min = null,
    max = null,
    shortcuts = rangeShortcuts(),
    placeholder,
    clearable = true,
    error = '',
    disabled = false,
    ...field
  } = $props()

  /** @type {DateField | undefined} */
  let dateField = $state()
  let open = $state(false)
  let focus = $state(today())
  let month = $state(monthOf(today()))
  /** The first day of a range being chosen on the calendar, until the second press. */
  let first = $state(/** @type {string | null} */ (null))
  /** The day under the pointer or focus while choosing the second. */
  let pointed = $state(/** @type {string | null} */ (null))
  /** What's wrong with what was typed in each end. */
  let typed = $state(['', ''])
  const problem = $derived(error || typed[0] || typed[1])
  const tint = $derived(/** @type {[string, string] | null} */ (first ? [first, pointed ?? first] : value[0] && value[1] ? [value[0], value[1]] : null))

  /** The shortcuts' spans, cut to min and max; null for one wholly outside them. */
  const presets = $derived(
    shortcuts.map((shortcut) => {
      const [from, to] = shortcut.range()
      const outside = (min && to < min) || (max && from > max)
      return { label: shortcut.label, range: outside ? null : /** @type {[string, string]} */ ([clamp(from, min, max), clamp(to, min, max)]) }
    }),
  )

  /** @param {[string, string]} range @param {() => void} close */
  function choose(range, close) {
    value = range
    first = null
    typed = ['', '']
    close()
  }

  /** Sets one end from typing; ends the wrong way round swap. @param {0 | 1} end @param {string} day */
  function setEnd(end, day) {
    const next = /** @type {[string, string]} */ (end === 0 ? [day, value[1]] : [value[0], day])
    value = next[0] && next[1] && next[0] > next[1] ? [next[1], next[0]] : next
  }

  function onopen() {
    first = null
    pointed = null
    focus = value[0] || clamp(today(), min, max)
    month = monthOf(focus)
  }

  /** @param {string} day @param {() => void} close */
  function pick(day, close) {
    if (!first) {
      first = day
      pointed = day
      return
    }
    choose(/** @type {[string, string]} */ ([first, day].toSorted(compare)), close)
  }
</script>

<span id="{id}-from-name" class="sr-only">from</span>
<span id="{id}-to-name" class="sr-only">to</span>
<DateField
  bind:this={dateField}
  {id}
  {label}
  {disabled}
  calendarLabel="Choose dates"
  bind:open
  {onopen}
  hasValue={!!(value[0] || value[1])}
  onclear={clearable ? () => ((value = ['', '']), (typed = ['', ''])) : undefined}
  error={problem}
  {...field}
>
  {#snippet inputs()}
    <DateInput
      bind:value={() => value[0], (day) => setEnd(0, day)}
      {id}
      {min}
      {max}
      {placeholder}
      {disabled}
      aria-labelledby="{id}-label {id}-from-name"
      errorId={(error || typed[0]) && `${id}-error`}
      onopen={(toCalendar) => dateField?.show(toCalendar)}
      onproblem={(m) => (typed = [m, typed[1]])}
    />
    <span class="to" aria-hidden="true">–</span>
    <DateInput
      bind:value={() => value[1], (day) => setEnd(1, day)}
      id="{id}-end"
      {min}
      {max}
      {placeholder}
      {disabled}
      aria-labelledby="{id}-label {id}-to-name"
      errorId={(error || typed[1]) && `${id}-error`}
      onopen={(toCalendar) => dateField?.show(toCalendar)}
      onproblem={(m) => (typed = [typed[0], m])}
    />
  {/snippet}
  {#snippet panel(close)}
    <div class="range" class:split={shortcuts.length > 0}>
      {#if shortcuts.length}
        <RangeShortcuts vertical class="presets" items={presets} {value} onpick={(range) => choose(range, close)} />
      {/if}
      <div class="days">
        <p class="hint small muted" aria-live="polite">{first ? `From ${formatDay(first)}: pick the last day` : 'Pick the first day'}</p>
        <Calendar
          bind:month
          bind:focus
          {min}
          {max}
          {label}
          selected={first ? [first] : value.filter(Boolean)}
          range={tint}
          onpoint={(day) => first && (pointed = day)}
          onpick={(day) => pick(day, close)}
        />
      </div>
    </div>
  {/snippet}
</DateField>

<style>
  .to {
    flex: none;
    color: var(--muted);
  }
  .range,
  .days {
    display: grid;
    gap: var(--space-2);
  }
  .range.split {
    grid-template-columns: auto auto;
    align-items: start;
    gap: var(--space-3);
  }
  .split > :global(.presets) {
    align-self: stretch;
    padding-inline-end: var(--space-3);
    border-inline-end: 1px solid var(--line);
  }
  @media (max-width: 480px) {
    .range.split {
      grid-template-columns: auto;
    }
    /* Widened over DateField's panel padding (--space-3) so the hairline runs edge to edge. */
    .split > :global(.presets) {
      margin-inline: calc(-1 * var(--space-3));
      padding: 0 var(--space-3) var(--space-2);
      border-inline-end: 0;
      border-block-end: 1px solid var(--line);
    }
  }
</style>
