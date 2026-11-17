<script>
  /**
   * Small ⓘ button with a tooltip that opens on hover or keyboard focus (Esc closes it). With `pinnable`, clicking pins
   * it open over a dimmed page so its text can be selected and copied; a press outside it, Esc, scrolling the page, or
   * clicking the ⓘ again closes it.
   * Lives on <body> (fixed, below the button, flipping above when there's no room), so scrolling panes, sticky
   * headers and clipping cards can't cover or cut it.
   * `lines`: [{ label?, text }]; `label`: the button's accessible name.
   */
  import Icon from './Icon.svelte';
  import { fade } from 'svelte/transition';
  import { portal } from '../lib/dom.js';
  import { motion } from '../lib/motion.js';

  let { label = 'More information', lines = [], pinnable = false } = $props();
  const uid = 'tip-' + Math.random().toString(36).slice(2, 8);
  let btn = $state();
  let open = $state(false);
  let pinned = $state(false);

  const show = () => (open = true);
  const hide = () => { open = false; pinned = false; };
  const softHide = () => !pinned && (open = false);

  /** Attachment: places the tip against the button once it has rendered (and so has a size). */
  function place(tip) {
    const r = btn.getBoundingClientRect();
    const w = tip.offsetWidth, h = tip.offsetHeight;
    const top = r.bottom + 6 + h > innerHeight - 8 && r.top - 6 - h > 8 ? r.top - 6 - h : r.bottom + 6;
    tip.style.top = `${top}px`;
    tip.style.left = `${Math.max(8, Math.min(r.left, innerWidth - w - 8))}px`;
  }

  $effect(() => {
    if (!pinned) return;
    const inside = (t) => btn?.contains(t) || t.closest?.(`#${uid}`);
    const down = (e) => !inside(e.target) && hide();
    const key = (e) => e.key === 'Escape' && (e.stopPropagation(), hide());
    const scrolled = (e) => !inside(e.target) && hide();
    document.addEventListener('pointerdown', down, true);
    document.addEventListener('keydown', key, true);
    document.addEventListener('scroll', scrolled, true);
    return () => {
      document.removeEventListener('pointerdown', down, true);
      document.removeEventListener('keydown', key, true);
      document.removeEventListener('scroll', scrolled, true);
    };
  });
</script>

<button
  bind:this={btn}
  type="button"
  class="info"
  class:pinned
  aria-label={label}
  aria-expanded={pinnable ? pinned : undefined}
  aria-describedby={open ? uid : undefined}
  onpointerenter={show}
  onpointerleave={softHide}
  onfocus={show}
  onblur={softHide}
  onclick={(e) => { e.stopPropagation(); if (!pinnable) show(); else if (pinned) hide(); else { pinned = true; show(); } }}
  onkeydown={(e) => e.key === 'Escape' && open && (e.stopPropagation(), hide())}>
  <Icon name="infoCircle" size="sm" />
</button>
{#if pinned}
  <!-- Swallows the outside press that closes the pinned tip, so it doesn't also hit what's underneath. -->
  <div class="scrim" aria-hidden="true" {@attach portal} transition:fade={{ duration: motion(160) }}></div>
{/if}
{#if open}
  <div id={uid} class="tip" class:pinned role="tooltip" data-floating {@attach portal} {@attach place}>
    {#each lines as l, i (i)}
      <p>{#if l.label}<span class="k">{l.label}</span>{/if}<span>{l.text}</span></p>
    {/each}
  </div>
{/if}

<style>
  .info {
    display: inline-grid; place-items: center; width: 24px; height: 24px; flex: none; padding: 0;
    border: 0; border-radius: var(--r-pill); background: none; color: var(--faint);
  }
  .info:hover, .info:focus-visible, .info.pinned { color: var(--fg-2); background: var(--fill-3); }
  .tip {
    position: fixed; top: 0; left: 0; z-index: var(--z-menu); width: max-content; max-width: min(328px, calc(100vw - 16px)); pointer-events: none;
    display: grid; gap: 4px; padding: var(--space-2) var(--space-3);
    border: 1px solid var(--line-float); background: var(--elevated); border-radius: var(--r-lg); box-shadow: var(--shadow);
    font: 400 12px/1.5 var(--font-body); color: var(--fg-2); text-align: left; white-space: normal; overflow-wrap: anywhere;
    letter-spacing: normal; text-transform: none;
  }
  .scrim { position: fixed; inset: 0; z-index: calc(var(--z-menu) - 1); background: var(--scrim); }
  .tip.pinned { pointer-events: auto; user-select: text; -webkit-user-select: text; cursor: text; }
  p { display: grid; grid-template-columns: auto 1fr; gap: var(--space-2); }
  .k { color: var(--muted); min-width: 52px; }
</style>
