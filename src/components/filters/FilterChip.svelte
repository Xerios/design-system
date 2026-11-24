<script>
  /**
   * One applied filter as a joined pill (Linear's filter chips): the field it looks at, the condition, the value and a ✕,
   * split by hairlines. The condition opens a menu of the others; the value opens a panel under it with whatever edits
   * it (an OptionList, a calendar…); the ✕ removes the filter. FilterBar draws these from data; use one directly for a
   * filter row of your own.
   *
   *   <FilterChip field={{ label: 'Status', icon: 'circleDashed' }} operator="is" operators={['is', 'is not']}
   *     onoperator={(op) => (f.op = op)} onremove={() => remove(f)}>
   *     {#snippet value()}<Icon name="checkCircle" size="sm" />Done{/snippet}
   *     {#snippet panel({ close })}<OptionList bind:value={f.value} options={STATUSES} label="Status" />{/snippet}
   *   </FilterChip>
   *
   * field: { label, icon? } (an Icon name). operator: the condition shown ("is", "after"). operators: the conditions it
   * can switch to; with more than one the condition is a button opening them as a menu (the context menu layer, so mount
   * <ContextMenu />), else plain text. onoperator(op). onremove(): the ✕ (removeLabel names it, default "Remove filter").
   * open (bindable): whether the value's panel is open. onclose(): after the panel closes, however it closed.
   * value: snippet drawing the value on its button. panel: snippet ({ close }) drawing the editor in the panel; close()
   * closes it and puts the focus back on the value.
   * focus(): puts the focus on the value button.
   * Keyboard: each part is a button in the tab order. On the value, Enter, Space or ArrowDown opens the panel; Esc in it
   * closes it, and Tab past its last control closes it and moves on. The group is named by its parts ("Status is Done").
   * Other attributes (class…) and attachments go to the group.
   */
  import Icon from '../Icon.svelte'
  import AnchoredPanel from '../AnchoredPanel.svelte'
  import { tooltip } from '../../lib/tooltip.js'
  import { menu, openMenuFrom, closeMenu } from '../../lib/menu.svelte.js'

  /**
   * @typedef {object} Props
   * @property {{ label: string, icon?: string }} field
   * @property {string} operator
   * @property {string[]} [operators]
   * @property {(op: string) => void} [onoperator]
   * @property {() => void} onremove
   * @property {string} [removeLabel]
   * @property {boolean} [open] bindable
   * @property {() => void} [onclose]
   * @property {import('svelte').Snippet} value
   * @property {import('svelte').Snippet<[{ close: () => void }]>} [panel]
   */
  /** @type {Props & Omit<import('svelte/elements').HTMLAttributes<HTMLDivElement>, keyof Props>} */
  let {
    field,
    operator,
    operators = [],
    onoperator,
    onremove,
    removeLabel = 'Remove filter',
    open = $bindable(false),
    onclose,
    value,
    panel,
    class: className,
    ...rest
  } = $props()

  const uid = $props.id()
  /** @type {HTMLButtonElement | undefined} */
  let valueButton = $state()
  /** @type {HTMLButtonElement | undefined} */
  let opButton = $state()
  const choosable = $derived(operators.length > 1)
  const opOpen = $derived(menu.open && !!opButton && menu.trigger === opButton)

  export function focus() {
    valueButton?.focus()
  }

  /** @param {boolean} refocus */
  function close(refocus) {
    if (!open) return
    open = false
    if (refocus) valueButton?.focus()
    onclose?.()
  }

  /** @param {MouseEvent} e */
  function toggleOperators(e) {
    e.stopPropagation()
    if (opOpen) return closeMenu()
    if (!opButton) return
    openMenuFrom(
      opButton,
      operators.map((op) => ({ label: op, checked: op === operator, action: () => onoperator?.(op) })),
      `${field.label} condition`,
    )
  }

  /** @param {KeyboardEvent} e */
  function onValueKey(e) {
    if (e.key === 'ArrowDown' && !open && panel) {
      e.preventDefault()
      open = true
    }
  }
