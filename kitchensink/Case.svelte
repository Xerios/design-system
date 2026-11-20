<script>
  /**
   * Kitchen sink: one case of a component inside its Demo, captioned with what it shows. A component's cases share one
   * Demo; each gets a Case, so they stay told apart. A rule separates each case from the one before, edge to edge.
   *
   *   <Demo label="Button">
   *     <Case label="Variants">…</Case>
   *     <Case label="Async: rejects">…</Case>
   *   </Demo>
   *
   * @typedef {object} Props
   * @property {string} label
   * @property {import('svelte').Snippet} children
   */
  /** @type {Props} */
  let { label, children } = $props()
  const id = $props.id()
</script>

<div class="case" role="group" aria-labelledby={id}>
  <span {id} class="case-label">{label}</span>
  <div class="case-stage">{@render children()}</div>
</div>

<style>
  .case {
    display: grid;
    gap: var(--space-2);
    width: 100%;
    min-width: 0;
  }
  /* A rule above each case after the first, running out through the Demo's padding to its borders; the content stays
     in line. The Demo's gap above it plus the margin matches the padding below. */
  .case:not(:first-child) {
    width: calc(100% + 2 * var(--demo-pad, 0px));
    margin: var(--space-1) calc(var(--demo-pad, 0px) * -1) 0;
    padding: var(--space-3) var(--demo-pad, 0px) 0;
    border-top: 1px solid var(--line);
  }
  .case-label {
    font-size: 12px;
    color: var(--muted);
  }
  .case-stage {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2);
    min-width: 0;
  }
</style>
