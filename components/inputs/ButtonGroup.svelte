<script>
  import Icon from '../Icon.svelte';
  import { tooltip } from '../../lib/tooltip.js';
  import Tooltip from '../Tooltip.svelte';
  /**
   * Single choice shown as a joined switch: one track, the chosen segment raised on it (radio group with roving
   * focus). Same options shape as Segmented ({ value, label, icon?, hint?, info? }; `info` adds an ⓘ with that text as a hover tooltip). `fill` stretches it to its container
   * with equal-width segments. `pill` rounds the track and segments fully (toolbar view switchers).
   */
  let { value, options, label, onchange, fill = false, iconOnly = false, pill = false } = $props();
  const buttons = [];

  function onkeydown(e, i) {
    const n = options.length;
    const next = { ArrowRight: (i + 1) % n, ArrowDown: (i + 1) % n, ArrowLeft: (i - 1 + n) % n, ArrowUp: (i - 1 + n) % n, Home: 0, End: n - 1 }[e.key];
    if (next === undefined) return;
    e.preventDefault();
    e.stopPropagation();
    buttons[next].focus();
    onchange(options[next].value);
  }
</script>

<div class="group" class:fill class:pill role="radiogroup" aria-label={label}>
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
      aria-description={o.info}
      onkeydown={(e) => onkeydown(e, i)}>{#if o.icon}<Icon name={o.icon} size="sm" />{/if}{#if !iconOnly}<span class="text">{o.label}</span>{/if}{#if o.info}<Tooltip focusable={false}>{#snippet tip()}{o.info}{/snippet}<span class="info"><Icon name="infoCircle" size="sm" /></span></Tooltip>{/if}</button>
  {/each}
</div>

<style>
  .group {
    display: inline-grid; grid-auto-flow: column; grid-auto-columns: auto; gap: 2px; max-width: 100%; padding: 2px;
    border-radius: var(--r); background: var(--fill-2); box-shadow: inset 0 0 0 1px var(--line);
  }
  .group.fill { display: grid; grid-auto-columns: minmax(0, 1fr); width: 100%; }
  .group.pill, .pill button { border-radius: var(--r-pill); }
  button {
    display: inline-flex; align-items: center; justify-content: center; gap: 6px; min-width: 0; min-height: 26px; padding: 0 10px;
    border: 0; border-radius: calc(var(--r) - 2px); background: none; color: var(--muted);
    font-size: 12px; line-height: 14px; font-weight: var(--w-medium); cursor: pointer; white-space: nowrap;
    transition: color var(--dur) var(--ease-out), background-color var(--dur) var(--ease-out), box-shadow var(--dur) var(--ease-out);
  }
  button:not([aria-checked="true"]):hover { color: var(--fg-2); background: var(--fill-3); }
  [aria-checked="true"] { background: var(--elevated); color: var(--fg); box-shadow: var(--shadow-sm), inset 0 0 0 1px var(--line); }
  button :global(.icon) { flex: none; }
  .info { display: inline-flex; color: var(--faint); }
  button:hover .info { color: var(--muted); }
  .text { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
</style>
