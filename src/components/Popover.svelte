<script>
  /**
   * A non-modal panel opened from a button of your own, below it (or above, with placement="above", for bottom bars).
   * Escape or a press outside closes it and returns focus to the button; Tab past its last control (or Shift+Tab before
   * its first) closes it too and goes on from the button. scrim dims the page behind the open panel (the header and
   * status bar it opens from stay undimmed above it, see portalNear) and swallows the outside press that closes it, so
   * that press doesn't also hit whatever was under it.
   *
   *   <Popover id="filters" label="Filters">
   *     {#snippet button(props)}
   *       <Button icon="funnel" {...props}>Filters{#if active.length}<span class="badge">{active.length}</span>{/if}</Button>
   *     {/snippet}
   *     {#snippet children({ close })}…<Button small onclick={close}>Done</Button>{/snippet}
   *   </Popover>
   *   <Popover id="share" label="Share" scrim>
   *     {#snippet button(props)}<Button iconOnly icon="share" label="Share" {...props} />{/snippet}
   *     {#snippet children({ close })}…{/snippet}
   *   </Popover>
   *
   * button (required): snippet (props) drawing the trigger. Spread `props` on a `Button` (or any element that passes
   * them to its <button>): they carry its id, aria-expanded, aria-controls, the press that toggles the panel and an
   * attachment the popover finds the button by and anchors the panel to. Name the button as any: its visible text, or
   * `iconOnly` with a `label` (aria-label and tooltip). `.badge` and `.new-dot` (css/atoms.css) mark what's active inside.
   * children receives { close }, which closes the panel and puts the focus back on the button.
   * align: which edge of the button the panel lines up with ('end', the default, or 'start'); it flips to the other
   * side, or above, when there is no room. width: the panel's width in px. Under 860px it spans the window instead.
   * Once open, the panel stays where it opened even if the button changes size (say, its badge appears).
   * Other attributes (class…) and attachments go to the panel.
   */
  import { tick } from 'svelte'
  import { createAttachmentKey } from 'svelte/attachments'
  import { fly, fade } from '../lib/motion.js'
  import { portalNear } from '../lib/dom.js'
  import { observeSize } from '../lib/observe.js'

  /**
   * @typedef {object} Props
   * @property {string} id the button's id; the panel's is `{id}-panel`
   * @property {string} label the panel's accessible name
   * @property {'start' | 'end'} [align]
   * @property {'below' | 'above'} [placement]
   * @property {number} [width] the panel's width in px
   * @property {boolean} [scrim]
   * @property {boolean} [open] bindable
   * @property {import('svelte').Snippet<[Record<string | symbol, any>]>} button draws the trigger, given the props to spread on it
   * @property {import('svelte').Snippet<[{ close: () => void }]>} children
   */
  /** @type {Props & Omit<import('svelte/elements').HTMLAttributes<HTMLDivElement>, keyof Props>} */
  let {
    id,
    label,
    align = 'end',
    placement = 'below',
    width = 320,
    scrim = false,
    open = $bindable(false),
    button: renderButton,
    class: className,
    children,
    ...rest
  } = $props()
  /** @type {HTMLElement | undefined} */
  let button = $state()
  /** @type {HTMLElement | undefined} */
  let panel = $state()

  // The panel is anchored to the button in CSS (anchor positioning), so it can live beside the scrim (portalNear), above
  // it, wherever the button is; each Popover needs its own anchor name.
  const uid = $props.id()
  const anchor = `--popover-${uid}`

  // The attachment in the button's props: tells the popover which element it is (focus returns to it, a press on it
  // isn't an outside press) and adds the anchor name to any it already has (Button has its own, for its error bubble).
  const ref = createAttachmentKey()
  /** @param {HTMLElement} node */
  const claim = (node) => {
    button = node
    const before = node.style.getPropertyValue('anchor-name')
    node.style.setProperty('anchor-name', before ? `${before}, ${anchor}` : anchor)
    return () => {
      node.style.setProperty('anchor-name', before)
      if (button === node) button = undefined
    }
  }
  const buttonProps = $derived({
    id,
    'aria-expanded': open,
    'aria-controls': `${id}-panel`,
    // Returns nothing: Button would show a promise (show's) as busy.
    onclick: () => void (open ? hide() : show()),
    [ref]: claim,
  })

  /**
   * Attachment on the panel: holds it where it opened. It lines up with the button's edge; if the button then changes
   * size while it is open (a count appearing in it), that edge may move, and the panel would jump sideways with it. So
   * each move of the edge on a resize is taken back with a shift (--pin, used above 860px only).
   * @param {HTMLElement} node
   */
  function pin(node) {
    const el = button
    if (!el) return
    const edge = () => {
      const r = el.getBoundingClientRect()
      return align === 'start' ? r.left : r.right
    }
    let last = edge(),
      shift = 0
    return observeSize(el, () => {
      const now = edge()
      shift -= now - last
      last = now
      node.style.setProperty('--pin', `${shift}px`)
    })
  }

  async function show() {
    open = true
    await tick()
    ;(panel?.querySelector('[data-autofocus]') || panel?.querySelector(FOCUSABLE))?.focus()
  }
  function hide(refocus = true) {
    open = false
    if (refocus) button?.focus()
  }

  function outside(e) {
    if (!open) return
    // Presses inside the panel, on its button, or inside a menu/listbox opened from it (those live on <body>) stay open.
    if (panel?.contains(e.target) || button?.contains(e.target) || e.target.closest?.('.ctx-menu, [data-floating]')) return
    hide(false)
  }

  const FOCUSABLE = 'button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])'

  function onkeydown(e) {
    if (e.key === 'Escape' && !e.target.closest('[role="listbox"]')) {
      e.stopPropagation()
      hide()
    }
    // The panel isn't next to the button in the page (it sits beside the scrim), so Tab out of it would land at the end
    // of the page: closing puts the focus back on the button, and a Tab goes on from there.
    if (e.key === 'Tab' && panel) {
      const items = [...panel.querySelectorAll(FOCUSABLE)].filter((el) => el.checkVisibility?.() ?? true)
      const at = document.activeElement
      if (e.shiftKey && (at === panel || at === items[0])) {
        e.preventDefault()
        hide()
      } else if (!e.shiftKey && (!items.length || at === items.at(-1))) hide()
    }
  }
