<script>
  import Icon from './Icon.svelte'
  /**
   * One line of error text with a warning icon: under a field, or next to a form's buttons when a whole request
   * failed. Draws nothing while `message` is empty, so it can stay in the markup. Announced by screen readers
   * when it appears (role="alert").
   *
   *   <ErrorMessage message={failure} />
   *
   * TextField, TextArea and Select draw one themselves from their `error` prop; use this directly for controls
   * that have no such prop, and for errors that belong to no single field.
   *
   * message: the text. id: so a control can point at it with aria-describedby.
   */
  let { message = '', id = undefined } = $props()
</script>

{#if message}
  <p {id} class="error" data-tone="danger" role="alert">
    <Icon name="warning" size="sm" />
    <span>{message}</span>
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
  .error :global(.icon) {
    flex: none;
    height: 1lh;
  }
</style>
