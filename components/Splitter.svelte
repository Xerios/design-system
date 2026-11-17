<script>
  /**
   * Vertical drag handle that resizes the panel beside it. `side` says where that panel is:
   * "end" (right of the handle, so dragging left makes it wider) or "start".
   * Keyboard: ←/→ resize (Shift for bigger steps), Home/End go to the limits, Enter or double-click resets.
   * The width is reported live through `oninput` while dragging and committed once through `onchange`
   * (so a drag is one saved preference, not hundreds).
   */
  let { value, min = 240, max = 1200, defaultValue, side = 'end', label = 'Resize panel', oninput, onchange } = $props();

  let dragging = $state(false);
  // While dragging, the whole page shows the resize cursor and text doesn't get selected.
  $effect(() => {
    document.body.classList.toggle('resizing', dragging);
    return () => document.body.classList.remove('resizing');
  });
  const clamp = (v) => Math.round(Math.max(min, Math.min(max, v)));
  const now = $derived(clamp(value));

  let startX = 0, startV = 0, last = null, moved = false;
  function down(e) {
    if (e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragging = true;
    startX = e.clientX;
    startV = now;
    last = now;
    moved = false;
  }
  function move(e) {
    if (!dragging) return;
    const dx = e.clientX - startX;
    last = clamp(startV + (side === 'end' ? -dx : dx));
    moved = true;
    oninput?.(last);
  }
  function up() {
    if (!dragging) return;
    dragging = false;
    if (moved) onchange?.(last);
  }
  const set = (v) => {
    const next = clamp(v);
    oninput?.(next);
    onchange?.(next);
  };
  function key(e) {
    const step = e.shiftKey ? 64 : 16;
    const grow = side === 'end' ? -1 : 1; // ArrowRight moves the handle right
    const map = {
      ArrowLeft: () => set(now - step * grow),
      ArrowRight: () => set(now + step * grow),
      Home: () => set(min),
      End: () => set(max),
      Enter: () => set(defaultValue),
    };
    if (map[e.key]) {
      e.preventDefault();
      e.stopPropagation();
      map[e.key]();
    }
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
<div
  class="splitter"
  class:dragging
  role="separator"
  aria-orientation="vertical"
  aria-label={label}
  aria-valuenow={now}
  aria-valuemin={min}
  aria-valuemax={max}
  tabindex="0"
  title="Drag to resize · double-click to reset"
  onpointerdown={down}
  onpointermove={move}
  onpointerup={up}
  onpointercancel={up}
  ondblclick={() => set(defaultValue)}
  onkeydown={key}></div>

<style>
  .splitter {
    position: relative; width: 12px; flex: none; cursor: col-resize; touch-action: none; align-self: stretch;
    border-radius: 4px;
  }
  .splitter::after {
    content: ""; position: absolute; top: 8px; bottom: 8px; left: 50%; width: 2px; transform: translateX(-50%);
    border-radius: 2px; background: transparent; transition: background-color var(--dur-fast) var(--ease-out);
  }
  .splitter:hover::after { background: var(--line); }
  .splitter.dragging::after, .splitter:focus-visible::after { background: var(--accent); }
  .splitter:focus-visible { outline: none; }
  :global(body.resizing) { cursor: col-resize; user-select: none; }
  :global(body.resizing iframe) { pointer-events: none; }
  @media (max-width: 860px) { .splitter { display: none; } }
</style>
