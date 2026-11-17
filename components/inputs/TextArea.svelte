<script>
  /**
   * Multi-line text field matching TextField (Linear's composer): the shared .field-box (faint fill, inset hairline
   * with a lit top edge, 8px corners, indigo hairline and ring while focused). Grows with its content up to 40% of the window, then scrolls; resizable.
   * Other props (placeholder, events, autofocus, data-*) go to the <textarea>. Call focus() to jump into it.
   * error: a message from the app; the field turns red and shows it in a bubble underneath, which can be dismissed. Native constraints (`required`,
   * `minlength`…) report the browser's own message the same way. See lib/validity.js.
   * info: what the field is for or how to fill it, behind an ⓘ next to the label (see InfoTip).
   */
  import ErrorMessage from '../ErrorMessage.svelte';
  import InfoTip from '../InfoTip.svelte';
  import { validity } from '../../lib/validity.js';
  let { value = $bindable(''), id, label, hideLabel = false, rows = 3, error = '', info = '', ...rest } = $props();
  let area = $state();
  let native = $state(''); // the browser's message for a failed native constraint
  const problem = $derived(error || native);
  export const focus = () => area?.focus();
</script>

<div class="field">
  {#snippet fieldLabel()}<label for={id} class:sr-only={hideLabel} class="field-label">{label}</label>{/snippet}
  {#if info}
    <div class="field-head">{@render fieldLabel()}<InfoTip lines={[{ text: info }]} label="About {label}" /></div>
  {:else}
    {@render fieldLabel()}
  {/if}
  <!-- The box draws the field; the textarea inside is bare. -->
  <div class="box field-box">
    <!-- svelte-ignore a11y_autofocus -->
    <textarea
      {id}
      {rows}
      bind:this={area}
      bind:value
      {...rest}
      aria-invalid={problem ? 'true' : undefined}
      aria-describedby={problem ? `${id}-error` : undefined}
      {@attach validity(() => error, (message) => (native = message))}></textarea>
  </div>
  <ErrorMessage floating id="{id}-error" message={problem} ondismiss={() => area?.focus()} />
</div>

<style>
  .field { position: relative; display: flex; flex-direction: column; gap: 3px; min-width: 0; }
  textarea {
    display: block; width: 100%; min-height: 72px; max-height: 40vh; resize: vertical; field-sizing: content;
    padding: 10px 12px 12px; border: 0; border-radius: inherit; background: none; outline: none;
    font: 400 13px/20px var(--font-body); color: var(--fg);
  }
  textarea::placeholder { color: var(--faint); opacity: 1; }
</style>
