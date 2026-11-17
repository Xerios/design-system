<script>
  /**
   * Multi-line text field matching TextField (Linear's composer): faint fill, lit-corner hairline, 8px corners,
   * indigo edge and ring while focused. Grows with its content up to 40% of the window, then scrolls; resizable.
   * Other props (placeholder, events, autofocus, data-*) go to the <textarea>. Call focus() to jump into it.
   */
  let { value = $bindable(''), id, label, hideLabel = false, rows = 3, ...rest } = $props();
  let area = $state();
  export const focus = () => area?.focus();
</script>

<div class="field">
  <label for={id} class:sr-only={hideLabel} class="field-label">{label}</label>
  <!-- The box draws the field; the textarea inside is bare. -->
  <div class="box edge">
    <!-- svelte-ignore a11y_autofocus -->
    <textarea {id} {rows} bind:this={area} bind:value {...rest}></textarea>
  </div>
</div>

<style>
  .field { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
  .box { border-radius: var(--r); background: var(--fill-2); --edge-w: var(--hairline); --edge-b: var(--field-edge-end); box-shadow: var(--field-shadow); transition: background-color var(--dur) var(--ease-out), box-shadow var(--dur) var(--ease-out); }
  .box:hover { background: var(--fill-3); }
  .box:focus-within { --edge-a: var(--accent); --edge-b: var(--accent-line); box-shadow: 0 0 0 var(--hairline) var(--accent-line), 0 0 0 3px color-mix(in srgb, var(--accent) 14%, transparent); }
  textarea {
    display: block; width: 100%; min-height: 72px; max-height: 40vh; resize: vertical; field-sizing: content;
    padding: 10px 12px 12px; border: 0; border-radius: inherit; background: none; outline: none;
    font: 400 13px/20px var(--font-body); color: var(--fg);
  }
  textarea::placeholder { color: var(--faint); opacity: 1; }
</style>
