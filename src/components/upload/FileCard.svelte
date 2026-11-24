<script>
  import Icon from '../Icon.svelte'
  import Button from '../Button.svelte'
  import Shimmer from '../Shimmer.svelte'
  import { invalid } from '../../lib/invalid.js'
  import { tooltip } from '../../lib/tooltip.js'
  import { fade, durations } from '../../lib/motion.js'
  import { morph } from '../../lib/morph.svelte.js'
  /**
   * Internal to Upload (Upload.File, Upload.Files, Upload.Folder): the box a picker draws, empty or holding its choice.
   * Empty, it is a pill like .btn: an icon and `label`, opening the picker. Holding something, the same box reshapes
   * (lib/morph.svelte.js) into a card: an icon, the name over a detail line (its size), and a ✕ that clears it. A file's
   * icon is coloured by its format (`tone`), with its extension (`ext`) on a band across it. Pressing the card opens the
   * picker again to replace it, unless `onpick` is left out (a card in a list, which only clears). The tooltips of both
   * buttons name the file in full, since the card may cut its name short.
   * Delete or Backspace on it clears it too. The button stays the same element throughout, so it keeps the focus, and
   * the ✕ hands the focus back to it.
   *
   * @typedef {object} Item
   * @property {string} name
   * @property {string} detail
   * @property {string} icon
   * @property {string} [ext] the extension, on a band across the icon ('PDF')
   * @property {string} [tone] the icon's colour: a data-tone name, or 'accent'
   *
   * @typedef {object} Props
   * @property {Item | null} item what it holds, or null while empty
   * @property {string} [label] the empty pill's text
   * @property {string} [icon] the empty pill's icon
   * @property {() => void} [onpick] opens the picker; left out, the card is not a button
   * @property {() => void} [onclear] adds the ✕
   * @property {boolean} [disabled]
   * @property {boolean} [dragging] files are dragged over its drop target
   * @property {boolean} [busy] reading what was dropped: the pill shimmers with `busyLabel` and ignores presses
   * @property {string} [busyLabel]
   * @property {string} [id] on the button
   * @property {string | false} [errorId] the id of its error message, while there is one
   * @property {HTMLButtonElement} [main] the button (bindable)
   */
  /** @type {Props} */
  let {
    item,
    label = '',
    icon = 'upload',
    onpick,
    onclear,
    disabled = false,
    dragging = false,
    busy = false,
    busyLabel = 'Reading…',
    id,
    errorId = false,
    main = $bindable(),
  } = $props()

  /** @type {HTMLDivElement | undefined} */
  let box = $state()
  morph(
    () => box,
    () => item,
  )

  function clear() {
    if (disabled) return
    onclear?.()
    main?.focus()
  }

  /** @param {KeyboardEvent} event */
  function onkeydown(event) {
    if (!item || !onclear || (event.key !== 'Delete' && event.key !== 'Backspace')) return
    event.preventDefault()
    clear()
  }
</script>

