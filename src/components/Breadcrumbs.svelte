<script>
  /**
   * Breadcrumbs: the path from the top of a hierarchy down to the page you are on, each level a link back up. Levels
   * are split by a caret; the last one is the current page (aria-current="page"), drawn as plain text in the brighter
   * colour. A long path folds its middle levels behind a "…" button that shows them in place, so the first level and
   * the nearest ones stay in view. A label longer than its room is cut short with an ellipsis and has a tooltip giving
   * it in full.
   *
   *   <Breadcrumbs items={[{ label: 'Projects', href: '/projects' }, { label: 'Atlas', href: '/projects/atlas' }, { label: 'Settings' }]} />
   *   <Breadcrumbs items={path} max={3} />                                      first level, "…", then the last two
   *   <Breadcrumbs items={[{ label: 'Home', icon: 'house', href: '/' }, …]} />  an icon before a label
   *   <Breadcrumbs items={[{ label: 'Inbox', onclick: () => go('inbox') }, …]} /> a button, for navigation without URLs
   *
   * items: the levels, top first. Each has a label, and an href (a link), an onclick (a button, or the link's own
   * handler, for a router), or neither (plain text, for a level with no page of its own); icon: an Icon name before it.
   * current: the last item is the page you are on (default true); false makes it a link like the rest, for a trail
   * that stops at the parent. max: the most levels shown before the middle ones fold (default 4; 0 never folds); the
   * fold opens again when the items change. label: the navigation landmark's name (default "Breadcrumb").
   * Other attributes (class…) and attachments go to the <nav>.
   * Keyboard: each link or button is in the Tab order. "…" shows the folded levels and moves the focus to the first.
   */
  import { tick } from 'svelte'

  import Icon from './Icon.svelte'
  import { tooltip } from '../lib/tooltip.js'
  import { observeSize } from '../lib/observe.js'

  /**
   * @typedef {object} Crumb
   * @property {string} label
   * @property {string} [href]
   * @property {string} [icon]
   * @property {(e: MouseEvent) => void} [onclick]
   */
  /**
   * @typedef {object} Props
   * @property {Crumb[]} items
   * @property {boolean} [current]
   * @property {number} [max]
   * @property {string} [label]
   */
  /** @type {Props & Omit<import('svelte/elements').HTMLAttributes<HTMLElement>, keyof Props>} */
  let { items, current = true, max = 4, label = 'Breadcrumb', class: className, ...rest } = $props()

  // Shown in full once "…" is pressed; new items fold again.
  let unfolded = $derived.by(() => {
    void items
    return false
  })
  // The first level stays, then the last max - 1; the ones between fold. Folding a single level would save nothing.
  const keep = $derived(Math.max(max, 2) - 1)
  const folds = $derived(max > 0 && !unfolded && items.length - 1 - keep > 1)
  const shown = $derived(folds ? [0, ...items.map((_, i) => i).slice(-keep)] : items.map((_, i) => i))

  /** @type {HTMLOListElement | undefined} */
  let list = $state()

  async function unfold() {
    unfolded = true
    await tick()
    list?.querySelectorAll('li')[1]?.querySelector('a, button')?.focus()
  }

  /**
   * Attachment: the tooltip with the whole label, only while the label is cut short.
   * @param {string} text
   * @returns {import('svelte/attachments').Attachment<HTMLElement>}
   */
  const whole = (text) => (node) => {
    const label = /** @type {HTMLElement | null} */ (node.querySelector('.text'))
    if (!label) return
    /** @type {(() => void) | null} */
    let off = null
    const check = () => {
      const cut = label.scrollWidth > label.clientWidth
      if (cut && !off) off = tooltip(text)(node) ?? (() => {})
      else if (!cut && off) {
        off()
        off = null
      }
    }
    const stop = observeSize(label, check)
    return () => {
      stop()
      off?.()
    }
  }
</script>

{#snippet content(/** @type {Crumb} */ item)}
  {#if item.icon}<Icon name={item.icon} size="sm" />{/if}
  <span class="text">{item.label}</span>
{/snippet}

<nav class={['breadcrumbs', className]} aria-label={label} {...rest}>
  <ol bind:this={list}>
    {#each shown as i, at (i)}
      {@const item = items[i]}
      {@const here = current && i === items.length - 1}
      <li>
        {#if at > 0}<span class="sep"><Icon name="caretRight" size="sm" /></span>{/if}
        {#if here}
          <span class="crumb" aria-current="page" {@attach whole(item.label)}>{@render content(item)}</span>
        {:else if item.href}
          <a class="crumb link" href={item.href} onclick={item.onclick} {@attach whole(item.label)}>{@render content(item)}</a>
        {:else if item.onclick}
          <button type="button" class="crumb link" onclick={item.onclick} {@attach whole(item.label)}>{@render content(item)}</button>
        {:else}
          <span class="crumb" {@attach whole(item.label)}>{@render content(item)}</span>
        {/if}
      </li>
      {#if folds && at === 0}
        <li>
          <span class="sep"><Icon name="caretRight" size="sm" /></span>
          <button type="button" class="crumb link more" aria-label="Show the full path" {@attach tooltip('Show the full path')} onclick={unfold}>
            <Icon name="more" size="sm" />
          </button>
        </li>
      {/if}
    {/each}
  </ol>
</nav>

<style>
  /* Pulled back by the crumbs' padding, so the first label lines up with the content around it. */
  ol {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 2px;
    margin: 0;
    margin-inline-start: calc(var(--space-1) * -1);
    padding: 0;
    list-style: none;
    font-size: 13px;
  }
  li {
    display: flex;
    align-items: center;
    gap: 2px;
    min-width: 0;
  }
  .sep {
    display: inline-flex;
    flex: none;
    color: var(--faint);
  }

  .crumb {
    all: unset;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    min-width: 0;
    min-height: 24px;
    padding-inline: var(--space-1);
    border-radius: var(--r-sm);
    color: var(--muted);
    font-weight: var(--w-medium);
    text-decoration: none;
  }
  .crumb > :global(.icon) {
    flex: none;
  }
  .text {
    max-inline-size: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .crumb[aria-current] {
    color: var(--fg);
  }
  /* The page you are on may take what room there is. */
  .crumb[aria-current] .text {
    max-inline-size: none;
  }

  /* A link is readable at rest, as hovering changes only its fill; the page you are on stays the brightest. */
  .link {
    color: var(--fg-2);
    cursor: pointer;
    transition:
      background-color var(--dur) var(--ease-out),
      color var(--dur) var(--ease-out);
  }
  .link:hover {
    background: var(--control-2);
  }
  .link:active {
    background: var(--control-3);
  }
  .link:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: -2px;
  }
  .more {
    justify-content: center;
    min-width: 24px;
  }

  @media (max-width: 859px) {
    .text {
      max-inline-size: 120px;
    }
  }
  @media (pointer: coarse) {
    .crumb {
      min-height: 32px;
    }
    .more {
      min-width: 32px;
    }
  }
</style>
