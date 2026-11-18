<script>
  import ErrorMessage from '../ErrorMessage.svelte'
  import Icon from '../Icon.svelte'
  import InfoTip from '../InfoTip.svelte'
  import { tooltip } from '../../lib/tooltip.js'
  import { validity } from '../../lib/validity.js'
  import { composing } from '../../lib/dom.js'
  import { invalid } from '../../lib/invalid.js'
  /**
   * Text input with optional search icon and shortcut hint; search fields (type 'search') also get a clear button, and Esc clears them. `compact`: 28px, for toolbars (see SearchField).
   * error: a message from the app; the field turns red and shows it in a bubble underneath, which can be dismissed. Native constraints work the same way:
   * pass `required`, `pattern`, `minlength`… (any other attribute goes to the <input>) and the browser's own message
   * shows there once its form is validated (never just for leaving the field). See lib/validity.js, and lib/field-errors.svelte.js
   * for a form's worth of them.
   * info: what the field is for or how to fill it, behind an ⓘ next to the label (see InfoTip).
   */
  /**
   * @typedef {object} Props
   * @property {string} [value] bindable
   * @property {string} id
   * @property {string} label
   * @property {string} [placeholder]
   * @property {string} [type] 'search' (the default) adds the search icon, the clear button and Esc to clear
   * @property {boolean} [icon]
   * @property {string | null} [shortcut]
   * @property {boolean} [hideLabel]
   * @property {boolean} [compact]
   * @property {((value: string) => void) | null} [onenter]
   * @property {string} [error]
   * @property {string} [info]
   */
  /** @type {Props & Omit<import('svelte/elements').HTMLInputAttributes, keyof Props>} */
  let {
    value = $bindable(''),
    id,
    label,
    placeholder = '',
    type = 'search',
    icon = type === 'search',
    shortcut = null,
    hideLabel = false,
    compact = false,
    onenter = null,
    error = '',
    info = '',
    ...rest
  } = $props()
  let input = $state()
  let native = $state('') // the browser's message for a failed native constraint
  const problem = $derived(error || native)
  export const focus = () => input?.focus()

  function onkeydown(e) {
    // Enter and Esc inside an IME composition belong to the input method.
    if (composing(e)) return
    if (e.key === 'Escape' && value && type === 'search') {
      e.preventDefault()
      e.stopPropagation()
      value = ''
    } else if (e.key === 'Enter' && onenter) {
      e.preventDefault()
      onenter(value)
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
  <div class="box field-box" class:compact>
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
      autocapitalize="none"
      autocorrect="off"
      enterkeyhint={type === 'search' ? 'search' : undefined}
      {...rest}
      {@attach invalid(problem && `${id}-error`)}
      {onkeydown}
      {@attach validity(
        () => error,
        (message) => (native = message),
      )}
    />
    {#if value && type === 'search'}
      <button
        type="button"
        class="clear"
        aria-label="Clear {label}"
        {@attach tooltip('Clear')}
        onclick={() => {
          value = ''
          input.focus()
        }}><Icon name="x" size="sm" /></button
      >
    {:else if shortcut}
      <kbd aria-hidden="true">{shortcut}</kbd>
    {/if}
  </div>
  <ErrorMessage floating id="{id}-error" message={problem} ondismiss={() => input?.focus()} />
</div>

<style>
  .field {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
  }
  .box {
    display: flex;
    align-items: center;
    gap: 6px;
    min-height: 32px;
    padding: 0 6px 0 10px;
  }
  /* Compact (toolbars): shorter. */
  .compact {
    min-height: 28px;
  }
  .lead {
    display: inline-flex;
    color: var(--faint);
  }
  input {
    all: unset;
    flex: 1;
    min-width: 0;
    font-size: 13px;
    color: var(--fg);
    padding-block: 6px;
  }
  input::placeholder {
    color: var(--faint);
    opacity: 1;
  }
  @media (hover: none) {
    kbd {
      display: none;
    }
  }
  .clear {
    display: inline-grid;
    place-items: center;
    border: 0;
    background: none;
    color: var(--muted);
    width: 22px;
    height: 22px;
    border-radius: 50%;
    padding: 0;
    flex: none;
  }
  .clear:hover {
    color: var(--fg);
    background: var(--fill-3);
  }
</style>
