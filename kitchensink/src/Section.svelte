<script>
  /**
   * Kitchen sink: one area of the catalogue (Actions, Inputs…), with a heading the side menu links to, then its
   * components, one Demo each, stacked down the page.
   *
   *   <Section id="inputs" title="Inputs" intro="Every field shares the label, ⓘ and error bubble.">…demos…</Section>
   *
   * @typedef {object} Props
   * @property {string} id
   * @property {string} title
   * @property {string} [intro]
   * @property {import('svelte').Snippet} children
   */
  /** @type {Props} */
  let { id, title, intro = '', children } = $props()
</script>

<section {id} aria-labelledby="{id}-title" class="section">
  <h2 id="{id}-title" tabindex="-1">{title}</h2>
  {#if intro}<p class="intro">{intro}</p>{/if}
  <div class="demos">{@render children()}</div>
</section>

<style>
  /* Its rule runs edge to edge: out through the side padding of the scroll area it sits in (--page-inset, set by the
     host), with the content kept where it was. */
  .section {
    display: grid;
    gap: var(--space-1);
    margin-inline: calc(var(--page-inset, 0px) * -1);
    padding: var(--space-8) var(--page-inset, 0px) var(--space-2);
    border-top: 1px solid var(--line);
    scroll-margin-top: var(--space-6);
  }
  /* The first area starts the page: no rule above it, and no gap before its heading. */
  .section:first-of-type {
    border-top: 0;
    padding-top: 0;
  }
  h2 {
    font: var(--w-semibold) 30px/1.2 var(--font-display);
    color: var(--fg);
    /* A jump to the area scrolls its heading into view: leave room above it, so it doesn't sit against the top edge. */
    scroll-margin-top: var(--space-8);
  }
  h2:focus {
    outline: none;
  }
  .intro {
    max-width: 75ch;
    font-size: 16px;
    color: var(--muted);
  }
  /* Its Demos, one under the other, each with its rule above. A container, so a Demo can tell whether there is room for
     its heading beside its examples. The heading sits as far above the first rule as below the area's own rule: the
     section's top padding, less the gap the grid already puts before this. */
  .demos {
    container: area / inline-size;
    display: grid;
    margin-top: calc(var(--space-8) - var(--space-1));
  }
</style>
