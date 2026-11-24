<script>
  /**
   * Kitchen sink: one example of a component inside its Demo: a caption saying what it shows, over a frame holding it.
   * A Demo lays its Cases out in a grid, as many to a row as fit; the frames in a row match the tallest.
   *
   *   <Demo label="Button">
   *     <Case label="Variants">…</Case>
   *     <Case label="Async: rejects">…</Case>
   *   </Demo>
   *
   * wide: takes a whole row of the grid, for an example that needs the room (a table, a row of tiles).
   *
   * @typedef {object} Props
   * @property {string} label
   * @property {boolean} [wide]
   * @property {import('svelte').Snippet} children
   */
  /** @type {Props} */
  let { label, wide = false, children } = $props()
  const id = $props.id()
</script>

<div class="case" class:wide role="group" aria-labelledby={id}>
  <span {id} class="case-label">{label}</span>
  <div class="case-stage">{@render children()}</div>
</div>

<style>
  .case {
    display: grid;
    grid-template-rows: auto 1fr;
    gap: var(--space-2);
    min-width: 0;
  }
  .wide {
    grid-column: 1 / -1;
  }
  .case-label {
    font-size: 12px;
    color: var(--muted);
  }
  .case-stage {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    align-content: start;
    gap: var(--space-2);
    min-width: 0;
    padding: var(--space-3);
    border: 1px solid var(--line);
    border-radius: var(--r-lg);
    background: var(--surface);
  }
</style>
