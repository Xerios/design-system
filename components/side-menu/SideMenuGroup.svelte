<script>
  /**
   * SideMenu.Group: a run of rows in a SideMenu. With a title, it gets a muted heading at the content edge that folds it
   * (the caret right after the name); without one, it is a plain list, for the menu's first rows (inbox, your own work),
   * set apart from the titled groups below by the space between groups.
   *
   *   <SideMenu.Group>…items…</SideMenu.Group>
   *   <SideMenu.Group title="Favorites">…items…</SideMenu.Group>                  opens and closes on its own
   *   <SideMenu.Group title="Teams" bind:open={teamsOpen}>…</SideMenu.Group>      the parent holds the state
   *   <SideMenu.Group title="Teams" open={saved} ontoggle={save}>…</SideMenu.Group>   …or stores it somewhere
   *
   * title: the heading. open (bindable, default true) and ontoggle(open): its folded state; only with a title.
   * children: SideMenu.Item rows.
   * Other attributes (class, id…) and attachments go to the wrapper.
   * Keyboard: the heading is a button (Enter or Space folds the group); it says whether the group is open.
   */
  import { setContext } from 'svelte'

  import Icon from '../Icon.svelte'
  import { slide } from '../../lib/motion.js'
  import { DEPTH } from './context.js'

  /**
   * @typedef {object} Props
   * @property {string} [title]
   * @property {boolean} [open] bindable
   * @property {(open: boolean) => void} [ontoggle]
   * @property {import('svelte').Snippet} children
   */
  /** @type {Props & Omit<import('svelte/elements').HTMLAttributes<HTMLDivElement>, keyof Props>} */
  let { title = '', open = $bindable(true), ontoggle, class: className, children, ...rest } = $props()

  const uid = $props.id()
  setContext(DEPTH, 0)

  function toggle() {
    open = !open
    ontoggle?.(open)
  }
</script>

<div class={['side-menu-group', className]} {...rest}>
  {#if title}
    <button type="button" id="{uid}-heading" class="heading" aria-expanded={open} aria-controls="{uid}-items" onclick={toggle}>
      <span class="name">{title}</span>
      <Icon name="caretDown" size="sm" />
    </button>
    {#if open}
      <ul id="{uid}-items" class="items" aria-labelledby="{uid}-heading" transition:slide>{@render children()}</ul>
    {/if}
  {:else}
    <ul class="items">{@render children()}</ul>
  {/if}
</div>

<style>
  .side-menu-group:not(:first-child) {
    margin-top: var(--space-5);
  }
  .items {
    display: grid;
    gap: 2px;
  }
  /* Muted text from the content edge, the caret right after it. */
  .heading {
    all: unset;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    gap: var(--space-1);
    min-height: 28px;
    max-width: 100%;
    margin-inline: calc(var(--bleed) * -1);
    padding-inline: var(--bleed);
    border-radius: var(--r);
    color: var(--muted);
    font-size: 12px;
    font-weight: var(--w-medium);
    cursor: pointer;
    transition: color var(--dur) var(--ease-out);
  }
  .heading:hover {
    color: var(--fg-2);
  }
  .heading:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: -2px;
  }
  .name {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .heading > :global(.icon) {
    flex: none;
    rotate: 0deg;
    transition: rotate var(--dur) var(--ease-out);
  }
  .heading[aria-expanded='false'] > :global(.icon) {
    rotate: -90deg;
  }
  @media (pointer: coarse) {
    .heading {
      min-height: 44px;
    }
  }
</style>
