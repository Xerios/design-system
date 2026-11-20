<script>
  import Icon from '../Icon.svelte'
  import { tooltip } from '../../lib/tooltip.js'
  import { radioKeys } from '../../lib/roving.js'
  /**
   * Single choice shown as one joined pill: the options sit side by side, split by hairlines, with only the first and last
   * rounded off; the chosen one is filled. A radio group with roving focus, for toolbar filters and view switches.
   *
   *   <ButtonGroup value={service} options={[{ value: 'all', label: 'All' }, …]} label="Service" onchange={(v) => (service = v)} />
   *
   * Props: `value`; `options` ({ value, label, icon?, hint? }; `hint` becomes the tooltip); `label` (the group's accessible
   * name); `onchange(value)`; `iconOnly` shows only the icons, with the label as tooltip and aria-label.
   * Keyboard: Tab focuses the chosen option; arrows, Home and End move and choose.
   */
  /**
   * @typedef {{ value: any, label: string, icon?: string, hint?: string }} Option
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

<div class={['group', className]} role="radiogroup" aria-label={label} {...rest} {@attach radioKeys}>
  {#each options as o (o.value)}
    <button
      type="button"
      role="radio"
      aria-checked={o.value === value}
      tabindex={o.value === value ? 0 : -1}
      onclick={() => onchange(o.value)}
      {@attach tooltip(iconOnly ? o.label + (o.hint ? ` (${o.hint})` : '') : o.hint)}
      aria-label={iconOnly ? o.label : undefined}
      >{#if o.icon}<Icon name={o.icon} size="sm" />{/if}{#if !iconOnly}<span class="text">{o.label}</span>{/if}</button
    >
  {/each}
</div>

<style>
  /* One pill: the hairline rings the whole group, and each option after the first draws its divider on its left. */
  .group {
    display: inline-flex;
    /* As wide as its options: a grid or column-flex parent would otherwise stretch the track past them. */
    width: fit-content;
    max-width: 100%;
    border-radius: var(--r-pill);
    background: var(--control-2);
    box-shadow:
      inset 0 0 0 1px var(--line),
      var(--shadow-btn);
  }
  button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-width: 0;
    min-height: 28px;
    padding: 0 12px;
    border: 0;
    border-radius: 0;
    background: none;
    color: var(--muted);
    font-size: 12px;
    line-height: 14px;
    font-weight: var(--w-medium);
    cursor: pointer;
    white-space: nowrap;
    transition:
      color var(--dur) var(--ease-out),
      background-color var(--dur) var(--ease-out);
  }
  button + button {
    box-shadow: inset 1px 0 0 var(--line);
  }
  button:first-child {
    border-start-start-radius: var(--r-pill);
    border-end-start-radius: var(--r-pill);
    padding-inline-start: 14px;
  }
  button:last-child {
    border-start-end-radius: var(--r-pill);
    border-end-end-radius: var(--r-pill);
    padding-inline-end: 14px;
  }
  button:not([aria-checked='true']):hover {
    color: var(--fg-2);
    background: var(--control-2);
  }
  [aria-checked='true'] {
    background: var(--control-4);
    color: var(--fg);
  }
  button :global(.icon) {
    flex: none;
  }
  .text {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
