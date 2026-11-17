<script>
  import Icon from '../Icon.svelte';
  /** Single choice shown as a row of pills (radio group with roving focus). An option with `done` gets a green icon; `hint` becomes its tooltip. */
  let { value, options, label, onchange, iconOnly = false } = $props();
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

<div class="seg" role="radiogroup" aria-label={label}>
  {#each options as o, i (o.value)}
    <button
      bind:this={buttons[i]}
      type="button"
      role="radio"
      aria-checked={o.value === value}
      data-done={o.done || undefined}
      tabindex={o.value === value ? 0 : -1}
      onclick={() => onchange(o.value)}
      title={iconOnly ? o.label + (o.hint ? ` (${o.hint})` : '') : o.hint}
      aria-label={iconOnly ? o.label : undefined}
      onkeydown={(e) => onkeydown(e, i)}>{#if o.icon}<Icon name={o.icon} />{/if}{#if !iconOnly}<span>{o.label}</span>{/if}</button>
  {/each}
</div>

<style>
  /* One track, the chosen option raised on it (same shape as the layout tabs in the header). */
  .seg { display: inline-flex; flex-wrap: wrap; gap: 4px; max-width: 100%; }
  button {
    display: inline-flex; align-items: center; gap: 6px; min-height: 28px; border: 0; border-radius: var(--r-pill); padding: 0 10px;
    background: var(--fill-2); box-shadow: inset 0 0 0 1px var(--line);
    font-size: 12px; line-height: 14px; font-weight: var(--w-medium); cursor: pointer; color: var(--muted);
    transition: color var(--dur) var(--ease-out), background-color var(--dur) var(--ease-out);
  }
  button:not([aria-checked="true"]):hover { color: var(--fg-2); background: var(--fill-3); }
  [aria-checked="true"] { background: var(--fill-4); color: var(--fg); }
  /* Something finished behind this option (e.g. research done): its icon turns green. */
  [data-done] :global(.icon) { color: var(--success); }
</style>
