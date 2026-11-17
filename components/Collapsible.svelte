<script>
  /**
   * Collapsible section with a full-width header button, for stacking inside a panel.
   *
   *   <Collapsible title="Requirements" count={8}>…</Collapsible>             opens and closes on its own
   *   <Collapsible title="…" bind:open>…</Collapsible>                        the parent holds the state
   *   <Collapsible title="…" open={saved} ontoggle={(next) => save(next)}>…   …or stores it somewhere (preferences)
   *
   * `count` shows a number pill after the title; `meta` is an optional snippet at the right of the header.
   * `id` names the body for aria-controls (one is made up if you leave it out).
   * Sections run edge to edge: set --bleed on the container to its side padding.
   */
  import { slide } from 'svelte/transition';
  import Icon from './Icon.svelte';
  import { motion } from '../lib/motion.js';

  let { id = 'c' + Math.random().toString(36).slice(2, 8), title, open = $bindable(true), ontoggle, count = null, meta, children } = $props();
  const toggle = () => {
    open = !open;
    ontoggle?.(open);
  };
</script>

<section class="collapsible" class:open>
  <h3>
    <button type="button" aria-expanded={open} aria-controls={id} onclick={toggle}>
      <span class="chev"><Icon name="caretRight" size="sm" /></span>
      <span class="title">{title}</span>
      {#if count != null}<span class="count">{count}</span>{/if}
      {#if meta}<span class="meta">{@render meta()}</span>{/if}
    </button>
  </h3>
  {#if open}
    <div {id} class="body" transition:slide={{ duration: motion(180) }}>
      <div class="inner">{@render children()}</div>
    </div>
  {/if}
</section>

<style>
  /* Sections run edge to edge across the panel they're in: the container sets --bleed to its side padding, the section
     extends into it with negative margins and pads back by the same amount, so the hairlines and the header's hover fill
     reach both edges while the chevron, title and content stay where they were. */
  .collapsible { --pad: calc(var(--bleed, 0px) + var(--space-1)); margin-inline: calc(-1 * var(--bleed, 0px)); border-top: 1px solid var(--line); }
  .collapsible:last-child { border-bottom: 1px solid var(--line); }
  h3 { margin: 0; }
  button {
    display: flex; align-items: center; gap: var(--space-2); width: 100%; min-height: 32px; padding: 0 var(--pad);
    background: none; border: 0; border-radius: 0; text-align: left; color: var(--muted);
    font: var(--w-medium) 12px var(--font-body);
    transition: color var(--dur-fast) var(--ease-out), background-color var(--dur-fast) var(--ease-out);
  }
  button:hover { color: var(--fg-2); background: var(--fill-2); }
  button:focus-visible { outline-offset: -2px; border-radius: 0; }
  .chev { display: inline-flex; transition: transform var(--dur) var(--ease-out); }
  .open .chev { transform: rotate(90deg); }
  .title { color: var(--fg); }
  .count { font: var(--w-medium) 11px var(--font-data); font-variant-numeric: tabular-nums; color: var(--muted); background: var(--fill-3); border-radius: var(--r-pill); padding: 1px 7px; }
  .meta { margin-left: auto; font: 400 12px var(--font-body); }
  .inner { padding: var(--space-1) var(--pad) var(--space-4); display: grid; gap: var(--space-3); }
</style>
