<script>
  import Icon from './Icon.svelte'
  import { tooltip } from '../lib/tooltip.js'
  import { fly, durations } from '../lib/motion.js'
  /**
   * One line of error text with a warning icon. Draws nothing while `message` is empty, so it can stay in the
   * markup. Inline, it is an alert (role="alert"): read out as it appears, for a failure no field owns. Floating, it is
   * not: the field points at it (aria-describedby), so it is read when the field gets focus (a failed submit moves the
   * focus there), and fieldErrors announces it once when the field is left (lib/announce.js). An alert per field would
   * read every message at once.
   *
   *   <ErrorMessage message={failure} />            inline: next to a form's buttons, or where no single control is at fault
   *   <ErrorMessage floating message={error} />     a bubble under its control, with a button to dismiss it
   *
   * floating: a red bubble with an arrow, hanging under the nearest positioned ancestor (the field), over what follows, so nothing
   * shifts when it appears. Dismissing hides it until the message changes; the control keeps its invalid style.
   * It drops in from its control and lifts away as it goes; the inline one fades in and goes at once, so the layout
   * after it doesn't wait on a fade.
   * TextField, TextArea and Select draw a floating one themselves from their `error` prop.
   *
   * message: the text. id: so a control can point at it with aria-describedby. ondismiss: runs after the bubble
   * is dismissed (the fields use it to take the focus back). Other attributes (class…) and attachments go to the <p>.
   *
   * @typedef {object} Props
   * @property {string} [message]
   * @property {string} [id]
   * @property {boolean} [floating]
   * @property {(() => void) | null} [ondismiss]
   */
  /** @type {Props & Omit<import('svelte/elements').HTMLAttributes<HTMLParagraphElement>, keyof Props>} */
  let { message = '', id = undefined, floating = false, ondismiss = null, class: className, ...rest } = $props()
  // Set by the dismiss button; a new message resets it, so that one shows again.
  let dismissed = $derived.by(() => {
    void message
    return false
  })
  const shown = $derived(message && !(floating && dismissed))
</script>

{#if shown}
  <p
    {id}
    class={['error', className]}
    class:floating
    data-tone="danger"
    role={floating ? undefined : 'alert'}
    {...rest}
    in:fly={{ y: floating ? -4 : 0, duration: durations.short3 }}
    out:fly={{ y: floating ? -4 : 0, duration: floating ? durations.short2 : 0 }}
  >
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
  /* One line tall, so the icon sits centred on the first line of text and stays at the top when the text wraps. */
  .error > :global(.icon) {
    flex: none;
    height: 1lh;
  }
  .floating {
    position: absolute;
    top: calc(100% + var(--space-2));
    left: 0;
    z-index: var(--z-sticky);
    /* As wide as its text, up to a cap of its own rather than the control's width, so a narrow field doesn't squeeze the
       message into a column of short lines. */
    width: max-content;
    max-width: min(320px, calc(100dvw - 32px));
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
    rotate: 45deg;
  }
  .floating > :global(.icon) {
    color: var(--tone);
  }
  .floating .text {
    padding-right: var(--space-1);
  }
  /* The icon and the first line of text centre on the 24px dismiss button; all three stay at the top as the text wraps. */
  .floating > :global(.icon),
  .floating .text {
    margin-block: calc((24px - 1lh) / 2);
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
