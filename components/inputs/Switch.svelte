<script>
  /** On/off switch. `hint`: a short state note after the label, shown in parentheses outside the button (so clicking it
   *  doesn't toggle) and given to it as its description. Other props and attachments go to the button, e.g. {@attach tooltip('…')} when a short label needs explaining. */
  /**
   * @typedef {object} Props
   * @property {boolean} [checked] bindable
   * @property {string} id
   * @property {string} label
   * @property {string | null} [hint]
   */
  /** @type {Props & Omit<import('svelte/elements').HTMLButtonAttributes, keyof Props>} */
  let { checked = $bindable(false), id, label, hint = null, class: className, ...rest } = $props()
</script>

<span class="row">
  <button
    {id}
    type="button"
    class={['switch', className]}
    role="switch"
    aria-checked={checked}
    aria-describedby={hint != null ? `${id}-hint` : undefined}
    {...rest}
    onclick={() => (checked = !checked)}
  >
    <span class="knob" aria-hidden="true"></span>
    <span class="text">{label}</span>
  </button>
  {#if hint != null}<span class="hint" id="{id}-hint">({hint})</span>{/if}
</span>

<style>
  /* fit-content: a grid or column parent would otherwise stretch the switch across the row, so a click in the empty space
     beside the label would toggle it. The hint sits beside the button, centred on it: the button's own baseline comes from
     the empty knob (its first item), so baseline alignment would drop the hint to the knob's bottom edge. */
  .row {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    width: fit-content;
    max-width: 100%;
  }
  .switch {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    text-align: left;
    min-height: 32px;
    padding: 0 2px;
    background: none;
    border: 0;
    cursor: pointer;
    font-size: 13px;
    color: var(--fg-2);
  }
  .knob {
    position: relative;
    width: 28px;
    height: 16px;
    border-radius: var(--r-pill);
    background: var(--fill-4);
    box-shadow: inset 0 0 0 1px var(--line);
    transition:
      background var(--dur) var(--ease-out),
      box-shadow var(--dur) var(--ease-out),
      filter var(--dur) var(--ease-out);
    flex: none;
  }
  .knob::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--knob);
    box-shadow: var(--knob-shadow);
    translate: 0 0;
    transition: translate var(--dur) var(--ease-out);
  }
  [aria-checked='true'] .knob {
    background: var(--brand);
    box-shadow: none;
  }
  [aria-checked='true'] .knob::after {
    translate: 12px 0;
  }
  /* Hover (when it can act): the label comes forward, an off track firms up its hairline, an on track brightens. */
  .switch {
    transition: color var(--dur) var(--ease-out);
  }
  .switch:hover:not(:disabled) {
    color: var(--fg);
  }
  .switch:hover:not(:disabled):not([aria-checked='true']) .knob {
    box-shadow: inset 0 0 0 1px var(--line-float);
  }
  .switch:hover:not(:disabled)[aria-checked='true'] .knob {
    filter: brightness(1.1);
  }
  .switch:focus-visible {
    outline: none;
  }
  .switch:focus-visible .knob {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
  .hint {
    font: var(--w-medium) 12px var(--font-data);
    font-variant-numeric: tabular-nums;
    color: var(--muted);
  }
</style>
