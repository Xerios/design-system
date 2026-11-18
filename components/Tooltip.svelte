<script>
  /**
   * Shows a small tooltip when the wrapped content is hovered or focused (it becomes focusable for that; Esc closes).
   * Lives in the top layer (above modal dialogs), fixed below the content with an arrow pointing at it, opening toward the side with more room, so panes and sticky headers don't clip it.
   * `tip`: snippet with the tooltip's content. focusable={false} inside buttons and links (hover only; give the content
   * its own accessible name then).
   */
  import { topLayer } from '../lib/dom.js';

  let { tip, focusable = true, children } = $props();
  const propsId = $props.id();
  const uid = 'tt-' + propsId;
  let el = $state();
  let pos = $state(null); // { top, left?, right?, arrow } in viewport px while open; arrow is the arrow's --arrow-x

  function show() {
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    if (cx > innerWidth / 2) {
      const right = Math.max(8, innerWidth - r.right);
      pos = { top: r.bottom + 8, right, arrow: `calc(100% - ${innerWidth - right - cx}px)` };
    } else {
      const left = Math.max(8, r.left);
      pos = { top: r.bottom + 8, left, arrow: `${cx - left}px` };
    }
  }
  const hide = () => (pos = null);
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<span
  bind:this={el}
  class="anchor"
  tabindex={focusable ? 0 : undefined}
  aria-describedby={pos ? uid : undefined}
  onpointerenter={show}
  onpointerleave={hide}
  onfocus={show}
  onblur={hide}
  onkeydown={(e) => e.key === 'Escape' && pos && (e.stopPropagation(), hide())}>
  {@render children()}
</span>
{#if pos}
  <div id={uid} class="tip" role="tooltip" data-arrow="up" {@attach topLayer(el)} style:--arrow-x={pos.arrow} style:top="{pos.top}px" style:left={pos.left != null ? `${pos.left}px` : null} style:right={pos.right != null ? `${pos.right}px` : null}>
    {@render tip()}
  </div>
{/if}

<style>
  .anchor { display: inline-flex; border-radius: var(--r); }
  .tip {
    position: fixed; z-index: var(--z-menu); width: max-content; max-width: 280px; pointer-events: none;
    display: grid; gap: 6px; justify-items: start; padding: var(--space-2) var(--space-3);
    border: 1px solid var(--line-float); background: var(--elevated);
    border-radius: var(--r-lg); box-shadow: var(--shadow); color: var(--fg-2); font: 400 12px/1.5 var(--font-body);
    white-space: normal; text-align: left; letter-spacing: normal; text-transform: none; cursor: default;
    animation: tip-in var(--dur) var(--ease-out);
  }
  @keyframes tip-in { from { opacity: 0; transform: translateY(-3px); } }
</style>
