<script>
  /**
   * Range slider. Drag, click the track, or use arrows / PageUp / PageDown / Home / End.
   *
   *   <Slider bind:value={opacity} min={0} max={1} step={0.05} id="opacity" label="Opacity" format={(v) => `${Math.round(v * 100)}%`} />
   *
   * format: how the value reads, beside the track (on the right) and to screen readers.
   * ticks: a mark under the track at each stop. 'auto' (default): when there are 3 to 11 stops (1–5, 0–10, 0–100 in
   * tens), so a few values to aim for show where they are; true, always; false, never (lib/ticks.js).
   * note, info, hideLabel: as on the other fields (see FieldLabel). Other attributes (class…) and attachments go to the
   * slider itself (role="slider").
   *
   * @typedef {object} Props
   * @property {number} [value] bindable
   * @property {number} [min]
   * @property {number} [max]
   * @property {number} [step]
   * @property {string} id
   * @property {string} label
   * @property {(value: number) => string} [format]
   * @property {string} [note]
   * @property {string} [info]
   * @property {boolean} [hideLabel]
   * @property {'auto' | boolean} [ticks]
   */
  import FieldLabel from './FieldLabel.svelte'
  import SliderTicks from './SliderTicks.svelte'

  /** @type {Props & Omit<import('svelte/elements').HTMLAttributes<HTMLDivElement>, keyof Props>} */
  let {
    value = $bindable(0),
    min = 0,
    max = 100,
    step = 1,
    id,
    label,
    format = (v) => String(v),
    note = '',
    info = '',
    hideLabel = false,
    ticks = 'auto',
    class: className,
    ...rest
  } = $props()
  let track = $state()
  let dragging = $state(false)
  const pct = $derived(((value - min) / (max - min)) * 100)

  const snap = (v) => Math.min(max, Math.max(min, Math.round((v - min) / step) * step + min))
  const fromPointer = (e) => {
    const r = track.getBoundingClientRect()
    value = snap(min + ((e.clientX - r.left) / r.width) * (max - min))
  }

  function down(e) {
    if (e.button !== 0) return
    dragging = true
    e.currentTarget.setPointerCapture(e.pointerId)
    e.currentTarget.focus()
    fromPointer(e)
  }
  function onkeydown(e) {
    const big = step * Math.max(1, Math.round((max - min) / step / 10))
    const next = {
      ArrowRight: value + step,
      ArrowUp: value + step,
      ArrowLeft: value - step,
      ArrowDown: value - step,
      PageUp: value + big,
      PageDown: value - big,
      Home: min,
      End: max,
    }[e.key]
    if (next === undefined) return
    e.preventDefault()
    value = snap(next)
  }
</script>

<div class="field">
  <FieldLabel id="{id}-label" {label} {note} {info} {hideLabel} />
  <div class="row">
    <div
      {id}
      class={['slider', className]}
      {...rest}
      class:dragging
      role="slider"
      tabindex="0"
      aria-labelledby="{id}-label"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={format(value)}
      style:--pct="{pct}%"
      onpointerdown={down}
      onpointermove={(e) => dragging && fromPointer(e)}
      onpointerup={() => (dragging = false)}
      onpointercancel={() => (dragging = false)}
      {onkeydown}
    >
      <div class="track" bind:this={track}><div class="fill"></div></div>
      <SliderTicks {min} {max} {step} {ticks} on={(v) => v <= value} />
      <div class="thumb"></div>
    </div>
    <output for={id}>{format(value)}</output>
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
  .slider {
    position: relative;
    width: 180px;
    height: 32px;
    display: flex;
    align-items: center;
    cursor: pointer;
    /* Horizontal drags are the slider's; vertical ones still scroll the page. */
    touch-action: pan-y;
    border-radius: 6px;
  }
  .slider:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
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
    inset: 0 auto 0 0;
    width: var(--pct);
    background: var(--brand);
  }
  .thumb {
    position: absolute;
    left: var(--pct);
    top: 50%;
    width: 14px;
    height: 14px;
    translate: -50% -50%;
    scale: 1;
    border-radius: 50%;
    background: var(--knob);
    border: 0;
    box-shadow:
      0 0 0 1px var(--knob-ring),
      var(--knob-shadow);
    transition: scale var(--dur-fast) var(--ease-out);
  }
  .slider:hover .thumb,
  .dragging .thumb {
    scale: 1.12;
  }
</style>
