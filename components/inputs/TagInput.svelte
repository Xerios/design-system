<script>
  /**
   * A list of short values (tags) edited in one field: what is typed turns into a tag as soon as a separator is typed,
   * on Enter, on paste, and when the field is left. Each tag has an × to remove it. Duplicates are dropped.
   *
   *   <TagInput bind:value={names} id="names" label="Names" placeholder="Add a name" separator={/[\s,]+/} />
   *
   * Props:
   *   value (bindable): the tags, an array of strings. Changes only by whole tags, so it can be saved on every change.
   *   id, label, hideLabel, placeholder, info (an ⓘ next to the label, see InfoTip), error (a message from the app).
   *   separator: a RegExp for what splits typed text into tags (default commas and line breaks).
   *   normalize(text): turns typed text into a tag (default: trimmed). Return '' to drop it.
   *   validate(tag): a message when the tag isn't allowed, else ''. A rejected tag stays in the input, with the
   *     message in a bubble underneath, so it can be fixed.
   * Keyboard: Backspace or ← at the start of the input selects the last tag; ← and → move between tags and back to the
   * input; Backspace or Delete removes the selected tag; Escape clears what is typed; typing goes back to the input.
   * Clicking a tag selects it. Additions and removals are announced to screen readers.
   * Other attributes and attachments go to the <input>.
   */
  import { tick } from 'svelte'
  import ErrorMessage from '../ErrorMessage.svelte'
  import Icon from '../Icon.svelte'
  import InfoTip from '../InfoTip.svelte'
  import { flip, scale, durations } from '../../lib/motion.js'
  import { tooltip } from '../../lib/tooltip.js'

  /**
   * @typedef {object} Props
   * @property {string[]} [value] bindable
   * @property {string} id
   * @property {string} label
   * @property {boolean} [hideLabel]
   * @property {string} [placeholder]
   * @property {string} [info]
   * @property {string} [error]
   * @property {RegExp} [separator]
   * @property {(text: string) => string} [normalize]
   * @property {((tag: string) => string | null | undefined) | null} [validate]
   */
  /** @type {Props & Omit<import('svelte/elements').HTMLInputAttributes, keyof Props>} */
  let {
    value = $bindable([]),
    id,
    label,
    hideLabel = false,
    placeholder = '',
    info = '',
    error = '',
    separator = /[,\n]+/,
    normalize = (text) => text.trim(),
    validate = null,
    ...rest
  } = $props()

  let input = $state()
  let box = $state()
  let draft = $state('')
  let rejected = $state('') // validate's message for the text left in the input
  let announcement = $state('')
  const problem = $derived(rejected || error)

  /** Adds the pieces as tags in one change; returns the ones validate turned down. */
  function add(pieces) {
    const next = [...value]
    const refused = []
    rejected = ''
    for (const piece of pieces) {
      const tag = normalize(piece)
      if (!tag) continue
      const message = validate?.(tag)
      if (message) {
        refused.push(piece.trim())
        rejected = message
      } else if (!next.includes(tag)) next.push(tag)
    }
    if (next.length !== value.length) {
      announcement = `Added ${next.slice(value.length).join(', ')}`
      value = next
    }
    return refused
  }

  /** Turns the typed text into tags. `all`: the last piece too (Enter, paste, leaving); otherwise it may still be typed. */
  function commit(all) {
    const pieces = draft.split(separator)
    const unfinished = all ? '' : pieces.pop()
    const refused = add(pieces)
    draft = [...refused, unfinished].filter(Boolean).join(', ')
  }

  function remove(i, focusAfter) {
    const tag = value[i]
    value = value.filter((_, j) => j !== i)
    announcement = `Removed ${tag}`
    // Once the list has updated, focus where the selection goes next.
    void tick().then(() => focusAt(focusAfter))
  }

  /** Focuses tag i, or the input when there is no such tag. Found by its text: a removed tag may still be fading out. */
  function focusAt(i) {
    const tag = value[i]
    if (tag != null) box?.querySelector(`[data-tag="${CSS.escape(tag)}"]`)?.focus()
    else input?.focus()
  }

  function oninput(e) {
    rejected = ''
    if (e.inputType === 'insertFromPaste') commit(true)
    else if (separator.test(draft)) commit(false)
  }

  function onInputKeydown(e) {
    const atStart = input.selectionStart === 0 && input.selectionEnd === 0
    if (e.key === 'Enter' && draft.trim()) {
      e.preventDefault()
      commit(true)
    } else if (e.key === 'Escape' && draft) {
      e.preventDefault()
      e.stopPropagation()
      draft = ''
      rejected = ''
    } else if ((e.key === 'Backspace' || e.key === 'ArrowLeft') && atStart && value.length) {
      e.preventDefault()
      focusAt(value.length - 1)
    }
  }

  // Keys on a selected tag (handled on the box: a tag is a list item, not a control of its own).
  function onTagKeydown(e) {
    const tag = e.target.dataset?.tag
    if (tag == null) return
    const i = value.indexOf(tag)
    if (e.key === 'Backspace') {
      e.preventDefault()
      remove(i, i > 0 ? i - 1 : value.length > 1 ? 0 : -1)
    } else if (e.key === 'Delete') {
      e.preventDefault()
      remove(i, i < value.length - 1 ? i : -1)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      if (i > 0) focusAt(i - 1)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      focusAt(i + 1)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      focusAt(-1)
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      // Typing goes back to the input; the key lands there.
      focusAt(-1)
    }
  }

  // Leaving the whole field (not just moving between its tags and input) commits what was typed.
  function onfocusout(e) {
    if (!e.currentTarget.contains(e.relatedTarget) && draft.trim()) commit(true)
  }
