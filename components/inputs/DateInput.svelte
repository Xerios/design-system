<script>
  /**
   * A typed day, the text part of DatePicker and DateRangePicker (use those). It shows the value in the locale's numeric
   * form ('18/11/2026') and reads what is typed when the field is left or Enter is pressed: that form with any
   * separators, two-digit years, or ISO ('2026-11-18'). See lib/dates.js.
   *
   *   <DateInput bind:value {id} {min} {max} errorId={problem && `${id}-error`} onopen={openCalendar} onproblem={(m) => (problem = m)} />
   *
   * value (bindable): the ISO day, '' for none. min, max: the range a typed day must fall in.
   * onproblem(message): what is wrong with what was typed ('' once it reads); the picker shows it as the field's error.
   * onopen(focus): asks for the calendar: a click does (focus false: typing carries on), and ArrowDown does with the
   * focus moving onto it (focus true). errorId: as the invalid attachment's.
   * Esc puts back the value's text after an edit. Other attributes (aria-labelledby, placeholder…) go to the <input>.
   */
  import { composing } from '../../lib/dom.js'
  import { invalid } from '../../lib/invalid.js'
  import { formatDay, formatInput, inputFormat, parseInput, within } from '../../lib/dates.js'

  /**
   * @typedef {object} Props
   * @property {string} [value] bindable
   * @property {string} id
   * @property {string | null} [min]
   * @property {string | null} [max]
   * @property {string | false | null | undefined} [errorId]
   * @property {(focus: boolean) => void} [onopen]
   * @property {(message: string) => void} [onproblem]
   */
  /** @type {Props & Omit<import('svelte/elements').HTMLInputAttributes, keyof Props>} */
  let { value = $bindable(''), id, min = null, max = null, errorId, onopen, onproblem, placeholder, ...rest } = $props()

  const format = inputFormat()

  /** Attachment: the format as the placeholder, set in the browser: the server's locale may write dates another way,
   *  and a placeholder rendered there would stay (hydration keeps attributes as they came). @param {HTMLInputElement} node */
  function showFormat(node) {
    node.placeholder = placeholder ?? inputFormat().placeholder
  }
  // The text in the box: the value's, until it is edited (a writable derived: picking a day elsewhere resets it).
  let text = $derived(value ? formatInput(value) : '')

  /** Reads what was typed; a day that reads becomes the value, anything else is reported and left to fix. */
  function commit() {
    const typed = text.trim()
    if (!typed) {
      onproblem?.('')
      if (value) value = ''
      return
    }
    const day = parseInput(typed)
    if (!day) return onproblem?.(`Enter a date as ${format.placeholder}.`)
    if (!within(day, min, max)) {
      const range =
        min && max ? `from ${formatDay(min)} to ${formatDay(max)}` : min ? `from ${formatDay(min)} on` : `up to ${formatDay(/** @type {string} */ (max))}`
      return onproblem?.(`Pick a day ${range}.`)
    }
    onproblem?.('')
    value = day
    text = formatInput(day)
  }

  /** @param {KeyboardEvent} e */
  function onkeydown(e) {
    // Enter and Esc inside an IME composition belong to the input method.
    if (composing(e)) return
    if (e.key === 'Enter') commit()
    else if (e.key === 'ArrowDown') {
      e.preventDefault()
      onopen?.(true)
    } else if (e.key === 'Escape' && text !== (value ? formatInput(value) : '')) {
      e.preventDefault()
      e.stopPropagation()
      text = value ? formatInput(value) : ''
      onproblem?.('')
    }
  }
</script>

<input
  {id}
  type="text"
  bind:value={text}
  autocomplete="off"
  spellcheck="false"
  {...rest}
  {@attach invalid(errorId)}
  {@attach showFormat}
  onblur={commit}
  onclick={() => onopen?.(false)}
  {onkeydown}
/>

<style>
  input {
    flex: 1;
    width: 100%;
    min-width: 0;
    min-height: 30px;
    padding: 0 var(--space-2);
    border: 0;
    background: none;
    color: var(--fg);
    font: 400 13px var(--font-data);
    font-variant-numeric: tabular-nums;
    outline: none;
  }
  input::placeholder {
    color: var(--faint);
  }
</style>
