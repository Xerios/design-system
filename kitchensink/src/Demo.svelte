<script>
  /**
   * Kitchen sink: one component's entry, laid out the way most kitchen sinks and docs do it (Bootstrap's cheatsheet,
   * Storybook's docs, Primer): its name as a heading with a line on what it is, then its examples. On a wide page the
   * heading sits in a column on the left (sticky, so it stays beside a tall entry) and the examples fill the rest; on a
   * narrow one the heading goes on top.
   *
   *   <Demo label="Button" description="Runs async work itself.">
   *     <Case label="Variants">…</Case>
   *     <Case label="Async: rejects">…</Case>
   *   </Demo>
   *   <Demo label="Switch"><Switch … /></Demo>                       one example: a single frame, no Case needed
   *
   * label: the component's name (the heading, and its row in the side menu). description: a line under it.
   * Its examples are Cases, laid out in a grid of frames at least --case-min (216px) wide: span={2} for wider ones
   * (about two to a row), wide for one to a row. Content that isn't in Cases goes in one frame.
   * The heading's id comes from the label (`Date picker` → #date-picker), for links to it.
   *
   * @typedef {object} Props
   * @property {string} label
   * @property {string} [description]
   * @property {1 | 2} [span]
   * @property {boolean} [wide]
   * @property {import('svelte').Snippet} children
   */
  /** @type {Props} */
  let { label, description = '', span = 1, wide = false, children } = $props()

  const id = $derived(
    label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, ''),
  )
</script>

<article class="demo" class:span-2={span === 2} class:wide {id} aria-labelledby="{id}-title" data-label={label}>
  <header>
    <h3 id="{id}-title" tabindex="-1">{label}</h3>
    {#if description}<p>{description}</p>{/if}
  </header>
  <div class="examples">{@render children()}</div>
</article>

<style>
  /* Each entry is a band across the area, its rule edge to edge through the page's side padding (--page-inset). */
  .demo {
    --case-min: 216px;
    display: grid;
    gap: var(--space-3);
    min-width: 0;
    margin-inline: calc(var(--page-inset, 0px) * -1);
    padding: var(--space-4) var(--page-inset, 0px);
    border-top: 1px solid var(--line);
    scroll-margin-top: var(--space-4);
  }
  .span-2 {
    --case-min: 400px;
  }
  .wide {
    --case-min: 100%;
  }
  header {
    display: grid;
    gap: var(--space-1);
    align-content: start;
    min-width: 0;
  }
  h3 {
    font: var(--w-semibold) 14px var(--font-display);
    color: var(--fg);
  }
  h3:focus {
    outline: none;
  }
  p {
    font-size: 12px;
    color: var(--muted);
    max-width: 60ch;
  }
  /* Wide enough for a column beside the examples: the heading moves into it and stays in view down a tall entry. */
  @container area (min-width: 860px) {
    .demo {
      grid-template-columns: 168px minmax(0, 1fr);
      gap: var(--space-5);
    }
    header {
      position: sticky;
      top: var(--space-4);
      align-self: start;
    }
  }

  /* With Cases: a grid of them, as many to a row as fit, each row as tall as its tallest frame. */
  .examples {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, var(--case-min)), 1fr));
    gap: var(--space-4) var(--space-3);
    min-width: 0;
  }
  /* Without: its content in one frame, as a Case draws it. */
  .examples:not(:has(> :global(.case))) {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-3);
    border: 1px solid var(--line);
    border-radius: var(--r-lg);
    background: var(--surface);
  }
</style>
