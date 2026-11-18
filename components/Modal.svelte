<script>
  /**
   * A modal dialog: the .dialog panel in the top layer, with a header holding its title and a ✕. The body and footer
   * are the children, so each step of a flow can swap them: use .dialog-body (a <form> is fine) and .dialog-foot.
   *
   *   <Modal bind:this={modal} title="New site" canClose={confirmDiscard} onclose={reset}>
   *     <form id="new-site" class="dialog-body" novalidate onsubmit={submit}>…</form>
   *     <footer class="dialog-foot">
   *       <span class="spacer"></span>
   *       <button type="button" class="btn" onclick={() => modal.requestClose()}>Cancel</button>
   *       <button type="submit" form="new-site" class="btn btn-primary">Create</button>
   *     </footer>
   *   </Modal>
   *
   *   modal.show()           opens it (does nothing while it is open)
   *   modal.requestClose()   closes it the way the ✕ does, through `locked` and `canClose`
   *   modal.close()          closes it now
   *   modal.isOpen()
   *
   * title: the heading, which names the dialog. narrow: the 420px size for a question (.dialog.confirm).
   * closeButton (default true): the ✕. A question usually drops it and has Cancel in its footer.
   * locked: only close() closes it and the ✕ is disabled, for work that has to finish on screen.
   * canClose(): asked on every request to close (the ✕, Esc, a backdrop click, requestClose). Return false, or a promise
   *   of false, to keep it open: pair it with confirmDialog to ask before unsaved input is thrown away. One question at a
   *   time: requests while it is asking are ignored.
   * onclose(): after it has closed, however that happened.
   * Other attributes (class, aria-describedby…) and attachments go to the <dialog>.
   *
   * Keyboard: Esc requests closing, through canClose however fast it is repeated (see closeRequests in lib/dom.js). The
   * focus starts on the first [autofocus] control, else the first focusable one, and goes back where it was on close.
   */
  import Icon from './Icon.svelte'
  import { backdropClose, closeRequests } from '../lib/dom.js'
  import { tooltip } from '../lib/tooltip.js'

  /**
   * @typedef {object} Props
   * @property {string} title
   * @property {boolean} [narrow]
   * @property {boolean} [closeButton]
   * @property {boolean} [locked]
   * @property {() => boolean | Promise<boolean>} [canClose]
   * @property {(event: Event) => void} [onclose]
   * @property {import('svelte').Snippet} [children]
   */
  /** @type {Props & Omit<import('svelte/elements').HTMLDialogAttributes, keyof Props>} */
  let { title, narrow = false, closeButton = true, locked = false, canClose, onclose, class: className, children, ...rest } = $props()
  const uid = $props.id()

  /** @type {HTMLDialogElement | undefined} */
  let dialog
  let asking = false

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
</script>

<dialog
  bind:this={dialog}
  class={['dialog', narrow && 'confirm', className]}
  aria-labelledby="{uid}-title"
  {...backdropClose(requestClose)}
  {...closeRequests(requestClose)}
  {...rest}
  {onclose}
>
  <header class="dialog-head">
    <h2 id="{uid}-title">{title}</h2>
    {#if closeButton}
      <button type="button" class="icon-btn" aria-label="Close" {@attach tooltip('Close')} onclick={requestClose} disabled={locked}><Icon name="x" /></button>
    {/if}
  </header>
  {@render children?.()}
</dialog>
