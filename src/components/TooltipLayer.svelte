<script module>
  // Anchor names on a control. Other components name anchors on the same element (AnchoredPanel, Select), so the tip's
  // is added to those it has (inline, else from a stylesheet), and taken out again: the inline value goes back to what it
  // was, unless something else has changed it meanwhile, when only the tip's name is taken out of it.
  /** @param {string} value */
  const list = (value) => (value && value !== 'none' ? value.split(',').map((n) => n.trim()) : [])

  /** @param {HTMLElement} node @param {string} name */
  function addName(node, name) {
    const before = node.style.getPropertyValue('anchor-name')
    const names = list(before || getComputedStyle(node).getPropertyValue('anchor-name'))
    const after = [...names, name].join(', ')
    node.style.setProperty('anchor-name', after)
    return { before, after }
  }
  /** @param {HTMLElement} node @param {string} name @param {{ before: string, after: string }} named */
  function removeName(node, name, { before, after }) {
    const now = node.style.getPropertyValue('anchor-name')
    const rest = now === after ? before : list(now).filter((n) => n !== name).join(', ')
    if (rest) node.style.setProperty('anchor-name', rest)
    else node.style.removeProperty('anchor-name')
  }

  /** Whether the control's own popup is open (a select's list, which may cover the control): its tip would only sit
      under it, so none shows. False where the browser doesn't know :open. @param {HTMLElement} node */
  function popupOpen(node) {
    try {
      return node.matches(':open')
    } catch {
      return false
    }
  }
</script>

