<script>
  import ErrorMessage from '../ErrorMessage.svelte';
  import Icon from '../Icon.svelte';
  import InfoTip from '../InfoTip.svelte';
  import { tooltip } from '../../lib/tooltip.js';
  import { validity } from '../../lib/validity.js';
  /**
   * Text input with optional search icon, clear button and shortcut hint. `compact`: 28px, for toolbars (see SearchField).
   * error: a message from the app; the field turns red and shows it in a bubble underneath, which can be dismissed. Native constraints work the same way:
   * pass `required`, `pattern`, `minlength`… (any other attribute goes to the <input>) and the browser's own message
   * shows there once its form is validated (never just for leaving the field). See lib/validity.js, and lib/field-errors.svelte.js
   * for a form's worth of them.
   * info: what the field is for or how to fill it, behind an ⓘ next to the label (see InfoTip).
   */
  let { value = $bindable(''), id, label, placeholder = '', type = 'search', icon = type === 'search', shortcut = null, hideLabel = false, compact = false, onenter = null, error = '', info = '', ...rest } = $props();
  let input = $state();
  let native = $state(''); // the browser's message for a failed native constraint
  const problem = $derived(error || native);
  export const focus = () => input?.focus();

  function onkeydown(e) {
    if (e.key === 'Escape' && value) {
      e.preventDefault();
      e.stopPropagation();
      value = '';
    } else if (e.key === 'Enter' && onenter) {
      e.preventDefault();
      onenter(value);
    }
  }
</script>

<div class="field">
  {#snippet fieldLabel()}<label for={id} class:sr-only={hideLabel} class="field-label">{label}</label>{/snippet}
  {#if info}
    <div class="field-head">{@render fieldLabel()}<InfoTip lines={[{ text: info }]} label="About {label}" /></div>
  {:else}
    {@render fieldLabel()}
  {/if}
  <div class="box edge" class:compact>
    {#if icon}
      <span class="lead"><Icon name="search" /></span>
    {/if}
    <input
      {id}
      bind:this={input}
      bind:value
      type="text"
      inputmode={type === 'search' ? 'search' : undefined}
      {placeholder}
      autocomplete="off"
      spellcheck="false"
      {...rest}
      aria-invalid={problem ? 'true' : undefined}
      aria-describedby={problem ? `${id}-error` : undefined}
      {onkeydown}
      {@attach validity(() => error, (message) => (native = message))} />
    {#if value}
      <button type="button" class="clear" aria-label="Clear {label}" {@attach tooltip('Clear')} onclick={() => { value = ''; input.focus(); }}><Icon name="x" size="sm" /></button>
    {:else if shortcut}
      <kbd aria-hidden="true">{shortcut}</kbd>
    {/if}
  </div>
  <ErrorMessage floating id="{id}-error" message={problem} ondismiss={() => input?.focus()} />
</div>

<style>
  .field { position: relative; display: flex; flex-direction: column; gap: 3px; min-width: 0; }
  .box {
    display: flex; align-items: center; gap: 6px; min-height: 32px; padding: 0 6px 0 10px;
    background: var(--fill-2); border: 0; border-radius: var(--r);
    --edge-w: var(--hairline); --edge-b: var(--field-edge-end); box-shadow: var(--field-shadow);
    transition: border-color var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out), background-color var(--dur-fast) var(--ease-out);
  }
  .box:hover { background: var(--fill-3); }
  .box:focus-within { --edge-a: var(--accent); --edge-b: var(--accent-line); box-shadow: 0 0 0 var(--hairline) var(--accent-line), 0 0 0 3px color-mix(in srgb, var(--accent) 14%, transparent); }
  /* Invalid: a red edge, and a red ring while focused. Only once there is a message (aria-invalid), not the browser's
     :user-invalid, which turns a field red as soon as it is left. */
  .box:has([aria-invalid="true"]) { --edge-a: var(--danger); --edge-b: var(--danger); }
  .box:has([aria-invalid="true"]):focus-within { box-shadow: 0 0 0 var(--hairline) var(--danger), 0 0 0 3px color-mix(in srgb, var(--danger) 14%, transparent); }
  /* Compact (toolbars): shorter. */
  .compact { min-height: 28px; }
  .lead { display: inline-flex; color: var(--faint); }
  input { all: unset; flex: 1; min-width: 0; font-size: 13px; color: var(--fg); padding-block: 6px; }
  input::placeholder { color: var(--faint); opacity: 1; }
  @media (hover: none) { kbd { display: none; } }
  .clear { display: inline-grid; place-items: center; border: 0; background: none; color: var(--muted); width: 22px; height: 22px; border-radius: 50%; padding: 0; flex: none; }
  .clear:hover { color: var(--fg); background: var(--fill-3); }
</style>
