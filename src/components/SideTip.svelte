<script>
  /**
   * A card of rich detail beside a list, level with one of its items: what an option means, before it is chosen (VS
   * Code's suggestion details, Linear's previews). The host shows it while an item is under the pointer or the
   * keyboard, and points it at that item; Select and OptionList draw one from their options' `detail`. Use it for any
   * list of your own (a menu, a table's rows).
   *
   *   {#if open && options[active].detail}
   *     <SideTip id="plan-detail" for="plan-opt-{active}" beside={list} title="Pro" text="Unlimited projects." />
   *   {/if}
   *   <SideTip for={row} beside={table}>
   *     <h4>Pro</h4><p>Unlimited projects, <strong>priority</strong> support.</p><ul><li>…</li></ul>
   *   </SideTip>
   *
   * for: the item it describes, an element or its id. It sits level with the item's top, held inside the window.
   * beside: the element whose side it sits on (the list's floating box); default the item itself. It goes to the right
   * of it, else the left, else (no room either side, as on a phone) below it, else above.
   * title, text: a heading and a paragraph, for plain detail. children: anything richer, under them (headings,
   * paragraphs, lists, code, images; styled lightly here).
   * id: give one and point the item's aria-describedby at it, so the detail is read with the item.
   * It doesn't take the pointer (moving onto it would leave the list), so keep links and buttons out of it.
   * Lives in the top layer (above modal dialogs), follows the item as the list scrolls, fades in and out.
   * Other attributes (class…) and attachments go to the card.
   */
  import { untrack } from 'svelte'
  import { topLayer } from '../lib/dom.js'
  import { pop } from '../lib/motion.js'
  import { observeSize } from '../lib/observe.js'

  /**
   * @typedef {object} Props
   * @property {HTMLElement | string | null | undefined} for
   * @property {HTMLElement | null} [beside]
   * @property {string} [title]
   * @property {string} [text]
   * @property {import('svelte').Snippet} [children]
   */
  /** @type {Props & Omit<import('svelte/elements').HTMLAttributes<HTMLDivElement>, keyof Props>} */
  let { for: target, beside = null, title = '', text = '', class: className, children, ...rest } = $props()

  const GAP = 6 // from the list's edge
  const MARGIN = 8 // from the window's edge

  // Moving to another item moves the card; it stays the same node in the top layer (joining a modal dialog around it).
  const item = () => (typeof target === 'string' ? document.getElementById(target) : target)

  /** Attachment: places the card beside the list, level with the item; again when either moves or the card resizes. */
  function place(/** @type {HTMLElement} */ tip) {
    // Read here, so the card moves to the next item when the host points it there.
    const el = item()
    const box = beside ?? el
    if (!el || !box) return
    const update = () => {
      const r = el.getBoundingClientRect()
      const b = box.getBoundingClientRect()
      const w = tip.offsetWidth
      const h = tip.offsetHeight
      const fit = (/** @type {number} */ v, /** @type {number} */ size, /** @type {number} */ room) =>
        Math.max(MARGIN, Math.min(v, room - size - MARGIN))
      let left, top, side
      if (b.right + GAP + w <= innerWidth - MARGIN) [left, side] = [b.right + GAP, 'right']
      else if (b.left - GAP - w >= MARGIN) [left, side] = [b.left - GAP - w, 'left']
      if (side) {
        // Level with the item, kept within the list's own height where it can be.
        top = fit(Math.max(b.top, Math.min(r.top, b.bottom - h)), h, innerHeight)
      } else {
        left = fit(b.left, w, innerWidth)
        side = b.bottom + GAP + h <= innerHeight - MARGIN ? 'below' : 'above'
        top = fit(side === 'below' ? b.bottom + GAP : b.top - GAP - h, h, innerHeight)
      }
      tip.style.left = `${left}px`
      tip.style.top = `${top}px`
      tip.dataset.side = side
    }
    update()
    const stopSize = observeSize(tip, update)
    addEventListener('scroll', update, true)
    addEventListener('resize', update)
    return () => {
      stopSize()
      removeEventListener('scroll', update, true)
      removeEventListener('resize', update)
    }
  }
</script>

<div class={['side-tip', className]} role="tooltip" data-floating {...rest} {@attach topLayer(untrack(() => beside ?? item()))} {@attach place} transition:pop={{ from: beside ?? item() }}>
  {#if title}<strong class="title">{title}</strong>{/if}
  {#if text}<p>{text}</p>{/if}
  {@render children?.()}
</div>

<style>
  .side-tip {
    position: fixed;
    top: 0;
    left: 0;
    z-index: calc(var(--z-overlay) + 2);
    width: max-content;
    max-width: min(320px, calc(100dvw - 16px));
    max-height: calc(100dvh - 16px);
    overflow: clip;
    pointer-events: none;
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--line-float);
    background: var(--elevated);
    border-radius: var(--r-lg);
    box-shadow: var(--shadow);
    font: var(--w-normal) 12px/1.5 var(--font-body);
    color: var(--fg-2);
    text-align: left;
    white-space: normal;
    overflow-wrap: anywhere;
    letter-spacing: normal;
    text-transform: none;
  }
  /* The heading, given as `title` or as the first heading of the children. */
  .title,
  .side-tip :global(:is(h1, h2, h3, h4, h5, h6)) {
    margin: 0;
    font-size: 13px;
    font-weight: var(--w-semibold);
    line-height: 1.4;
    color: var(--fg);
  }
  .side-tip :global(:is(p, ul, ol, dl, figure, pre)) {
    margin: 0;
  }
  .side-tip :global(:is(ul, ol)) {
    padding-inline-start: var(--space-4);
  }
  .side-tip :global(ul) {
    list-style: disc;
  }
  .side-tip :global(ol) {
    list-style: decimal;
  }
  .side-tip :global(:is(code, kbd, time)) {
    font-family: var(--font-data);
    font-variant-numeric: tabular-nums;
  }
  .side-tip :global(strong) {
    font-weight: var(--w-semibold);
    color: var(--fg);
  }
  .side-tip :global(small) {
    color: var(--muted);
    font-size: 11px;
  }
  .side-tip :global(img) {
    max-width: 100%;
    border-radius: var(--r-sm);
  }
  .side-tip :global(hr) {
    margin: var(--space-1) calc(var(--space-3) * -1);
    border: 0;
    border-top: 1px solid var(--line);
  }
  @media (forced-colors: active) {
    .side-tip {
      border-color: CanvasText;
    }
  }
</style>
