<script>
  /**
   * A non-modal panel opened from a button of your own, below it (or above, with placement="above", for bottom bars).
   * Escape or a press outside closes it and returns focus to the button; Tab past its last control (or Shift+Tab before
   * its first) closes it too and goes on from the button. scrim dims the page behind the open panel (the header and
   * status bar it opens from stay undimmed above it, see portalNear; the panel, in the top layer, stays above it) and
   * swallows the outside press that closes it, so that press doesn't also hit whatever was under it.
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
   * Once open, the panel stays where it opened even if the button changes size (say, its badge appears). The panel is
   * AnchoredPanel, as the filter bar's are.
   * Other attributes (class…) and attachments go to the panel.
   */
  import { createAttachmentKey } from 'svelte/attachments'
  import { fade } from '../lib/motion.js'
  import { portalNear } from '../lib/dom.js'
  import AnchoredPanel from './AnchoredPanel.svelte'

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
    children,
    ...rest
  } = $props()
  /** @type {HTMLElement | undefined} */
  let button = $state()

  // The attachment in the button's props: tells the popover which element it is (the panel anchors to it, focus returns
  // to it, a press on it isn't an outside press).
  const ref = createAttachmentKey()
  /** @param {HTMLElement} node */
  const claim = (node) => {
    button = node
    return () => {
      if (button === node) button = undefined
    }
  }
  const buttonProps = $derived({
    id,
    'aria-haspopup': 'dialog',
    'aria-expanded': open,
    'aria-controls': open ? `${id}-panel` : undefined,
    // Returns nothing: Button would take a promise for work and show it as busy.
    onclick: () => void (open = !open),
    [ref]: claim,
  })

  function hide(refocus = true) {
    open = false
    if (refocus) button?.focus()
  }
</script>

{@render renderButton(buttonProps)}
<!-- Each in its own block: a block whose only node was moved elsewhere is removed cleanly. -->
{#if open && scrim}
  <div class="pop-scrim" aria-hidden="true" {@attach portalNear(button)} transition:fade></div>
{/if}
{#if open && button}
  <AnchoredPanel id="{id}-panel" anchor={button} {label} {align} {placement} {width} onclose={hide} {...rest}>
    {@render children({ close: () => hide() })}
  </AnchoredPanel>
{/if}

<style>
  /* Moved out of the button's bar (so its fixed box isn't trapped by a backdrop-filter) into the nearest
     [data-layer-root] or <body>, just under the header and status bar (z-header), so the bar it opened from stays
     above it. The panel is in the top layer, above both. */
  .pop-scrim {
    position: fixed;
    inset: 0;
    z-index: calc(var(--z-header) - 1);
    background: var(--scrim);
  }
</style>
