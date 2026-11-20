<script>
  /**
   * A side sheet: a modal dialog along the window's edge, full height, for the details of something in a list or a
   * longer form beside the page. Drag its inner edge to resize it; the width can be kept as a preference.
   *
   *   <Drawer bind:this={drawer} label="{job.title} at {job.company}" bind:width={prefs.drawerWidth} onclose={deselect}>
   *     {#key job.id}<JobDetail {job} />{/key}
   *   </Drawer>
   *   drawer.show()   drawer.requestClose()   drawer.close()   drawer.isOpen()
   *
   * label: names the dialog (its content usually has its own heading). side: end (default, the right) | start.
   * width (bindable): its width in px, or undefined for defaultWidth (560); a drag sets it, and dragging back to the
   * default (or double-clicking the edge) clears it, so a stored preference only holds a choice. onresize(width):
   * after a drag ends, to save it. minWidth (360); the widest is the window less 120px, and a narrow window gives it all
   * of its width (the edge can't be dragged below 860px). resizable (default true).
   * canClose, locked, onclose: as Modal's: every way of closing (the ✕, Esc, a backdrop click, requestClose) asks
   * canClose first; locked holds it open.
   * The content scrolls inside it, under a floating ✕, with its top and bottom edges fading while there is more. It
   * opens with the focus on that scroll area, so the keyboard scrolls it at once; Tab reaches the ✕ and the content.
   * Esc closes it; the focus goes back to what opened it. It slides in from its edge (instantly under reduced motion).
   * Other attributes (class…) and attachments go to the <dialog>.
   */
  import Button from './Button.svelte'
  import Splitter from './Splitter.svelte'
  import { backdropClose, closeRequests } from '../lib/dom.js'
  import { scrollFade } from '../lib/scroll-fade.js'

  /**
   * @typedef {object} Props
   * @property {string} label
   * @property {'start' | 'end'} [side]
   * @property {number} [width] bindable
   * @property {number} [defaultWidth]
   * @property {number} [minWidth]
   * @property {boolean} [resizable]
   * @property {(width: number | undefined) => void} [onresize]
   * @property {boolean} [locked]
   * @property {() => boolean | Promise<boolean>} [canClose]
   * @property {(event: Event) => void} [onclose]
   * @property {import('svelte').Snippet} [children]
   */
  /** @type {Props & Omit<import('svelte/elements').HTMLDialogAttributes, keyof Props>} */
  let {
    label,
    side = 'end',
    width = $bindable(),
    defaultWidth = 560,
    minWidth = 360,
    resizable = true,
    onresize,
    locked = false,
    canClose,
    onclose,
    class: className,
    children,
    ...rest
  } = $props()

  /** @type {HTMLDialogElement | undefined} */
  let dialog
  let asking = false
  let viewport = $state(1440)
  /** The width while the edge is being dragged; committed to `width` when the drag ends. */
  let dragging = $state(/** @type {number | null} */ (null))
  const widest = $derived(Math.max(minWidth, viewport - 120))
  const shown = $derived(Math.max(minWidth, Math.min(widest, dragging ?? width ?? defaultWidth)))

  export function show() {
    if (!dialog?.open) dialog?.showModal()
  }
  export function close() {
    dialog?.close()
  }
  export function isOpen() {
    return dialog?.open ?? false
  }
  export async function requestClose() {
    if (locked || asking || !dialog?.open) return
    asking = true
    try {
      if ((await canClose?.()) === false) return
    } finally {
      asking = false
    }
    dialog?.close()
  }

  /** @param {number} next */
  function resized(next) {
    dragging = null
    width = next === defaultWidth ? undefined : next
    onresize?.(width)
  }
</script>

<svelte:window bind:innerWidth={viewport} />

<dialog
  bind:this={dialog}
  class={['drawer', side, className]}
  aria-label={label}
  style:--drawer-w="{shown}px"
  {...backdropClose(requestClose)}
  {...closeRequests(requestClose)}
  {...rest}
  {onclose}
