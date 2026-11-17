<script>
  import Icon from '../Icon.svelte';
  /**
   * Single-choice dropdown with a listbox popover. Keyboard: arrows, Home/End, type-ahead, Enter, Escape.
   * Options: { value, label, text?, hint?, group? }. `label` shows on the button, `text` (if set) in the list.
   * Consecutive options with the same `group` sit under its heading; a value may appear in more than one group.
   * groupActions: { [group]: { icon, label, run } } puts a small button on that group's heading (e.g. Clear).
   * loading (true or a label like "Checking models…"): the button shows a shimmer on its edge and label and doesn't open.
   * error: a message from the app; the button turns red (`data-invalid`) and shows it in a bubble underneath, which can be dismissed.
   */
  import { tick } from 'svelte';
  import ErrorMessage from '../ErrorMessage.svelte';
  import Shimmer from '../Shimmer.svelte';
  import { tooltip } from '../../lib/tooltip.js';
  import { portal } from '../../lib/dom.js'; // the list lives on <body> so a scrolling parent can't clip it

  let { value = $bindable(), options, id, label, hideLabel = false, groupActions = {}, loading = false, error = '' } = $props();
  let open = $state(false);
  let active = $state(0);
  let button = $state(), list = $state();
  const current = $derived(options.find((o) => o.value === value) ?? options[0]);
  const text = (o) => o.text ?? o.label;
  // Runs of options with the same group, each keeping its index into `options` (what keyboard and ids use).
  const sections = $derived(
    options.reduce((acc, o, i) => {
      const last = acc.at(-1);
      if (last && last.group === (o.group ?? null)) last.items.push({ o, i });
      else acc.push({ group: o.group ?? null, items: [{ o, i }] });
      return acc;
    }, [])
  );

  function place() {
    if (!list || !button) return;
    const r = button.getBoundingClientRect();
    list.style.minWidth = `${r.width}px`;
    list.style.maxWidth = `min(${Math.max(r.width, 440)}px, calc(100vw - 32px))`;
    const h = list.offsetHeight, w = list.offsetWidth;
    const above = r.bottom + h + 8 > innerHeight && r.top > h + 8;
    list.style.left = `${Math.max(8, Math.min(r.left, innerWidth - w - 8))}px`;
    list.style.top = `${above ? r.top - h - 4 : r.bottom + 4}px`;
  }

  async function show() {
    if (loading || !options.length) return;
    active = Math.max(0, options.indexOf(current));
    open = true;
    await tick();
    place();
    // Open on the current option: centred in the list when the list scrolls.
    const el = list.querySelector(`[data-i="${active}"]`);
    if (el) list.scrollTop = el.offsetTop - (list.clientHeight - el.offsetHeight) / 2;
    list.focus();
  }
  async function runGroupAction(action) {
    action.run();
    await tick();
    active = Math.min(Math.max(0, options.indexOf(current)), options.length - 1);
    place();
  }
  function hide(refocus = true) {
    open = false;
    if (refocus) button?.focus();
  }
  function choose(i) {
    value = options[i].value;
    hide();
  }

  function onButtonKey(e) {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
      e.preventDefault();
      show();
    }
  }
  function onListKey(e) {
    const n = options.length;
    switch (e.key) {
      case 'ArrowDown': active = (active + 1) % n; break;
      case 'ArrowUp': active = (active - 1 + n) % n; break;
      case 'Home': active = 0; break;
      case 'End': active = n - 1; break;
      case 'Enter': case ' ': choose(active); break;
      case 'Escape': hide(); break;
      case 'Tab': hide(); return; // back on the button first, so Tab moves on from there (the list sits at the end of <body>)
      default: {
        if (e.key.length !== 1) return;
        const k = e.key.toLowerCase();
        const order = [...options.keys()].slice(active + 1).concat([...options.keys()].slice(0, active + 1));
        const hit = order.find((i) => text(options[i]).toLowerCase().startsWith(k));
        if (hit == null) return;
        active = hit;
      }
    }
    e.preventDefault();
    e.stopPropagation();
    list.querySelector(`[data-i="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }

  $effect(() => {
    if (!open) return;
    const outside = (e) => !button.contains(e.target) && !list?.contains(e.target) && hide(false);
    const follow = (e) => e.target !== list && place();
    document.addEventListener('pointerdown', outside, true);
    addEventListener('scroll', follow, true);
    addEventListener('resize', place);
    return () => {
      document.removeEventListener('pointerdown', outside, true);
      removeEventListener('scroll', follow, true);
      removeEventListener('resize', place);
    };
  });
</script>

{#snippet option(o, i)}
  <!-- Keyboard is handled on the listbox (aria-activedescendant pattern); options only take pointer input. -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <li
    id="{id}-opt-{i}"
    data-i={i}
    role="option"
    aria-selected={o.value === value}
    class:active={i === active}
    onpointerenter={() => (active = i)}
    onclick={() => choose(i)}>
    <span class="tick">{#if o.value === value}<Icon name="check" size="sm" />{/if}</span>
    <span class="label" title={o.label}>{text(o)}</span>
    {#if o.hint}<span class="hint">{o.hint}</span>{/if}
  </li>
{/snippet}

<div class="field">
  <span class="field-label" class:sr-only={hideLabel} id="{id}-label">{label}</span>
  <div class="wrap">
    <button
      {id}
      bind:this={button}
      type="button"
      class="trigger"
      class:shimmer={loading}
      aria-haspopup="listbox"
      aria-expanded={open}
      aria-busy={loading || undefined}
      aria-disabled={loading || undefined}
      aria-labelledby="{id}-label {id}"
      data-invalid={error ? '' : undefined}
      aria-describedby={error ? `${id}-error` : undefined}
      onclick={() => (open ? hide() : show())}
      onkeydown={onButtonKey}>
      {#if loading}
        <Shimmer class="value">{typeof loading === 'string' ? loading : 'Loading…'}</Shimmer>
      {:else}
        <span class="value" title={current?.label}>{current?.label ?? ''}</span>
      {/if}
      <span class="caret" class:flip={open}><Icon name="caretDown" size="sm" /></span>
    </button>
    {#if open}
      <ul
        bind:this={list}
        class="list"
        data-floating
        {@attach portal}
        role="listbox"
        tabindex="-1"
        aria-labelledby="{id}-label"
        aria-activedescendant="{id}-opt-{active}"
        onkeydown={onListKey}>
        {#each sections as sec, si (si)}
          {#if sec.group}
            {@const action = groupActions[sec.group]}
            <li class="group" role="group" aria-labelledby="{id}-group-{si}">
              <div class="group-head">
                <span id="{id}-group-{si}">{sec.group}</span>
                {#if action}
                  <!-- Pointer only (keeps focus on the listbox, which owns the keyboard). -->
                  <button type="button" class="group-action" tabindex="-1" aria-label={action.label} {@attach tooltip(action.label)} onmousedown={(e) => e.preventDefault()} onclick={() => runGroupAction(action)}><Icon name={action.icon} size="sm" /></button>
                {/if}
              </div>
              <ul role="none">
                {#each sec.items as { o, i } (i)}{@render option(o, i)}{/each}
              </ul>
            </li>
          {:else}
            {#each sec.items as { o, i } (i)}{@render option(o, i)}{/each}
          {/if}
        {/each}
      </ul>
    {/if}
  </div>
  <ErrorMessage floating id="{id}-error" message={error} ondismiss={() => button?.focus()} />
</div>

<style>
  .field { position: relative; display: flex; flex-direction: column; gap: 3px; }
  .wrap { position: relative; }
  .trigger {
    display: flex; align-items: center; justify-content: space-between; gap: 8px; min-width: 120px; max-width: 100%; min-height: 32px; text-align: left;
    padding: 0 8px 0 10px; font-size: 13px; font-weight: var(--w-medium); color: var(--fg-2); background: none; border: 1px solid var(--line-strong); border-radius: var(--r); cursor: pointer;
    transition: background-color var(--dur) var(--ease-out), border-color var(--dur) var(--ease-out), box-shadow var(--dur) var(--ease-out);
  }
  .trigger:hover:not([aria-busy]) { background: var(--fill-3); color: var(--fg); }
  /* Loading: the working shimmer runs along the hairline and through the label (global .shimmer / .shimmer-text). */
  .trigger[aria-busy] { cursor: progress; border-color: var(--line); }
  .trigger[aria-busy] .caret { opacity: 0.5; }
  .trigger[aria-expanded="true"] { background: var(--fill-4); color: var(--fg); }
  .trigger:focus-visible { border-color: var(--accent-line); box-shadow: var(--ring); outline: none; }
  .trigger[data-invalid] { border-color: var(--danger); }
  .trigger[data-invalid]:focus-visible { box-shadow: 0 0 0 2px color-mix(in srgb, var(--danger) 30%, transparent); }
  /* Long values (model ids…) are cut with an ellipsis on one line; the full text is in the tooltip. */
  .trigger :global(.value), .label { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .caret { flex: none; display: inline-flex; color: var(--muted); transition: transform var(--dur) var(--ease-out); }
  .caret.flip { transform: rotate(180deg); }
  .list {
    position: fixed; z-index: calc(var(--z-overlay) + 1); top: 0; left: 0; width: max-content; max-height: min(280px, calc(100vh - 16px)); overflow-y: auto; overflow-x: hidden; overscroll-behavior: contain;
    border: 1px solid transparent; background: linear-gradient(var(--elevated), var(--elevated)) padding-box, var(--edge-grad-float); border-radius: var(--r-lg); padding: 4px; box-shadow: var(--shadow);
  }
  .list:focus { outline: none; }
  li { display: grid; grid-template-columns: 14px minmax(0, 1fr) auto; gap: 6px; align-items: center; min-height: 32px; padding: 0 10px 0 8px; border-radius: var(--r-sm); font-size: 13px; color: var(--fg-2); cursor: pointer; white-space: nowrap; }
  li.active { background: var(--fill-3); color: var(--fg); }
  .tick { display: inline-flex; color: var(--accent); }
  /* Group headings: small muted labels, a hairline between groups. */
  .group { display: block; padding: 0; min-height: 0; cursor: default; }
  .group + .group, li:not(.group) + .group { margin-top: 4px; padding-top: 4px; border-top: 1px solid var(--line); }
  .group-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; height: 26px; padding: 0 6px 0 8px; font: var(--w-medium) 11.5px var(--font-body); color: var(--muted); }
  .group-action { display: inline-flex; align-items: center; justify-content: center; width: 20px; height: 20px; padding: 0; border: 0; border-radius: var(--r-sm); background: none; color: var(--muted); cursor: pointer; }
  .group-action:hover { background: var(--fill-3); color: var(--fg); }
  .hint { color: var(--faint); font: var(--w-medium) 12px var(--font-data); font-variant-numeric: tabular-nums; }
</style>
