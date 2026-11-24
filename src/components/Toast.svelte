<script>
  /**
   * The toasts at the bottom of the window, as a stack: the newest in front, up to two older ones peeking out behind
   * it, smaller and further back. Hovering or focusing the stack fans it out so every toast can be read and acted on.
   * Dismissing the front toast brings the next one forward. The app owns the list and the timers; this draws them.
   *
   *   <Toast toasts={app.toasts} onhold={holdToasts} ondismiss={(id) => dismissToast(id)} />
   *
   * `toasts`: oldest first, newest last. Each is { id, message, action?: { label, run, icon? } }.
   * `onhold(true|false)`: hovering or focusing the stack pauses the app's close timers, leaving resumes them.
   * `ondismiss(id)`: the close button, or after the action ran.
   * Keyboard: Tab reaches each toast's buttons (the stack fans out while focus is inside). Dismissing the focused toast
   * moves focus to the next one. Toasts never take focus on their own.
   * It sits in the bottom-right corner, --toast-offset above the bottom edge (default --space-4); set that token to clear a bottom bar.
   * It shows above modal dialogs: the region is a popover (top layer), and while a modal <dialog> is open it moves
   * into that dialog, since everything outside a modal is inert and could not be clicked or announced.
   */
  import { untrack } from 'svelte'
  import Button from './Button.svelte'
  import Icon from './Icon.svelte'
  import { fly } from '../lib/motion.js'

  /**
   * @typedef {{ id: string | number, message: string, action?: { label: string, run: () => void, icon?: string } }} ToastData
   * @typedef {object} Props
   * @property {ToastData[]} [toasts]
   * @property {(held: boolean) => void} [onhold]
   * @property {(id: ToastData['id']) => void} [ondismiss]
   */
  /** @type {Props} */
  let { toasts = [], onhold, ondismiss } = $props()

  /** How many toasts show at once; older ones wait out of sight until those in front go. */
  const VISIBLE = 3
  /** How far each card behind sticks out above the one in front of it, in px. */
  const PEEK = 10
  /** How much smaller each card behind is. */
  const SHRINK = 0.05
  /** The 1px border above and below each card's content. */
  const BORDER = 2

  /** @type {HTMLDivElement | undefined} */
  let region = $state()
  /** Content height of each toast by id, measured unclamped so a card can return to its own height. */
  /** @type {Record<string | number, number>} */
  let heights = $state({})
  let hovered = $state(false)
  let focused = $state(false)
  const expanded = $derived(toasts.length > 0 && (hovered || focused))

  /** Newest first: each toast's depth in the stack (0 is the front) and, fanned out, how far up it sits. */
  const layout = $derived.by(() => {
    let above = 0
    return toasts.toReversed().map((toast, depth) => {
      const height = (heights[toast.id] ?? 0) + BORDER
      const item = { toast, depth, offset: above, height }
      if (depth < VISIBLE) above += height
      return item
    })
  })
  const front = $derived(layout[0]?.height ?? 0)
  const shown = $derived(Math.min(layout.length, VISIBLE))
  /** The region covers the whole fanned-out stack, gaps included, so the pointer can travel between cards. */
  const regionHeight = $derived(expanded ? `calc(${layout[shown - 1].offset + layout[shown - 1].height}px + ${shown - 1} * var(--space-2))` : `${front}px`)

  // untrack: onhold reads the app's list, and a change to it must not count as leaving the stack.
  $effect(() => {
    const held = expanded
    untrack(() => onhold?.(held))
  })

  /** @param {{ depth: number, offset: number }} item */
  function place({ depth, offset }) {
    const d = Math.min(depth, VISIBLE)
    if (expanded) return { translate: `0 calc(-1 * (${offset}px + ${d} * var(--space-2)))`, scale: '1' }
    return { translate: `0 ${-d * PEEK}px`, scale: `${1 - d * SHRINK}` }
  }

  /** Dismisses a toast; if focus was in it, focus goes to the next one (else nowhere, and the stack folds). */
  function dismiss(id, depth) {
    const card = region?.querySelector(`[data-toast-id="${CSS.escape(String(id))}"]`)
    const hadFocus = card?.contains(document.activeElement)
    const next = layout[depth + 1] ?? layout[depth - 1]
    ondismiss?.(id)
    if (!hadFocus) return
    const target = next && region?.querySelector(`[data-toast-id="${CSS.escape(String(next.toast.id))}"] .close`)
    if (target instanceof HTMLElement) target.focus()
    else focused = false
  }

  /** Attachment on the region: each new toast re-enters the top layer, so it lands above whatever opened since the last one. */
  function inTopLayer(node) {
    void toasts.at(-1)?.id
    const modals = document.querySelectorAll('dialog:modal')
    const host = modals[modals.length - 1] ?? document.body
    const raise = () => {
      if (node.matches(':popover-open')) node.hidePopover()
      node.showPopover()
    }
    if (node.parentNode !== host) host.append(node)
    raise()
    if (host === document.body) return
    // The dialog closed with the toasts still inside it: back to <body>, or they would vanish with the dialog.
    const home = () => {
      if (node.parentNode !== host) return
      document.body.append(node)
      raise()
    }
    host.addEventListener('close', home, { once: true })
    return () => host.removeEventListener('close', home)
  }
