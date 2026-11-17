<script>
  import Icon from '../Icon.svelte';
  /** Text input with optional search icon, clear button and shortcut hint. `compact`: 28px, for toolbars (see SearchField). */
  let { value = $bindable(''), id, label, placeholder = '', type = 'search', icon = type === 'search', shortcut = null, hideLabel = false, compact = false, onenter = null } = $props();
  let input = $state();
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
  <label for={id} class:sr-only={hideLabel} class="field-label">{label}</label>
  <div class="box edge" class:compact>
    {#if icon}
      <span class="lead"><Icon name="search" /></span>
    {/if}
    <input {id} bind:this={input} bind:value type="text" inputmode={type === 'search' ? 'search' : undefined} {placeholder} autocomplete="off" spellcheck="false" {onkeydown} />
    {#if value}
      <button type="button" class="clear" aria-label="Clear {label}" onclick={() => { value = ''; input.focus(); }}><Icon name="x" size="sm" /></button>
    {:else if shortcut}
      <kbd aria-hidden="true">{shortcut}</kbd>
    {/if}
  </div>
</div>

<style>
  .field { display: flex; flex-direction: column; gap: 3px; min-width: 0; }
  .box {
    display: flex; align-items: center; gap: 6px; min-height: 32px; padding: 0 6px 0 10px;
    background: var(--fill-2); border: 0; border-radius: var(--r);
    --edge-w: var(--hairline); --edge-b: var(--field-edge-end); box-shadow: var(--field-shadow);
    transition: border-color var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out), background-color var(--dur-fast) var(--ease-out);
  }
  .box:hover { background: var(--fill-3); }
  .box:focus-within { --edge-a: var(--accent); --edge-b: var(--accent-line); box-shadow: 0 0 0 var(--hairline) var(--accent-line), 0 0 0 3px color-mix(in srgb, var(--accent) 14%, transparent); }
  /* Compact (toolbars): shorter. */
  .compact { min-height: 28px; }
  .lead { display: inline-flex; color: var(--faint); }
  input { all: unset; flex: 1; min-width: 0; font-size: 13px; color: var(--fg); padding-block: 6px; }
  input::placeholder { color: var(--faint); opacity: 1; }
  @media (hover: none) { kbd { display: none; } }
  .clear { display: inline-grid; place-items: center; border: 0; background: none; color: var(--muted); width: 22px; height: 22px; border-radius: 50%; padding: 0; flex: none; }
  .clear:hover { color: var(--fg); background: var(--fill-3); }
</style>
