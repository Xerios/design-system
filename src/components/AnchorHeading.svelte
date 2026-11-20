<script>
  /**
   * A heading with a link to itself: a link glyph after the text, shown while the heading is hovered or the link has
   * focus (always, faintly, on touch screens), that puts the heading's address in the location bar. For long pages and
   * docs, so a reader can share a part of them. Its size comes from where it sits (`.prose`, or the app's own heading
   * styles); it only adds the link.
   *
   *   <div class="prose">
   *     <AnchorHeading id="install" level={2}>Install</AnchorHeading>
   *   </div>
   *
   * level: 1 to 6, the heading's rank (default 2).
   * id: the heading's id, and the fragment the link points to (#id). Unique on the page.
   * label: the link's name and tooltip (default "Link to this section").
   * Children: the heading's text. Other attributes, the class and attachments go to the heading element.
   * Keyboard: the link is in the tab order after the heading's text; Enter follows it.
   *
   * @typedef {object} Props
   * @property {string} id
   * @property {1 | 2 | 3 | 4 | 5 | 6} [level]
   * @property {string} [label]
   * @property {import('svelte').Snippet} children
   */
  import Icon from './Icon.svelte'
  import { tooltip } from '../lib/tooltip.js'

  /** @type {Props & Omit<import('svelte/elements').HTMLAttributes<HTMLHeadingElement>, keyof Props>} */
  let { id, level = 2, label = 'Link to this section', children, class: className, ...rest } = $props()
  const tag = $derived(`h${level}`)
</script>

<svelte:element this={tag} {id} class={['anchor-heading', className]} {...rest}
  >{@render children()}<a class="anchor" href="#{id}" aria-label={label} {@attach tooltip(label)}><Icon name="link" size="sm" /></a></svelte:element
>

<style>
  .anchor-heading {
    scroll-margin-top: var(--space-8);
  }
  /* A 24px target that doesn't stretch the line it sits on: its margins take back what it is taller than one line. */
  .anchor {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    margin-block: calc((1lh - 24px) / 2);
    margin-inline-start: var(--space-1);
    vertical-align: top;
    border-radius: var(--r-sm);
    color: var(--faint);
    opacity: 0;
    transition:
      opacity var(--dur) var(--ease-out),
      color var(--dur) var(--ease-out),
      background-color var(--dur) var(--ease-out);
  }
  .anchor-heading:hover .anchor,
  .anchor:focus-visible {
    opacity: 1;
  }
  .anchor:hover {
    background: var(--control-2);
    color: var(--fg-2);
  }
  @media (hover: none) {
    .anchor {
      opacity: 1;
    }
  }
  /* A finger needs 44px; the margins still keep the line as it was. */
  @media (pointer: coarse) {
    .anchor {
      width: 44px;
      height: 44px;
      margin-block: calc((1lh - 44px) / 2);
    }
  }
</style>