</script>

<div class={['filter-chip', className]} role="group" aria-labelledby="{uid}-field {uid}-op {uid}-value" {...rest}>
  <span class="seg field" id="{uid}-field">
    {#if field.icon}<Icon name={field.icon} size="sm" />{/if}
    {field.label}
  </span>
  {#if choosable}
    <button
      bind:this={opButton}
      type="button"
      class="seg op"
      id="{uid}-op"
      aria-haspopup="menu"
      aria-expanded={opOpen}
      {@attach tooltip('Change condition')}
      onclick={toggleOperators}>{operator}</button
    >
  {:else}
    <span class="seg op" id="{uid}-op">{operator}</span>
  {/if}
  <button
    bind:this={valueButton}
    type="button"
    class="seg value"
    id="{uid}-value"
    aria-haspopup={panel ? 'dialog' : undefined}
    aria-expanded={panel ? open : undefined}
    disabled={!panel}
    onclick={() => (open ? close(true) : (open = true))}
    onkeydown={onValueKey}>{@render value()}</button
  >
  <button type="button" class="seg remove" aria-label={removeLabel} {@attach tooltip(removeLabel)} onclick={onremove}>
    <Icon name="x" size="sm" />
  </button>
</div>

{#if open && panel && valueButton}
  <AnchoredPanel anchor={valueButton} label={field.label} onclose={close}>
    {@render panel({ close: () => close(true) })}
  </AnchoredPanel>
{/if}

<style>
  /* Segments on one light control fill, split by hairlines that run the pill's full height. */
  /* Chrome, not content: its field name and condition are plain spans, which base.css doesn't cover. */
  .filter-chip {
    user-select: none;
    display: inline-flex;
    align-items: stretch;
    flex: none;
    max-width: 100%;
    min-height: 26px;
    border-radius: var(--r-sm);
    background: var(--control-2);
    font: var(--w-medium) 12px/14px var(--font-body);
    white-space: nowrap;
  }
  .seg {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    padding: 0 var(--space-2);
    border: 0;
    border-radius: 0;
    background: none;
    color: var(--fg-2);
    font: inherit;
    transition:
      background-color var(--dur) var(--ease-out),
      color var(--dur) var(--ease-out);
  }
  .seg + .seg {
    border-inline-start: 1px solid var(--line);
  }
  .seg:first-child {
    border-start-start-radius: inherit;
    border-end-start-radius: inherit;
  }
  .seg:last-child {
    border-start-end-radius: inherit;
    border-end-end-radius: inherit;
  }
  .field :global(.icon) {
    color: var(--muted);
  }
  /* As readable as the field name beside it (it is a button too); hovering changes only the fill. */
  .op {
    color: var(--fg-2);
  }
  /* clip, not hidden: an element with overflow: hidden is a scroll container, which Chrome may put on a layer of its own
     while the pointer is over it, redrawing its text with other smoothing (the text seems to shift as it is hovered). */
  .value {
    max-width: 280px;
    overflow: clip;
    color: var(--fg);
  }
  /* An icon may brighten as it is hovered (no text to shift). */
  .remove:hover,
  .remove:active {
    color: var(--fg);
  }
  .remove {
    justify-content: center;
    min-width: 26px;
    padding: 0;
    color: var(--muted);
  }
  button.seg {
    cursor: pointer;
  }
  button.seg:hover:not(:disabled) {
    background: var(--control-3);
  }
  button.seg:active:not(:disabled),
  button.seg[aria-expanded='true'] {
    background: var(--control-4);
  }
  .value:disabled {
    cursor: default;
  }
  /* Inside the pill, so the next segment doesn't cover the ring. */
  button.seg:focus-visible {
    outline-offset: -2px;
  }
  @media (forced-colors: active) {
    .filter-chip {
      outline: 1px solid CanvasText;
      outline-offset: -1px;
    }
    .seg + .seg {
      border-color: CanvasText;
    }
  }
</style>
