/** Small DOM helpers shared by floating and modal components. */

/** Attachment: moves the node to <body>, so scrolling, clipping or sticky ancestors can't clip or cover it. */
export const portal = (node) => {
  document.body.appendChild(node);
  return () => node.remove();
};

/**
 * Attachment: like portal, but moves the node into the nearest [data-layer-root] ancestor of `from` (else <body>).
 * Use it for layers that must stack against siblings inside an isolated container (the app shell isolates its header
 * and view card, so a scrim on <body> would cover the header and the panel it opened).
 */
export const portalNear = (from) => (node) => {
  (from?.closest('[data-layer-root]') ?? document.body).appendChild(node);
  return () => node.remove();
};

/**
 * Handlers for a modal <dialog> (spread them onto it) that close it on a backdrop click, but only when the press both
 * started and ended on the backdrop: dragging a text selection or an input's caret out of the dialog doesn't close it.
 */
export function backdropClose(close) {
  let downOnBackdrop = false;
  return {
    onpointerdown: (e) => (downOnBackdrop = e.target === e.currentTarget),
    onclick: (e) => {
      if (downOnBackdrop && e.target === e.currentTarget) close();
      downOnBackdrop = false;
    },
  };
}
