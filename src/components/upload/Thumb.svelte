<script>
  import Icon from '../Icon.svelte'
  import Button from '../Button.svelte'
  import { fileSize, preview } from '../../lib/files.js'
  import { invalid } from '../../lib/invalid.js'
  import { tooltip } from '../../lib/tooltip.js'
  import { fade, durations } from '../../lib/motion.js'
  import { morph } from '../../lib/morph.svelte.js'
  /**
   * Internal to Upload (Upload.Image, Upload.Images): an image picker's tile, empty or holding its image. Empty, it is a
   * pill like .btn (an icon and `label`), or with `square` a dashed tile the size of a thumbnail with the icon over the
   * label (the add tile ending a grid). Holding an image, the same box reshapes (lib/morph.svelte.js) into a square
   * thumbnail of it, cropped to fill, with a ✕ in its corner and the name and size under it. Pressing the thumbnail opens
   * the picker again to replace the image, unless `onpick` is left out (a thumbnail in a grid, which only clears).
   * Delete or Backspace on it clears it too. The tooltips of both buttons name the image in full, since the caption may
   * cut its name short. The button stays the same element throughout, so it keeps the focus, and
   * the ✕ hands the focus back to it.
   *
   * @typedef {object} Props
   * @property {File | null} file the image, or null while empty
   * @property {string} [label] the empty state's text
   * @property {string} [icon] the empty state's icon
   * @property {boolean} [square] empty, a thumbnail-sized tile instead of a pill
   * @property {() => void} [onpick] opens the picker; left out, the thumbnail is not a button
   * @property {() => void} [onclear] adds the ✕
   * @property {boolean} [disabled]
   * @property {boolean} [dragging] files are dragged over its drop target
   * @property {string} [id] on the button
   * @property {string | false} [errorId] the id of its error message, while there is one
   * @property {HTMLButtonElement} [main] the button (bindable)
   */
  /** @type {Props} */
  let {
    file,
    label = '',
    icon = 'image',
    square = false,
    onpick,
    onclear,
    disabled = false,
    dragging = false,
    id,
    errorId = false,
    main = $bindable(),
  } = $props()

  /** @type {HTMLDivElement | undefined} */
  let box = $state()
  morph(
    () => box,
    () => file,
  )

  function clear() {
    if (disabled) return
    onclear?.()
    main?.focus()
  }

  /** @param {KeyboardEvent} event */
  function onkeydown(event) {
    if (!file || !onclear || (event.key !== 'Delete' && event.key !== 'Backspace')) return
    event.preventDefault()
    clear()
  }
</script>

{#snippet content()}
  {#if file}
    <img alt="" draggable="false" {@attach preview(file)} in:fade={{ duration: durations.short4 }} />
  {:else}
    <Icon name={icon} size={square ? 'md' : 'sm'} /><span class="label" in:fade={{ duration: durations.short4 }}>{label}</span>
  {/if}
{/snippet}

<div class="thumb">
  <div bind:this={box} class={['tile', file ? 'filled' : square ? 'empty square' : 'empty pill', dragging && 'dragging', disabled && 'disabled']}>
    {#if onpick}
      <button
        bind:this={main}
        type="button"
        class="main"
        {id}
        {disabled}
        aria-label={file?.name}
        {@attach invalid(errorId)}
        {@attach tooltip(file ? 'Replace' : '', { detail: file?.name })}
        onclick={onpick}
        {onkeydown}>{@render content()}</button
      >
    {:else}
      <div class="main">{@render content()}</div>
    {/if}
    {#if file && onclear}
      <Button iconOnly small icon="x" label="Remove" detail={file.name} class="clear" aria-label="Remove {file.name}" {disabled} onclick={clear} />
    {/if}
  </div>
  {#if file}
    <span class="caption" in:fade={{ duration: durations.short4 }}>
      <span class="name">{file.name}</span>
      <span class="detail">{fileSize(file.size)}</span>
    </span>
  {/if}
</div>

<style>
  .thumb {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    width: fit-content;
    max-width: 100%;
  }
  /* One box for every state: a pill drawn as .btn is, a dashed add tile, or the thumbnail. lib/morph animates its size
     between them and these transitions the rest. */
  .tile {
    position: relative;
    display: flex;
    min-width: 0;
    border: 1px solid var(--line-strong);
    background: var(--control-2);
    color: var(--fg);
    transition:
      border-radius var(--dur) var(--ease-out),
      border-color var(--dur) var(--ease-out),
      background-color var(--dur) var(--ease-out),
      box-shadow var(--dur) var(--ease-out),
      color var(--dur) var(--ease-out);
  }
  .pill {
    min-height: 28px;
    border-radius: var(--r-sm);
    box-shadow: var(--shadow-btn);
  }
  .square,
  .filled {
    width: 96px;
    height: 96px;
    border-radius: var(--r);
  }
  .square {
    border: 2px dashed var(--line-strong);
  }
  .filled {
    background: var(--control-3);
  }
  .main {
    display: flex;
    flex: 1;
    align-items: center;
    gap: 6px;
    min-width: 0;
    margin: 0;
    padding: 0 11px;
    border: 0;
    border-radius: inherit;
    background: none;
    color: inherit;
    font: inherit;
    font-size: 12px;
    font-weight: var(--w-medium);
    line-height: 14px;
    white-space: nowrap;
  }
  .square .main {
    flex-direction: column;
    justify-content: center;
    gap: var(--space-1);
    padding: var(--space-2);
    text-align: center;
    white-space: normal;
  }
  .filled .main {
    padding: 0;
  }
  button.main {
    cursor: pointer;
  }
  button.main:disabled {
    cursor: default;
  }
  .main > :global(.icon) {
    color: var(--muted);
    transition: color var(--dur) var(--ease-out);
  }
  .empty:has(> button.main:hover:not(:disabled)) {
    background: var(--control-3);
  }
  .empty:has(> button.main:hover:not(:disabled)) .main > :global(.icon) {
    color: inherit;
  }
  .empty:has(> button.main:active:not(:disabled)) {
    background: var(--control-4);
  }
  img {
    display: block;
    width: 100%;
    height: 100%;
    border-radius: calc(var(--r) - 1px);
    object-fit: cover;
    transition: opacity var(--dur) var(--ease-out);
  }
  .filled:has(> button.main:hover:not(:disabled)) img {
    opacity: 0.85;
  }
  /* The small ✕ (Button) on a solid disc with a hairline, so it reads over any picture: the control tint over the
     surface. */
  .tile :global(.clear) {
    position: absolute;
    top: var(--space-1);
    right: var(--space-1);
    border: 1px solid var(--line-strong);
    background: linear-gradient(var(--control-2), var(--control-2)), var(--surface);
    color: var(--fg-2);
  }
  .tile :global(.clear:hover:not(:disabled)) {
    background: linear-gradient(var(--control-4), var(--control-4)), var(--surface);
    color: var(--fg);
  }
  .caption {
    display: grid;
    width: 96px;
  }
  .caption > span {
    overflow: clip;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .name {
    color: var(--fg-2);
    font-size: 12px;
  }
  .detail {
    color: var(--muted);
    font-family: var(--font-data);
    font-size: 11px;
    font-variant-numeric: tabular-nums;
  }
  .dragging {
    border-color: var(--accent);
    background: var(--accent-soft);
  }
  .tile:has(> .main:global([aria-invalid='true'])) {
    border-color: var(--danger);
  }
  .disabled {
    opacity: 0.5;
    box-shadow: none;
  }
  @media (pointer: coarse) {
    .pill {
      min-height: 44px;
    }
  }
</style>
