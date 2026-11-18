<script>
  /**
   * Compact search box for toolbars: search icon, clear button, optional shortcut hint (e.g. "/"), Esc clears.
   * A TextField in its compact size; the label is for screen readers only. Call focus() to jump into it.
   * Other attributes and attachments go to the <input>, as with TextField.
   */
  import TextField from './TextField.svelte'

  /**
   * @typedef {object} Props
   * @property {string} [value] bindable
   * @property {string} id
   * @property {string} label
   * @property {string} [placeholder]
   * @property {string | null} [shortcut]
   * @property {((value: string) => void) | null} [onenter]
   */
  /** @type {Props & Omit<import('svelte/elements').HTMLInputAttributes, keyof Props>} */
  let { value = $bindable(''), id, label, placeholder = '', shortcut = null, onenter = null, ...rest } = $props()
  let field = $state()
  export const focus = () => field?.focus()
</script>

<TextField {...rest} {id} {label} {placeholder} {shortcut} {onenter} hideLabel compact bind:value bind:this={field} />
