<script>
  /**
   * Button that opens a non-modal panel below it (or above, with placement="above", for bottom bars). Escape or a
   * click outside closes it and returns focus to the button. The trigger shows an optional count badge for "what's
   * active inside". hideLabel keeps the label for screen readers only (when the trigger snippet says it already).
   * scrim dims the page behind the open panel (the header and status bar it opens from stay undimmed above it)
   * and swallows the outside press that closes it, so that press doesn't also hit whatever was under it.
   *
   *   <Popover id="filters" label="Filters" badge={active.length}>
   *     {#snippet trigger()}<Icon name="funnel" />{/snippet}
   *     {#snippet children({ close })}…<button type="button" class="btn" onclick={close}>Done</button>{/snippet}
   *   </Popover>
   *
   * children receives { close }, which closes the panel and puts the focus back on the button.
   * Once open, the panel stays where it opened even if the button changes size (say, its badge appears).
   * Other attributes (class…) and attachments go to the trigger button.
   */
  import { tick } from 'svelte'
  import { fly, fade } from '../lib/motion.js'
  import { portalNear } from '../lib/dom.js'
  import { observeSize } from '../lib/observe.js'

  /**
   * @typedef {object} Props
   * @property {string} id
   * @property {string} label
   * @property {number | string | null} [badge]
   * @property {boolean} [dot]
   * @property {'start' | 'end'} [align]
   * @property {'below' | 'above'} [placement]
   * @property {boolean} [hideLabel]
   * @property {number} [width] the panel's width in px
   * @property {boolean} [scrim]
   * @property {boolean} [open] bindable
   * @property {import('svelte').Snippet} trigger
   * @property {import('svelte').Snippet<[{ close: () => void }]>} children
   */
  /** @type {Props & Omit<import('svelte/elements').HTMLButtonAttributes, keyof Props>} */
  let {
    id,
    label,
    badge = null,
    dot = false,
    align = 'end',
    placement = 'below',
    hideLabel = false,
    width = 320,
    scrim = false,
    open = $bindable(false),
    trigger,
    class: className,
    children,
    ...rest
  } = $props()
  let button = $state(),
    panel = $state(),
    root = $state()

  /**
   * Attachment on the panel: holds it where it opened. It is placed against the button's edge (CSS); if the button then
   * changes size while it is open (a count appearing in it), that edge moves, and the panel would jump sideways with it.
   * So once it has opened, its horizontal place on the page is kept: whenever the popover's box moves or resizes, the
   * panel's offset inside it is corrected by the difference. Only while it is absolutely placed (a narrow window spans
   * it across the screen, which doesn't move).
   * @param {HTMLElement} node
   */
  function pin(node) {
    if (!root || getComputedStyle(node).position !== 'absolute') return
    const host = root
    const at = node.getBoundingClientRect().left - host.getBoundingClientRect().left
    const page = host.getBoundingClientRect().left + scrollX + at
    node.style.left = `${at}px`
    node.style.right = 'auto'
    const hold = () => {
      node.style.left = `${page - (host.getBoundingClientRect().left + scrollX)}px`
    }
    return observeSize(host, hold)
  }

  async function show() {
    open = true
    await tick()
    ;(panel.querySelector('[data-autofocus]') || panel.querySelector('button, [href], input, [tabindex]:not([tabindex="-1"])'))?.focus()
  }
  function hide(refocus = true) {
    open = false
    if (refocus) button?.focus()
  }

  function outside(e) {
    if (!open) return
    // Clicks inside the panel, on its button, or inside a menu/listbox opened from it (those live on <body>) stay open.
    if (panel?.contains(e.target) || button?.contains(e.target) || e.target.closest?.('.ctx-menu, [data-floating]')) return
    hide(false)
  }

  function onkeydown(e) {
    if (e.key === 'Escape' && !e.target.closest('[role="listbox"]')) {
      e.stopPropagation()
      hide()
    }
  }
</script>

<svelte:document onpointerdowncapture={outside} />

<div class="pop" bind:this={root}>
  <button
    {id}
    bind:this={button}
    type="button"
    class={['btn trigger', className]}
    {...rest}
    aria-expanded={open}
    aria-controls="{id}-panel"
    onclick={() => (open ? hide() : show())}
  >
    {@render trigger()}
    <span class="label" class:sr-only={hideLabel}>{label}</span>
    {#if badge}<span class="badge">{badge}</span>{/if}
    {#if dot}<span class="new-dot" aria-hidden="true"></span>{/if}
  </button>
  {#if open && scrim}
    <div class="pop-scrim" aria-hidden="true" {@attach portalNear(button)} transition:fade></div>
  {/if}
  {#if open}
    <div
      id="{id}-panel"
      bind:this={panel}
      class="panel"
      class:start={align === 'start'}
      class:above={placement === 'above'}
      style:--w="{width}px"
      role="dialog"
      aria-label={label}
      tabindex="-1"
      {onkeydown}
      {@attach pin}
      in:fly={{ y: placement === 'above' ? 6 : -6 }}
      out:fly={{ y: placement === 'above' ? 4 : -4 }}
    >
      {@render children({ close: () => hide() })}
    </div>
  {/if}
</div>

<style>
  .pop {
    position: relative;
  }
  .trigger[aria-expanded='true'] {
    background: var(--control-4);
    color: var(--fg);
  }
  .badge {
    font: var(--w-medium) 11px/1 var(--font-data);
    font-variant-numeric: tabular-nums;
    color: var(--accent-ink);
    background: var(--brand);
    border-radius: var(--r-pill);
    padding: 2px 5px;
    min-width: 16px;
    text-align: center;
  }
  .panel {
    position: absolute;
    z-index: var(--z-menu);
    top: calc(100% + 6px);
    right: 0;
    width: min(var(--w), calc(100dvw - 32px));
    max-height: min(70dvh, 560px);
    overflow: auto;
    overscroll-behavior: contain;
    border: 1px solid var(--line-float);
    background: var(--elevated);
    border-radius: var(--r-lg);
    box-shadow: var(--shadow);
  }
  /* Moved out of the trigger's bar (so its fixed box isn't trapped by a backdrop-filter) into the nearest [data-layer-root] or <body>, just
     under the header and status bar (z-header), so the bar it opened from and the panel inside it stay above it. */
  .pop-scrim {
    position: fixed;
    inset: 0;
    z-index: calc(var(--z-header) - 1);
    background: var(--scrim);
  }
  .panel.start {
    right: auto;
    left: 0;
  }
  .panel.above {
    top: auto;
    bottom: calc(100% + 6px);
  }
  .panel:focus {
    outline: none;
  }
  @media (max-width: 860px) {
    .pop {
      position: static;
    }
    .panel {
      left: var(--gutter-l);
      right: var(--gutter-r);
      width: auto;
      top: calc(100% + var(--space-1));
    }
    .panel.above {
      top: auto;
      bottom: calc(100% + var(--space-1));
    }
  }
</style>
