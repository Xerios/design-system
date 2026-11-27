<script>
  import Icon from '../Icon.svelte'
  import InfoTip from '../InfoTip.svelte'
  import { tooltip } from '../../lib/tooltip.js'
  import { radioKeys } from '../../lib/roving.js'
  import { motion, durations, easings } from '../../lib/motion.js'
  /**
   * Single choice shown as a joined switch: one track, the chosen segment raised on it (radio group with roving
   * focus). Same options shape as Segmented ({ value, label, icon?, hint?, info? }; `info` adds an ⓘ with that text as a hover tooltip). `fill` stretches it to its container
   * with equal-width segments. `pill` rounds the track and segments fully (toolbar view switchers).
   * When the choice changes, the raised thumb slides from the old segment to the new one (instantly under reduced motion).
   */
  /**
   * @typedef {{ value: any, label: string, icon?: string, hint?: string, info?: string }} Option
   * @typedef {object} Props
   * @property {any} value
   * @property {Option[]} options
   * @property {string} label
   * @property {(value: any) => void} onchange
   * @property {boolean} [iconOnly]
   * @property {boolean} [fill]
   * @property {boolean} [pill]
   */
  /** @type {Props & Omit<import('svelte/elements').HTMLAttributes<HTMLDivElement>, keyof Props>} */
  let { value, options, label, onchange, fill = false, iconOnly = false, pill = false, class: className, ...rest } = $props()
  const uid = $props.id()
  let group

  // Where the thumb sat before this change: read before the DOM updates, so the new thumb can slide in from there.
  let from = null
  $effect.pre(() => {
    void value
    from = group?.querySelector('.thumb')?.getBoundingClientRect() ?? null
  })

  /** Intro for the new thumb: starts on the old thumb's box and eases its edges onto its own (no scaling, so radii hold). */
  function slide(node) {
    const to = node.getBoundingClientRect()
    if (!from || !to.width) return { duration: 0 }
    const l = from.left - to.left,
      t = from.top - to.top,
      r = to.right - from.right,
      b = to.bottom - from.bottom
    return { duration: motion(durations.short4), easing: easings.standard.standard, css: (_, u) => `inset: ${u * t}px ${u * r}px ${u * b}px ${u * l}px;` }
  }
</script>

<div bind:this={group} class={['group', className]} class:fill class:pill role="radiogroup" aria-label={label} {...rest} {@attach radioKeys}>
  {#each options as o, i (o.value)}
    <button
      type="button"
      role="radio"
      aria-checked={o.value === value}
      tabindex={o.value === value ? 0 : -1}
      onclick={() => onchange(o.value)}
      {@attach tooltip(iconOnly ? o.label + (o.hint ? ` (${o.hint})` : '') : o.hint)}
      aria-label={iconOnly ? o.label : undefined}
      aria-describedby={o.info ? `${uid}-info-${i}` : undefined}
      >{#if o.value === value}<span class="thumb" aria-hidden="true" in:slide></span>{/if}{#if o.icon}<Icon name={o.icon} size="sm" />{/if}{#if !iconOnly}<span
          class="text">{o.label}</span
        >{/if}{#if o.info}<InfoTip decorative text={o.info} />{/if}</button
    >
  {/each}
  <!-- The ⓘ's text, as each option's description: the tooltip only opens on hover. -->
  {#each options as o, i (o.value)}
    {#if o.info}<span id="{uid}-info-{i}" class="sr-only">{o.info}</span>{/if}
  {/each}
</div>

<style>
  .group {
    display: inline-grid;
    grid-auto-flow: column;
    grid-auto-columns: auto;
    gap: 2px;
    /* As wide as its options: a grid or column-flex parent would otherwise stretch the track past them (`fill` stretches it on purpose). */
    width: fit-content;
    max-width: 100%;
    padding: 2px;
    /* A clear track under a hairline, so only the raised thumb is filled and casts a shadow. */
    border-radius: var(--r);
    background: transparent;
    box-shadow: inset 0 0 0 1px var(--line);
    /* The thumb sits at z-index -1 in here: under every segment's content, even while it slides across them. */
    isolation: isolate;
  }
  .group.fill {
    display: grid;
    grid-auto-columns: minmax(0, 1fr);
    width: 100%;
  }
  .group.pill,
  .pill button {
    border-radius: var(--r-pill);
  }
  button {
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-width: 0;
    min-height: 26px;
    padding: 0 10px;
    border: 0;
    border-radius: calc(var(--r) - 2px);
    background: none;
    /* Unchosen options are dimmed until hovered; the chosen one is clear. */
    color: var(--muted);
    font-size: 12px;
    line-height: 14px;
    font-weight: var(--w-medium);
    cursor: pointer;
    white-space: nowrap;
    transition:
      color var(--dur) var(--ease-out),
      background-color var(--dur) var(--ease-out),
      box-shadow var(--dur) var(--ease-out);
  }
  button:not([aria-checked='true']):hover {
    background: var(--control-2);
    color: var(--fg);
  }
  [aria-checked='true'] {
    color: var(--fg);
  }
  /* The raised surface behind the chosen segment; its own element so it can slide between segments. */
  .thumb {
    position: absolute;
    inset: 0;
    z-index: -1;
    border-radius: inherit;
    pointer-events: none;
    /* Filled like ButtonGroup's chosen option (--control-4) and raised (--shadow-btn), with a hairline for an edge. */
    background: var(--control-4);
    box-shadow:
      inset 0 0 0 1px var(--line),
      var(--shadow-btn);
  }
  button :global(.icon) {
    flex: none;
  }
  .text {
    min-width: 0;
    overflow: clip;
    text-overflow: ellipsis;
  }
</style>
