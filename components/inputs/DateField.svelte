<script>
  /**
   * The field the date pickers share: a label, a box holding the picker's typed inputs (DateInput), a clear button while
   * there is a value, a calendar button that opens a panel under the box, and the error bubble. DatePicker and
   * DateRangePicker put a Calendar in the panel; use those.
   *
   *   <DateField bind:this={field} {id} {label} bind:open {onopen} hasValue={!!value} onclear={() => (value = '')} {error}>
   *     {#snippet inputs()}<DateInput bind:value {id} onopen={() => field.show()} … />{/snippet}
   *     {#snippet panel(close)}<Calendar … onpick={(day) => ((value = day), close())} />{/snippet}
   *   </DateField>
   *
   * id: the first input's (the label points at it). open (bindable). onopen(): runs as it opens (set the calendar on the
   * value). show(focus = true): opens it and, with focus, moves the focus onto the calendar (an input's ArrowDown);
   * a click in an input opens it without, so typing carries on. hasValue + onclear: the clear button. panel(close): the panel's
   * content; close() shuts it and puts the focus back on the calendar button. calendarLabel: that button's name
   * ("Choose a date"). error, info, hideLabel, disabled: as on the other fields. Other attributes and attachments go to
   * the field's wrapper.
   * Keyboard: the calendar button or ArrowDown in an input opens the panel with the focus in it; a click in an input opens
   * it too, leaving the focus there; Esc closes it; tabbing out of the field (or the panel) closes it.
   */
  import { tick } from 'svelte'
  import Icon from '../Icon.svelte'
  import ErrorMessage from '../ErrorMessage.svelte'
  import InfoTip from '../InfoTip.svelte'
  import { topLayer } from '../../lib/dom.js'
  import { pop } from '../../lib/motion.js'
  import { tooltip } from '../../lib/tooltip.js'

  /**
   * @typedef {object} Props
   * @property {string} id
   * @property {string} label
   * @property {boolean} [open] bindable
   * @property {() => void} [onopen]
   * @property {boolean} [hasValue]
   * @property {() => void} [onclear]
   * @property {string} [calendarLabel]
   * @property {boolean} [hideLabel]
   * @property {string} [error]
   * @property {string} [info]
   * @property {boolean} [disabled]
   * @property {import('svelte').Snippet} inputs
   * @property {import('svelte').Snippet<[() => void]>} panel
   */
  /** @type {Props & Omit<import('svelte/elements').HTMLAttributes<HTMLDivElement>, keyof Props>} */
  let {
    id,
    label,
    open = $bindable(false),
    onopen,
    hasValue = false,
    onclear,
    calendarLabel = 'Choose a date',
    hideLabel = false,
    error = '',
    info = '',
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
  let box = $state()
  /** @type {HTMLDivElement | undefined} */
  let sheet = $state()

  /**
   * Opens the panel (if it isn't) and, with `focus`, moves the focus into it: onto its focus day (the element with
   * tabindex 0, or [data-autofocus]). A click in a typed input opens it without, so typing carries on.
   * @param {boolean} [focus]
   */
  export async function show(focus = true) {
    if (disabled) return
    if (!open) {
      onopen?.()
      open = true
    }
    if (!focus) return
    await tick()
    const target = /** @type {HTMLElement | null | undefined} */ (sheet?.querySelector('[data-autofocus], [tabindex="0"]'))
    target?.focus()
  }
  async function close(refocus = true) {
    open = false
    if (refocus) {
      await tick()
      button?.focus()
    }
  }

  /** @param {KeyboardEvent} e */
  function onPanelKey(e) {
    if (e.key !== 'Escape') return
    e.preventDefault()
    e.stopPropagation()
    void close()
  }
  /** Leaving the field with the focus still in the box (the panel open without it) closes the panel too. @param {FocusEvent} e */
  function onBoxFocusOut(e) {
    const to = /** @type {Node | null} */ (e.relatedTarget)
    if (open && to && !sheet?.contains(to) && !box?.contains(to)) void close(false)
  }
  /** Esc in the box (an input) closes an open panel; the focus stays where it is. @param {KeyboardEvent} e */
  function onBoxKey(e) {
    if (e.key !== 'Escape' || !open || e.defaultPrevented) return
    e.preventDefault()
    e.stopPropagation()
    void close(false)
  }
  /** Tabbing out of the panel closes it. @param {FocusEvent} e */
  function onfocusout(e) {
    const to = /** @type {Node | null} */ (e.relatedTarget)
    if (to && !sheet?.contains(to) && !box?.contains(to)) void close(false)
  }
  /** A press outside the field and its panel closes it. @param {PointerEvent} e */
  const outside = (e) => {
    const target = /** @type {Element} */ (e.target)
    if (open && !sheet?.contains(target) && !box?.contains(target) && !target.closest?.(`label[for="${id}"]`)) void close(false)
  }
</script>

<svelte:document onpointerdowncapture={outside} />

<div class={['field', className]} {...rest}>
  {#snippet fieldLabel()}<label for={id} class="field-label" class:sr-only={hideLabel} id="{id}-label">{label}</label>{/snippet}
  {#if info}
    <div class="field-head">{@render fieldLabel()}<InfoTip lines={[{ text: info }]} label="About {label}" /></div>
  {:else}
    {@render fieldLabel()}
  {/if}
  <!-- The keys and focus are its inputs'; the box only listens for Esc and for the focus leaving. -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div bind:this={box} class="box field-box" class:disabled style:anchor-name={anchor} onfocusout={onBoxFocusOut} onkeydown={onBoxKey}>
    {@render inputs()}
    {#if onclear && hasValue && !disabled}
      <button type="button" class="tool" aria-label="Clear {label}" {@attach tooltip('Clear')} onclick={() => (onclear(), box?.querySelector('input')?.focus())}
        ><Icon name="x" size="sm" /></button
      >
    {/if}
    <button
      bind:this={button}
      type="button"
      class="tool"
      {disabled}
      aria-label="{calendarLabel}, {label}"
      aria-haspopup="dialog"
      aria-expanded={open}
      {@attach tooltip(calendarLabel)}
      onclick={() => (open ? close() : show(true))}><Icon name="calendar" size="sm" /></button
    >
  </div>
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
      transition:pop={{ from: box }}
      onkeydown={onPanelKey}
      {onfocusout}
    >
      {@render panel(() => void close())}
    </div>
  {/if}
  <ErrorMessage floating id="{id}-error" message={error} ondismiss={() => box?.querySelector('input')?.focus()} />
</div>

<style>
  .field {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
  }
  .box {
    display: flex;
    align-items: center;
    gap: 2px;
    min-height: 32px;
    padding-inline: var(--space-1);
  }
  .box.disabled {
    opacity: 0.5;
  }
  .tool {
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
  .tool:hover:not(:disabled),
  .tool[aria-expanded='true'] {
    background: var(--control-3);
    color: var(--fg-2);
  }
  /* Anchored under the field, flipping above or to its other side when there's no room. */
  .panel {
    position: fixed;
    z-index: calc(var(--z-overlay) + 1);
    position-area: block-end span-inline-end;
    position-try-fallbacks:
      flip-block,
      flip-inline,
      flip-block flip-inline;
    position-visibility: anchors-visible;
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
