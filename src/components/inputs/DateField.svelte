<script>
  /**
   * The field the date pickers share: a label, a button showing the value for reading ('3–18 Nov', see formatSpan in
   * lib/dates.js) that opens a panel under it, and the error bubble. The panel starts with a box holding the picker's
   * typed inputs (DateInput) and a clear button while there is a value; the picker's Calendar follows. DatePicker and
   * DateRangePicker fill it; use those.
   *
   *   <DateField {id} {label} bind:open {onopen} text={formatShort(value)} hasValue={!!value} onclear={() => (value = '')} {error}>
   *     {#snippet inputs(close)}<DateInput bind:value id="{id}-typed" data-autofocus … />{/snippet}
   *     {#snippet panel(close)}<Calendar … onpick={(day) => ((value = day), close())} />{/snippet}
   *   </DateField>
   *
   * id: the button's (the label points at it). text: the value as the button shows it; placeholder in its place while
   * it is '' ("Choose a date"). longText: the value with more said (the year), shown instead of text while the button
   * has room for it in full. open (bindable). onopen(): runs as it opens (set the calendar and the inputs on the
   * value). show(): opens it with the focus on the panel's [data-autofocus] element (its text selected, so typing
   * replaces it), else its first focusable day. inputs(close): the typed inputs, in the box at the top of the panel.
   * hasValue + onclear: the clear button at the end of that box (the focus goes to its first input). panel(close): the
   * rest of the panel; close() shuts it and puts the focus back on the button. error, info, note, hideLabel, disabled: as on the
   * other fields. Other attributes and attachments go to the button.
   * Keyboard: Enter, Space, ArrowDown or ArrowUp on the button opens the panel with the focus in it; Esc closes it;
   * tabbing out of the panel closes it.
   */
  import { tick } from 'svelte'
  import Icon from '../Icon.svelte'
  import ErrorMessage from '../ErrorMessage.svelte'
  import FieldLabel from './FieldLabel.svelte'
  import { invalid } from '../../lib/invalid.js'
  import { topLayer } from '../../lib/dom.js'
  import { pop } from '../../lib/motion.js'
  import { tooltip } from '../../lib/tooltip.js'

  /**
   * @typedef {object} Props
   * @property {string} id
   * @property {string} label
   * @property {string} [text]
   * @property {string} [longText]
   * @property {string} [placeholder]
   * @property {boolean} [open] bindable
   * @property {() => void} [onopen]
   * @property {boolean} [hasValue]
   * @property {() => void} [onclear]
   * @property {boolean} [hideLabel]
   * @property {string} [error]
   * @property {string} [info]
   * @property {string} [note] dimmed text after the label, e.g. '(optional)'
   * @property {boolean} [disabled]
   * @property {import('svelte').Snippet<[() => void]>} inputs
   * @property {import('svelte').Snippet<[() => void]>} panel
   */
  /** @type {Props & Omit<import('svelte/elements').HTMLButtonAttributes, keyof Props>} */
  let {
    id,
    label,
    text = '',
    longText = '',
    placeholder = 'Choose a date',
    open = $bindable(false),
    onopen,
    hasValue = false,
    onclear,
    hideLabel = false,
    error = '',
    info = '',
    note = '',
    disabled = false,
    class: className,
    inputs,
    panel,
    ...rest
  } = $props()

  const uid = $props.id()
  const anchor = `--date-${uid}`
  /** @type {HTMLButtonElement | undefined} */
  let button = $state()
  /** @type {HTMLDivElement | undefined} */
  let entry = $state()
  /** @type {HTMLDivElement | undefined} */
  let sheet = $state()

  // The long text, when there is one that says more than text.
  const long = $derived(text && longText && longText !== text ? longText : '')
  /** Whether the long text doesn't fit, so the short one shows in its place. */
  let tight = $state(false)
  /** Attachment for the long text: measures whether it fits, again as the button resizes, the text changes (the
   *  argument) or the fonts load. Both texts keep their place in the layout, so a button sized by its content takes
   *  the long one's width and shows it. @param {string} _text */
  const fit = (_text) => (/** @type {HTMLElement} */ node) => {
    const check = () => (tight = node.scrollWidth > node.clientWidth)
    const observer = new ResizeObserver(check)
    observer.observe(node)
    void document.fonts?.ready.then(check)
    return () => observer.disconnect()
  }

  /** Opens the panel (if it isn't) with the focus on its [data-autofocus] element, else its focus day. */
  export async function show() {
    if (disabled) return
    if (!open) {
      onopen?.()
      open = true
    }
    await tick()
    const target = /** @type {HTMLElement | null | undefined} */ (sheet?.querySelector('[data-autofocus], [tabindex="0"]'))
    target?.focus()
    if (target instanceof HTMLInputElement) target.select()
  }
  /** Closes the panel; with refocus, the focus goes back on the button (at once, so a Tab moves on from there). */
  function close(refocus = true) {
    open = false
    if (refocus) button?.focus()
  }

  /** @param {KeyboardEvent} e */
  function onButtonKey(e) {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    e.preventDefault()
    void show()
  }
  /** @param {KeyboardEvent} e */
  function onPanelKey(e) {
    if (e.key !== 'Escape' || e.defaultPrevented) return
    e.preventDefault()
    e.stopPropagation()
    close()
  }
  /** Tabbing out of the panel closes it; the focus moving into a layer opened from it (a Select's list) doesn't.
   *  @param {FocusEvent} e */
  function onfocusout(e) {
    const to = /** @type {Element | null} */ (e.relatedTarget)
    if (to && !sheet?.contains(to) && !to.closest?.('[data-floating]')) close(false)
  }
  /** A press outside the field and its panel closes it. The label counts as the button, and a layer opened from the
   *  panel (a Select's list, a tip) as the panel. @param {PointerEvent} e */
  const outside = (e) => {
    const target = /** @type {Element} */ (e.target)
    if (open && !sheet?.contains(target) && !button?.contains(target) && !target.closest?.(`label[for="${id}"], [data-floating], .tooltip`)) close(false)
  }