</script>

<svelte:document onpointerdowncapture={outside} />

{@render renderButton(buttonProps)}
<!-- Each in its own block: a block whose only node was moved elsewhere (portalNear) is removed cleanly. -->
{#if open && scrim}
  <div class="pop-scrim" aria-hidden="true" {@attach portalNear(button)} transition:fade></div>
{/if}
{#if open}
  <div
    id="{id}-panel"
    bind:this={panel}
    class={['panel', className]}
    {...rest}
    class:start={align === 'start'}
    class:above={placement === 'above'}
    style:--w="{width}px"
    style:position-anchor={anchor}
    role="dialog"
    aria-label={label}
    tabindex="-1"
    data-floating
    {onkeydown}
    {@attach portalNear(button)}
    {@attach pin}
    in:fly={{ y: placement === 'above' ? 6 : -6 }}
    out:fly={{ y: placement === 'above' ? 4 : -4 }}
  >
    {@render children({ close: () => hide() })}
  </div>
{/if}

<style>
  /* Moved out of the trigger's bar (so its fixed box isn't trapped by a backdrop-filter) into the nearest [data-layer-root] or <body>, just
     under the header and status bar (z-header), so the bar it opened from stays above it. The panel goes to the same
     place, above it (z-menu). */
  .pop-scrim {
    position: fixed;
    inset: 0;
    z-index: calc(var(--z-header) - 1);
    background: var(--scrim);
  }
  /* Anchored to the button: below it, lined up with its end edge (or start edge), flipped above or to the other side
     when it would overflow the window. Hidden while the button is scrolled out of view. */
  .panel {
    position: fixed;
    z-index: var(--z-menu);
    position-area: block-end span-inline-start;
    position-try-fallbacks:
      flip-block,
      flip-inline,
      flip-block flip-inline;
    position-visibility: anchors-visible;
    margin-block: 6px;
    translate: var(--pin, 0) 0;
    width: min(var(--w), calc(100dvw - 32px));
    max-height: min(70dvh, 560px);
    overflow: auto;
    overscroll-behavior: contain;
    border: 1px solid var(--line-float);
    background: var(--elevated);
    border-radius: var(--r-lg);
    box-shadow: var(--shadow);
  }
  .panel.start {
    position-area: block-end span-inline-end;
  }
  .panel.above {
    position-area: block-start span-inline-start;
  }
  .panel.start.above {
    position-area: block-start span-inline-end;
  }
  .panel:focus {
    outline: none;
  }
  /* Narrow: across the window between the gutters, under (or over) the button. */
  @media (max-width: 860px) {
    .panel,
    .panel.start,
    .panel.above,
    .panel.start.above {
      position-area: none;
      position-try-fallbacks: none;
      margin: 0;
      translate: none;
      left: var(--gutter-l);
      right: var(--gutter-r);
      width: auto;
      top: calc(anchor(bottom) + var(--space-1));
    }
    .panel.above,
    .panel.start.above {
      top: auto;
      bottom: calc(anchor(top) + var(--space-1));
    }
  }
</style>
