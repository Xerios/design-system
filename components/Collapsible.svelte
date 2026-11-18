<script>
  /**
   * Collapsible section with a full-width header button, for stacking inside a panel.
   *
   *   <Collapsible title="Requirements" count={8}>…</Collapsible>             opens and closes on its own
   *   <Collapsible title="…" bind:open>…</Collapsible>                        the parent holds the state
   *   <Collapsible title="…" open={saved} ontoggle={(next) => save(next)}>…   …or stores it somewhere (preferences)
   *
   * `count` shows a number pill after the title; `meta` is an optional snippet at the right of the header.
   * `info`: what the section is for, behind an ⓘ right after the title (see InfoTip).
   * `id` names the body for aria-controls (one is made up if you leave it out).
   * Sections run edge to edge: set --bleed on the container to its side padding.
   */
  import Icon from './Icon.svelte'
  import InfoTip from './InfoTip.svelte'
  import { slide } from '../lib/motion.js'

  const uid = $props.id()
  /**
   * @typedef {object} Props
   * @property {string} [id] the body's id (generated when not given)
   * @property {string} title
   * @property {boolean} [open] bindable
   * @property {(open: boolean) => void} [ontoggle]
   * @property {number | string | null} [count]
   * @property {import('svelte').Snippet} [meta]
   * @property {string} [info]
   * @property {import('svelte').Snippet} children
   */
  /** @type {Props & Omit<import('svelte/elements').HTMLAttributes<HTMLElement>, keyof Props>} */
  let { id = 'c-' + uid, title, open = $bindable(true), ontoggle, count = null, meta, info = '', class: className, children, ...rest } = $props()
  const toggle = () => {
    open = !open
    ontoggle?.(open)
  }
</script>

<section class={['collapsible', className]} class:open {...rest}>
  <!-- The toggle is an empty button stretched over the whole header and named by the parts it covers, so the ⓘ can sit
       right after the title without being a button inside a button. -->
  <h3>
    <button
      type="button"
      class="hit"
      aria-expanded={open}
      aria-controls={id}
      aria-labelledby={[`${id}-title`, count != null && `${id}-count`, meta && `${id}-meta`].filter(Boolean).join(' ')}
      onclick={toggle}
    ></button>
    <span class="chev" aria-hidden="true"><Icon name="caretRight" size="sm" /></span>
    <span class="title" id="{id}-title" aria-hidden="true">{title}</span>
    {#if info}<InfoTip lines={[{ text: info }]} label="About {title}" />{/if}
    {#if count != null}<span class="count" id="{id}-count" aria-hidden="true">{count}</span>{/if}
    {#if meta}<span class="meta" id="{id}-meta" aria-hidden="true">{@render meta()}</span>{/if}
  </h3>
  {#if open}
    <div {id} class="body" transition:slide>
      <div class="inner">{@render children()}</div>
    </div>
  {/if}
</section>

<style>
  /* Sections run edge to edge across the panel they're in: the container sets --bleed to its side padding, the section
     extends into it with negative margins and pads back by the same amount, so the hairlines and the header's hover fill
     reach both edges while the chevron, title and content stay where they were. */
  .collapsible {
    --pad: calc(var(--bleed, 0px) + var(--space-1));
    margin-inline: calc(-1 * var(--bleed, 0px));
    border-top: 1px solid var(--line);
  }
  .collapsible:last-child {
    border-bottom: 1px solid var(--line);
  }
  /* The header row draws everything; the stretched .hit button on top of it takes the clicks, hover and focus ring.
     The ⓘ comes after .hit and is positioned, so it paints above it and keeps its own pointer. */
  h3 {
    position: relative;
    display: flex;
    align-items: center;
    gap: var(--space-2);
    min-height: 32px;
    margin: 0;
    padding: 0 var(--pad);
    color: var(--muted);
    font: var(--w-medium) 12px var(--font-body);
    transition:
      color var(--dur-fast) var(--ease-out),
      background-color var(--dur-fast) var(--ease-out);
  }
  h3:has(> .hit:hover) {
    color: var(--fg-2);
    background: var(--fill-2);
  }
  .hit {
    position: absolute;
    inset: 0;
    padding: 0;
    background: none;
    border: 0;
    border-radius: 0;
  }
  .hit:focus-visible {
    outline-offset: -2px;
    border-radius: 0;
  }
  /* Tucked against the title (the row's gap is for the other parts); its 24px box overlaps the row's padding. */
  h3 > :global(.info) {
    position: relative;
    margin: -4px 0 -4px calc(2px - var(--space-2));
  }
  .chev {
    display: inline-flex;
    rotate: 0deg;
    transition: rotate var(--dur) var(--ease-out);
  }
  .open .chev {
    rotate: 90deg;
  }
  .title {
    color: var(--fg);
  }
  .count {
    font: var(--w-medium) 11px var(--font-data);
    font-variant-numeric: tabular-nums;
    color: var(--muted);
    background: var(--fill-3);
    border-radius: var(--r-pill);
    padding: 1px 7px;
  }
  .meta {
    margin-left: auto;
    font: 400 12px var(--font-body);
  }
  .inner {
    padding: var(--space-1) var(--pad) var(--space-4);
    display: grid;
    gap: var(--space-3);
  }
</style>
