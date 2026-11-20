<script>
  /**
   * A range on one track: two thumbs, from and to, that can't cross. Slider's look, two values.
   *
   *   <RangeSlider bind:value={price} min={0} max={500} step={10} id="price" label="Price" format={(v) => `€${v}`} />
   *
   * value (bindable): [from, to]. gap: the least distance kept between them (default 0, they may meet).
   * format: how a value reads, beside the track (on the right, "from – to") and to screen readers.
   * note, info, hideLabel: as on the other fields (see FieldLabel).
   * Keyboard, on each thumb (each is its own slider, as the ARIA pattern has it): arrows step, PageUp / PageDown take a
   * tenth of the range, Home / End go as far as the other thumb allows. Pointer: drag a thumb, or press the track to
   * move the nearer thumb there.
   * Other attributes (class…) and attachments go to the group around the thumbs.
   *
   * @typedef {object} Props
   * @property {[number, number]} [value] bindable
   * @property {number} [min]
   * @property {number} [max]
   * @property {number} [step]
   * @property {number} [gap]
   * @property {string} id
   * @property {string} label
   * @property {(value: number) => string} [format]
   * @property {string} [note]
   * @property {string} [info]
   * @property {boolean} [hideLabel]
   */
  import FieldLabel from './FieldLabel.svelte'

  /** @type {Props & Omit<import('svelte/elements').HTMLAttributes<HTMLDivElement>, keyof Props>} */
  let {
    value = $bindable([0, 100]),
    min = 0,
    max = 100,
    step = 1,
    gap = 0,
    id,
    label,
    format = (v) => String(v),
    note = '',
    info = '',
    hideLabel = false,
    class: className,
    ...rest
  } = $props()

  /** @type {HTMLDivElement | undefined} */
  let track = $state()
  /** @type {HTMLDivElement[]} */
  const thumbs = []
  /** Which thumb is being dragged: 0 (from), 1 (to) or null. */
  let dragging = $state(/** @type {0 | 1 | null} */ (null))

  const pct = (v) => ((v - min) / (max - min)) * 100
  const snap = (v) => Math.round((v - min) / step) * step + min
  /** The limits of one thumb: the range's ends, and the other thumb (less the gap). */
  const lowest = (i) => (i === 0 ? min : value[0] + gap)
  const highest = (i) => (i === 0 ? value[1] - gap : max)

  /** @param {0 | 1} i @param {number} v */
  function set(i, v) {
    const next = Math.min(highest(i), Math.max(lowest(i), snap(v)))
    if (next === value[i]) return
    value = i === 0 ? [next, value[1]] : [value[0], next]
  }

  /** @param {PointerEvent} e */
  const at = (e) => {
    const r = /** @type {HTMLDivElement} */ (track).getBoundingClientRect()
    return min + ((e.clientX - r.left) / r.width) * (max - min)
  }

  /** A press on the track (or a thumb): the nearer thumb takes over and follows the pointer. */
  function down(e) {
    if (e.button !== 0) return
    const v = at(e)
    // Equal distances (thumbs together) go to the side the press is on.
    /** @type {0 | 1} */
    const i = Math.abs(v - value[0]) < Math.abs(v - value[1]) || (value[0] === value[1] && v < value[0]) ? 0 : 1
    dragging = i
    e.currentTarget.setPointerCapture(e.pointerId)
    e.preventDefault()
    thumbs[i]?.focus()
    set(i, v)
  }
  const move = (e) => dragging !== null && set(dragging, at(e))
  const up = () => (dragging = null)

  /** @param {KeyboardEvent} e @param {0 | 1} i */
  function onkeydown(e, i) {
    const big = step * Math.max(1, Math.round((max - min) / step / 10))
    const v = value[i]
    const next = {
      ArrowRight: v + step,
      ArrowUp: v + step,
      ArrowLeft: v - step,
      ArrowDown: v - step,
      PageUp: v + big,
      PageDown: v - big,
      Home: lowest(i),
      End: highest(i),
    }[e.key]
    if (next === undefined) return
    e.preventDefault()
    set(i, next)
  }
</script>

<div class="field">
  <FieldLabel id="{id}-label" {label} {note} {info} {hideLabel} />
  <span id="{id}-from-name" class="sr-only">from</span>
  <span id="{id}-to-name" class="sr-only">to</span>
  <div class="row">
    <!-- Pointer only: the thumbs inside are the keyboard's way in. -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class={['range', className]}
      {...rest}
      role="group"
      aria-labelledby="{id}-label"
      class:dragging={dragging !== null}
      style:--from="{pct(value[0])}%"
      style:--to="{pct(value[1])}%"
      onpointerdown={down}
      onpointermove={move}
      onpointerup={up}
      onpointercancel={up}
    >
      <div class="track" bind:this={track}><div class="fill"></div></div>
      {#each [0, 1] as i (i)}
        <div
          bind:this={thumbs[i]}
          id="{id}-{i === 0 ? 'from' : 'to'}"
          class="thumb"
          class:active={dragging === i}
          style:left="var(--{i === 0 ? 'from' : 'to'})"
          role="slider"
          tabindex="0"
          aria-labelledby="{id}-label {id}-{i === 0 ? 'from' : 'to'}-name"
          aria-valuemin={lowest(i)}
          aria-valuemax={highest(i)}
          aria-valuenow={value[i]}
          aria-valuetext={format(value[i])}
          onkeydown={(e) => onkeydown(e, /** @type {0 | 1} */ (i))}
        ></div>
      {/each}
    </div>
    <output for="{id}-from {id}-to">{format(value[0])} – {format(value[1])}</output>
  </div>
</div>

<style>
  .field {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  /* The track, then the value on its right. The gap clears the thumb, which overhangs the track's end by half its width. */
  .row {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }
  output {
    font: var(--w-medium) 12px var(--font-data);
    font-variant-numeric: tabular-nums;
    color: var(--fg-2);
    white-space: nowrap;
  }
  .range {
    position: relative;
    width: 180px;
    height: 32px;
    display: flex;
    align-items: center;
    cursor: pointer;
    /* Horizontal drags are the slider's; vertical ones still scroll the page. */
    touch-action: pan-y;
  }
  .track {
    position: relative;
    width: 100%;
    height: 4px;
    border-radius: var(--r-pill);
    background: var(--control-4);
    overflow: clip;
  }
  .fill {
    position: absolute;
    inset: 0 auto 0 var(--from);
    width: calc(var(--to) - var(--from));
    background: var(--brand);
  }
  .thumb {
    position: absolute;
    top: 50%;
    width: 14px;
    height: 14px;
    translate: -50% -50%;
    scale: 1;
    border-radius: 50%;
    background: var(--knob);
    box-shadow:
      0 0 0 1px var(--knob-ring),
      var(--knob-shadow);
    transition: scale var(--dur-fast) var(--ease-out);
  }
  .thumb:hover,
  .thumb.active {
    scale: 1.12;
  }
  .thumb:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
  /* The one in use draws above the other where they meet. */
  .thumb:is(:focus, .active) {
    z-index: 1;
  }
</style>
