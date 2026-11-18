<script>
  /**
   * Range slider. Drag, click the track, or use arrows / PageUp / PageDown / Home / End.
   *
   *   <Slider bind:value={opacity} min={0} max={1} step={0.05} id="opacity" label="Opacity" format={(v) => `${Math.round(v * 100)}%`} />
   *
   * format: how the value reads, next to the label and to screen readers. Other attributes (class…) and attachments go
   * to the slider itself (role="slider").
   *
   * @typedef {object} Props
   * @property {number} [value] bindable
   * @property {number} [min]
   * @property {number} [max]
   * @property {number} [step]
   * @property {string} id
   * @property {string} label
   * @property {(value: number) => string} [format]
   */
  /** @type {Props & Omit<import('svelte/elements').HTMLAttributes<HTMLDivElement>, keyof Props>} */
  let { value = $bindable(0), min = 0, max = 100, step = 1, id, label, format = (v) => String(v), class: className, ...rest } = $props()
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
  <span class="field-label" id="{id}-label">{label} <output for={id}>{format(value)}</output></span>
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
    <div class="thumb"></div>
  </div>
</div>

<style>
  .field {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }
  output {
    font: var(--w-medium) 12px var(--font-data);
    font-variant-numeric: tabular-nums;
    color: var(--fg-2);
    margin-left: 4px;
  }
  .slider {
    position: relative;
    width: 150px;
    height: 32px;
    display: flex;
    align-items: center;
    cursor: pointer;
    touch-action: none;
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
    background: var(--fill-4);
    overflow: hidden;
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
    transform: translate(-50%, -50%);
    border-radius: 50%;
    background: #fff;
    border: 0;
    box-shadow:
      0 0 0 1px rgb(0 0 0 / 0.12),
      0 1px 3px rgb(0 0 0 / 0.3);
    transition: transform 0.1s;
  }
  .slider:hover .thumb,
  .dragging .thumb {
    transform: translate(-50%, -50%) scale(1.12);
  }
</style>
