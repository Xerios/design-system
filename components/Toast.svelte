<script>
  /**
   * One toast at the bottom of the window. The app owns the state and the timer; this draws it.
   *
   *   <Toast toast={app.toast} onhold={holdToast} ondismiss={() => (app.toast = null)} />
   *
   * `toast`: null, or { id, message, action?: { label, run, icon? } }. A new `id` replays the entrance.
   * `onhold(true|false)`: hover or focus pauses the app's close timer and leaving resumes it.
   * `ondismiss()`: the close button, or after the action ran.
   * It sits --toast-offset above the bottom edge (default --space-4); set that token to clear a bottom bar.
   * It shows above modal dialogs: the region is a popover (top layer), and while a modal <dialog> is open it moves
   * into that dialog, since everything outside a modal is inert and could not be clicked or announced.
   */
  import Icon from './Icon.svelte';
  import { fly } from '../lib/motion.js';
  import { tooltip } from '../lib/tooltip.js';

  let { toast = null, onhold, ondismiss } = $props();
  let region = $state();

  // Each new toast re-enters the top layer, so it lands above whatever opened since the last one.
  $effect(() => {
    if (!region) return;
    void toast?.id;
    const modals = document.querySelectorAll('dialog:modal');
    const host = modals[modals.length - 1] ?? document.body;
    const node = region;
    const raise = () => {
      if (node.matches(':popover-open')) node.hidePopover();
      node.showPopover();
    };
    if (node.parentNode !== host) host.append(node);
    raise();
    if (host === document.body) return;
    // The dialog closed with the toast still inside it: back to <body>, or it would vanish with the dialog.
    const home = () => {
      if (node.parentNode !== host) return;
      document.body.append(node);
      raise();
    };
    host.addEventListener('close', home, { once: true });
    return () => host.removeEventListener('close', home);
  });
</script>

<!-- One polite status region; the toast never takes focus. Hover or focus pauses the timer. -->
<div bind:this={region} class="region" popover="manual" role="status" aria-live="polite" aria-atomic="true">
  {#if toast}
    {#key toast.id}
      <div
        class="toast"
        role="group"
        aria-label="Notification"
        onpointerenter={() => onhold?.(true)}
        onpointerleave={() => onhold?.(false)}
        onfocusin={() => onhold?.(true)}
        onfocusout={() => onhold?.(false)}
        in:fly={{ y: 12 }}
        out:fly={{ y: 8 }}>
        <span class="msg">{toast.message}</span>
        {#if toast.action}
          <button
            type="button"
            class="action"
            onclick={() => {
              toast.action.run();
              ondismiss?.();
            }}>
            {#if toast.action.icon}<Icon name={toast.action.icon} size="sm" />{/if}
            {toast.action.label}
          </button>
        {/if}
        <button type="button" class="close" aria-label="Dismiss notification" {@attach tooltip('Dismiss')} onclick={() => ondismiss?.()}><Icon name="x" size="sm" /></button>
      </div>
    {/key}
  {/if}
</div>

<style>
  /* The popover defaults (centred, bordered, padded, opaque) are reset: the region is only a place for the toast. */
  .region { inset: auto; margin: 0; padding: 0; border: 0; background: none; overflow: visible; color: inherit; }
  .region { position: fixed; left: 50%; bottom: calc(var(--toast-offset, var(--space-4)) + env(safe-area-inset-bottom, 0px)); translate: -50% 0; z-index: var(--z-toast); max-width: calc(100% - 32px); }
  .toast { display: flex; gap: var(--space-2); align-items: center; padding: var(--space-1) var(--space-1) var(--space-1) var(--space-4); border-radius: var(--r-lg); border: 1px solid transparent; background: linear-gradient(var(--elevated), var(--elevated)) padding-box, var(--edge-grad-float); color: var(--fg); font-size: 13px; box-shadow: var(--shadow); }
  .msg { padding-block: var(--space-2); }
  .action, .close { display: inline-flex; align-items: center; gap: var(--space-1); min-height: 32px; border: 0; border-radius: var(--r-sm); background: none; color: var(--accent); font-weight: var(--w-medium); padding: 0 var(--space-2); white-space: nowrap; }
  .close { color: var(--muted); min-width: 32px; justify-content: center; }
  .action:hover, .close:hover { background: var(--fill-3); }
  .close:hover { color: var(--fg); }
</style>
