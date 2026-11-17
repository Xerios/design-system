<script>
  import Icon from '../Icon.svelte'
  import { tooltip } from '../../lib/tooltip.js'
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
  let { value, options, label, onchange, iconOnly = false } = $props()
  const buttons = []

  function onkeydown(e, i) {
    const n = options.length
    const next = { ArrowRight: (i + 1) % n, ArrowDown: (i + 1) % n, ArrowLeft: (i - 1 + n) % n, ArrowUp: (i - 1 + n) % n, Home: 0, End: n - 1 }[e.key]
    if (next === undefined) return
    e.preventDefault()
    e.stopPropagation()
    buttons[next].focus()
    onchange(options[next].value)
  }
</script>

<div class="group" role="radiogroup" aria-label={label}>
  {#each options as o, i (o.value)}
    <button
      bind:this={buttons[i]}
      type="button"
      role="radio"
      aria-checked={o.value === value}
      tabindex={o.value === value ? 0 : -1}
      onclick={() => onchange(o.value)}
      {@attach tooltip(iconOnly ? o.label + (o.hint ? ` (${o.hint})` : '') : o.hint)}
      aria-label={iconOnly ? o.label : undefined}
      onkeydown={(e) => onkeydown(e, i)}
      >{#if o.icon}<Icon name={o.icon} size="sm" />{/if}{#if !iconOnly}<span class="text">{o.label}</span>{/if}</button
    >
  {/each}
</div>

<style>
  /* One pill: the hairline rings the whole group, and each option after the first draws its divider on its left. */
  .group {
    display: inline-flex;
    max-width: 100%;
    border-radius: var(--r-pill);
    background: var(--fill-2);
    box-shadow: inset 0 0 0 1px var(--line);
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
    background: var(--fill-2);
  }
  [aria-checked='true'] {
    background: var(--fill-4);
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
