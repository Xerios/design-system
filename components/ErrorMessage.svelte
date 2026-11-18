<script>
  import Icon from './Icon.svelte'
  import { tooltip } from '../lib/tooltip.js'
  /**
   * One line of error text with a warning icon. Draws nothing while `message` is empty, so it can stay in the
   * markup. Announced by screen readers when it appears (role="alert").
   *
   *   <ErrorMessage message={failure} />            inline: next to a form's buttons, or where no single control is at fault
   *   <ErrorMessage floating message={error} />     a bubble under its control, with a button to dismiss it
   *
   * floating: a red bubble with an arrow, hanging under the nearest positioned ancestor (the field), over what follows, so nothing
   * shifts when it appears. Dismissing hides it until the message changes; the control keeps its invalid style.
   * TextField, TextArea and Select draw a floating one themselves from their `error` prop.
   *
   * message: the text. id: so a control can point at it with aria-describedby. ondismiss: runs after the bubble
   * is dismissed (the fields use it to take the focus back).
   */
  let { message = '', id = undefined, floating = false, ondismiss = null } = $props()
  // Set by the dismiss button; a new message resets it, so that one shows again.
  let dismissed = $derived.by(() => {
    void message
    return false
  })
  const shown = $derived(message && !(floating && dismissed))
</script>

{#if shown}
  <p {id} class="error" class:floating data-tone="danger" role="alert">
    <Icon name="warning" size="sm" />
    <span class="text">{message}</span>
    {#if floating}
      <button
        type="button"
        class="dismiss"
        aria-label="Dismiss"
        {@attach tooltip('Dismiss')}
        onclick={() => {
          dismissed = true
          ondismiss?.()
        }}><Icon name="x" size="sm" /></button
      >
    {/if}
  </p>
{/if}

<style>
  .error {
    display: flex;
    align-items: flex-start;
    gap: var(--space-1);
    min-width: 0;
    font-size: 12px;
    color: var(--tone);
  }
  /* One line tall, so the icon sits centred on the first line of text. */
  .error > :global(.icon) {
    flex: none;
    height: 1lh;
  }
  .floating {
    position: absolute;
    top: calc(100% + var(--space-2));
    left: 0;
    z-index: var(--z-sticky);
    width: max-content;
    max-width: 100%;
    align-items: center;
    padding: var(--space-1) var(--space-1) var(--space-1) var(--space-2);
    border: 1px solid var(--tone);
    border-radius: var(--r);
    /* Tinted red over the floating surface, so it reads as an error and not as an ordinary tooltip. */
    background: linear-gradient(var(--tone-soft), var(--tone-soft)), var(--elevated);
    box-shadow: var(--shadow);
    color: var(--fg);
  }
  /* The arrow: a small square turned 45°, half above the bubble, pointing at the control. */
  .floating::before {
    content: '';
    position: absolute;
    top: calc(var(--space-1) * -1 - 1px);
    left: var(--space-3);
    width: var(--space-2);
    height: var(--space-2);
    border: 1px solid var(--tone);
    border-right: 0;
    border-bottom: 0;
    background: inherit;
    transform: rotate(45deg);
  }
  .floating > :global(.icon) {
    color: var(--tone);
  }
  .floating .text {
    padding-right: var(--space-1);
  }
  .dismiss {
    display: inline-grid;
    place-items: center;
    flex: none;
    width: 24px;
    height: 24px;
    padding: 0;
    border: 0;
    border-radius: var(--r-pill);
    background: none;
    color: var(--tone);
    cursor: pointer;
  }
  .dismiss:hover {
    background: var(--tone-soft);
  }
</style>
