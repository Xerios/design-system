<script>
  import Icon from '../Icon.svelte';
  /** Button that opens the file picker and hands back the chosen files. */
  let { label, accept = '', multiple = false, onfiles, variant = '' } = $props();
  let input = $state();
</script>

<button type="button" class="btn {variant}" onclick={() => input.click()}>
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
    onfiles([...e.currentTarget.files]);
    e.currentTarget.value = '';
  }} />

