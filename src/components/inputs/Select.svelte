<script>
  import Icon from '../Icon.svelte'
  /**
   * Single-choice dropdown with a listbox popover. Keyboard: arrows, Home/End, type-ahead, Enter, Escape; with a search
   * field the focus stays in it, arrows and Enter work the list, and Home/End, Space and letters are the field's.
   * Options: { value, label, text?, hint?, group?, detail? }. `label` shows on the button, `text` (if set) in the list.
   * Consecutive options with the same `group` sit under its heading; a value may appear in more than one group.
   * groupActions: { [group]: { icon, label, run } } puts a small button on that group's heading (e.g. Clear).
   * loading (true or a label like "Checking models…"): the button shows a shimmer on its edge and label and doesn't open.
   * ghost: a flat button with no raised edges (for toolbars and dense rows); the default is raised.
   * disabled: shows the value but doesn't open: flat with no fill, a faded caret and the not-allowed cursor (e.g. when
   * there is only one choice).
   * error: a message from the app; the button turns red (aria-invalid, set by lib/invalid.js) and shows it in a bubble underneath, which can be dismissed.
   * info: what the choice is for, behind an ⓘ next to the label (see InfoTip).
   * note: dimmed text after the label, such as '(optional)' (see .label-note); screen readers read it as part of the label.
   * search: 'auto' (default: a ListSearch field at the top of the list when there are more than 8 options), true or
   * false. Typing narrows the list (anywhere in an option's text, ignoring case and accents; lib/list-search.js) and
   * puts the keyboard on the first match; Esc clears the text, then closes. searchPlaceholder: its text ("Filter…").
   * detail: an option's `detail` (any value) puts a card beside the list while that option is under the pointer or the
   * keyboard (SideTip), read with the option: a string is its text, { title, text } a heading and text. The `detail`
   * snippet (option) draws it instead, for anything richer (headings, lists, code), from whatever `detail` holds.
   * item: snippet (option, { selected, active }) drawing an option's row in the list in place of its text and hint: an
   * avatar or icon, a second line, a badge. The button still shows `label`, and type-ahead and the search still go by
   * `text ?? label`, so keep those the words the row says. On the chosen row (solid brand) --fg, --fg-2, --muted and
   * --faint turn to the brand's ink, so text drawn in them stays readable; `selected` is there for anything else.
   * Other attributes (class…) and attachments go to the button.
   *
   *   <Select bind:value={owner} options={PEOPLE} id="owner" label="Owner">
   *     {#snippet item(o)}<img class="avatar" src={o.avatar} alt="" /><span>{o.label}<small>{o.email}</small></span>{/snippet}
   *   </Select>
   *   <Select bind:value={region} options={REGIONS} id="region" label="Region" info="Where the files are served from." />
   *   <Select bind:value={plan} options={PLANS} id="plan" label="Plan">
   *     {#snippet detail(o)}<h4>{o.label}</h4><p>{o.detail.summary}</p><ul>{#each o.detail.perks as p}<li>{p}</li>{/each}</ul>{/snippet}
   *   </Select>
   */
  import { tick } from 'svelte'
  import ErrorMessage from '../ErrorMessage.svelte'
  import FieldLabel from './FieldLabel.svelte'
  import Shimmer from '../Shimmer.svelte'
  import { tooltip } from '../../lib/tooltip.js'
  import { invalid } from '../../lib/invalid.js'
  import { observeSize } from '../../lib/observe.js'
  import { topLayer } from '../../lib/dom.js' // the list lives in the top layer: no scrolling parent clips it, no modal dialog covers it
  import { pop } from '../../lib/motion.js'
  import ListSearch from './ListSearch.svelte'
  import { matches, wantsSearch } from '../../lib/list-search.js'
  import { reveal } from '../../lib/reveal.js'
  import SideTip from '../SideTip.svelte'

  /**
   * @typedef {{ value: any, label: string, text?: string, hint?: string, group?: string, detail?: any }} Option
   * @typedef {object} Props
   * @property {any} [value] bindable
   * @property {Option[]} options
   * @property {string} id
   * @property {string} label
   * @property {boolean} [hideLabel]
   * @property {Record<string, { icon: string, label: string, run: () => void }>} [groupActions]
   * @property {boolean | string} [loading]
   * @property {string} [error]
   * @property {string} [info]
   * @property {string} [note] dimmed text after the label, e.g. '(optional)'
   * @property {boolean} [ghost]
   * @property {boolean} [disabled]
   * @property {'auto' | boolean} [search]
   * @property {string} [searchPlaceholder]
   * @property {import('svelte').Snippet<[Option]>} [detail] draws an option's detail card
   * @property {import('svelte').Snippet<[Option, { selected: boolean, active: boolean }]>} [item] draws an option's row in the list
   */
  /** @type {Props & Omit<import('svelte/elements').HTMLButtonAttributes, keyof Props>} */
  let {
    value = $bindable(),
    options,
    id,
    label,
    hideLabel = false,
    groupActions = {},
    loading = false,
    error = '',
    info = '',
    note = '',
    ghost = false,
    disabled = false,
    search = 'auto',
    searchPlaceholder = 'Filter…',
    detail,
    item,
    class: className,
    ...rest
  } = $props()
  let open = $state(false)
  let active = $state(0)
  let button = $state(),
    list = $state(),
    listbox = $state(),
    searchField = $state()
  let query = $state('')
  const current = $derived(options.find((o) => o.value === value) ?? options[0])
  const text = (o) => o.text ?? o.label
  const searchable = $derived(wantsSearch(search, options.length))
  // The option whose detail card shows: the keyboard's (the pointer's too), while it is in the list and has a detail.
  const described = $derived(open && visible.includes(active) && options[active]?.detail != null ? options[active] : null)
  /** Plain detail (no snippet): a string is the text, an object its title and text. */
  const plain = (/** @type {Option} */ o) =>
    detail ? {} : typeof o.detail === 'object' ? { title: o.detail.title, text: o.detail.text } : { text: String(o.detail) }
  // The options the search leaves, each with its index into `options` (what keyboard and ids use).
  const shown = $derived(options.map((o, i) => ({ o, i })).filter(({ o }) => matches(text(o), query)))
  const visible = $derived(shown.map(({ i }) => i))
  // Runs of shown options with the same group.
  const sections = $derived(
    shown.reduce((acc, { o, i }) => {
      const last = acc.at(-1)
      if (last && last.group === (o.group ?? null)) last.items.push({ o, i })
      else acc.push({ group: o.group ?? null, items: [{ o, i }] })
      return acc
    }, []),
  )

  // The list is anchored to the button in CSS (anchor positioning): it sits below it, flips above or to the other side
  // when there is no room, and follows it while the page scrolls. Each Select needs its own anchor name.
  const uid = $props.id()
  const anchor = `--select-${uid}`

  // Whether the value on the button is cut off by its ellipsis: then the button's tooltip shows it whole (a native title
  // can't be reached from the keyboard). Checked on resize, and again whenever the value changes.
  let cut = $state(false)
  const watchCut = (_text) => (node) => {
    const check = () => (cut = node.scrollWidth > node.clientWidth)
    const stop = observeSize(node, check)
    check()
    return stop
  }

  async function show() {
    if (disabled || loading || !options.length) return
    query = ''
    active = Math.max(0, options.indexOf(current))
    open = true
    await tick()
    // Open on the current option: centred in the list when the list scrolls.
    const el = listbox?.querySelector(`[data-i="${active}"]`)
    if (el) listbox.scrollTop = el.offsetTop - (listbox.clientHeight - el.offsetHeight) / 2
    if (searchField) searchField.focus()
    else listbox?.focus()
  }
  /** @param {string} q */
  function narrow(q) {
    query = q
    // The keyboard goes to the first match (back on the current option when the text is cleared).
    active = q ? (visible[0] ?? -1) : Math.max(0, options.indexOf(current))
    tick().then(() => reveal(listbox, listbox?.querySelector(`[data-i="${active}"]`)))
  }
  async function runGroupAction(action) {
    action.run()
    await tick()
    active = Math.min(Math.max(0, options.indexOf(current)), options.length - 1)
  }
  function hide(refocus = true) {
    open = false
    if (refocus) button?.focus()
  }
  function choose(i) {
    value = options[i].value
    hide()
  }

  function onButtonKey(e) {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
      e.preventDefault()
      show()
    }
  }
  function onListKey(e) {
    // Steps go through the options the search leaves.
    const n = visible.length
    const at = visible.indexOf(active)
    switch (e.key) {
      case 'ArrowDown':
        if (n) active = visible[(at + 1) % n]
        break
      case 'ArrowUp':
        if (n) active = visible[at <= 0 ? n - 1 : at - 1]
        break
      case 'Home':
      case 'End':
        if (searchable) return // the caret's
        if (n) active = e.key === 'Home' ? visible[0] : visible[n - 1]
        break
      case ' ':
        if (searchable) return // a space in the search
        if (at >= 0) choose(active)
        break
      case 'Enter':
        if (at >= 0) choose(active)
        break
      case 'Escape':
        hide()
        break
      case 'Tab':
        hide()
        return // back on the button first, so Tab moves on from there (the list sits at the end of <body>)
      default: {
        if (searchable || e.key.length !== 1) return
        const k = e.key.toLowerCase()
        const order = [...options.keys()].slice(active + 1).concat([...options.keys()].slice(0, active + 1))
        const hit = order.find((i) => text(options[i]).toLowerCase().startsWith(k))
        if (hit == null) return
        active = hit
      }
    }
    e.preventDefault()
    e.stopPropagation()
    reveal(listbox, listbox?.querySelector(`[data-i="${active}"]`))
  }

  // While open, a press outside closes the list. The label counts as the button (its click toggles the list), so pressing
  // it isn't an outside press.
  const outside = (e) => open && !button.contains(e.target) && !list?.contains(e.target) && !e.target.closest?.(`label[for="${id}"]`) && hide(false)
