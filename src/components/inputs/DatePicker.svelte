<script>
  /**
   * One date: a button showing it for reading ('18 Nov', with the year when it isn't this year; see formatShort in
   * lib/dates.js) that opens a panel under it, where it is typed or picked from a calendar.
   *
   *   <DatePicker bind:value={due} id="due" label="Due date" min={today()} />
   *
   * value (bindable): an ISO day ('2026-11-18'), or '' for none. min, max: the first and last day allowed.
   * allowed: the only days that can be chosen (ISO days), or null for any; the calendar strikes out the rest and opens
   * on the nearest one, and typing another is an error under the input.
   * Typing, in the input at the top of the panel: DD/MM/YYYY ('18/11/2026'; its placeholder shows it), with any
   * separators, two-digit years or ISO; read when the input is left (the calendar moves to the day) or Enter is pressed
   * (which also closes). Something that doesn't read, or falls outside min / max, is shown under the input until fixed
   * (Esc puts the value back). placeholder: the button's text with no value ("Choose a date").
   * clearable (default true): a ✕ to empty it. error, info, note, hideLabel, disabled: as on the other fields.
   * Keyboard: Enter, Space or ArrowDown on the button opens the panel with the focus in the input, its text selected
   * (typing replaces it); ArrowDown or Tab moves on to the calendar, where arrows move by day and week, PageUp / PageDown
   * by month (Shift: year), Enter picks and closes. Esc closes.
   * Other attributes and attachments go to the button.
   */
  import Calendar from './Calendar.svelte'
  import DateField from './DateField.svelte'
  import DateInput from './DateInput.svelte'
  import ErrorMessage from '../ErrorMessage.svelte'
  import { clamp, formatShort, monthOf, nearest, today, within } from '../../lib/dates.js'

  /**
   * @typedef {object} Props
   * @property {string} [value] bindable
   * @property {string} id
   * @property {string} label
   * @property {string | null} [min]
   * @property {string | null} [max]
   * @property {string[] | null} [allowed]
   * @property {string} [placeholder]
   * @property {boolean} [clearable]
   * @property {boolean} [hideLabel]
   * @property {string} [error]
   * @property {string} [info]
   * @property {string} [note] dimmed text after the label, e.g. '(optional)'
   * @property {boolean} [disabled]
   */
  /** @type {Props & Omit<import('svelte/elements').HTMLButtonAttributes, keyof Props>} */
  let { value = $bindable(''), id, label, min = null, max = null, allowed = null, placeholder, clearable = true, error = '', disabled = false, ...field } = $props()

  /** @type {HTMLDivElement | undefined} */
  let calendar = $state()
  let open = $state(false)
  let focus = $state(today())
  let month = $state(monthOf(today()))
  /** What's wrong with what was typed in the panel, if anything; shown there, under the input. */
  let typed = $state('')

  /** Moves the focus from the input onto the calendar's focus day. */
  const focusCalendar = () => /** @type {HTMLElement | null | undefined} */ (calendar?.querySelector('[tabindex="0"]'))?.focus()

  /** Opens on the value, or on today (kept within min and max, and moved to the nearest allowed day). */
  function onopen() {
    typed = ''
    const day = clamp(today(), min, max)
    focus = value || (allowed && nearest(day, allowed.filter((d) => within(d, min, max)))) || day
    month = monthOf(focus)
  }
</script>

<DateField
  {id}
  {label}
  {disabled}
  bind:open
  {onopen}
  text={value ? formatShort(value) : ''}
  {placeholder}
  hasValue={!!value}
  onclear={clearable ? () => ((value = ''), (typed = '')) : undefined}
  {error}
  {...field}
>
  {#snippet inputs(close)}
    <DateInput
      bind:value
      id="{id}-typed"
      {min}
      {max}
      {allowed}
      aria-label="{label}, typed"
      data-autofocus
      errorId={typed && `${id}-typed-error`}
      onopen={(toCalendar) => toCalendar && focusCalendar()}
      onproblem={(m) => (typed = m)}
      oncommit={(day, enter) => (enter ? close() : day && ((focus = day), (month = monthOf(day))))}
    />
  {/snippet}
  {#snippet panel(close)}
    <div class="picker">
      <ErrorMessage id="{id}-typed-error" message={typed} />
      <div bind:this={calendar}>
        <Calendar
          bind:month
          bind:focus
          {min}
          {max}
          {allowed}
          {label}
          selected={value ? [value] : []}
          onpick={(day) => {
            value = day
            typed = ''
            close()
          }}
        />
      </div>
    </div>
  {/snippet}
</DateField>

<style>
  .picker {
    display: grid;
    gap: var(--space-2);
  }
</style>
