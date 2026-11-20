<script>
  /**
   * A dashed outline drawn over its positioned parent, with Linear's spaced dashes (3 on, 3.5 off) on a rounded
   * rectangle: for something proposed but not applied yet (a range being picked, a suggested block), where a dashed
   * border's short, tight dashes would read as noise. Decorative; it takes no presses.
   *
   *   <div style="position: relative">… <DashOutline /></div>
   *
   * Tune it with custom properties on it or an ancestor: --dash-color (default --accent), --dash-radius (default
   * --r-sm). To draw one slice of a longer outline (each day of a calendar range drawing its part of the week's bar, so
   * the dashes run on unbroken across them), --dash-x moves the rectangle's left edge (negative: it starts before this
   * box) and --dash-width sets its width; the box clips what falls outside it.
   * Other attributes (class, style…) go to the <svg>.
   */
  /** @type {import('svelte/elements').SVGAttributes<SVGSVGElement>} */
  let { class: className, ...rest } = $props()
</script>

<svg class={['dash-outline', className]} aria-hidden="true" focusable="false" {...rest}><rect /></svg>

<style>
  .dash-outline {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    pointer-events: none;
  }
  /* Inset half the stroke, so the 1px line sits on the box's edge. */
  rect {
    x: calc(var(--dash-x, 0px) + 0.5px);
    y: 0.5px;
    width: calc(var(--dash-width, 100%) - 1px);
    height: calc(100% - 1px);
    rx: calc(var(--dash-radius, var(--r-sm)) - 0.5px);
    fill: none;
    stroke: var(--dash-color, var(--accent));
    stroke-width: 1;
    stroke-dasharray: 3 3.5;
  }
  @media (forced-colors: active) {
    rect {
      stroke: Highlight;
    }
  }
</style>