</script>

<!-- One polite status region; new toasts are announced as they arrive. Hover or focus fans the stack out and pauses the timers. -->
<div
  bind:this={region}
  {@attach inTopLayer}
  class="region"
  popover="manual"
  role="status"
  aria-live="polite"
  aria-atomic="false"
  style:height={regionHeight}
  onpointerenter={() => (hovered = true)}
  onpointerleave={() => (hovered = false)}
  onfocusin={() => (focused = true)}
  onfocusout={(e) => {
    if (!(e.relatedTarget instanceof Node && e.currentTarget.contains(e.relatedTarget))) focused = false
  }}
>
  <ol class="stack" aria-label="Notifications">
    {#each layout.toReversed() as item (item.toast.id)}
      {@const { toast, depth } = item}
      {@const at = place(item)}
      {@const gone = depth >= VISIBLE}
      <li
        class="toast"
        class:behind={depth > 0 && !expanded}
        class:gone
        data-toast-id={toast.id}
        inert={gone}
        aria-hidden={gone || undefined}
        style:z-index={layout.length - depth}
        style:height={heights[toast.id] === undefined ? undefined : `${expanded || depth === 0 ? heights[toast.id] : front - BORDER}px`}
        style:translate={at.translate}
        style:scale={at.scale}
        in:fly={{ y: 16 }}
        out:fly={{ y: 8 }}
      >
        <div class="body" bind:offsetHeight={heights[toast.id]}>
          <span class="msg">{toast.message}</span>
          {#if toast.action}
            <button
              type="button"
              class="action"
              onclick={() => {
                toast.action.run()
                dismiss(toast.id, depth)
              }}
            >
              {#if toast.action.icon}<Icon name={toast.action.icon} size="sm" />{/if}
              {toast.action.label}
            </button>
          {/if}
          <Button iconOnly icon="x" label="Dismiss" class="close" aria-label="Dismiss notification" onclick={() => dismiss(toast.id, depth)} />
        </div>
      </li>
    {/each}
  </ol>
</div>

<style>
  /* The popover defaults (centred, bordered, padded, opaque) are reset: the region is only a place for the stack. */
  .region {
    inset: auto;
    margin: 0;
    padding: 0;
    border: 0;
    background: none;
    overflow: visible;
    color: inherit;
  }
  .region {
    position: fixed;
    right: calc(var(--space-4) + env(safe-area-inset-right, 0px));
    bottom: calc(var(--toast-offset, var(--space-4)) + env(safe-area-inset-bottom, 0px));
    z-index: var(--z-toast);
    width: min(360px, 100vw - 32px);
  }
  .stack {
    position: relative;
    height: 100%;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  /* Every card sits on the bottom edge; translate and scale set its place in the stack. Scaling from the top keeps
     each card's top edge where it was moved to, so a strip of it shows above the card in front. */
  .toast {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    box-sizing: content-box;
    overflow: hidden;
    transform-origin: top center;
    border-radius: var(--r-lg);
    border: 1px solid transparent;
    background:
      linear-gradient(var(--elevated), var(--elevated)) padding-box,
      var(--edge-grad-float);
    color: var(--fg);
    font-size: 13px;
    box-shadow: var(--shadow);
    transition:
      translate var(--dur-slow) var(--ease-out),
      scale var(--dur-slow) var(--ease-out),
      height var(--dur-slow) var(--ease-out),
      opacity var(--dur-slow) var(--ease-out);
  }
  .toast.gone {
    opacity: 0;
    pointer-events: none;
  }
  /* The buttons stay at the top, beside the first line, when the message wraps. */
  .body {
    display: flex;
    gap: var(--space-2);
    align-items: flex-start;
    padding: var(--space-1) var(--space-1) var(--space-1) var(--space-4);
    transition: opacity var(--dur) var(--ease-out);
  }
  /* A card behind shows only its edge; its text would only be noise under the one in front. */
  .behind .body {
    opacity: 0;
  }
  .msg {
    flex: 1;
    min-width: 0;
    padding-block: var(--space-2);
    overflow-wrap: anywhere;
  }
  .action {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    min-height: 32px;
    border: 0;
    border-radius: var(--r-sm);
    background: none;
    color: var(--accent);
    font-weight: var(--w-medium);
    padding: 0 var(--space-2);
    white-space: nowrap;
    /* Centred on the message's first line (its padding and one line), not on the whole block. */
    margin-top: calc((var(--space-2) * 2 + 1lh - 32px) / 2);
  }
  .action:hover {
    background: var(--control-3);
  }
  /* The ✕ (Button), centred on the first line the same way. */
  .toast :global(.close) {
    margin-top: calc((var(--space-2) * 2 + 1lh - 28px) / 2);
  }
</style>
