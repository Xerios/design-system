<script>
  /**
   * A tile: a bordered box with a title, an optional icon and any content under it, that is an action (a link or a
   * button), a choice (a checkbox on its own, or an option of a TileGroup), or just content. The whole tile answers the
   * pointer, not only its title: the title is the control itself (so it is the control's name, and its content the
   * description), stretched over the tile. Content can be more than text (lists, chips, a figure, even its own buttons
   * or fields, which stay usable on top of the tile). A checkbox is the exception: only its top row (icon, title, check
   * mark and the padding round them) toggles it, so working with what is under it can't toggle it by accident; with no
   * content, the whole tile does.
   *
   *   <Tile title="Deploy guide" icon="rocket" href="/docs/deploy" cta="Read the guide">From a fresh repo to a live site.</Tile>
   *   <Tile title="Run checks" icon="flask" onclick={run}>Lint, types and tests.</Tile>
   *   <Tile title="Nightly backups" bind:checked={backups}>Kept for 30 days.</Tile>
   *   <TileGroup label="Plan" bind:value={plan}>
   *     <Tile value="free" title="Free">Up to 3 projects.</Tile>
   *     <Tile value="pro" title="Pro">Unlimited projects.</Tile>
   *   </TileGroup>
   *
   * What it is, the first that applies:
   *   inside a TileGroup and given a `value` → one of the group's options (a radio, or a checkbox when the group is `multiple`)
   *   `checked` given (a boolean, bindable) → a checkbox on its own
   *   `href` → a link; `onclick` → a button
   *   none of these → content only, not interactive
   *
   * title: the tile's name, one line at the top.
   * icon: a registered icon name, before the title.
   * value: its value as an option of the TileGroup around it.
   * checked: bindable; makes it a checkbox on its own.
   * href, target, rel: a link. An external address (http or https) opens in a new tab unless `target` says otherwise.
   * onclick(event): a button; on a link or a choice it runs after the press is handled.
   * cta: a short call to action at the foot (actions only), with the arrow.
   * arrow: an arrow at the foot that nudges on hover (default: on links; ↗ for an external one). Actions only.
   * horizontal: icon, text and arrow or check mark in one row, for a list of tiles rather than a grid.
   * disabled: out of reach, faded.
   * Children: the content under the title. Other attributes, the class and attachments go to the tile's box.
   * Keyboard: Tab reaches it (an option of a one-choice group: the chosen one only, then arrows move and choose);
   * Enter follows a link or presses a button; Space toggles a checkbox or presses a button.
   *
   * @typedef {object} Props
   * @property {string} title
   * @property {string} [icon]
   * @property {string} [value]
   * @property {boolean} [checked]
   * @property {string} [href]
   * @property {string} [target]
   * @property {string} [rel]
   * @property {(event: MouseEvent) => void} [onclick]
   * @property {string} [cta]
   * @property {boolean} [arrow]
   * @property {boolean} [horizontal]
   * @property {boolean} [disabled]
   * @property {import('svelte').Snippet} [children]
   */
  import { getContext } from 'svelte'
  import Icon from '../Icon.svelte'
  import { TILE_GROUP } from './context.js'

  /** @type {Props & Omit<import('svelte/elements').HTMLAttributes<HTMLDivElement>, keyof Props>} */
  let {
    title,
    icon,
    value,
    checked = $bindable(),
    href,
    target,
    rel,
    onclick,
    cta = '',
    arrow,
    horizontal = false,
    disabled = false,
    children,
    class: className,
    ...rest
  } = $props()
  const uid = $props.id()

  /** @type {import('./context.js').TileGroupContext | undefined} */
  const group = getContext(TILE_GROUP)

  const option = $derived(group !== undefined && value !== undefined)
  const kind = $derived(option ? (group?.multiple ? 'checkbox' : 'radio') : checked !== undefined ? 'checkbox' : href ? 'link' : onclick ? 'button' : 'static')
  const choice = $derived(kind === 'radio' || kind === 'checkbox')
  const on = $derived(choice && (option ? !!group?.isChosen(/** @type {string} */ (value)) : !!checked))
  const off = $derived(disabled || (option && !!group?.disabled))
  const external = $derived(!!href && /^https?:\/\//i.test(href))
  const linkTarget = $derived(target ?? (external ? '_blank' : undefined))
  const showArrow = $derived(!choice && (arrow ?? kind === 'link'))
  const body = $derived(children ? `${uid}-body` : undefined)

  // An option that can be reached joins the group's list, so the group knows which comes first.
  $effect(() => {
    if (option && !off) return group?.register(/** @type {string} */ (value))
  })

  /** @param {MouseEvent} e */
  function press(e) {
    if (option) group?.choose(/** @type {string} */ (value))
    else if (kind === 'checkbox') checked = !checked
    onclick?.(e)
  }
</script>

<!-- The state classes go in the class array, not class: directives: next to the spread, Svelte's server output passes a
     $derived's getter to a shorthand class:name (always truthy) instead of its value. -->
<div class={['tile', className, { horizontal, interactive: kind !== 'static', checkbox: kind === 'checkbox', on, off }]} {...rest}>
  {#if kind === 'checkbox'}
    <!-- Its top row is the control: icon, title and check mark in one button, laid on the tile's columns. -->
    <button type="button" class="hit head" role="checkbox" aria-checked={on} disabled={off} aria-describedby={body} onclick={press}>
      {#if icon}<span class="lead" aria-hidden="true"><Icon name={icon} /></span>{/if}
      <span class="title">{title}</span>
      <span class="mark" aria-hidden="true"><Icon name="checkBold" size="sm" /></span>
    </button>
  {:else if icon}
    <span class="lead" aria-hidden="true"><Icon name={icon} /></span>
  {/if}
  {#if kind === 'link'}
    <a
      class="hit title"
      href={off ? undefined : href}
      role={off ? 'link' : undefined}
      aria-disabled={off || undefined}
      target={linkTarget}
      rel={rel ?? (external ? 'noopener noreferrer' : undefined)}
      aria-describedby={body}
      {onclick}
      >{title}{#if linkTarget === '_blank'}<span class="sr-only"> (opens in a new tab)</span>{/if}</a
    >
  {:else if kind === 'static'}
    <span class="title">{title}</span>
  {:else if kind !== 'checkbox'}
    <button
      type="button"
      class="hit title"
      role={kind === 'radio' ? 'radio' : undefined}
      aria-checked={kind === 'radio' ? on : undefined}
      tabindex={option ? group?.tabStop(/** @type {string} */ (value)) : undefined}
      disabled={off}
      aria-describedby={body}
      onclick={press}>{title}</button
    >
  {/if}
  {#if kind === 'radio'}<span class="mark radio" aria-hidden="true"></span>{/if}
  {#if children}<div class="body" id={body}>{@render children()}</div>{/if}
  {#if !choice && (cta || showArrow)}
    <div class="foot">
      {#if cta}<span>{cta}</span>{/if}
      {#if showArrow}<span class="arrow" aria-hidden="true"><Icon name={external ? 'external' : 'arrowRight'} size="sm" /></span>{/if}
    </div>
  {/if}
</div>

<style>
  /* A grid: icon, title and check mark across the top, the content under them, the foot at the bottom (pushed there when
     the tile is stretched to its row). Spacing is margins, not gaps, so a part that is left out leaves no gap. */
  .tile {
    position: relative;
    isolation: isolate;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    grid-template-rows: auto 1fr auto;
    grid-template-areas:
      'lead title end'
      'body body body'
      'foot foot foot';
    align-items: start;
    min-width: 0;
    --tile-pad-y: var(--space-4);
    --tile-pad-x: var(--space-4);
    padding: var(--tile-pad-y) var(--tile-pad-x);
    border: 1px solid var(--line);
    border-radius: var(--r-lg);
    background: var(--surface);
    color: var(--fg);
    text-align: start;
    transition:
      border-color var(--dur) var(--ease-out),
      translate var(--dur-fast) var(--ease-out);
  }
  /* The hover, pressed and chosen fills: translucent, laid over the surface under the content. */
  .tile::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: -1;
    border-radius: calc(var(--r-lg) - 1px);
    pointer-events: none;
    transition: background-color var(--dur) var(--ease-out);
  }
  /* Tiles you can press are raised like a button (its faint fill and relief); content-only tiles stay flat. */
  .interactive {
    background: var(--control-1);
    box-shadow: var(--shadow-btn);
  }
  /* A checkbox lights up only while its top row, the part that toggles it, is under the pointer. */
  .interactive:hover:not(.off, .on, .checkbox),
  .checkbox:not(.off, .on):has(> .head:hover) {
    border-color: var(--line-strong);
  }
  .interactive:hover:not(.off, .on, .checkbox)::before,
  .checkbox:not(.off, .on):has(> .head:hover)::before {
    background: var(--control-2);
  }
  .interactive:not(.off):has(> .hit:active) {
    translate: 0 1px;
  }
  .interactive:not(.off):has(> .hit:active)::before {
    background: var(--control-3);
  }
  .on {
    border-color: var(--accent);
  }
  .on::before {
    background: var(--accent-soft);
  }
  .off {
    opacity: 0.5;
  }

  /* The control: plain text in the tile, with its ::after stretched over the whole tile (it has no position of its own,
     so the tile is what the ::after is placed in). Its focus ring is drawn round the tile instead. */
  .hit {
    margin: 0;
    padding: 0;
    border: 0;
    background: none;
    font: inherit;
    color: inherit;
    text-align: inherit;
    text-decoration: none;
    cursor: pointer;
  }
  .hit::after {
    content: '';
    position: absolute;
    inset: -1px;
    border-radius: var(--r-lg);
  }
  .hit:focus-visible {
    outline: none;
  }
  .tile:has(> .hit:focus-visible) {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
  .off .hit {
    cursor: default;
  }

  /* A checkbox's top row: one button holding icon, title and check mark, laid on the tile's own columns (subgrid) so the
     content under it lines up as in any tile. Its hit area reaches out through the padding at the top and sides and a
     little below; the content under it is outside the control. With no content it fills the tile, as other tiles do. */
  .head {
    position: relative;
    grid-area: 1 / 1 / 2 / -1;
    display: grid;
    grid-template-columns: subgrid;
    align-items: start;
  }
  .head > .lead {
    grid-area: 1 / 1;
  }
  .head > .title {
    grid-area: 1 / 2;
  }
  .head > .mark {
    grid-area: 1 / 3;
  }
  .head::after {
    inset: calc(-1px - var(--tile-pad-y)) calc(-1px - var(--tile-pad-x)) calc(var(--space-1) * -1);
    border-radius: var(--r-lg) var(--r-lg) 0 0;
  }
  .head:last-child {
    grid-row: 1 / -1;
    align-self: stretch;
  }
  .head:last-child::after {
    bottom: calc(-1px - var(--tile-pad-y));
    border-radius: var(--r-lg);
  }

  .lead {
    grid-area: lead;
    display: flex;
    align-items: center;
    height: 1lh;
    margin-inline-end: var(--space-2);
    color: var(--fg-2);
    transition: color var(--dur) var(--ease-out);
  }
  .on .lead {
    color: var(--accent);
  }
  .title {
    grid-area: title;
    min-width: 0;
    color: var(--fg);
    font-weight: var(--w-medium);
  }

  /* The check mark: a box (a ring for a radio) one line tall beside the title, filled with the brand colour when chosen. */
  .mark {
    grid-area: end;
    display: grid;
    place-items: center;
    width: 16px;
    height: 16px;
    margin-block: calc((1lh - 16px) / 2);
    margin-inline-start: var(--space-3);
    border: 1px solid var(--faint);
    border-radius: calc(var(--r-sm) - 2px);
    background: var(--control-1);
    color: var(--accent-ink);
    transition:
      background-color var(--dur) var(--ease-out),
      border-color var(--dur) var(--ease-out);
  }
  .mark.radio {
    border-radius: var(--r-pill);
  }
  .mark.radio::after {
    content: '';
    width: 6px;
    height: 6px;
    border-radius: var(--r-pill);
    background: var(--accent-ink);
  }
  .mark :global(.icon),
  .mark.radio::after {
    opacity: 0;
    scale: 0.5;
    transition:
      opacity var(--dur) var(--ease-out),
      scale var(--dur) var(--ease-out);
  }
  .on .mark {
    border-color: var(--brand);
    background: var(--brand);
  }
  .on .mark :global(.icon),
  .on .mark.radio::after {
    opacity: 1;
    scale: 1;
  }

  /* Content sits above the stretched control so its own controls can be used, but lets every other press fall through
     to it. Only where the control is stretched over the whole tile: a plain tile's content, and a checkbox's (outside
     its control), are ordinary text. */
  .body {
    grid-area: body;
    min-width: 0;
    margin-top: var(--space-2);
    color: var(--muted);
    font-size: 12px;
  }
  .interactive:not(.checkbox) .body {
    position: relative;
    z-index: 1;
    pointer-events: none;
  }
  .interactive:not(.checkbox) .body :global(:is(a, button, input, select, textarea, label, summary, [tabindex], [contenteditable])) {
    pointer-events: auto;
  }

  .foot {
    grid-area: foot;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--space-1);
    margin-top: var(--space-3);
    color: var(--muted);
    font-size: 12px;
    font-weight: var(--w-medium);
    transition: color var(--dur) var(--ease-out);
  }
  .arrow {
    display: inline-flex;
    transition: translate var(--dur) var(--ease-out);
  }
  .interactive:hover:not(.off) .foot {
    color: var(--accent);
  }
  .interactive:hover:not(.off) .arrow {
    translate: 2px 0;
  }

  /* One row: the icon down the left, title over content in the middle, the check mark or the foot at the right. */
  .horizontal {
    grid-template-rows: auto 1fr;
    grid-template-areas:
      'lead title end'
      'lead body end';
    --tile-pad-y: var(--space-3);
  }
  .horizontal .body {
    margin-top: var(--space-1);
  }
  .horizontal .foot {
    grid-area: end;
    align-self: center;
    margin: 0 0 0 var(--space-3);
  }

  /* Forced colours drop the fills that mark a chosen tile and its check: draw them in system colours. */
  @media (forced-colors: active) {
    .on {
      border-color: Highlight;
    }
    .on .mark {
      border-color: Highlight;
      background: Highlight;
      color: HighlightText;
    }
    .mark.radio::after {
      background: HighlightText;
    }
  }
</style>