>
  {#if resizable}
    <!-- The edge you drag straddles the sheet's inner side. -->
    <div class="edge">
      <Splitter
        label="Resize {label}"
        value={shown}
        min={minWidth}
        max={widest}
        {defaultWidth}
        side={side === 'end' ? 'end' : 'start'}
        oninput={(next) => (dragging = next)}
        onchange={resized}
      />
    </div>
  {/if}
  <!-- Before the content, so Tab reaches it first; it floats over the scroll area, so the top fade never dims it. -->
  <Button iconOnly icon="x" label="Close" class="drawer-close" disabled={locked} onclick={requestClose} />
  <!-- The scroll area takes the focus on open (autofocus), so arrow keys and Page Down scroll it straight away. -->
  <!-- svelte-ignore a11y_autofocus -->
  <div class="body" tabindex="-1" autofocus {@attach scrollFade()}>
    {@render children?.()}
  </div>
</dialog>

<style>
  /* A modal <dialog> along the window's edge, full height. effects.css gives every dialog its fade and the scroll lock;
     this one slides from its side instead of rising. */
  .drawer {
    inset: 0 0 0 auto;
    width: min(var(--drawer-w), 100%);
    max-width: 100%;
    height: 100dvh;
    max-height: 100dvh;
    margin: 0;
    padding: 0;
    overflow: visible;
    border: 0;
    border-inline-start: 1px solid var(--line-float);
    background: var(--view-bg);
    color: var(--fg);
    box-shadow: var(--shadow);
    translate: 100% 0;
    scale: 1;
    transition-duration: var(--dur);
  }
  .drawer.start {
    inset: 0 auto 0 0;
    border-inline-start: 0;
    border-inline-end: 1px solid var(--line-float);
    translate: -100% 0;
  }
  .drawer[open] {
    display: flex;
    translate: 0 0;
    transition-duration: var(--dur-slow);
  }
  @starting-style {
    .drawer[open] {
      translate: 100% 0;
      scale: 1;
    }
    .drawer.start[open] {
      translate: -100% 0;
    }
  }
  .drawer::backdrop {
    background: var(--scrim);
    backdrop-filter: blur(2px);
  }
  .drawer:focus {
    outline: none;
  }
  .edge {
    position: absolute;
    inset-block: 0;
    inset-inline-start: 0;
    z-index: 1;
    display: flex;
    translate: -50% 0;
  }
  .start .edge {
    inset-inline: auto 0;
    translate: 50% 0;
  }
  .drawer > :global(.drawer-close) {
    position: absolute;
    z-index: 1;
    top: calc(var(--space-3) + env(safe-area-inset-top, 0px));
    inset-inline-end: var(--space-5);
    background: var(--elevated);
    box-shadow: inset 0 0 0 1px var(--line-strong);
  }
  .drawer > :global(.drawer-close:hover) {
    background: var(--surface-3);
  }
  .body {
    /* Side padding that full-width rows inside (sections) can bleed into, as in a panel. */
    --bleed: var(--space-8);
    flex: 1;
    min-width: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    scrollbar-gutter: stable;
    padding: calc(var(--space-8) + var(--space-3) + env(safe-area-inset-top, 0px)) max(var(--bleed), env(safe-area-inset-right, 0px))
      calc(var(--space-8) + var(--space-2) + env(safe-area-inset-bottom, 0px)) var(--bleed);
  }
  .body:focus {
    outline: none;
  }
  @media (max-width: 860px) {
    .body {
      --bleed: var(--gutter-l);
      padding-inline: var(--gutter-l) var(--gutter-r);
    }
    .drawer > :global(.drawer-close) {
      inset-inline-end: var(--gutter-r);
    }
  }
  @media (forced-colors: active) {
    .drawer {
      border-color: CanvasText;
    }
  }
</style>
