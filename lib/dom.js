/** Small DOM helpers shared by floating and modal components. */

/** Attachment: moves the node to <body>, so scrolling, clipping or sticky ancestors can't clip or cover it. */
export const portal = (node) => {
  document.body.appendChild(node);
  return () => node.remove();
};

/**
 * Attachment: shows a floating node in the top layer (Popover API), so it draws above modal dialogs and their backdrop,
 * which no z-index can. It goes into the <dialog> around `from` if there is one (everything outside a modal dialog is
 * inert, so it couldn't be pointed at, clicked or selected there), else <body>. The top layer stacks in the order things
 * are shown: a layer that must sit above one shown after it has to be shown again (re-created). base.css resets the
 * popover's default box on [data-top-layer]; give the node position: fixed and place it as usual.
 */
export const topLayer = (from) => (node) => {
  node.setAttribute('popover', 'manual');
  node.setAttribute('data-top-layer', '');
  (from?.closest('dialog') ?? document.body).appendChild(node);
  node.showPopover?.();
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
