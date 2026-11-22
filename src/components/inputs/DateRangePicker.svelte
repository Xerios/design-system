<script>
  /**
   * A span of days: a button showing it for reading ('3–18 Nov 2026', '28 Oct – 3 Nov 2026', dropping this year's number
   * when the button is too narrow for it; see formatSpan in lib/dates.js) that
   * opens a panel under it, where the two ends are typed (from, to) or picked with two presses on a calendar.
   *
   *   <DateRangePicker bind:value={stay} id="stay" label="Dates" min={today()} />
   *
   * value (bindable): [from, to] as ISO days, from ≤ to; ['', ''] for none (either end may be empty while typing).
   * min, max: the first and last day allowed. Typing works as DatePicker's, in the panel's two inputs; ends typed the
   * wrong way round swap. Enter in the first moves on to the second; Enter in the second closes once both are set.
   * placeholder ("Choose dates"), weekStart, clearable, error, info, note, hideLabel, disabled: as DatePicker's.
   * On the calendar the first press starts a new range; while choosing the second, the days up to the pointer (or the
   * keyboard focus) are tinted, and a second press before the first swaps them. Until the second press the inputs show
   * the first day in "from" and nothing in "to" (typing there finishes the range). Closing before the second press keeps
   * the old range. After the first press, screen readers are told to pick the last day. Keyboard: as DatePicker's.
   * shortcuts: ready-made spans beside the calendar, [{ label, range() }] with range() giving [from, to]; one press sets
   * it and closes. Default: Last 7, 30, 60 and 90 days, This year (rangeShortcuts in lib/dates.js); [] for
   * none. A span reaching past min or max is cut to them, and one wholly outside is disabled.
   * Other attributes and attachments go to the button.
   */
  import Calendar from './Calendar.svelte'
  import DateField from './DateField.svelte'
  import DateInput from './DateInput.svelte'
  import RangeShortcuts from './RangeShortcuts.svelte'
  import ErrorMessage from '../ErrorMessage.svelte'
  import { clamp, compare, formatShort, formatSpan, monthOf, rangeShortcuts, today } from '../../lib/dates.js'

  /**
   * @typedef {object} Props
   * @property {[string, string]} [value] bindable
   * @property {string} id
   * @property {string} label
   * @property {string | null} [min]
   * @property {string | null} [max]
   * @property {{ label: string, range: () => [string, string] }[]} [shortcuts]
   * @property {string} [placeholder]
   * @property {number | 'locale'} [weekStart]
   * @property {boolean} [clearable]
   * @property {boolean} [hideLabel]
   * @property {string} [error]
   * @property {string} [info]
   * @property {string} [note] dimmed text after the label, e.g. '(optional)'
   * @property {boolean} [disabled]
   */
  /** @type {Props & Omit<import('svelte/elements').HTMLButtonAttributes, keyof Props>} */
  let {
    value = $bindable(['', '']),
    id,
    label,
    min = null,
    max = null,
    shortcuts = rangeShortcuts(),
    placeholder = 'Choose dates',
    weekStart = 1,
    clearable = true,
    error = '',
    disabled = false,
    ...field
  } = $props()

  /** @type {HTMLDivElement | undefined} */
  let days = $state()
  let open = $state(false)
  let focus = $state(today())
  let month = $state(monthOf(today()))
  /** The first day of a range being chosen on the calendar, until the second press. */
  let first = $state(/** @type {string | null} */ (null))
  /** The day under the pointer or focus while choosing the second. */
  let pointed = $state(/** @type {string | null} */ (null))
  /** What's wrong with what was typed in each end; shown in the panel, under the inputs. */
  let typed = $state(['', ''])
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

  /** Sets one end from typing; ends the wrong way round swap. Typed while the calendar's second press is pending, it
   *  goes with the first day picked (as the inputs show it). @param {0 | 1} end @param {string} day */
  function setEnd(end, day) {
    const base = first ? [first, ''] : value
    first = null
    const next = /** @type {[string, string]} */ (end === 0 ? [day, base[1]] : [base[0], day])
    value = next[0] && next[1] && next[0] > next[1] ? [next[1], next[0]] : next
  }

  /** Moves the focus to an element in the panel (an input's text selected). @param {Element | null | undefined} el */
  function focusOn(el) {
    if (!(el instanceof HTMLElement)) return
    el.focus()
    if (el instanceof HTMLInputElement) el.select()
  }

  /** After a typed end reads, the calendar moves to the day; then `next` (Enter's step: on to the other input, or
   *  closing). @param {string} day @param {(() => void) | null} next */
  function typedEnd(day, next) {
    if (day) {
      focus = day
      month = monthOf(day)
    }
    next?.()
  }

  function onopen() {
    typed = ['', '']
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
      typed = ['', '']
      return
    }
    choose(/** @type {[string, string]} */ ([first, day].toSorted(compare)), close)
  }
</script>

<DateField
  {id}
  {label}
  {disabled}
  bind:open
  {onopen}
  text={formatSpan(value[0], value[1])}
  longText={formatSpan(value[0], value[1], { year: true })}
  {placeholder}
  hasValue={!!(first || value[0] || value[1])}
  onclear={clearable ? () => ((value = ['', '']), (first = null), (typed = ['', ''])) : undefined}
  {error}
  {...field}
>
  {#snippet inputs(close)}
    <!-- While the calendar's second press is pending, the first day shows in "from" and "to" is empty. -->
    <DateInput
      bind:value={() => first ?? value[0], (day) => setEnd(0, day)}
      id="{id}-from"
      {min}
      {max}
      aria-label="{label}, from"
      data-autofocus
      errorId={typed[0] && `${id}-typed-error`}
      onopen={(toCalendar) => toCalendar && focusOn(days?.querySelector('[tabindex="0"]'))}
      onproblem={(m) => (typed = [m, typed[1]])}
      oncommit={(day, enter) => typedEnd(day, enter ? () => focusOn(document.getElementById(`${id}-to`)) : null)}
    />
    <span class="to" aria-hidden="true">–</span>
    <DateInput
      bind:value={() => (first ? '' : value[1]), (day) => setEnd(1, day)}
      id="{id}-to"
      {min}
      {max}
      aria-label="{label}, to"
      errorId={typed[1] && `${id}-typed-error`}
      onopen={(toCalendar) => toCalendar && focusOn(days?.querySelector('[tabindex="0"]'))}
      onproblem={(m) => (typed = [typed[0], m])}
      oncommit={(day, enter) => typedEnd(day, enter ? () => (value[0] && value[1] ? close() : focusOn(document.getElementById(`${id}-from`))) : null)}
    />
  {/snippet}
  {#snippet panel(close)}
    <div class="range" class:split={shortcuts.length > 0}>
      {#if shortcuts.length}
        <RangeShortcuts vertical class="presets" items={presets} {value} onpick={(range) => choose(range, close)} />
      {/if}
      <div class="days" bind:this={days}>
        <ErrorMessage id="{id}-typed-error" message={typed[0] || typed[1]} />
        <p class="sr-only" aria-live="polite">{first ? `From ${formatShort(first)}: pick the last day` : ''}</p>
        <Calendar
          bind:month
          bind:focus
          {min}
          {max}
          {weekStart}
          {label}
          selected={first ? [first] : value.filter(Boolean)}
          range={tint}
          pending={!!first}
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
    user-select: none;
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
