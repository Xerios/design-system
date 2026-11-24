<script>
  /**
   * The layer for alertDialog, confirmDialog and promptDialog (lib/dialogs.svelte.js). Mount it once, at the root:
   *
   *   <Dialogs />
   *
   * No props. Each request opens as a narrow modal (.dialog.confirm) in the top layer, so it sits above a dialog that
   * is already open. Keyboard: the focus starts on the safe choice (the confirm button, or cancel when `danger`; the
   * field in a prompt), Tab moves between the buttons, Enter in the field confirms, Esc cancels. The focus goes back
   * where it was when the dialog closes.
   */
  import { tick } from 'svelte'

  import TextField from './inputs/TextField.svelte'
  import Button from './Button.svelte'
  import { backdropClose } from '../lib/dom.js'
  import { answer, dialogs } from '../lib/dialogs.svelte.js'

  const uid = $props.id()
  let dialog = $state()
  // The request on screen. Kept after it is answered, so the closing fade still shows its text.
  let view = $state(null)
  let value = $state('')
  let error = $state('')
  // What closing the dialog answers: the cancel value until a confirming button says otherwise.
  let result
  let shownId = 0

  const CANCELLED = { alert: undefined, confirm: false, prompt: null }

  $effect(() => {
    const next = dialogs.current
    if (!next || next.id === shownId) return
    shownId = next.id
    view = next
    value = next.value ?? ''
    error = ''
    result = CANCELLED[next.kind]
    void tick().then(() => dialog?.showModal())
  })

  function confirm() {
    if (view?.kind === 'prompt') {
      const problem = view.validate?.(value) ?? ''
      if (problem) {
        error = problem
        return
      }
      result = value
    } else {
      result = view?.kind === 'confirm' ? true : undefined
    }
    dialog?.close()
  }

  function submit(event) {
    event.preventDefault()
    confirm()
  }
</script>

<dialog
  bind:this={dialog}
  class="dialog confirm"
  role={view?.kind === 'prompt' ? undefined : 'alertdialog'}
  aria-labelledby="{uid}-title"
  aria-describedby={view?.body ? `${uid}-body` : undefined}
  {...backdropClose(() => dialog?.close())}
  onclose={() => answer(result)}
>
  {#if view}
    <header class="dialog-head">
      <h2 id="{uid}-title">{view.title}</h2>
    </header>
    <form class="dialog-form" novalidate onsubmit={submit}>
      {#if view.body || view.kind === 'prompt'}
        <div class="dialog-body">
          {#if view.body}<p id="{uid}-body" class="body">{view.body}</p>{/if}
          {#if view.kind === 'prompt'}
            {#key view.id}
              <TextField
                bind:value
                id="{uid}-field"
                label={view.label ?? view.title}
                hideLabel={!view.label}
                type="text"
                placeholder={view.placeholder ?? ''}
                {error}
                oninput={() => (error = '')}
                autofocus
              />
            {/key}
          {/if}
        </div>
      {/if}
      <footer class="dialog-foot">
        <span class="spacer"></span>
        {#if view.kind === 'alert'}
          <Button type="submit" variant="primary" autofocus>{view.okLabel ?? 'OK'}</Button>
        {:else}
          <Button autofocus={view.kind === 'confirm' && view.danger} onclick={() => dialog?.close()}>{view.cancelLabel ?? 'Cancel'}</Button>
          <Button type="submit" variant={view.danger ? 'danger' : 'primary'} autofocus={view.kind === 'confirm' && !view.danger}
            >{view.confirmLabel ?? 'OK'}</Button
          >
        {/if}
      </footer>
    </form>
  {/if}
</dialog>

<style>
  .dialog-form {
    display: contents;
  }
  /* Cancel and confirm held apart, so a quick tap can't land on the wrong one. On a phone they share the row equally. */
  .dialog-foot {
    gap: var(--space-4);
  }
  @media (max-width: 860px) {
    .spacer {
      display: none;
    }
    .dialog-foot > :global(.btn) {
      flex: 1;
    }
  }
  .body {
    overflow-wrap: anywhere;
    white-space: pre-line;
  }
</style>