</script>

<svelte:document onpointerdowncapture={outside} />

{#snippet option(o, i)}
  <!-- Keyboard is handled on the listbox (aria-activedescendant pattern); options only take pointer input. -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <li
    id="{id}-opt-{i}"
    data-i={i}
    role="option"
    aria-selected={o.value === value}
    aria-describedby={described && i === active ? `${id}-detail` : undefined}
    class:active={i === active}
    class:custom={!!item}
    onpointerenter={() => (active = i)}
    onclick={() => choose(i)}
  >
    {#if item}
      {@render item(o, { selected: o.value === value, active: i === active })}
    {:else}
      <span class="label" title={o.label}>{text(o)}</span>
      {#if o.hint}<span class="hint">{o.hint}</span>{/if}
    {/if}
  </li>
{/snippet}

<div class="field">
  <!-- A real label for the trigger button: clicking it activates the button, so it opens the list, as clicking a text
       field's label puts you in the field. -->
  <FieldLabel for={id} id="{id}-label" {label} {note} {info} {hideLabel} />
  <div class="wrap">
    <button
      {id}
      bind:this={button}
      type="button"
      class={['trigger', className]}
      style:anchor-name={anchor}
      {...rest}
      class:shimmer={loading}
      class:ghost
      {disabled}
      aria-haspopup="listbox"
      aria-expanded={open}
      aria-busy={loading || undefined}
      aria-disabled={loading || undefined}
      aria-labelledby="{id}-label {id}"
      {@attach invalid(error && `${id}-error`)}
      onclick={() => (open ? hide() : show())}
      onkeydown={onButtonKey}
      {@attach tooltip(cut && !open ? current?.label : '')}
    >
      {#if loading}
        <Shimmer class="value">{typeof loading === 'string' ? loading : 'Loading…'}</Shimmer>
      {:else}
        <span class="value" {@attach watchCut(current?.label)}>{current?.label ?? ''}</span>
      {/if}
      <span class="caret" class:flip={open}><Icon name="caretDown" size="sm" /></span>
    </button>
    {#if open}
      {@const activeId = visible.includes(active) ? `${id}-opt-${active}` : undefined}
      <div bind:this={list} style:position-anchor={anchor} class="list" data-floating {@attach topLayer(button)} transition:pop={{ from: button }}>
        {#if searchable}
          <ListSearch
            bind:this={searchField}
            value={query}
            oninput={narrow}
            {label}
            controls="{id}-listbox"
            active={activeId}
            placeholder={searchPlaceholder}
            onkeydown={onListKey}
          />
        {/if}
        <!-- With a search field the focus stays in it: a press on the list mustn't take it (mousedown is what moves it). -->
        <ul
          bind:this={listbox}
          id="{id}-listbox"
          class="options"
          role="listbox"
          tabindex="-1"
          aria-labelledby="{id}-label"
          aria-activedescendant={searchable ? undefined : activeId}
          onkeydown={searchable ? undefined : onListKey}
          onmousedown={searchable ? (e) => e.preventDefault() : undefined}
        >
        {#each sections as sec, si (si)}
          {#if sec.group}
            {@const action = groupActions[sec.group]}
            <li class="group" role="group" aria-labelledby="{id}-group-{si}">
              <!-- Sticky: lib/reveal.js keeps the keyboard's option clear of it. -->
              <div class="group-head" data-sticky-head>
                <span id="{id}-group-{si}">{sec.group}</span>
                {#if action}
                  <!-- Pointer only (keeps focus on the listbox, which owns the keyboard). -->
                  <button
                    type="button"
                    class="group-action"
                    tabindex="-1"
                    aria-label={action.label}
                    {@attach tooltip(action.label)}
                    onmousedown={(e) => e.preventDefault()}
                    onclick={() => runGroupAction(action)}><Icon name={action.icon} size="sm" /></button
                  >
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
        {#if !shown.length}<li class="empty" role="none">No matches</li>{/if}
        </ul>
      </div>
    {/if}
    <!-- Its own block, never inside the one above: a block whose only node is the list (moved to the top layer) is
         removed cleanly; with a second node left behind in .wrap, removing it would sweep up whatever follows the list
         in <body>, such as another Select's list opening as this one closes. -->
    {#if described}
      <SideTip id="{id}-detail" for="{id}-opt-{active}" beside={list} {...plain(described)}>{@render detail?.(described)}</SideTip>
    {/if}
  </div>
  <ErrorMessage floating id="{id}-error" message={error} ondismiss={() => button?.focus()} />
</div>

<style>
  /* min-width: 0 lets it shrink in a flex or grid parent; otherwise a long value's unwrapped width holds it open and
     the trigger runs past its container instead of cutting the value off. */
  .field {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
    max-width: 100%;
  }
  .wrap {
    position: relative;
  }
  .trigger {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    min-width: 120px;
    max-width: 100%;
    min-height: var(--control-h);
    text-align: left;
    padding: 0 8px 0 10px;
    font-size: 13px;
    font-weight: var(--w-medium);
    color: var(--fg);
    background: var(--control-2);
    border: 1px solid var(--line-strong);
    border-radius: var(--r);
    cursor: pointer;
    /* Raised (--shadow-btn) like a button: you press it to open, unlike the sunken text fields, on the same faint fill
       as theirs. Open, it sits flat. */
    --raise: var(--shadow-btn);
    box-shadow: var(--raise);
    transition:
      background-color var(--dur) var(--ease-out),
      border-color var(--dur) var(--ease-out),
      box-shadow var(--dur) var(--ease-out);
  }
  .trigger:hover:not([aria-busy], :disabled) {
    background: var(--control-3);
  }
  /* Loading: the working shimmer runs along the hairline and through the label (global .shimmer / .shimmer-text), on an
     outlined box: no fill and no raised edge to drown it out, as a busy Button. */
  .trigger[aria-busy] {
    --raise: 0 0 transparent;
    cursor: progress;
    background: none;
  }
  .trigger[aria-busy] .caret {
    opacity: 0.5;
  }
  .trigger[aria-expanded='true'] {
    background: var(--control-4);
    box-shadow: none;
  }
  /* Ghost: no relief, open or closed (the focus ring still shows). */
  .trigger.ghost {
    --raise: 0 0 transparent;
  }
  /* …and no fill at rest; hover and open fill it as usual. */
  .trigger.ghost:not(:hover, [aria-expanded='true']) {
    background: none;
  }
  /* Disabled: ghost-flat, no fill, a quieter edge; the value stays readable. */
  .trigger:disabled {
    --raise: 0 0 transparent;
    background: none;
    border-color: var(--line);
    cursor: not-allowed;
  }
  /* The caret stays, faded: it is still a dropdown, just not one that opens now. */
  .trigger:disabled .caret {
    opacity: 0.4;
  }
  /* Focused, it sits flat inside the ring: the raise's outer contact ring would draw a dark line through it. */
  .trigger:focus-visible {
    border-color: var(--accent-line);
    box-shadow: var(--ring);
    outline: none;
  }
  /* :global: the attribute is set by the invalid attachment, at runtime, where Svelte can't see it. */
  .trigger:global([aria-invalid='true']) {
    border-color: var(--danger);
  }
  .trigger:global([aria-invalid='true']):focus-visible {
    box-shadow: 0 0 0 2px color-mix(in lch, var(--danger) 30%, transparent);
  }
  /* Long values (model ids…) are cut with an ellipsis on one line; the full text is in the tooltip. */
  .trigger :global(.value),
  .label {
    min-width: 0;
    overflow: clip;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .caret {
    flex: none;
    display: inline-flex;
    color: var(--muted);
    rotate: 0deg;
    transition: rotate var(--dur) var(--ease-out);
  }
  .caret.flip {
    rotate: 180deg;
  }
  /* Anchored to the trigger: below it from its left edge, at least as wide; flipped above, or to end at its right edge,
     when it would overflow the window. Hidden while the button is scrolled out of view. */
  .list {
    position: fixed;
    z-index: calc(var(--z-overlay) + 1);
    position-area: block-end span-inline-end;
    position-try-fallbacks:
      flip-block,
      flip-inline,
      flip-block flip-inline;
    position-visibility: anchors-visible;
    /* A touch to the left of the field, so the list's text lines up under the field's own (mirrored when it flips to
       end at the field's right edge: a flip swaps the inline margins too), and as much wider, so it overhangs the
       field's right edge by the same amount. */
    margin-inline-start: calc(var(--space-1) * -1);
    margin-block: 4px;
    display: flex;
    flex-direction: column;
    width: max-content;
    min-width: calc(anchor-size(width) + var(--space-1) * 2);
    max-width: min(max(calc(anchor-size(width) + var(--space-1) * 2), 440px), calc(100dvw - 32px));
    max-height: min(320px, calc(100dvh - 16px));
    overflow: hidden;
    border: 1px solid transparent;
    background:
      linear-gradient(var(--elevated), var(--elevated)) padding-box,
      var(--edge-grad-float);
    border-radius: var(--r-lg);
    box-shadow: var(--shadow);
  }
  /* The options scroll under the search field, which stays put. */
  .options {
    flex: 1 1 auto;
    min-height: 0;
    max-height: 280px;
    margin: 0;
    padding: 4px;
    list-style: none;
    overflow-y: auto;
    overflow-x: hidden;
    overscroll-behavior: contain;
    /* Positioned: the options' offsetTop (opening on the value) counts from the list. */
    position: relative;
    --head: 26px;
  }
  .options:focus {
    outline: none;
  }
  .empty {
    display: block;
    color: var(--muted);
    cursor: default;
  }
  /* The box's edge is a gradient under a transparent border (base.css outlines listboxes; this one wraps the listbox). */
  @media (forced-colors: active) {
    .list {
      border-color: CanvasText;
    }
    li[aria-selected='true'] {
      background: Highlight;
      color: HighlightText;
    }
  }
  li {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 6px;
    align-items: center;
    min-height: 32px;
    padding: 0 10px;
    border-radius: var(--r-sm);
    font-size: 13px;
    color: var(--fg);
    cursor: pointer;
    white-space: nowrap;
  }
  li.active {
    background: var(--control-3);
  }
  /* The chosen option is solid brand, as Calendar's chosen day, whether or not the keyboard is on it. With the keyboard
     on it, a lighter brand line inside the edge keeps that visible. */
  /* The text tokens turn to the brand's ink too, so a custom row's quieter text (item snippet) stays readable on it. */
  li[aria-selected='true'] {
    background: var(--brand);
    color: var(--accent-ink);
    --fg: var(--accent-ink);
    --fg-2: var(--accent-ink);
    --muted: color-mix(in lch, var(--accent-ink) 80%, transparent);
    --faint: color-mix(in lch, var(--accent-ink) 70%, transparent);
  }
  /* A row drawn by the item snippet: its content in a row, free to wrap or take a second line (it grows past 32px). */
  li.custom {
    display: flex;
    gap: var(--space-2);
    padding-block: var(--space-1);
    white-space: normal;
  }
  li[aria-selected='true'].active {
    box-shadow: inset 0 0 0 2px color-mix(in lch, var(--brand), var(--accent-ink) 45%);
  }
  li[aria-selected='true'] .hint {
    color: inherit;
    opacity: 0.75;
  }
  /* Group headings: small muted labels, a hairline between groups. */
  /* Square, and widened over the list's 4px padding so the hairline runs edge to edge. */
  .group {
    display: block;
    margin-inline: -4px;
    padding: 0 4px;
    min-height: 0;
    border-radius: 0;
    cursor: default;
  }
  .group + .group,
  li:not(.group) + .group {
    margin-top: 4px;
    padding-top: 4px;
    border-top: 1px solid var(--line);
  }
  /* A group's heading stays at the top of the list while its options scroll under it (as DateRangeSelect's months do):
     on the list's own surface, across its whole width. */
  .group-head {
    position: sticky;
    top: 0;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    min-height: var(--head);
    margin-inline: -4px;
    padding: 0 10px 0 12px;
    background: var(--elevated);
    /* It sticks at the list's content edge, 4px below its top: fill that strip too, so rows don't show through it. */
    box-shadow: 0 -4px 0 var(--elevated);
    font: var(--w-medium) 12px var(--font-body);
    color: var(--muted);
  }
  .group-action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    padding: 0;
    border: 0;
    border-radius: var(--r-sm);
    background: none;
    color: var(--muted);
    cursor: pointer;
  }
  .group-action:hover {
    background: var(--control-3);
    color: var(--fg);
  }
  .hint {
    color: var(--faint);
    font: var(--w-medium) 12px var(--font-data);
    font-variant-numeric: tabular-nums;
  }
</style>
