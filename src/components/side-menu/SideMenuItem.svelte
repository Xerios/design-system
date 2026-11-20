<script>
  /**
   * SideMenu.Item: one row of a SideMenu: an icon in the icon column, the label in the label column, and a count or
   * other trailing content centred on the trailing column. A link with href, otherwise a button. Items nested in it are
   * its sub-items, shown under it; each level starts at its parent's label column (a child's icon there, or its label
   * when it has none), so labels line up down the menu. A hairline runs down the parent's icon column beside them.
   *
   *   <SideMenu.Item href="/inbox" icon="inbox" label="Inbox" count={3} current={path === '/inbox'} />
   *   <SideMenu.Item icon="gear" label="Settings" onclick={openSettings} />                 a button that acts
   *   <SideMenu.Item icon="folder" label="Projects">…items…</SideMenu.Item>                  a button that folds them
   *   <SideMenu.Item href="/team" icon="users" label="Team" open={path.startsWith('/team')}>…</SideMenu.Item>
   *
   * label: the row's text. href: makes it a link. icon: an Icon name, in the icon column.
   * current: marks the row as where you are (true is aria-current="page"; or pass "location" for a spot on the page,
   * "step"…): it takes the raised fill. A row whose open sub-items hold the current one keeps only its brighter text,
   * so one row is marked at a time.
   * count: a number in a badge on the trailing column (unread, items in it); trailing: a snippet there instead.
   * children: sub-items (SideMenu.Item). Without href the row folds them, with a caret after the label; with href they
   * show while open is true (bindable, default false), e.g. while its page is open. ontoggle(open) after a fold.
   * Other attributes (onclick, class, title…) and attachments go to the <a> or <button>.
   * Keyboard: a link or button in the Tab order; a folding row says whether it is open.
   */
  import { getContext, setContext } from 'svelte'

  import Icon from '../Icon.svelte'
  import { slide } from '../../lib/motion.js'
  import { DEPTH } from './context.js'

  /**
   * @typedef {object} Props
   * @property {string} label
   * @property {string} [href]
   * @property {string} [icon]
   * @property {boolean | 'page' | 'location' | 'step' | 'date' | 'time'} [current]
   * @property {number | string | null} [count]
   * @property {import('svelte').Snippet} [trailing]
   * @property {boolean} [open] bindable
   * @property {(open: boolean) => void} [ontoggle]
   * @property {import('svelte').Snippet} [children]
   */
  /** @type {Props & Omit<import('svelte/elements').HTMLAnchorAttributes & import('svelte/elements').HTMLButtonAttributes, keyof Props>} */
  let { label, href, icon, current = false, count = null, trailing, open = $bindable(false), ontoggle, class: className, onclick, children, ...rest } = $props()

  const uid = $props.id()
  /** @type {number} */
  const depth = getContext(DEPTH) ?? 0
  setContext(DEPTH, depth + 1)

  const ariaCurrent = $derived(current === true ? 'page' : current || undefined)
  // A row without a link folds its sub-items.
  const folds = $derived(!href && !!children)

  /** @param {MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }} e */
  function press(e) {
    onclick?.(e)
    if (!folds || e.defaultPrevented) return
    open = !open
    ontoggle?.(open)
  }
</script>

