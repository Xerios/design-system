<script>
  /**
   * Kitchen sink: one area of the catalogue, with a heading the page's jump list links to.
   *
   *   <Section id="inputs" title="Inputs" intro="Every field shares the label, ⓘ and error bubble.">…demos…</Section>
   *
   * @typedef {object} Props
   * @property {string} id
   * @property {string} title
   * @property {string} [intro]
   * @property {import('svelte').Snippet} children
   */
  import { masonry } from './masonry.js'

  /** @type {Props} */
  let { id, title, intro = '', children } = $props()
</script>

<section {id} aria-labelledby="{id}-title" class="section">
  <h2 id="{id}-title" tabindex="-1">{title}</h2>
  {#if intro}<p class="intro">{intro}</p>{/if}
  <div class="demos" {@attach masonry}>{@render children()}</div>
</section>

<style>
  /* Its rule runs edge to edge: out through the side padding of the scroll area it sits in (--page-inset, set by the
     host), with the content kept where it was. */
  .section {
    display: grid;
    gap: var(--space-3);
    margin-inline: calc(var(--page-inset, 0px) * -1);
    padding: var(--space-6) var(--page-inset, 0px);
    border-top: 1px solid var(--line);
    scroll-margin-top: var(--space-6);
  }
  /* The first area starts the page: no rule above it, and no gap before its heading. */
  .section:first-of-type {
    border-top: 0;
    padding-top: 0;
  }
  h2 {
    font: var(--w-semibold) 16px var(--font-display);
    color: var(--fg);
    /* A jump to the area scrolls its heading into view: leave room above it, so it doesn't sit against the top edge. */
    scroll-margin-top: var(--space-8);
  }
  h2:focus {
    outline: none;
  }
  .intro {
    max-width: 75ch;
    color: var(--muted);
  }
  /* Columns at least 300px wide, laid out as masonry (see masonry.js; it needs align-items: start). A container, so a
     Demo can tell how many columns there are room for. */
  .demos {
    container: demos / inline-size;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr));
    gap: var(--space-4);
    align-items: start;
  }
</style>
