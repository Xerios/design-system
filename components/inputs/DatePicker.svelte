<script>
  /**
   * One date: typed, or picked from a calendar under the field.
   *
   *   <DatePicker bind:value={due} id="due" label="Due date" min={today()} />
   *
   * value (bindable): an ISO day ('2026-11-18'), or '' for none. min, max: the first and last day allowed.
   * allowed: the only days that can be chosen (ISO days), or null for any; the calendar strikes out the rest and opens
   * on the nearest one, and typing another is the field's error.
   * Typing: the locale's numeric form ('18/11/2026'; the placeholder shows it), with any separators, two-digit years or
   * ISO; read when the field is left or Enter is pressed. Something that doesn't read, or falls outside min / max, is
   * the field's error until fixed (Esc puts the value back). placeholder: in place of the format.
   * clearable (default true): a ✕ to empty it. error, info, hideLabel, disabled: as on the other fields.
   * A click in the field opens the calendar under it (the focus stays, so typing carries on). Keyboard: ArrowDown in the
   * field, or the calendar button, opens it with the focus on the value (or today); arrows move
   * by day and week, PageUp / PageDown by month (Shift: year), Enter picks and closes, Esc closes.
   * Other attributes and attachments go to the field's wrapper.
   */
  import Calendar from './Calendar.svelte'
  import DateField from './DateField.svelte'
  import DateInput from './DateInput.svelte'
  import { clamp, monthOf, nearest, today, within } from '../../lib/dates.js'

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
   * @property {boolean} [disabled]
   */
  /** @type {Props & Omit<import('svelte/elements').HTMLAttributes<HTMLDivElement>, keyof Props>} */
  let { value = $bindable(''), id, label, min = null, max = null, allowed = null, placeholder, clearable = true, error = '', disabled = false, ...field } = $props()

  /** @type {DateField | undefined} */
  let dateField = $state()
  let open = $state(false)
  let focus = $state(today())
  let month = $state(monthOf(today()))
  /** What's wrong with what was typed, if anything. */
  let typed = $state('')
  const problem = $derived(error || typed)

  /** Opens on the value, or on today (kept within min and max, and moved to the nearest allowed day). */
  function onopen() {
    const day = clamp(today(), min, max)
    focus = value || (allowed && nearest(day, allowed.filter((d) => within(d, min, max)))) || day
    month = monthOf(focus)
  }
</script>

<DateField
  bind:this={dateField}
  {id}
  {label}
  {disabled}
  bind:open
  {onopen}
  hasValue={!!value}
  onclear={clearable ? () => ((value = ''), (typed = '')) : undefined}
  error={problem}
  {...field}
>
  {#snippet inputs()}
    <DateInput
      bind:value
      {id}
      {min}
      {max}
      {allowed}
      {placeholder}
      {disabled}
      errorId={problem && `${id}-error`}
      onopen={(toCalendar) => dateField?.show(toCalendar)}
      onproblem={(m) => (typed = m)}
    />
  {/snippet}
  {#snippet panel(close)}
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
  {/snippet}
</DateField>
