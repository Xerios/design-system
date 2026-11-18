<script>
  import Icon from '../Icon.svelte'
  /**
   * Button that opens the file picker and hands back the chosen files.
   *
   *   <FileButton label="Upload a zip" accept=".zip" onfiles={([file]) => take(file)} />
   *
   * variant: a button class added to .btn (btn-primary, btn-small…). Other attributes (class…) and attachments go to
   * the button.
   *
   * @typedef {object} Props
   * @property {string} label
   * @property {string} [accept]
   * @property {boolean} [multiple]
   * @property {(files: File[]) => void} onfiles
   * @property {string} [variant]
   */
  /** @type {Props & Omit<import('svelte/elements').HTMLButtonAttributes, keyof Props>} */
  let { label, accept = '', multiple = false, onfiles, variant = '', class: className, ...rest } = $props()
  let input = $state()
</script>

<button type="button" class={['btn', variant, className]} {...rest} onclick={() => input.click()}>
  <Icon name="upload" />
  <span class="file-label">{label}</span>
</button>
<input
  bind:this={input}
  type="file"
  {accept}
  {multiple}
  hidden
  onchange={(e) => {
    onfiles([...e.currentTarget.files])
    e.currentTarget.value = ''
  }}
/>
