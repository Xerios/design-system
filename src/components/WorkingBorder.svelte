<script>
  /**
   * Working border: two comets of light travel round the edge of their parent at an even speed, with a blurred copy
   * glowing around it. They are the metal of the working shimmer and the new-content glow (--sheen-*): a faint silver
   * tail running through cyan, indigo, rose and gold to a bright head, silver on dark and violet on light. Drop it inside a positioned element
   * with a 1px border; set --radius to its border-radius (default --r-xl). It fills that element and paints over the
   * border. Purely decorative. Reduced motion holds the comets still (the global rule).
   *
   * Each comet is a run of short dashes on an SVG outline of the box (a rounded rect, its length normalised to 100 with
   * pathLength, so the comet is a share of the perimeter and a lap takes --dur on any size). A dash bends with the outline,
   * so a comet flows round the corners as it does along the sides; a rigid bar following a path would pivot there instead.
   * Each dash has one colour, sampled along the comet's gradient, so the run of them reads as the gradient.
   *
   * Nothing here reaches past the parent's border box in layout, so it never makes a scroll container show a scrollbar:
   * the outline sits on the border, and the glow spills outside only through a filter, which doesn't count as overflow.
   */

  /** How much of the perimeter a comet covers, and how many dashes it is drawn with. */
  const LENGTH = 22
  const DASHES = 14
  /** The comet's colours, tail (0) to head (1): the sheen tokens, so they follow the theme. */
  const STOPS = [
    [0, 'transparent'],
    [0.3, 'color-mix(in lch, var(--sheen-lo) 50%, transparent)'],
    [0.5, 'var(--sheen-cool)'],
    [0.64, 'var(--sheen-tint)'],
    [0.76, 'var(--sheen-rose)'],
    [0.86, 'var(--sheen-gold)'],
    [0.95, 'var(--sheen-hi)'],
    [1, 'transparent'],
  ]

  /** The comet's colour at t (0 tail … 1 head), mixed between the stops either side. @param {number} t */
  function colourAt(t) {
    const i = Math.max(
      1,
      STOPS.findIndex(([at]) => at >= t),
    )
    const [a, from] = STOPS[i - 1]
    const [b, to] = STOPS[i]
    const share = Math.round(((t - a) / (b - a)) * 100)
    return `color-mix(in lch, ${to} ${share}%, ${from})`
  }

  const seg = LENGTH / DASHES
  const dashes = Array.from({ length: DASHES }, (_, k) => ({ k, colour: colourAt((k + 0.5) / DASHES) }))
  /** Two comets, half a lap apart. */
  const COMETS = [0, 50]
</script>

<span class="working" aria-hidden="true" style:--seg="{seg}px">
  {#each ['glow', 'line'] as layer (layer)}
    <svg class={layer}>
      {#each COMETS as lead (lead)}
        {#each dashes as dash (dash.k)}
          <!-- rx is the fallback for browsers without the rx CSS property; the CSS one follows --radius. -->
          <rect width="100%" height="100%" rx="11.5" pathLength="100" style:stroke={dash.colour} style:--start="{-(lead + dash.k * seg)}px" />
        {/each}
      {/each}
    </svg>
  {/each}
</span>

<style>
  .working {
    position: absolute;
    inset: -1px;
    border-radius: var(--radius);
    pointer-events: none;
    z-index: 1;
    --dur: 3.2s;
    --radius: var(--r-xl);
  }
  /* The outline runs down the middle of the parent's 1px border: the svg is inset half a pixel and its strokes overflow it. */
  svg {
    position: absolute;
    inset: 0.5px;
    width: calc(100% - 1px);
    height: calc(100% - 1px);
    overflow: visible;
  }
  rect {
    rx: calc(var(--radius) - 0.5px);
    fill: none;
    stroke-width: 1;
    stroke-linecap: butt;
    /* Lengths, not bare numbers, on every side: a number and a length don't interpolate, so the dashes would jump a lap
       at a time instead of travelling. In SVG a px is a user unit, so pathLength still scales them. */
    stroke-dasharray: var(--seg) calc(100px - var(--seg));
    stroke-dashoffset: var(--start);
    animation: travel var(--dur) linear infinite;
  }
  /* The glow: the same comets, wider and blurred out past the edge. */
  .glow {
    filter: blur(6px);
    opacity: 0.8;
  }
  .glow rect {
    stroke-width: 3;
  }
  /* One lap: every dash moves on by the whole outline, keeping its place in its comet. */
  @keyframes travel {
    to {
      stroke-dashoffset: calc(var(--start) - 100px);
    }
  }
</style>
