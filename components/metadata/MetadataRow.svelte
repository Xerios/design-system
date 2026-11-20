<script>
  /**
   * One row of a Metadata list: its label, and its values as children.
   *
   *   <Metadata.Row label="Resources" onlabelclick={addLink} labelTip="Add a link">
   *     <a class="chip-btn" href="/docs/plan"><Icon name="link" />Plan</a>
   *   </Metadata.Row>
   *
   * label: the row's name, short (it sits in an 80px column).
   * onlabelclick(event): makes the label a button (open the row's menu, add a value); it fills on hover.
   * labelTip: what pressing the label does, as its tooltip. Give it with onlabelclick: the label alone doesn't say.
   * Children: the values, usually `.chip-btn` pills (`.outlined` for a row of labels), or `.label-chip` for ones that do
   * nothing. Other attributes, the class and attachments go to the row's <div>.
   * Keyboard: Enter or Space presses the label when it is a button.
   *
   * @typedef {object} Props
   * @property {string} label
   * @property {(event: MouseEvent) => void} [onlabelclick]
   * @property {string} [labelTip]
   * @property {import('svelte').Snippet} [children]
   */
  import { tooltip } from '../../lib/tooltip.js'

  /** @type {Props & Omit<import('svelte/elements').HTMLAttributes<HTMLDivElement>, keyof Props>} */
  let { label, onlabelclick, labelTip = '', children, class: className, ...rest } = $props()
</script>

<div class={['row', className]} {...rest}>
  <dt>
    {#if onlabelclick}
      <button type="button" class="label action" onclick={onlabelclick} {@attach tooltip(labelTip)}>{label}</button>
    {:else}
      <span class="label">{label}</span>
    {/if}
  </dt>
  <dd class="values">{@render children?.()}</dd>
</div>

<style>
  /* Laid on the list's two columns (subgrid), so every row's label shares one width. The label stays with the first line
     of values when they wrap. */
  .row {
    display: grid;
    grid-column: 1 / -1;
    grid-template-columns: subgrid;
    align-items: start;
  }
  dt {
    min-width: 0;
  }
  .label {
    display: flex;
    align-items: center;
    min-height: 24px;
    padding-inline: var(--space-2);
    border-radius: var(--r-pill);
    color: var(--muted);
    font: var(--w-medium) 12px/14px var(--font-body);
    white-space: nowrap;
  }
  .action {
    width: 100%;
    border: 0;
    background: none;
    text-align: start;
    cursor: pointer;
    transition: background-color var(--dur) var(--ease-out);
  }
  .action:hover {
    background: var(--control-3);
  }
  .action:active {
    background: var(--control-4);
  }
  .values {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-1);
    min-width: 0;
    min-height: 24px;
    margin: 0;
  }
</style>
