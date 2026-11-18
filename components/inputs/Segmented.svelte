<script>
  import Icon from '../Icon.svelte'
  import { tooltip } from '../../lib/tooltip.js'
  import { radioKeys } from '../../lib/roving.js'
  /** Single choice shown as a row of pills (radio group with roving focus). An option with `done` gets a green icon; `hint` becomes its tooltip. */
  /**
   * @typedef {{ value: any, label: string, icon?: string, hint?: string, done?: boolean }} Option
   * @typedef {object} Props
   * @property {any} value
   * @property {Option[]} options
   * @property {string} label
   * @property {(value: any) => void} onchange
   * @property {boolean} [iconOnly]
   */
  /** @type {Props & Omit<import('svelte/elements').HTMLAttributes<HTMLDivElement>, keyof Props>} */
  let { value, options, label, onchange, iconOnly = false, class: className, ...rest } = $props()
</script>

<div class={['seg', className]} role="radiogroup" aria-label={label} {...rest} {@attach radioKeys}>
  {#each options as o (o.value)}
    <button
      type="button"
      role="radio"
      aria-checked={o.value === value}
      data-done={o.done || undefined}
      tabindex={o.value === value ? 0 : -1}
      onclick={() => onchange(o.value)}
      {@attach tooltip(iconOnly ? o.label + (o.hint ? ` (${o.hint})` : '') : o.hint)}
      aria-label={iconOnly ? o.label : undefined}
      >{#if o.icon}<Icon name={o.icon} />{/if}{#if !iconOnly}<span>{o.label}</span>{/if}</button
    >
  {/each}
</div>

<style>
  /* One track, the chosen option raised on it (same shape as the layout tabs in the header). */
  .seg {
    display: inline-flex;
    flex-wrap: wrap;
    gap: 4px;
    /* As wide as its options: a grid or column-flex parent would otherwise stretch the track past them. */
    width: fit-content;
    max-width: 100%;
  }
  button {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 28px;
    border: 0;
    border-radius: var(--r-pill);
    padding: 0 10px;
    background: var(--fill-2);
    box-shadow:
      inset 0 0 0 1px var(--line),
      var(--shadow-btn);
    font-size: 12px;
    line-height: 14px;
    font-weight: var(--w-medium);
    cursor: pointer;
    color: var(--muted);
    transition:
      color var(--dur) var(--ease-out),
      background-color var(--dur) var(--ease-out);
  }
  button:not([aria-checked='true']):hover {
    color: var(--fg-2);
    background: var(--fill-3);
  }
  [aria-checked='true'] {
    background: var(--fill-4);
    color: var(--fg);
  }
  /* Something finished behind this option (e.g. research done): its icon turns green. */
  [data-done] :global(.icon) {
    color: var(--success);
  }
</style>
