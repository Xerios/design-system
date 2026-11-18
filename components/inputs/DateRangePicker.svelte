<script>
  /**
   * A span of days: two typed days (from, to) in one field, or two presses on a calendar under it.
   *
   *   <DateRangePicker bind:value={stay} id="stay" label="Dates" min={today()} />
   *
   * value (bindable): [from, to] as ISO days, from ≤ to; ['', ''] for none (either end may be empty while typing).
   * min, max: the first and last day allowed. Typing works as DatePicker's, in each end; ends typed the wrong way round
   * swap. placeholder, clearable, error, info, hideLabel, disabled: as DatePicker's.
   * On the calendar the first press starts a new range; while choosing the second, the days up to the pointer (or the
   * keyboard focus) are tinted, and a second press before the first swaps them. Closing before the second press keeps
   * the old range. A hint in the panel says which press is next, read out as it changes. Keyboard: as DatePicker's.
   * Other attributes and attachments go to the field's wrapper.
   */
  import Calendar from './Calendar.svelte'
  import DateField from './DateField.svelte'
  import DateInput from './DateInput.svelte'
  import { clamp, compare, formatDay, monthOf, today } from '../../lib/dates.js'

  /**
   * @typedef {object} Props
   * @property {[string, string]} [value] bindable
   * @property {string} id
   * @property {string} label
   * @property {string | null} [min]
   * @property {string | null} [max]
   * @property {string} [placeholder]
   * @property {boolean} [clearable]
   * @property {boolean} [hideLabel]
   * @property {string} [error]
   * @property {string} [info]
   * @property {boolean} [disabled]
   */
  /** @type {Props & Omit<import('svelte/elements').HTMLAttributes<HTMLDivElement>, keyof Props>} */
  let { value = $bindable(['', '']), id, label, min = null, max = null, placeholder, clearable = true, error = '', disabled = false, ...field } = $props()

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
    value = /** @type {[string, string]} */ ([first, day].toSorted(compare))
    first = null
    typed = ['', '']
    close()
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
    <div class="range">
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
  {/snippet}
</DateField>

<style>
  .to {
    flex: none;
    color: var(--muted);
  }
  .range {
    display: grid;
    gap: var(--space-2);
  }
</style>
