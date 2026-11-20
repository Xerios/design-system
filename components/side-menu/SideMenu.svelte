<script>
  /**
   * A side menu (Linear's sidebar): a header row on top (a title or workspace menu, with buttons at the right), then
   * groups of rows that scroll under it. Built from parts; import it from side-menu/index.js.
   *
   *   <SideMenu label="Sections">
   *     {#snippet header()}<WorkspaceMenu />{/snippet}
   *     {#snippet actions()}
   *       <Button iconOnly icon="search" label="Search" onclick={search} />
   *       <Button iconOnly icon="plus" label="New issue" onclick={compose} />
   *     {/snippet}
   *     <SideMenu.Group>
   *       <SideMenu.Item href="/inbox" icon="inbox" label="Inbox" count={3} current={path === '/inbox'} />
   *       <SideMenu.Item href="/mine" icon="target" label="My issues" />
   *     </SideMenu.Group>
   *     <SideMenu.Group title="Workspace">
   *       <SideMenu.Item href="/views" icon="stack" label="Views" />
   *       <SideMenu.Item icon="folder" label="Projects">            no href: a button that folds its items
   *         <SideMenu.Item href="/p/mobile" icon="phone" label="Mobile app" />
   *       </SideMenu.Item>
   *     </SideMenu.Group>
   *   </SideMenu>
   *
   * label: the <nav>'s accessible name (default "Menu").
   * header: the left of the top row (a title, or a menu button for the workspace). Its icon belongs in the icon column:
   * give it a negative start margin of --bleed, as a row's fill has.
   * actions: buttons at the right of the top row. The last is the menu's main action (new, compose): it is drawn raised,
   * and centred on the trailing column, where the rows' counts sit.
   * children: SideMenu.Group parts. They scroll, with edge fades, under the header.
   * Other attributes (class, id…) and attachments go to the <nav>. Fill the height it is given (it scrolls inside).
   *
   * Everything lines up on four columns, set here as properties and read by the parts: the content edge (--edge, where
   * group headings start), the icon column (--slot wide, icons centred in it), the label column after it (--gap on),
   * and the trailing column at the right (--trail wide, counts and buttons centred in it). A row's fill reaches --bleed
   * past the content edge on both sides. Override them on the element to retune the menu.
   * Keyboard: Tab moves through the header's controls, then the rows in order; Enter follows a link or folds a group.
   */
  import { scrollFade } from '../../lib/scroll-fade.js'

  /**
   * @typedef {object} Props
   * @property {string} [label]
   * @property {import('svelte').Snippet} [header]
   * @property {import('svelte').Snippet} [actions]
   * @property {import('svelte').Snippet} children
   */
  /** @type {Props & Omit<import('svelte/elements').HTMLAttributes<HTMLElement>, keyof Props>} */
  let { label = 'Menu', header, actions, class: className, children, ...rest } = $props()
</script>

<nav aria-label={label} class={['side-menu', className]} {...rest}>
  {#if header || actions}
    <div class="top">
      <div class="title">{@render header?.()}</div>
      {#if actions}<div class="actions">{@render actions()}</div>{/if}
    </div>
  {/if}
  <div class="scroll" {@attach scrollFade()}>{@render children()}</div>
</nav>

<style>
  /* Navigation chrome: nothing in it is text to copy or drag out (base.css); its links keep their right-click menu. */
  .side-menu {
    user-select: none;
    -webkit-user-select: none;
    --edge: var(--space-3);
    --slot: var(--icon-lg);
    --gap: var(--space-2);
    --trail: 28px;
    --bleed: var(--space-1);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    min-height: 0;
    height: 100%;
    padding: var(--space-2) var(--edge);
  }
  /* The title, then the actions ending on the trailing column. */
  .top {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: center;
    column-gap: var(--space-2);
    min-height: 32px;
  }
  .title {
    display: flex;
    align-items: center;
    min-width: 0;
  }
  .actions {
    display: flex;
    align-items: center;
    gap: var(--space-1);
  }
  /* The main action: raised, square-cornered like the rows, and exactly the trailing column's width. */
  .actions > :global(.icon-btn:last-child) {
    width: var(--trail);
    height: var(--trail);
    border: 1px solid var(--line-strong);
    border-radius: var(--r);
    background: var(--fill-1);
    box-shadow: var(--shadow-btn);
    color: var(--fg-2);
  }
  .actions > :global(.icon-btn:last-child:hover) {
    background: var(--fill-3);
    color: var(--fg);
  }
  .actions > :global(.icon-btn:last-child:active) {
    background: var(--fill-4);
  }
  .scroll {
    flex: 1;
    min-height: 0;
    /* The row fills reach past the content edge; the scroller must not clip them. */
    margin-inline: calc(var(--bleed) * -1);
    padding-inline: var(--bleed);
    overflow-y: auto;
    overscroll-behavior: contain;
    /* Leaves room under the last row, where the bottom fade is. */
    padding-bottom: var(--space-8);
  }
</style>
