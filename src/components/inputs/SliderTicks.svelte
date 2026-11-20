<script>
  /**
   * The tick marks under a slider's track, one per stop (part of Slider and RangeSlider; use those). Which values get one
   * comes from sliderTicks in lib/ticks.js; the ticks inside the chosen value or span take the accent, like the fill.
   * Decorative: the slider's own value text says where it is.
   *
   *   <SliderTicks {min} {max} {step} ticks="auto" on={(v) => v <= value} />
   *
   * min, max, step: the slider's. ticks: 'auto' (a few stops only), true or false. on(value): whether that tick is
   * inside the chosen part.
   *
   * @typedef {object} Props
   * @property {number} min
   * @property {number} max
   * @property {number} step
   * @property {'auto' | boolean} [ticks]
   * @property {(value: number) => boolean} on
   */
  import { sliderTicks } from '../../lib/ticks.js'

  /** @type {Props} */
  let { min, max, step, ticks = 'auto', on } = $props()
  const marks = $derived(sliderTicks(min, max, step, ticks))
</script>

{#if marks.length}
  <div class="ticks" aria-hidden="true">
    {#each marks as v (v)}<span class="tick" class:on={on(v)} style:left="{((v - min) / (max - min)) * 100}%"></span>{/each}
  </div>
{/if}

<style>
  /* Under the track, clear of the thumb's edge; presses go through to the slider. */
  .ticks {
    position: absolute;
    inset-inline: 0;
    top: calc(50% + 6px);
    height: 4px;
    pointer-events: none;
  }
  .tick {
    position: absolute;
    top: 0;
    width: 2px;
    height: 4px;
    translate: -50% 0;
    border-radius: var(--r-pill);
    background: var(--line-strong);
    transition: background-color var(--dur-fast) var(--ease-out);
  }
  .tick.on {
    background: var(--accent);
  }
  @media (forced-colors: active) {
    .tick {
      background: CanvasText;
    }
    .tick.on {
      background: Highlight;
    }
  }
</style>