{#snippet content()}
  {#if busy}
    <Icon name={icon} size="sm" /><Shimmer>{busyLabel}</Shimmer>
  {:else if item}
    <span class="lead" class:toned={item.tone} data-tone={item.tone} in:fade={{ duration: durations.short4 }}
      ><Icon name={item.icon} size={item.ext ? 'lg' : 'md'} />{#if item.ext}<span class="ext">{item.ext}</span>{/if}</span
    >
    <span class="text" in:fade={{ duration: durations.short4 }}>
      <span class="name">{item.name}</span>
      <span class="detail">{item.detail}</span>
    </span>
  {:else}
    <Icon name={icon} size="sm" /><span class="label" in:fade={{ duration: durations.short4 }}>{label}</span>
  {/if}
{/snippet}

<div bind:this={box} class={['card', item ? 'filled' : 'empty', dragging && 'dragging', disabled && 'disabled', busy && 'shimmer']}>
  {#if onpick}
    <button
      bind:this={main}
      type="button"
      class="main"
      {id}
      {disabled}
      aria-busy={busy || undefined}
      aria-disabled={busy || undefined}
      {@attach invalid(errorId)}
      {@attach tooltip(item && !busy ? 'Replace' : '', { detail: item?.name })}
      onclick={() => {
        if (!busy) onpick()
      }}
      {onkeydown}>{@render content()}</button
    >
  {:else}
    <div class="main">{@render content()}</div>
  {/if}
  {#if item && onclear && !busy}
    <Button iconOnly small icon="x" label="Remove" detail={item.name} class="clear" aria-label="Remove {item.name}" {disabled} onclick={clear} />
  {/if}
</div>

<style>
  /* One box for both states. Empty it is drawn as .btn is; holding something it is a flat card, wider and rounder.
     lib/morph animates its size between the two and these transitions the rest. */
  .card {
    display: flex;
    align-items: center;
    min-width: 0;
    max-width: 100%;
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
  .empty {
    min-height: 28px;
    border-radius: var(--r-sm);
    box-shadow: var(--shadow-btn);
  }
  .filled {
    width: 280px;
    border-radius: var(--r);
  }
  .main {
    display: flex;
    flex: 1;
    align-self: stretch;
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
    text-align: start;
    white-space: nowrap;
  }
  button.main {
    cursor: pointer;
  }
  button.main:disabled {
    cursor: default;
  }
  button.main[aria-busy='true'] {
    cursor: progress;
  }
  .main > :global(.icon) {
    color: var(--muted);
    transition: color var(--dur) var(--ease-out);
  }
  .card:has(> button.main:hover:not(:disabled, [aria-disabled='true'])) {
    background: var(--control-3);
  }
  .card:has(> button.main:hover:not(:disabled, [aria-disabled='true'])) .main > :global(.icon) {
    color: inherit;
  }
  .card:has(> button.main:active:not(:disabled, [aria-disabled='true'])) {
    background: var(--control-4);
  }
  /* The card: the icon in a square inset by the same space all round, then the name over the detail. */
  .filled .main {
    gap: var(--space-2);
    padding: var(--space-1) var(--space-2) var(--space-1) var(--space-1);
  }
  .lead {
    position: relative;
    display: grid;
    flex: none;
    place-items: center;
    width: 32px;
    height: 32px;
    border-radius: var(--r-sm);
    background: var(--fill-3);
    color: var(--muted);
  }
  /* A file's format: the icon tinted in its family's colour, on that colour's soft fill. 'accent' is not a data-tone of
     atoms.css, so it is defined here. */
  .lead[data-tone='accent'] {
    --tone: var(--accent);
    --tone-soft: var(--accent-soft);
  }
  .lead.toned {
    background: var(--tone-soft);
    color: var(--tone);
  }
  /* The extension on a solid band across the lower half of the page, as file-type icons have it. The band is darkened a
     touch in the light theme so the light text on it keeps AA contrast (green is just under it as it is). */
  .ext {
    position: absolute;
    bottom: 5px;
    left: 50%;
    padding: 0 2px;
    border-radius: calc(var(--r-sm) / 2);
    background: light-dark(color-mix(in lch, var(--tone, var(--muted)) 88%, var(--fg)), var(--tone, var(--muted)));
    color: var(--surface);
    font-family: var(--font-data);
    font-size: 11px;
    font-weight: var(--w-semibold);
    line-height: 12px;
    translate: -50% 0;
  }
  .text {
    display: grid;
    min-width: 0;
  }
  .name {
    overflow: clip;
    color: var(--fg);
    font-size: 13px;
    line-height: 18px;
    text-overflow: ellipsis;
  }
  .detail {
    overflow: clip;
    color: var(--muted);
    font-family: var(--font-data);
    font-size: 11px;
    font-weight: var(--w-normal);
    font-variant-numeric: tabular-nums;
    text-overflow: ellipsis;
  }
  .card :global(.clear) {
    margin-inline-end: var(--space-2);
  }
  .dragging {
    border-color: var(--accent);
    background: var(--accent-soft);
  }
  .card:has(> .main:global([aria-invalid='true'])) {
    border-color: var(--danger);
  }
  .disabled {
    opacity: 0.5;
    box-shadow: none;
  }
  @media (pointer: coarse) {
    .empty {
      min-height: 44px;
    }
    .card :global(.clear) {
      width: 44px;
      height: 44px;
      margin-inline-end: 0;
    }
  }
</style>
