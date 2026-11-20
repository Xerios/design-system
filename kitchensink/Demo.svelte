<script>
  /**
   * Kitchen sink: one specimen, captioned with what it shows. `wide` spans the whole row.
   *
   *   <Demo label="Async button: fails">…</Demo>
   *
   * @typedef {object} Props
   * @property {string} label
   * @property {boolean} [wide]
   * @property {import('svelte').Snippet} children
   */
  /** @type {Props} */
  let { label, wide = false, children } = $props()
</script>

<figure class="demo" class:wide>
  <figcaption>{label}</figcaption>
  <div class="stage">{@render children()}</div>
</figure>

<style>
  .demo {
    /* Its padding, which a Case's separator reaches through to the edges. */
    --demo-pad: var(--space-3);
    display: grid;
    gap: var(--space-2);
    min-width: 0;
    margin: 0;
    padding: var(--demo-pad);
    border: 1px solid var(--line);
    border-radius: var(--r-lg);
    background: var(--surface);
  }
  .wide {
    grid-column: 1 / -1;
  }
  /* A rule under the caption, edge to edge through the padding, spaced like the rules between Cases (the gap below
     plus the margin matches the padding above). */
  figcaption {
    margin: 0 calc(var(--demo-pad) * -1) var(--space-1);
    padding: 0 var(--demo-pad) var(--space-3);
    border-bottom: 1px solid var(--line);
    font-size: 12px;
    font-weight: var(--w-medium);
    color: var(--muted);
  }
  .stage {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2);
    min-width: 0;
  }
</style>
