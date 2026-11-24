<script>
  /**
   * The search field at the top of a floating list (Select's, OptionList's): flat on the list's surface, with a hairline
   * under it from edge to edge. A combobox that keeps the focus while the arrow keys move through the list it controls,
   * so the list's own key handler goes in `onkeydown`. lib/list-search.js decides when a list gets one and what matches.
   *
   *   <ListSearch bind:this={field} value={query} oninput={(q) => (query = q)} label="Region" controls="{id}-list"
   *     active="{id}-opt-{active}" onkeydown={onListKey} />
   *
   * value: the text. oninput(text): as it is typed or cleared. label: the accessible name (the list's).
   * controls: the listbox's id. active: the id of the option the keyboard is on (aria-activedescendant), if any.
   * placeholder: default "Filter…". onkeydown: the list's keys (arrows, Enter…); keys that edit text are the field's.
   * focus(): puts the focus in it.
   * With text in it, a ✕ at its end clears it (as a search TextField's does) and keeps the focus in the field; it is
   * left out of the tab order, since Tab belongs to the list around it, and Esc does the same from the keyboard.
   * Keyboard: Esc with text clears it (and goes no further); with none, Esc is left to the list around it.
   * Other attributes and attachments go to the <input>.
   */
  import Button from '../Button.svelte'
  import { composing } from '../../lib/dom.js'

  /**
   * @typedef {object} Props
   * @property {string} value
   * @property {(text: string) => void} oninput
   * @property {string} label
   * @property {string} controls
   * @property {string} [active]
   * @property {string} [placeholder]
   * @property {(e: KeyboardEvent) => void} [onkeydown]
   */
  /** @type {Props & Omit<import('svelte/elements').HTMLInputAttributes, keyof Props>} */
  let { value, oninput, label, controls, active, placeholder = 'Filter…', onkeydown, class: className, ...rest } = $props()
  /** @type {HTMLInputElement | undefined} */
  let input = $state()

  export function focus() {
    input?.focus({ preventScroll: true })
  }

  /** @param {KeyboardEvent} e */
  function keydown(e) {
    if (composing(e)) return
    if (e.key === 'Escape' && value) {
      e.preventDefault()
      e.stopPropagation()
      oninput('')
      return
    }
    onkeydown?.(e)
  }
</script>

<div class="list-search">
  <input
    bind:this={input}
    class={['list-search-input', className]}
    type="text"
    role="combobox"
    aria-label={label}
    aria-expanded="true"
    aria-controls={controls}
    aria-autocomplete="list"
    aria-activedescendant={active}
    autocomplete="off"
    spellcheck="false"
    {placeholder}
    {...rest}
    {value}
    oninput={(e) => oninput(e.currentTarget.value)}
    onkeydown={keydown}
  />
  <!-- Pointer only: mousedown would take the focus out of the field. Esc clears from the keyboard. Kept in place while
       there is nothing to clear (hidden), so a list sized to its content doesn't widen as the first letter is typed. -->
  <Button
    iconOnly
    small
    icon="x"
    label="Clear"
    class={['clear', !value && 'hidden']}
    disabled={!value}
    tabindex={-1}
    aria-label="Clear {label} filter"
    onmousedown={(e) => e.preventDefault()}
    onclick={() => {
      oninput('')
      input?.focus({ preventScroll: true })
    }}
  />
</div>

<style>
  /* Flat on the list's surface, with a hairline under it from edge to edge. */
  .list-search {
    flex: none;
    display: flex;
    align-items: center;
    gap: var(--space-1);
    min-height: 36px;
    padding: 0 6px 0 var(--space-3);
    border-bottom: 1px solid var(--line);
  }
  .list-search-input {
    flex: 1;
    min-width: 0;
    align-self: stretch;
    padding: 0;
    border: 0;
    border-radius: 0;
    background: none;
    color: var(--fg);
    font: inherit;
    font-size: 13px;
    user-select: text;
  }
  .list-search-input::placeholder {
    color: var(--muted);
  }
  .list-search-input:focus {
    outline: none;
  }
  .list-search :global(.clear.hidden) {
    visibility: hidden;
  }
</style>
