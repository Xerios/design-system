<script>
  /**
   * A list to tick values in (several, or one with `multiple={false}`), drawn flat to sit inside a floating panel: the
   * value editor of a filter, the field list of FilterBar's add button, or any popover of your own. Each row has a check
   * box (several) or, picking one, a solid brand fill on the picked row, an optional icon (in a tone's colour) and a
   * muted hint on the right, such as how many items have that value.
   * The ticked values move to the top, above a rule, when the list opens; ticking while it is open leaves the rows where
   * they are, so the one under the pointer doesn't jump away.
   *
   *   <OptionList bind:value={statuses} options={STATUSES} label="Status" />
   *   <OptionList value={field} options={FIELDS} multiple={false} label="Filter by" onpick={(key) => open(key)} />
   *
   * value (bindable): the ticked values, an array (in the options' order); with `multiple={false}`, one value.
   * options: [{ value, label, icon?, tone?, hint?, detail? }]. `icon` is an Icon name; `tone` (success, warning, danger, info,
   * neutral or an app's own) colours it through [data-tone]; `hint` sits on the right in tabular figures ("15 projects").
   * label: the list's accessible name. multiple: tick several (default) or pick one.
   * search: 'auto' (default: a ListSearch field to narrow the list when it has more than 8 options), true or false.
   * placeholder: the search field's text ("Filter…"). empty: what shows when nothing matches ("No matches").
   * onchange(value): after every tick. onpick(value): a pick in a single list (the host closes on it).
   * onback(): Backspace with the search empty (FilterBar goes back to the field list with it).
   * lead: snippet (option) drawing the left of a row in place of the icon, for something an icon name can't say.
   * More on an option: `top` keeps it above the rule with the ticked ones (FilterBar's recent filters); `muted` draws it
   * dimmed, still pickable (a field already filtered by); `switch` (true or false) ends the row with a switch showing it,
   * as a context menu's toggle does: picking the row calls onpick but doesn't make it the picked value, so the host
   * flips it and the list stays as it is; `action` is such a row without the switch (a "Show more" row); `removable`
   * puts a ✕ on the row under the pointer or keyboard, which calls onremove(option) (removeLabel names it, default
   * "Remove"), its room kept on every removable row so the list doesn't widen as it shows.
   * text: snippet (option) drawing a row's label in place of its plain text (part of it muted, say); `label` is still
   * what the search matches.
   * head: snippet drawn above the rows, scrolling with them (a heading for the top rows, with actions on them).
   * detail: an option's `detail` (any value) puts a card beside the panel (SideTip) while that row is under the pointer,
   * or the keyboard's while the list has the focus, read with the row: a string is its text, { title, text } a heading
   * and text. The `detail` snippet (option) draws it instead, for anything richer, from whatever `detail` holds.
   * autofocus: takes the focus as it appears (default true).
   * Keyboard: ArrowUp / ArrowDown move, Home / End (without a search field) jump to the ends, Space (without a search
   * field) or Enter ticks or picks; without a search field a letter jumps to the next option starting with it.
   * Shift+Delete (or Delete with nothing typed) removes a removable row. Esc clears
   * the search, else is left to the panel around it, as Tab is. With a search field the focus stays in it (combobox); otherwise on the list.
   * --held-gap: the surface the list sits on (default --elevated, a floating panel's); the ring on the row under the
   * pointer or keyboard opens a gap of it (.held / .keyed, css/atoms.css). Set it when the list sits on another surface.
   * Other attributes (class…) and attachments go to the wrapper.
   */
  import { tick, untrack } from 'svelte'
  import Icon from '../Icon.svelte'
  import ListSearch from '../inputs/ListSearch.svelte'
  import { matches, wantsSearch } from '../../lib/list-search.js'
  import { reveal } from '../../lib/reveal.js'
  import SideTip from '../SideTip.svelte'
  import { tooltip } from '../../lib/tooltip.js'

  /**
   * @typedef {{ value: any, label: string, icon?: string, tone?: string, hint?: string, detail?: any, top?: boolean, muted?: boolean, switch?: boolean, action?: boolean, removable?: boolean }} Option
   * @typedef {object} Props
   * @property {any} [value] bindable: an array, or one value when not `multiple`
   * @property {Option[]} options
   * @property {string} label
   * @property {boolean} [multiple]
   * @property {'auto' | boolean} [search]
   * @property {string} [placeholder]
   * @property {string} [empty]
   * @property {(value: any) => void} [onchange]
   * @property {(value: any) => void} [onpick]
   * @property {() => void} [onback]
   * @property {(option: Option) => void} [onremove] a removable row's ✕
   * @property {string} [removeLabel]
   * @property {import('svelte').Snippet} [head] above the rows, scrolling with them
   * @property {import('svelte').Snippet<[Option]>} [lead]
   * @property {import('svelte').Snippet<[Option]>} [text] draws a row's label
   * @property {import('svelte').Snippet<[Option]>} [detail] draws an option's detail card
   * @property {boolean} [autofocus]
   */
  /** @type {Props & Omit<import('svelte/elements').HTMLAttributes<HTMLDivElement>, keyof Props>} */
  let {
    value = $bindable(),
    options,
    label,
    multiple = true,
    search = 'auto',
    placeholder = 'Filter…',
    empty = 'No matches',
    onchange,
    onpick,
    onback,
    onremove,
    removeLabel = 'Remove',
    head,
    lead,
    text,
    detail,
    autofocus = true,
    class: className,
    ...rest
  } = $props()

  const uid = $props.id()
  /** @type {HTMLUListElement | undefined} */
  let list = $state()
  /** @type {HTMLDivElement | undefined} */
  let scroller = $state()
  let query = $state('')

  /** @param {any} v */
  const isOn = (v) => (multiple ? Array.isArray(value) && value.includes(v) : value === v)
  // The values ticked as the list opened: these rows lead, above the rule, for as long as it stays open.
  const pinned = untrack(() => new Set(multiple && Array.isArray(value) ? value : []))
  const searchable = $derived(wantsSearch(search, options.length))
  const found = $derived(options.filter((o) => matches(o.label, query)))
  /** @param {Option} o */
  const leads = (o) => !!o.top || pinned.has(o.value)
  const top = $derived(found.filter(leads))
  const others = $derived(found.filter((o) => !leads(o)))
  const shown = $derived([...top, ...others])
  const hasLead = $derived(!!lead || options.some((o) => o.icon))
  // The row holding the keyboard: back to the top whenever the search changes; on the picked one as a single list opens.
  let active = $derived.by(() => {
    void query
    return untrack(() => (multiple ? 0 : Math.max(0, shown.findIndex((o) => o.value === value))))
  })

  /** @param {Option} o */
  function choose(o) {
    if (o.switch != null || o.action) {
      onpick?.(o.value)
      return
    }
    if (!multiple) {
      value = o.value
      onchange?.(value)
      onpick?.(value)
      return
    }
    const was = Array.isArray(value) ? value : []
    const on = !was.includes(o.value)
    const next = new Set(was)
    if (on) next.add(o.value)
    else next.delete(o.value)
    // In the options' order, so a summary of them reads the way the list does; values not among the options stay last.
    const order = options.map((x) => x.value)
    value = [...order.filter((v) => next.has(v)), ...was.filter((v) => next.has(v) && !order.includes(v))]
    onchange?.(value)
  }

  /** @param {number} i */
  function moveTo(i) {
    active = i
    reveal(scroller, list?.querySelector(`[data-i="${i}"]`))
  }

  /** @param {KeyboardEvent} e */
  function onkeydown(e) {
    const n = shown.length
    switch (e.key) {
      case 'ArrowDown':
        if (n) moveTo((active + 1) % n)
        break
      case 'ArrowUp':
        if (n) moveTo((active - 1 + n) % n)
        break
      case 'Home':
      case 'End':
        if (searchable) return // the caret's
        if (n) moveTo(e.key === 'Home' ? 0 : n - 1)
        break
      case 'Enter':
        if (shown[active]) choose(shown[active])
        break
      case ' ':
        if (searchable) return // a space in the search
        if (shown[active]) choose(shown[active])
        break
      case 'Backspace':
        if (query || !onback) return
        onback()
        break
      case 'Delete':
        if ((query && !e.shiftKey) || !onremove || !shown[active]?.removable) return
        onremove(shown[active])
        break
      default: {
        if (searchable || e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return
        const k = e.key.toLowerCase()
        const order = [...shown.keys()].slice(active + 1).concat([...shown.keys()].slice(0, active + 1))
        const hit = order.find((i) => shown[i].label.toLowerCase().startsWith(k))
        if (hit == null) return
        moveTo(hit)
      }
    }
    e.preventDefault()
    keyboard = true
  }

  /** Attachment: takes the focus once the list is in place (the panel around it may still be moving into the top layer). */
  const focusIn = (/** @type {HTMLElement} */ node) => {
    if (autofocus) tick().then(() => node.focus({ preventScroll: true }))
  }
  const activeId = $derived(shown.length ? `${uid}-o-${active}` : undefined)

  // The detail card follows the keyboard's row while the list is in use (under the pointer or holding the focus), as
  // the row's highlight does; beside the floating panel the list sits in, else beside the list itself.
  /** @type {HTMLDivElement | undefined} */
  let root = $state()
  let hovered = $state(false)
  let focused = $state(false)
  // Whether the keyboard is moving through the list (its row then shows the keyed ring); the pointer moving over the
  // list turns it off, and tabbing onto the list turns it on.
  let keyboard = $state(false)
  const inUse = $derived(hovered || focused)
  const beside = $derived(root ? (/** @type {HTMLElement | null} */ (root.closest('[data-floating], [data-top-layer]')) ?? root) : null)
  const described = $derived((hovered || focused) && shown[active]?.detail != null ? shown[active] : null)
  /** Plain detail (no snippet): a string is the text, an object its title and text. */
  const plain = (/** @type {Option} */ o) =>
    detail ? {} : typeof o.detail === 'object' ? { title: o.detail.title, text: o.detail.text } : { text: String(o.detail) }
</script>

{#snippet row(/** @type {Option} */ o, /** @type {number} */ i)}
  <!-- Keyboard is handled on the search field or the listbox (aria-activedescendant); options take pointer input only. -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <li
    id="{uid}-o-{i}"
    data-i={i}
    class="option"
    class:muted={o.muted}
    class:active={i === active}
    class:held={inUse && !multiple && i === active && isOn(o.value)}
    class:keyed={inUse && keyboard && i === active && (multiple || !isOn(o.value))}
    role="option"
    aria-selected={o.switch == null && isOn(o.value)}
    aria-checked={o.switch ?? undefined}
    aria-describedby={described && i === active ? `${uid}-detail` : undefined}
    onpointerenter={() => (active = i)}
    onclick={() => choose(o)}
  >
    {#if multiple}
      <span class="box" aria-hidden="true"><Icon name="checkBold" size="sm" /></span>
    {/if}
    {#if hasLead}
      <span class="lead" data-tone={o.tone} aria-hidden="true">
        {#if lead}{@render lead(o)}{:else if o.icon}<Icon name={o.icon} />{/if}
      </span>
    {/if}
    <span class="label">{#if text}{@render text(o)}{:else}{o.label}{/if}</span>
    {#if o.hint}<span class="hint">{o.hint}</span>{/if}
    {#if o.removable && onremove}
      <!-- Pointer only: from the keyboard, Delete removes the row. -->
      <button
        type="button"
        class="remove"
        tabindex="-1"
        aria-label="{removeLabel} {o.label}"
        {@attach tooltip(removeLabel)}
        onclick={(e) => {
          e.stopPropagation()
          onremove(o)
        }}><Icon name="x" size="sm" /></button
      >
    {/if}
    {#if o.switch != null}<span class="knob" aria-hidden="true"></span>{/if}
  </li>
{/snippet}

<div
  bind:this={root}
  class={['option-list', !multiple && 'single', className]}
  {...rest}
  onpointerenter={() => (hovered = true)}
  onpointerleave={() => (hovered = false)}
  onfocusin={(e) => {
    focused = true
    if (e.target === list && list.matches(':focus-visible')) keyboard = true
  }}
  onpointermove={() => (keyboard = false)}
  onfocusout={(e) => (focused = !!root?.contains(/** @type {Node | null} */ (e.relatedTarget)))}
>
  {#if searchable}
    <ListSearch
      value={query}
      oninput={(text) => (query = text)}
      {label}
      controls="{uid}-list"
      active={activeId}
      {placeholder}
      {onkeydown}
      {@attach focusIn}
    />
  {/if}
  {#if shown.length}
    <!-- With a search field the focus stays in it: a press on the list mustn't take it (mousedown is what moves it). -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="scroll" bind:this={scroller} onmousedown={searchable ? (e) => e.preventDefault() : undefined}>
    {#if head}
      <!-- A press on its buttons leaves the focus where it is (the search field, or the list), so the keys still move through the rows. -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div class="head" onmousedown={(e) => e.preventDefault()}>{@render head()}</div>
    {/if}
    <ul
      id="{uid}-list"
      bind:this={list}
      class={['list', !multiple && 'single']}
      role="listbox"
      aria-label={label}
      aria-multiselectable={multiple || undefined}
      tabindex={searchable ? -1 : 0}
      aria-activedescendant={searchable ? undefined : activeId}
      onkeydown={searchable ? undefined : onkeydown}
      {@attach searchable ? null : focusIn}
    >
      {#each top as o, i (o.value)}{@render row(o, i)}{/each}
      {#if top.length && others.length}<li class="sep" role="none"></li>{/if}
      {#each others as o, j (o.value)}{@render row(o, top.length + j)}{/each}
    </ul>
    </div>
  {:else}
    <p class="empty" id="{uid}-list" role="status">{empty}</p>
  {/if}
  {#if described}
    <SideTip id="{uid}-detail" for="{uid}-o-{active}" {beside} {...plain(described)}>{@render detail?.(described)}</SideTip>
  {/if}
</div>

<style>
  .option-list {
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
  }
  /* The rows (and the head over them) scroll under the search field. On the scroller, not the wrapper: an ancestor of
     the search field set to none stops Safari typing in it. */
  .scroll {
    user-select: none;
    padding: 4px;
    max-height: 296px;
    overflow-y: auto;
    overscroll-behavior: contain;
  }
  .list {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .list:focus {
    outline: none;
  }
  /* Check, icon, label, hint; whichever the list has (a column only some rows fill keeps its width on the others). */
  .option {
    display: flex;
    gap: var(--space-2);
    align-items: center;
    min-height: 32px;
    padding: 0 10px 0 8px;
    border-radius: var(--r-sm);
    font-size: 13px;
    font-weight: var(--w-medium);
    color: var(--fg);
    white-space: nowrap;
  }
  /* The keyboard's row shows only while the list is in use (focused or under the pointer), not in a list at rest. */
  .option-list:is(:focus-within, :hover) .option.active {
    background: var(--control-3);
  }
  /* Picking one, the picked row is solid brand (as Calendar's chosen day), its icon and hint in the same ink. Under the
     pointer or the keyboard it is .held, and any other row the keyboard is on .keyed (css/atoms.css): a gap of the
     surface around the list just inside the edge (--held-gap). */
  .single [aria-selected='true'],
  .option-list.single:is(:focus-within, :hover) [aria-selected='true'].active {
    background: var(--brand);
    color: var(--accent-ink);
  }
  .single [aria-selected='true'] :is(.lead, .hint) {
    color: inherit;
  }
  .single [aria-selected='true'] .hint {
    opacity: 0.75;
  }
  /* The check box (Tile's): hidden on rows that are neither ticked nor under the pointer or keyboard, so the column of
     empty boxes doesn't crowd the list; brand-filled with a tick once ticked. */
  .box,
  .lead {
    flex: none;
    width: 16px;
  }
  .box {
    display: grid;
    place-items: center;
    width: 16px;
    height: 16px;
    border: 1px solid var(--faint);
    border-radius: calc(var(--r-sm) - 2px);
    background: var(--control-1);
    color: var(--accent-ink);
    opacity: 0;
    transition:
      opacity var(--dur-fast) var(--ease-out),
      background-color var(--dur) var(--ease-out),
      border-color var(--dur) var(--ease-out);
  }
  .box :global(.icon) {
    opacity: 0;
    scale: 0.5;
    transition:
      opacity var(--dur) var(--ease-out),
      scale var(--dur) var(--ease-out);
  }
  .option-list:is(:focus-within, :hover) .active .box,
  [aria-selected='true'] .box {
    opacity: 1;
  }
  [aria-selected='true'] .box {
    border-color: var(--brand);
    background: var(--brand);
  }
  [aria-selected='true'] .box :global(.icon) {
    opacity: 1;
    scale: 1;
  }
  .lead {
    display: inline-flex;
    color: var(--muted);
  }
  .lead[data-tone] {
    color: var(--tone);
  }
  /* Still pickable, but set back: a field already in use, a filter already applied. */
  .muted :is(.label, .lead) {
    color: var(--muted);
  }
  .label {
    flex: 1;
    min-width: 0;
    overflow: clip;
    text-overflow: ellipsis;
  }
  .hint {
    flex: none;
    color: var(--muted);
    font: var(--w-normal) 12px var(--font-data);
    font-variant-numeric: tabular-nums;
  }
  /* A removable row's ✕: on the row under the pointer or keyboard only, so a column of them doesn't crowd the list; its
     room is kept on the others (hidden, not gone), so the list doesn't widen as it shows. */
  .remove {
    flex: none;
    display: grid;
    visibility: hidden;
    place-items: center;
    width: 24px;
    height: 24px;
    margin-inline-end: -6px;
    padding: 0;
    border: 0;
    border-radius: var(--r-sm);
    background: none;
    color: var(--muted);
    cursor: pointer;
  }
  .option-list:is(:focus-within, :hover) .active .remove {
    visibility: visible;
  }
  .remove:hover {
    background: var(--control-3);
    color: var(--fg);
  }
  /* A switch row's switch: the track and knob of inputs/Switch, as the context menu's toggle items draw it (a control
     can't sit inside an option). */
  .knob {
    flex: none;
    position: relative;
    width: 28px;
    height: 16px;
    border-radius: var(--r-pill);
    background: var(--control-4);
    box-shadow:
      inset 0 0 0 1px var(--line),
      var(--sunken-shadow);
    transition:
      background var(--dur) var(--ease-out),
      box-shadow var(--dur) var(--ease-out);
  }
  .knob::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--knob);
    box-shadow: var(--knob-shadow);
    transition: translate var(--dur) var(--ease-out);
  }
  [aria-checked='true'] > .knob {
    background: var(--brand);
    box-shadow: none;
  }
  [aria-checked='true'] > .knob::after {
    translate: 12px 0;
  }
  /* Between the ticked rows and the rest: across the whole list, through its padding. */
  .sep {
    height: 1px;
    margin: 4px -4px;
    background: var(--line);
  }
  .empty {
    margin: 0;
    padding: var(--space-3);
    color: var(--muted);
    font-size: 13px;
  }
  @media (forced-colors: active) {
    .box {
      opacity: 1;
      border-color: CanvasText;
    }
    [aria-selected='true'] .box {
      background: Highlight;
    }
    .single [aria-selected='true'] {
      background: Highlight;
      color: HighlightText;
    }
  }
</style>
