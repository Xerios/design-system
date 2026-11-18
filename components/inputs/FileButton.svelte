<script>
  import Icon from '../Icon.svelte'
  import { tooltip } from '../../lib/tooltip.js'
  /**
   * Button that opens the file picker and hands back the chosen files.
   *
   *   <FileButton label="Upload a zip" accept=".zip" onfiles={([file]) => take(file)} />
   *
   *   <FileButton label="Choose files" multiple chosen={names} onfiles={take} onclear={() => (files = [])} />
   *
   * variant: a button class added to .btn (btn-primary, btn-small…). chosen: what is picked, shown after the button
   * (file names, "3 files"); onclear: adds a ✕ to it that drops the choice (the focus goes back to the button). Other
   * attributes (class…) and attachments go to the button.
   *
   * @typedef {object} Props
   * @property {string} label
   * @property {string} [accept]
   * @property {boolean} [multiple]
   * @property {(files: File[]) => void} onfiles
   * @property {string} [variant]
   * @property {string} [chosen]
   * @property {() => void} [onclear]
   */
  /** @type {Props & Omit<import('svelte/elements').HTMLButtonAttributes, keyof Props>} */
  let { label, accept = '', multiple = false, onfiles, variant = '', chosen = '', onclear, class: className, ...rest } = $props()
  /** @type {HTMLButtonElement | undefined} */
  let button = $state()
  let input = $state()
</script>

<button bind:this={button} type="button" class={['btn', variant, className]} {...rest} onclick={() => input.click()}>
  <Icon name="upload" />
  <span class="file-label">{label}</span>
</button>
{#if chosen}
  <span class="chosen">
    <span class="name">{chosen}</span>
    {#if onclear}
      <button
        type="button"
        class="clear"
        aria-label="Clear {label}"
        {@attach tooltip('Clear')}
        onclick={() => {
          onclear()
          button?.focus()
        }}><Icon name="x" size="sm" /></button
      >
    {/if}
  </span>
{/if}
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

<style>
  /* The choice, as a pill after the button: its name cut off with an ellipsis, and the ✕ that drops it. */
  .chosen {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    min-width: 0;
    max-width: 100%;
    min-height: 24px;
    padding-inline: var(--space-2) 2px;
    border-radius: var(--r-pill);
    background: var(--fill-3);
    color: var(--fg-2);
    font-size: 12px;
  }
  .name {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .clear {
    display: inline-grid;
    place-items: center;
    flex: none;
    width: 20px;
    height: 20px;
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: none;
    color: var(--muted);
  }
  .clear:hover {
    background: var(--fill-4);
    color: var(--fg);
  }
</style>
