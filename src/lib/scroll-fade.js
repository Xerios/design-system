// Edge fades for scroll areas: a mask softens the top edge while there's content above and the bottom edge while
// there's more below, each easing away at its end. Hovering or keyboard-focusing inside clears them.
// Styles live in css/effects.css ([data-scroll-fade]). A sticky header's band, reserved with scroll-padding-top, stays solid.
//
//   <div class="list" {@attach scrollFade()}>…</div>
//   <div class="list" {@attach scrollFade({ size: 64 })}>…</div>
//
// The mask fades everything the element paints, its own background and border included, so put it on a scroller
// without either (wrap the scroller in the card instead). Scrollbars are kept out of the mask.

import { observeSize } from './observe.js';

/** @param {{ size?: number }} [opts] fade height in px (default: --scroll-fade, 48px) */
export function scrollFade({ size } = {}) {
  return (node) => {
    if (size != null) node.style.setProperty('--scroll-fade', `${size}px`);

    let frame = 0;
    const update = () => {
      frame = 0;
      const { scrollTop, scrollHeight, clientHeight } = node;
      const cs = getComputedStyle(node);
      // Only while it actually scrolls: some areas hand scrolling to a child or the page at certain layouts.
      if (scrollHeight - clientHeight < 1 || !/auto|scroll/.test(cs.overflowY)) {
        node.removeAttribute('data-scroll-fade');
        return;
      }
      // Scrollbars sit inside the border; measure them so the mask can leave them solid.
      const bx = parseFloat(cs.borderLeftWidth) + parseFloat(cs.borderRightWidth);
      const by = parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth);
      node.style.setProperty('--scroll-fade-sb-w', `${Math.max(0, node.offsetWidth - node.clientWidth - bx)}px`);
      node.style.setProperty('--scroll-fade-sb-h', `${Math.max(0, node.offsetHeight - node.clientHeight - by)}px`);
      node.style.setProperty('--scroll-fade-inset', `${parseFloat(cs.scrollPaddingTop) || 0}px`);
      // Fractional scroll offsets (zoom, high-DPI) can leave a pixel short of either end.
      const edges = [];
      if (scrollTop > 1) edges.push('above');
      if (scrollHeight - clientHeight - scrollTop > 1) edges.push('below');
      node.dataset.scrollFade = edges.join(' ');
    };
    const schedule = () => { frame ||= requestAnimationFrame(update); };

    // The content can grow without the box resizing, so watch the children too (and the ones added later).
    /** @type {(() => void)[]} */
    let sized = [];
    const unwatch = () => {
      for (const stop of sized) stop();
      sized = [];
    };
    const watch = () => {
      unwatch();
      sized = [node, ...node.children].map((el) => observeSize(el, schedule));
      schedule();
    };
    const mutations = new MutationObserver(watch);
    mutations.observe(node, { childList: true });
    node.addEventListener('scroll', schedule, { passive: true });
    watch();

    return () => {
      cancelAnimationFrame(frame);
      unwatch();
      mutations.disconnect();
      node.removeEventListener('scroll', schedule);
      node.removeAttribute('data-scroll-fade');
      node.style.removeProperty('--scroll-fade');
      node.style.removeProperty('--scroll-fade-sb-w');
      node.style.removeProperty('--scroll-fade-sb-h');
      node.style.removeProperty('--scroll-fade-inset');
    };
  };
}
