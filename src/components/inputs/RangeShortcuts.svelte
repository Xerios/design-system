<script>
  /**
   * The ready-made spans of the range pickers, as quiet buttons (part of DateRangePicker and DateRangeSelect; use those).
   *
   *   <RangeShortcuts items={[{ label: 'Last 7 days', range: [from, to] }]} {value} onpick={(range) => (value = range)} />
   *
   * items: [{ label, range }], range [from, to], or null to show it disabled (the span isn't available).
   * value: the current [from, to]; the shortcut giving it is marked current. onpick(range).
   * vertical: a column (a wrapping row from 480px down); otherwise a wrapping row.
   * Keyboard: each is a button in the tab order. Other attributes go to the group.
   */

  /**
   * @typedef {object} Props
   * @property {{ label: string, range: [string, string] | null }[]} items
   * @property {[string, string]} value
   * @property {(range: [string, string]) => void} onpick
   * @property {boolean} [vertical]
   */
  /** @type {Props & Omit<import('svelte/elements').HTMLAttributes<HTMLDivElement>, keyof Props>} */
  let { items, value, onpick, vertical = false, class: className, ...rest } = $props()
</script>

<div class={['shortcuts', className]} class:vertical role="group" aria-label="Shortcuts" {...rest}>
  {#each items as item (item.label)}
    {@const range = item.range}
    <button
      type="button"
      class="shortcut"
      disabled={!range}
      aria-current={range && range[0] === value[0] && range[1] === value[1] ? 'true' : undefined}
      onclick={() => range && onpick(range)}>{item.label}</button
    >
  {/each}
</div>

<style>
  .shortcuts {
    display: flex;
    flex-wrap: wrap;
    gap: 2px;
  }
  .vertical {
    flex-direction: column;
    flex-wrap: nowrap;
  }
  .shortcut {
    min-height: 24px;
    padding: 0 var(--space-2);
    border: 0;
    border-radius: var(--r);
    background: none;
    color: var(--fg);
    font: var(--w-medium) 12px var(--font-body);
    text-align: start;
    white-space: nowrap;
    transition: background-color var(--dur-fast) var(--ease-out);
  }
  .shortcut:hover:not(:disabled) {
    background: var(--control-3);
  }
  .shortcut[aria-current='true'] {
    background: var(--accent-soft);
  }
  .shortcut:disabled {
    color: var(--faint);
    cursor: default;
  }
  .shortcut:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: -2px;
  }
  @media (pointer: coarse) {
    .shortcut {
      min-height: 44px;
    }
  }
  @media (max-width: 480px) {
    .vertical {
      flex-direction: row;
      flex-wrap: wrap;
    }
  }
  @media (forced-colors: active) {
    .shortcut[aria-current='true'] {
      outline: 1px solid Highlight;
      outline-offset: -1px;
    }
  }
</style>
