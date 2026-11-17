<script>
  /**
   * Compact search box for toolbars: search icon, clear button, optional shortcut hint (e.g. "/"), Esc clears.
   * A TextField in its compact size; the label is for screen readers only. Call focus() to jump into it.
   */
  import TextField from './TextField.svelte';

  let { value = $bindable(''), id, label, placeholder = '', shortcut = null, onenter = null } = $props();
  let field = $state();
  export const focus = () => field?.focus();
</script>

<TextField {id} {label} {placeholder} {shortcut} {onenter} hideLabel compact bind:value bind:this={field} />