</script>

<svelte:document onpointerdowncapture={outside} />

<div class="field">
  <FieldLabel for={id} id="{id}-label" {label} {note} {info} {hideLabel} />
  <button
    {id}
    bind:this={button}
    type="button"
    class={['trigger', className]}
    style:anchor-name={anchor}
    {...rest}
    {disabled}
    aria-haspopup="dialog"
    aria-expanded={open}
    aria-labelledby="{id}-label {id}"
    {@attach invalid(error && `${id}-error`)}
    onclick={() => (open ? close() : show())}
    onkeydown={onButtonKey}
  >
    <span class="icon"><Icon name="calendar" size="sm" /></span>
    <span class="value" class:placeholder={!text} class:stack={long}>
      {#if long}
        <span class="long" class:hide={tight} {@attach fit(long)}>{long}</span>
        <span class="short" class:hide={!tight}>{text}</span>
      {:else}
        {text || placeholder}
      {/if}
    </span>
    <span class="caret" class:flip={open}><Icon name="caretDown" size="sm" /></span>
  </button>
  {#if open}
    <div
      bind:this={sheet}
      class="panel"
      role="dialog"
      aria-label={label}
      tabindex="-1"
      data-floating
      style:position-anchor={anchor}
      {@attach topLayer(button)}
      transition:pop={{ from: button }}
      onkeydown={onPanelKey}
      {onfocusout}
    >
      <div bind:this={entry} class="entry field-box">
        {@render inputs(() => close())}
        <!-- Kept in place while there is nothing to clear (hidden and disabled), so the box doesn't change width as a
             value comes and goes. -->
        {#if onclear}
          <button
            type="button"
            class="clear"
            class:hidden={!hasValue}
            disabled={!hasValue}
            aria-label="Clear {label}"
            {@attach tooltip('Clear')}
            onclick={() => (onclear(), entry?.querySelector('input')?.focus())}><Icon name="x" size="sm" /></button
          >
        {/if}
      </div>
      {@render panel(() => close())}
    </div>
  {/if}
  <ErrorMessage floating id="{id}-error" message={error} ondismiss={() => button?.focus()} />
</div>

<style>
  .field {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
  }
  /* Raised like Select's button: pressed to open a panel. */
  .trigger {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 120px;
    max-width: 100%;
    min-height: var(--control-h);
    padding: 0 8px;
    border: 1px solid var(--line-strong);
    border-radius: var(--r);
    background: var(--control-2);
    color: var(--fg);
    font: var(--w-medium) 13px var(--font-data);
    font-variant-numeric: tabular-nums;
    text-align: left;
    cursor: pointer;
    --raise: var(--shadow-btn);
    box-shadow: var(--raise);
    transition:
      background-color var(--dur) var(--ease-out),
      border-color var(--dur) var(--ease-out),
      box-shadow var(--dur) var(--ease-out);
  }
  .trigger:hover:not(:disabled) {
    background: var(--control-3);
  }
  .trigger[aria-expanded='true'] {
    background: var(--control-4);
    box-shadow: none;
  }
  .trigger:disabled {
    --raise: 0 0 transparent;
    background: none;
    border-color: var(--line);
    cursor: not-allowed;
  }
  /* The caret stays, faded: it is still a dropdown, just not one that opens now. */
  .trigger:disabled .caret {
    opacity: 0.4;
  }
  /* Focused, it sits flat inside the ring, as Select's does. */
  .trigger:focus-visible {
    border-color: var(--accent-line);
    box-shadow: var(--ring);
    outline: none;
  }
  .trigger:global([aria-invalid='true']) {
    border-color: var(--danger);
  }
  .trigger:global([aria-invalid='true']):focus-visible {
    box-shadow: 0 0 0 2px color-mix(in lch, var(--danger) 30%, transparent);
  }
  .icon {
    flex: none;
    display: inline-flex;
    color: var(--muted);
  }
  .value {
    flex: 1 1 auto;
    min-width: 0;
    overflow: clip;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  /* The long and short text in one cell, one of them hidden: the long one wide enough to size a button that grows with
     its content, and measured (left unclipped) to tell whether it fits. */
  .stack {
    display: grid;
  }
  .stack > span {
    grid-area: 1 / 1;
    min-width: 0;
    white-space: nowrap;
  }
  .short {
    overflow: clip;
    text-overflow: ellipsis;
  }
  .hide {
    visibility: hidden;
  }
  .placeholder {
    font-family: var(--font-body);
    color: var(--muted);
  }
  .caret {
    flex: none;
    display: inline-flex;
    color: var(--muted);
    transition: rotate var(--dur) var(--ease-out);
  }
  .caret.flip {
    rotate: 180deg;
  }
  /* The typed inputs' box, at the top of the panel, with the clear button at its end. */
  .entry {
    display: flex;
    align-items: center;
    gap: 2px;
    min-height: 32px;
    margin-block-end: var(--space-2);
    padding-inline-end: 4px;
  }
  .clear {
    display: inline-grid;
    place-items: center;
    flex: none;
    width: 24px;
    height: 24px;
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: none;
    color: var(--muted);
  }
  .clear.hidden {
    visibility: hidden;
  }
  .clear:hover:not(:disabled) {
    background: var(--control-3);
    color: var(--fg-2);
  }
  /* Anchored under the field, flipping above or to its other side when there's no room. */
  /* No user-select here: the panel holds the typed inputs, and Safari won't type in a field under it (Calendar and the
     hints set their own). */
  .panel {
    position: fixed;
    z-index: calc(var(--z-overlay) + 1);
    position-area: block-end span-inline-end;
    position-try-fallbacks:
      flip-block,
      flip-inline,
      flip-block flip-inline;
    position-visibility: anchors-visible;
    /* A touch to the left of the field, so the panel's content lines up under the field's own (mirrored when it flips
       to end at the field's right edge: a flip swaps the inline margins too), and at least as much wider than it, so it
       overhangs the field's right edge by the same amount. */
    margin-inline-start: calc(var(--space-1) * -1);
    min-width: calc(anchor-size(width) + var(--space-1) * 2);
    margin-block: 4px;
    padding: var(--space-3);
    border: 1px solid var(--line-float);
    border-radius: var(--r-lg);
    background: var(--elevated);
    box-shadow: var(--shadow);
    color: var(--fg);
  }
  @media (forced-colors: active) {
    .panel {
      border-color: CanvasText;
    }
  }
</style>
