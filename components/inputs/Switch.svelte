<script>
  /** On/off switch. */
  let { checked = $bindable(false), id, label, hint = null } = $props();
</script>

<button {id} type="button" class="switch" role="switch" aria-checked={checked} onclick={() => (checked = !checked)}>
  <span class="knob" aria-hidden="true"></span>
  <span class="text">{label}{#if hint != null}<span class="hint">{hint}</span>{/if}</span>
</button>

<style>
  .switch { display: inline-flex; align-items: center; gap: 8px; min-height: 32px; padding: 0 2px; background: none; border: 0; cursor: pointer; font-size: 13px; color: var(--fg-2); }
  .knob { position: relative; width: 28px; height: 16px; border-radius: var(--r-pill); background: var(--fill-4); box-shadow: inset 0 0 0 1px var(--line); transition: background var(--dur) var(--ease-out); flex: none; }
  .knob::after { content: ""; position: absolute; top: 2px; left: 2px; width: 12px; height: 12px; border-radius: 50%; background: #fff; box-shadow: 0 1px 2px rgb(0 0 0 / 0.3); transition: transform var(--dur) var(--ease-out); }
  [aria-checked="true"] .knob { background: var(--brand); box-shadow: none; }
  [aria-checked="true"] .knob::after { transform: translateX(12px); }
  .switch:focus-visible { outline: none; }
  .switch:focus-visible .knob { outline: 2px solid var(--accent); outline-offset: 2px; }
  .text { display: inline-flex; align-items: baseline; gap: 6px; }
  .hint { font: var(--w-medium) 12px var(--font-data); font-variant-numeric: tabular-nums; color: var(--muted); }
</style>
