<script>
  /**
   * One applied filter as a joined pill (Linear's filter chips): the field it looks at, the condition, the value and a ✕,
   * split by hairlines. The condition is a select of the others; the value opens a panel under it with whatever edits
   * it (an OptionList, a calendar…); the ✕ removes the filter. FilterBar draws these from data; use one directly for a
   * filter row of your own.
   *
   *   <FilterChip field={{ label: 'Status', icon: 'circleDashed' }} operator="is" operators={['is', 'is not']}
   *     onoperator={(op) => (f.op = op)} onremove={() => remove(f)}>
   *     {#snippet value()}<Icon name="checkCircle" size="sm" />Done{/snippet}
   *     {#snippet panel({ close })}<OptionList bind:value={f.value} options={STATUSES} label="Status" />{/snippet}
   *   </FilterChip>
   *
   * field: { label, icon? } (an Icon name). operator: the condition shown ("is", "after", "is above"). operators: the
   * conditions it can switch to; with more than one the condition is a select whose list opens over the chip, the
   * chosen condition on top of its own text (where the browser supports appearance: base-select; elsewhere the native
   * list), else plain text. onoperator(op). onremove(): the ✕ (removeLabel names it, default "Remove filter").
   * open (bindable): whether the value's panel is open. onclose(): after the panel closes, however it closed.
   * value: snippet drawing the value on its button. panel: snippet ({ close }) drawing the editor in the panel; close()
   * closes it and puts the focus back on the value. Without an operator or a value the chip leaves that part out
   * (a filter that is on or off: "Easy apply | only | ✕").
   * focus(): puts the focus on the value button (else the condition, else the ✕).
   * Keyboard: the condition, the value and the ✕ are in the tab order. On the condition, Enter, Space or the arrows
   * open its list, as on any select. On the value, Enter, Space or ArrowDown opens the panel; Esc in it closes it, and
   * Tab past its last control closes it and moves on. The group is named by its parts ("Status is Done").
   * Other attributes (class…) and attachments go to the group.
   */
  import Icon from '../Icon.svelte'
  import AnchoredPanel from '../AnchoredPanel.svelte'
  import { tooltip } from '../../lib/tooltip.js'
  import ConditionSelect from './ConditionSelect.svelte'

  /**
   * @typedef {object} Props
   * @property {{ label: string, icon?: string }} field
   * @property {string} [operator]
   * @property {string[]} [operators]
   * @property {(op: string) => void} [onoperator]
   * @property {() => void} onremove
   * @property {string} [removeLabel]
   * @property {boolean} [open] bindable
   * @property {() => void} [onclose]
   * @property {import('svelte').Snippet} [value]
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
  /** @type {ConditionSelect | undefined} */
  let opSelect = $state()
  /** @type {HTMLButtonElement | undefined} */
  let removeButton = $state()
  const choosable = $derived(operators.length > 1)

  export function focus() {
    ;(valueButton ?? opSelect ?? removeButton)?.focus()
  }

  /** @param {boolean} refocus */
  function close(refocus) {
    if (!open) return
    open = false
    if (refocus) valueButton?.focus()
    onclose?.()
  }

  /** @param {KeyboardEvent} e */
  function onValueKey(e) {
    if (e.key === 'ArrowDown' && !open && panel) {
      e.preventDefault()
      open = true
    }
  }
</script>

<div
  class={['filter-chip', className]}
  role="group"
  aria-labelledby={[`${uid}-name`, operator && `${uid}-op`, value && `${uid}-value`].filter(Boolean).join(' ')}
  {...rest}
>
  <span class="seg field" id="{uid}-field">
    {#if field.icon}<Icon name={field.icon} size="sm" />{/if}
    <span class="name" id="{uid}-name">{field.label}</span>
  </span>
  {#if operator && choosable}
    <ConditionSelect
      bind:this={opSelect}
      id="{uid}-op"
      label="{field.label} condition"
      value={operator}
      options={operators}
      onchange={(op) => onoperator?.(op)}
    />
  {:else if operator}
    <span class="seg op" id="{uid}-op">{operator}</span>
  {/if}
  {#if value}
    <button
      bind:this={valueButton}
      type="button"
      class="seg value"
      id="{uid}-value"
      aria-haspopup={panel ? 'dialog' : undefined}
      aria-expanded={panel ? open : undefined}
      disabled={!panel}
      onclick={() => (open ? close(true) : (open = true))}
      onkeydown={onValueKey}><span class="value-text">{@render value()}</span></button
    >
  {/if}
  <button bind:this={removeButton} type="button" class="seg remove" aria-label={removeLabel} {@attach tooltip(removeLabel)} onclick={onremove}>
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
  /* Every part keeps its width but the value, which gives way when the chip is short of room (an ellipsis). */
  .seg {
    flex: none;
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
  /* The condition (ConditionSelect) is a segment of its own, drawn there. */
  .seg + .seg,
  .seg + :global(.condition-select),
  :global(.condition-select) + .seg {
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
    flex: 0 1 auto;
    max-width: 280px;
    overflow: clip;
    color: var(--fg);
  }
  /* A block, so plain text gets its ellipsis; richer content (an inline-flex summary) fits itself in with max-width. */
  .value-text {
    display: block;
    min-width: 0;
    overflow: clip;
    text-overflow: ellipsis;
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
    .seg + .seg,
    .seg + :global(.condition-select),
    :global(.condition-select) + .seg {
      border-color: CanvasText;
    }
  }
</style>
