<script>
  /**
   * Working border: two comets of colour (an indigo tail running through violet and pink to an amber head) travel round
   * the edge of their parent at an even speed, with a blurred copy glowing around it. Drop it inside a positioned element
   * with a 1px border; set --radius to its border-radius (default --r-xl). It fills that element and paints over the
   * border. Purely decorative. Reduced motion holds the comets still (the global rule).
   *
   * Nothing here reaches past the parent's border box in layout, so it never makes a scroll container show a scrollbar:
   * the comets are clipped to the ring, and the glow spills outside only through a filter, which doesn't count as overflow.
   */
</script>

<span class="working" aria-hidden="true">
  <span class="glow"><span class="ring"><i></i><i></i></span></span>
  <span class="ring"><i></i><i></i></span>
</span>

<style>
  .working { position: absolute; inset: -1px; border-radius: var(--radius); pointer-events: none; z-index: 1; --dur: 3.2s; --radius: var(--r-xl); }

  /* A band along the edge (the mask cuts out its middle); the comets run along a path through it. */
  .ring {
    position: absolute; inset: 0; padding: var(--band, 1px); border-radius: inherit; overflow: clip;
    -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor;
    mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); mask-composite: exclude;
  }
  /* The glow: a slightly wider band of the same comets, blurred out past the edge. */
  .glow { position: absolute; inset: 0; border-radius: inherit; filter: blur(6px); opacity: 0.8; }
  .glow .ring { --band: 3px; }

  i {
    position: absolute; top: 0; left: 0; width: 160px; height: 6px; border-radius: 999px;
    background: linear-gradient(90deg, transparent, color-mix(in srgb, #5e6ad2 50%, transparent) 35%, #7170ff 60%, #a855f7 75%, #ec4899 88%, #f59e0b 97%, transparent);
    offset-path: inset(0.5px round var(--radius)); offset-rotate: auto;
    animation: travel var(--dur) linear infinite;
  }
  i + i { animation-delay: calc(var(--dur) / -2); }
  @keyframes travel { from { offset-distance: 0%; } to { offset-distance: 100%; } }
</style>
