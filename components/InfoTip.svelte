<script>
  /**
   * Small ⓘ button with a tooltip that opens on hover or keyboard focus (Esc only closes it, not a dialog around it). With `pinnable`, clicking pins
   * it open over a dimmed page so its text can be selected and copied; a press outside it, Esc, scrolling the page, or
   * clicking the ⓘ again closes it.
   * Lives in the top layer (fixed, below the button, flipping above when there's no room, with an arrow pointing at it), so modal dialogs, scrolling
   * panes, sticky headers and clipping cards can't cover or cut it.
   * `lines`: [{ label?, text }]; `label`: the button's accessible name.
   * The tip fades in and out with a small slide away from the ⓘ (instant under reduced motion).
   * Other attributes (class…) and attachments go to the ⓘ button.
   */
  import Icon from './Icon.svelte'
  import { topLayer } from '../lib/dom.js'
  import { fade, motion, durations, easings } from '../lib/motion.js'

  /**
   * @typedef {object} Props
   * @property {string} [label]
   * @property {{ label?: string, text: string }[]} [lines]
   * @property {boolean} [pinnable]
   */
  /** @type {Props & Omit<import('svelte/elements').HTMLButtonAttributes, keyof Props>} */
  let { label = 'More information', lines = [], pinnable = false, class: className, ...rest } = $props()
  const propsId = $props.id()
  const uid = 'tip-' + propsId
  let btn = $state()
  let tipEl = $state()
  let open = $state(false)
  let pinned = $state(false)

  const show = () => (open = true)
  const hide = () => {
    open = false
    pinned = false
  }
  const softHide = () => !pinned && (open = false)

  /** Attachment: places the tip against the button once it has rendered (and so has a size). */
  function place(tip) {
    const r = btn.getBoundingClientRect()
    const w = tip.offsetWidth,
      h = tip.offsetHeight
    const above = r.bottom + 8 + h > innerHeight - 8 && r.top - 8 - h > 8
    const left = Math.max(8, Math.min(r.left, innerWidth - w - 8))
    tip.style.top = `${above ? r.top - 8 - h : r.bottom + 8}px`
    tip.style.left = `${left}px`
    // The arrow points back at the ⓘ.
    tip.dataset.arrow = above ? 'down' : 'up'
    tip.style.setProperty('--arrow-x', `${r.left + r.width / 2 - left}px`)
  }

  /** Svelte transition for the tip: fades and slides 3px toward the side it opens on. Deferred a microtask so `place` has
   *  already set which side that is. */
  function pop(node) {
    return ({ direction }) => {
      const dy = node.dataset.arrow === 'down' ? 3 : -3
      return {
        duration: motion(direction === 'out' ? durations.short2 : durations.short3),
        easing: easings.standard[direction === 'out' ? 'accelerate' : 'decelerate'],
        css: (t, u) => `opacity: ${t}; transform: translateY(${u * dy}px);`,
      }
    }
  }

  /** Attachment on the scrim: the top layer stacks by show order, so once the scrim is up the tip is shown again above it. */
  function raiseTip() {
    if (!tipEl?.matches(':popover-open')) return
    tipEl.hidePopover()
    tipEl.showPopover()
  }

  // While pinned: a press or scroll outside it, or Esc anywhere, closes it.
  const inside = (t) => btn?.contains(t) || t.closest?.(`#${uid}`)
  const outside = (e) => pinned && !inside(e.target) && hide()
  const escape = (e) => pinned && e.key === 'Escape' && (e.preventDefault(), e.stopPropagation(), hide())
</script>

<svelte:document onpointerdowncapture={outside} onkeydowncapture={escape} onscrollcapture={outside} />

<button
  bind:this={btn}
  type="button"
  class={['info', className]}
  {...rest}
  class:pinned
  aria-label={label}
  aria-expanded={pinnable ? pinned : undefined}
  aria-describedby={open ? uid : undefined}
  onpointerenter={show}
  onpointerleave={softHide}
  onfocus={show}
  onblur={softHide}
  onclick={(e) => {
    e.stopPropagation()
    if (!pinnable) show()
    else if (pinned) hide()
    else {
      pinned = true
      show()
    }
  }}
  onkeydown={(e) => e.key === 'Escape' && open && (e.preventDefault(), e.stopPropagation(), hide())}
>
  <Icon name="infoCircle" size="sm" />
</button>
{#if pinned}
  <!-- Swallows the outside press that closes the pinned tip, so it doesn't also hit what's underneath. -->
  <div class="scrim" aria-hidden="true" {@attach topLayer(btn)} {@attach raiseTip} transition:fade></div>
{/if}
{#if open}
  <div bind:this={tipEl} id={uid} class="tip" class:pinned role="tooltip" data-floating {@attach topLayer(btn)} {@attach place} transition:pop>
    {#each lines as l, i (i)}
      <p>
        {#if l.label}<span class="k">{l.label}</span>{/if}<span>{l.text}</span>
      </p>
    {/each}
  </div>
{/if}

<style>
  .info {
    display: inline-grid;
    place-items: center;
    width: 24px;
    height: 24px;
    flex: none;
    padding: 0;
    border: 0;
    border-radius: var(--r-pill);
    background: none;
    color: var(--faint);
  }
  .info:hover,
  .info:focus-visible,
  .info.pinned {
    color: var(--fg-2);
    background: var(--fill-3);
  }
  .tip {
    position: fixed;
    top: 0;
    left: 0;
    z-index: var(--z-menu);
    width: max-content;
    max-width: min(328px, calc(100vw - 16px));
    pointer-events: none;
    display: grid;
    gap: 4px;
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--line-float);
    background: var(--elevated);
    border-radius: var(--r-lg);
    box-shadow: var(--shadow);
    font: 400 12px/1.5 var(--font-body);
    color: var(--fg-2);
    text-align: left;
    white-space: normal;
    overflow-wrap: anywhere;
    letter-spacing: normal;
    text-transform: none;
  }
  .scrim {
    position: fixed;
    inset: 0;
    z-index: calc(var(--z-menu) - 1);
    background: var(--scrim);
  }
  .tip.pinned {
    pointer-events: auto;
    user-select: text;
    -webkit-user-select: text;
    cursor: text;
  }
  p {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: var(--space-2);
  }
  .k {
    color: var(--muted);
    min-width: 52px;
  }
</style>
