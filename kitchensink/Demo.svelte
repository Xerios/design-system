<script>
  /**
   * Kitchen sink: one specimen, captioned with what it shows. It takes one column of its Section; `span={2}` takes two
   * once the Section has room for two, and `wide` takes the whole row.
   *
   *   <Demo label="Async button: fails">…</Demo>
   *
   * @typedef {object} Props
   * @property {string} label
   * @property {1 | 2} [span]
   * @property {boolean} [wide]
   * @property {import('svelte').Snippet} children
   */
  /** @type {Props} */
  let { label, span = 1, wide = false, children } = $props()
</script>

<figure class="demo" class:span-2={span === 2} class:wide>
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
  /* Two columns fit once the Section's grid is two 300px columns and their gap (--space-4) wide. With one, a span of two
     would add a column that sticks out of it. */
  @container demos (min-width: 616px) {
    .span-2 {
      grid-column: span 2;
    }
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
