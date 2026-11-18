<script>
  /**
   * Empty state: a title, an optional line saying why or what to do, and optional actions (children) below it.
   *
   *   <Empty title="No calls match these filters" body="Try a shorter term.">
   *     <div><button type="button" class="btn" onclick={clear}>Clear filters</button></div>
   *   </Empty>
   *
   * Other attributes (class, id…) and attachments go to the wrapper.
   *
   * @typedef {object} Props
   * @property {string} title
   * @property {string} [body]
   * @property {import('svelte').Snippet} [children]
   */
  /** @type {Props & Omit<import('svelte/elements').HTMLAttributes<HTMLDivElement>, keyof Props>} */
  let { title, body = '', class: className, children, ...rest } = $props()
</script>

<div class={['empty', className]} {...rest}>
  <h3>{title}</h3>
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
  h3 {
    font: var(--w-semibold) 15px var(--font-display);
    color: var(--fg);
  }
  p {
    color: var(--muted);
  }
</style>
