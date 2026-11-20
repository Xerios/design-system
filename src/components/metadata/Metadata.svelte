<script>
  /**
   * Labelled values (Linear's project properties): each row a short label, then its values, usually `.chip-btn` pills
   * that open or change the value. A description list, so each label is read out with its values. The labels share one
   * column, as wide as the longest and 80px at least; values wrap onto more lines when the row is narrow, and the label
   * stays beside the first. The list reaches 8px out past its start, so the labels' text lines up with the content
   * around it and an interactive label's hover fill has room.
   *
   *   <Metadata>
   *     <Metadata.Row label="Properties">
   *       <button type="button" class="chip-btn"><Icon name="circleDashed" />Planned</button>
   *       <button type="button" class="chip-btn"><Icon name="monitor" />Web app</button>
   *     </Metadata.Row>
   *     <Metadata.Row label="Labels" onlabelclick={addLabel} labelTip="Add a label">
   *       <button type="button" class="chip-btn outlined"><span class="label-dot" style:--dot="var(--info)"></span>Design</button>
   *     </Metadata.Row>
   *   </Metadata>
   *
   * Children: its Metadata.Row elements. Other attributes, the class and attachments go to the <dl>.
   * Keyboard: Tab moves through the interactive labels and values in reading order.
   *
   * @typedef {object} Props
   * @property {import('svelte').Snippet} [children]
   */
  /** @type {Props & Omit<import('svelte/elements').HTMLAttributes<HTMLDListElement>, keyof Props>} */
  let { children, class: className, ...rest } = $props()
</script>

<dl class={['metadata', className]} {...rest}>{@render children?.()}</dl>

<style>
  .metadata {
    display: grid;
    grid-template-columns: minmax(80px, max-content) minmax(0, 1fr);
    row-gap: var(--space-4);
    margin: 0 0 0 calc(var(--space-2) * -1);
  }
</style>
