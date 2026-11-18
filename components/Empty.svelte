<script>
  /**
   * Empty state: a title, an optional line saying why or what to do, and optional actions (children) below it.
   *
   *   <Empty title="No calls match these filters" body="Try a shorter term.">
   *     <div><button type="button" class="btn" onclick={clear}>Clear filters</button></div>
   *   </Empty>
   *
   * level: the title's heading level, one below the heading it sits under (2 directly under a page's h1; 3, the
   * default, inside a section or dialog), so the outline has no gaps.
   * Other attributes (class, id…) and attachments go to the wrapper.
   *
   * @typedef {object} Props
   * @property {string} title
   * @property {string} [body]
   * @property {2 | 3 | 4 | 5 | 6} [level]
   * @property {import('svelte').Snippet} [children]
   */
  /** @type {Props & Omit<import('svelte/elements').HTMLAttributes<HTMLDivElement>, keyof Props>} */
  let { title, body = '', level = 3, class: className, children, ...rest } = $props()
</script>

<div class={['empty', className]} {...rest}>
  <svelte:element this={`h${level}`} class="title">{title}</svelte:element>
  {#if body}<p>{body}</p>{/if}
  {@render children?.()}
</div>

<style>
  .empty {
    max-width: 420px;
    margin: 48px auto;
    text-align: center;
    display: grid;
    gap: 6px;
  }
  .title {
    font: var(--w-semibold) 15px var(--font-display);
    color: var(--fg);
  }
  p {
    color: var(--muted);
  }
</style>