</script>

{#snippet fieldLabel()}<label for={id} id="{id}-label" class:sr-only={hideLabel} class="field-label">{label}</label>{/snippet}
<div class="field">
  {#if info}
    <div class="field-head">{@render fieldLabel()}<InfoTip lines={[{ text: info }]} label="About {label}" /></div>
  {:else}
    {@render fieldLabel()}
  {/if}
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
  <div bind:this={box} class="box field-box" {onfocusout} onkeydown={onTagKeydown} onclick={(e) => e.target === e.currentTarget && input.focus()}>
    <ul aria-labelledby="{id}-label">
      {#each value as tag, i (tag)}
        <li
          data-tag={tag}
          class="tag"
          tabindex="-1"
          animate:flip={{ duration: durations.short4 }}
          transition:scale={{ start: 0.85, duration: durations.short3 }}
        >
          <span class="text">{tag}</span>
          <button type="button" class="remove" tabindex="-1" aria-label="Remove {tag}" {@attach tooltip('Remove')} onclick={() => remove(i, -1)}
            ><Icon name="x" size="sm" /></button
          >
        </li>
      {/each}
    </ul>
    <input
      {id}
      bind:this={input}
      bind:value={draft}
      {...rest}
      type="text"
      placeholder={value.length ? '' : placeholder}
      autocomplete="off"
      spellcheck="false"
      aria-invalid={problem ? 'true' : undefined}
      aria-describedby="{id}-keys{problem ? ` ${id}-error` : ''}"
      {oninput}
      onkeydown={onInputKeydown}
    />
  </div>
  <span id="{id}-keys" class="sr-only">Enter or a comma adds what is typed. Backspace selects the last one; Backspace again removes it.</span>
  <span class="sr-only" aria-live="polite">{announcement}</span>
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
  /* The same box as TextField, wrapping its tags and the input onto as many rows as they need. */
  .box {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px;
    min-height: 32px;
    padding: 3px 6px 3px 4px;
    cursor: text;
  }
  /* The list's items flow in the box's own rows, beside the input. */
  ul {
    display: contents;
  }
  .tag {
    display: inline-flex;
    align-items: center;
    max-width: 100%;
    height: 24px;
    padding-left: 8px;
    cursor: default;
    border-radius: var(--r-pill);
    background: var(--fill-3);
    box-shadow: inset 0 0 0 1px var(--line);
    font-size: 12px;
    font-weight: var(--w-medium);
    color: var(--fg);
    outline: none;
    transition:
      background-color var(--dur-fast) var(--ease-out),
      box-shadow var(--dur-fast) var(--ease-out);
  }
  /* The selected tag: the one Backspace or Delete would remove. */
  .tag:focus {
    background: var(--accent-soft);
    box-shadow: inset 0 0 0 1px var(--accent-line);
  }
  .text {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  /* A 24px target with an 18px circle drawn inside it (the padding keeps the fill off the edge). */
  .remove {
    display: inline-grid;
    place-items: center;
    flex: none;
    width: 24px;
    height: 24px;
    padding: 3px;
    border: 0;
    border-radius: 50%;
    background: none;
    background-clip: content-box;
    color: var(--muted);
    cursor: pointer;
  }
  .remove:hover {
    color: var(--fg);
    background-color: var(--fill-4);
  }
  input {
    all: unset;
    flex: 1 1 80px;
    min-width: 80px;
    padding: 3px 0 3px 6px;
    font-size: 13px;
    color: var(--fg);
  }
  input::placeholder {
    color: var(--faint);
    opacity: 1;
  }
</style>