{#snippet content()}
  {#if icon}<Icon name={icon} size="lg" />{/if}
  <span class="name">
    <span class="label">{label}</span>
    {#if folds}<span class="caret"><Icon name="caretRight" size="sm" /></span>{/if}
  </span>
  {#if trailing}
    <span class="trail">{@render trailing()}</span>
  {:else if count != null}
    <span class="trail"><span class="count">{count}</span></span>
  {/if}
{/snippet}

<li class="side-menu-item">
  {#if href}
    <a class={['row', className]} class:bare={!icon} style:--depth={depth} {href} aria-current={ariaCurrent} {...rest} {onclick}>{@render content()}</a>
  {:else}
    <button
      type="button"
      class={['row', className]}
      class:bare={!icon}
      style:--depth={depth}
      aria-current={ariaCurrent}
      aria-expanded={folds ? open : undefined}
      aria-controls={folds ? `${uid}-items` : undefined}
      {...rest}
      onclick={press}>{@render content()}</button
    >
  {/if}
  {#if children && open}
    <ul id="{uid}-items" class="items" style:--depth={depth} transition:slide>{@render children()}</ul>
  {/if}
</li>

<style>
  .items {
    position: relative;
    display: grid;
    gap: 2px;
    margin-top: 2px;
  }
  /* The indent line: a hairline down the parent's icon column, beside its sub-items. A border, not a background, so it
     stays in forced colours. */
  .items::before {
    content: '';
    position: absolute;
    inset-block: 2px;
    inset-inline-start: calc(var(--depth) * (var(--slot) + var(--gap)) + var(--slot) / 2 - 0.5px);
    border-inline-start: 1px solid var(--line-strong);
    pointer-events: none;
  }

  /* The fill reaches --bleed past the content edge on both sides; each level of nesting starts one icon column and gap
     further in, at its parent's label column. */
  .row {
    all: unset;
    box-sizing: border-box;
    display: grid;
    grid-template-columns: var(--slot) minmax(0, 1fr) auto;
    align-items: center;
    column-gap: var(--gap);
    width: calc(100% + var(--bleed) * 2);
    min-height: 28px;
    margin-inline: calc(var(--bleed) * -1);
    padding-inline: calc(var(--bleed) + var(--depth) * (var(--slot) + var(--gap))) var(--bleed);
    border-radius: var(--r);
    color: var(--fg);
    font-size: 13px;
    font-weight: var(--w-medium);
    text-decoration: none;
    cursor: pointer;
    transition:
      background-color var(--dur) var(--ease-out),
      color var(--dur) var(--ease-out);
  }
  /* No icon: the label takes the icon column's place. */
  .row.bare {
    grid-template-columns: minmax(0, 1fr) auto;
  }
  .row > :global(.icon) {
    justify-self: center;
    color: var(--muted);
    transition: color var(--dur) var(--ease-out);
  }
  .row:hover {
    background: var(--control-2);
  }
  .row:hover > :global(.icon) {
    color: var(--fg-2);
  }
  .row[aria-current] {
    background: var(--control-3);
  }
  .row[aria-current] > :global(.icon) {
    color: var(--fg);
  }
  /* The current row is further down, among this row's sub-items: only that one takes the fill. */
  /* :global: the sub-items are other instances of this component. */
  .side-menu-item:has(> .items :global(.row[aria-current])) > .row[aria-current]:not(:hover) {
    background: none;
  }
  .row:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: -2px;
  }

  .name {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    min-width: 0;
  }
  .label {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .caret {
    display: inline-flex;
    flex: none;
    color: var(--muted);
    rotate: 0deg;
    transition: rotate var(--dur) var(--ease-out);
  }
  .row[aria-expanded='true'] .caret {
    rotate: 90deg;
  }

  /* The trailing column: its content centred on it, so counts line up with the header's main action. */
  .trail {
    display: grid;
    place-items: center;
    min-width: var(--trail);
  }
  .count {
    display: inline-grid;
    place-items: center;
    min-width: 20px;
    min-height: 20px;
    padding-inline: var(--space-1);
    border-radius: var(--r-sm);
    background: var(--fill-3);
    color: var(--fg-2);
    font: var(--w-medium) 11px var(--font-data);
    font-variant-numeric: tabular-nums;
  }

  @media (pointer: coarse) {
    .row {
      min-height: 44px;
    }
  }
  @media (forced-colors: active) {
    .row[aria-current] {
      outline: 1px solid Highlight;
      outline-offset: -1px;
    }
  }
</style>