<script>
  /**
   * The page's one tooltip. The `tooltip` attachment (lib/tooltip.js) mounts it when the first tooltip is attached and fills
   * it for each control in turn; `InfoTip` goes through that attachment too. Not for use on its own, so it takes no props.
   *
   * A popover in the top layer (above modal dialogs; it joins the dialog a control sits in, as everything outside that is
   * inert) spanning the window and letting the pointer through, holding the tip. The tip is placed by CSS anchor
   * positioning on its control (css/atoms.css): centred under it (over it with `placement: 'above'`), on the other side where there is no room, 8px in from the
   * window's edges, with an arrow pointing at it. It fades in, and goes at once.
   * Pinned (a control with `press: 'pin'`), the layer dims the page and catches the pointer: a press on it closes the tip
   * and goes no further, and the tip takes the pointer so its text can be selected.
   *
   * Exports, for the attachment: show(entry) (false when it didn't: the control's own list is open), hide(entry)
   * (unless pinned), close(entry), pin(entry) (toggles), track(entry) (returns its undo).
   * entry: { node, content (text, or a snippet), shortcut?, detail?, press?, placement?, name (its anchor name), describes }.
   * track hands a control (a <button> or <a>) to the browser: it gets `interestfor` pointing at the layer, and the
   * layer's `interest` and `loseinterest` events, fired with the control as their source, show and hide its tip. A pinned
   * tip holds on to the interest (the loseinterest is cancelled).
   *
   * Keyboard: Escape anywhere closes it; it is consumed (a dialog around stays open) when the tip is pinned or its control
   * has focus, and goes on when the tip only shows under the pointer. A press or a scroll anywhere closes it too.
   */
  import { flushSync } from 'svelte'

  /**
   * @typedef {object} Entry
   * @property {HTMLElement} node
   * @property {string | import('svelte').Snippet} content
   * @property {string | null} [shortcut]
   * @property {string | null} [detail]
   * @property {'pin' | 'open' | null} [press]
   * @property {'below' | 'above'} [placement]
   * @property {string} name
   * @property {boolean} describes
   */

  const uid = $props.id()
  const id = `tooltip-${uid}`
  const layerId = `tooltip-layer-${uid}`
  /** The controls the browser watches for us (track), by element. @type {WeakMap<Element, Entry>} */
  const tracked = new WeakMap()
  /** @type {HTMLDivElement} */
  let layer
  /** @type {HTMLDivElement} */
  let tip
  /** The control the tip is showing for, and the anchor names it had. @type {{ entry: Entry, named: { before: string, after: string } } | null} */
  let current = $state.raw(null)
  let pinned = $state(false)
  /** Which side of the control CSS put the tip on, for the arrow. */
  let side = $state('up')

  const isOpen = () => layer.matches(':popover-open')

  // Hands the tip back from its control, leaving it open (another control may be taking it).
  function release() {
    if (!current) return
    const { entry, named } = current
    if (entry.describes) entry.node.removeAttribute('aria-describedby')
    if (entry.press === 'pin') entry.node.setAttribute('aria-expanded', 'false')
    removeName(entry.node, entry.name, named)
    current = null
    pinned = false
  }

  /** @param {Entry} entry */
  export function show(entry) {
    if (current?.entry === entry) return true
    if (popupOpen(entry.node)) return false
    // Taken from a control the browser watches: hidden first, so the browser lets go of its interest there now, rather
    // than in a loseinterest that comes later and would hide the layer under this control's tip.
    if (current && tracked.get(current.entry.node) === current.entry && isOpen()) {
      release()
      layer.hidePopover()
    }
    release()
    current = { entry, named: addName(entry.node, entry.name) }
    const host = entry.node.closest('dialog') ?? document.body
    if (layer.parentNode !== host) {
      if (isOpen()) layer.hidePopover()
      host.append(layer)
    }
    // The content and the anchor in place before it opens and is measured.
    flushSync()
    if (!isOpen()) layer.showPopover()
    // Read from the edges, so the gap between the tip and the control needn't be known here.
    side = tip.getBoundingClientRect().bottom <= entry.node.getBoundingClientRect().top ? 'down' : 'up'
    if (entry.describes) entry.node.setAttribute('aria-describedby', id)
    return true
  }

  /** Closes the tip if it is `entry`'s (any control's, without one). @param {Entry} [entry] */
  export function close(entry) {
    if (!current || (entry && current.entry !== entry)) return
    release()
    if (isOpen()) layer.hidePopover()
  }

  /** The pointer or focus leaving the control: closes its tip unless it is pinned. @param {Entry} entry */
  export function hide(entry) {
    if (!pinned) close(entry)
  }

  /** Pins `entry`'s tip open, or closes it if it is pinned already. @param {Entry} entry */
  export function pin(entry) {
    if (pinned && current?.entry === entry) return close(entry)
    show(entry)
    pinned = true
    entry.node.setAttribute('aria-expanded', 'true')
  }

  /** @param {Entry} entry */
  export function track(entry) {
    tracked.set(entry.node, entry)
    entry.node.setAttribute('interestfor', layerId)
    return () => {
      if (tracked.get(entry.node) !== entry) return
      tracked.delete(entry.node)
      entry.node.removeAttribute('interestfor')
    }
  }

  // The browser's interest in a tracked control (hovered, focused from the keyboard, long-pressed): cancelled where the
  // tip doesn't show, so the browser doesn't open the layer itself.
  /** @param {Event & { source?: Element }} event */
  function interest(event) {
    const entry = event.source && tracked.get(event.source)
    if (!entry || !show(entry)) event.preventDefault()
  }

  /** @param {Event & { source?: Element }} event */
  function loseInterest(event) {
    const entry = event.source && tracked.get(event.source)
    if (!entry) return
    if (pinned && current?.entry === entry) event.preventDefault()
    else close(entry)
  }

  /** @param {PointerEvent} event */
  function press(event) {
    if (!current) return
    const target = /** @type {Node} */ (event.target)
    // Pinned, a press in the tip is selecting its text; anything else lands on the layer and only closes it.
    if (pinned ? tip.contains(target) : current.entry.press && current.entry.node.contains(target)) return
    close()
  }

  /** @param {KeyboardEvent} event */
  function key(event) {
    if (!current) return
    if (event.key !== 'Escape') {
      // A key that opens the control's own list (a select's) puts the tip away, once the list is open.
      const { entry } = current
      requestAnimationFrame(() => popupOpen(entry.node) && close(entry))
      return
    }
    if (pinned || current.entry.node.contains(document.activeElement)) {
      event.preventDefault()
      event.stopPropagation()
    }
    close()
  }

  // Scrolling closes it, as the browser can redraw an anchored tip a frame or more late: it would be seen hanging where
  // its control was. Not a scroll inside a pinned tip.
  /** @param {Event} event */
  function scrolled(event) {
    if (current && !(pinned && tip.contains(/** @type {Node} */ (event.target)))) close()
  }
</script>

<svelte:document onpointerdowncapture={press} onkeydowncapture={key} onscrollcapture={scrolled} />

<div bind:this={layer} id={layerId} class="tooltip-layer" class:pinned popover="manual" oninterest={interest} onloseinterest={loseInterest}>
  <div bind:this={tip} {id} class="tooltip" class:above={current?.entry.placement === 'above'} role="tooltip" data-arrow={side} style:--tooltip-anchor={current?.entry.name}>
    {#if current}
      {@const { content, detail, shortcut } = current.entry}
      {#if typeof content === 'function'}
        <span class="tooltip-lines">{@render content()}</span>
      {:else if detail}
        <!-- The space between the lines isn't drawn (they are grid items) but keeps the words apart when the tip is read
             out as the control's description. -->
        <span class="tooltip-lines"><strong>{content}</strong> <span>{detail}</span></span>
      {:else}
        {content}
      {/if}
      {#if shortcut}<kbd>{shortcut}</kbd>{/if}
    {/if}
  </div>
</div>
