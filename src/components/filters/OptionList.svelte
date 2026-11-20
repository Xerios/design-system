<script>
  /**
   * A list to tick values in (several, or one with `multiple={false}`), drawn flat to sit inside a floating panel: the
   * value editor of a filter, the field list of FilterBar's add button, or any popover of your own. Each row has a check
   * box, an optional icon (in a tone's colour) and a muted hint on the right, such as how many items have that value.
   * The ticked values move to the top, above a rule, when the list opens; ticking while it is open leaves the rows where
   * they are, so the one under the pointer doesn't jump away.
   *
   *   <OptionList bind:value={statuses} options={STATUSES} label="Status" />
   *   <OptionList value={field} options={FIELDS} multiple={false} label="Filter by" onpick={(key) => open(key)} />
   *
   * value (bindable): the ticked values, an array (in the options' order); with `multiple={false}`, one value.
   * options: [{ value, label, icon?, tone?, hint? }]. `icon` is an Icon name; `tone` (success, warning, danger, info,
   * neutral or an app's own) colours it through [data-tone]; `hint` sits on the right in tabular figures ("15 projects").
   * label: the list's accessible name. multiple: tick several (default) or pick one.
   * search: 'auto' (default: a ListSearch field to narrow the list when it has more than 8 options), true or false.
   * placeholder: the search field's text ("Filter…"). empty: what shows when nothing matches ("No matches").
   * onchange(value): after every tick. onpick(value): a pick in a single list (the host closes on it).
   * onback(): Backspace with the search empty (FilterBar goes back to the field list with it).
   * lead: snippet (option) drawing the left of a row in place of the icon, for something an icon name can't say.
   * autofocus: takes the focus as it appears (default true).
   * Keyboard: ArrowUp / ArrowDown move, Home / End (without a search field) jump to the ends, Space (without a search
   * field) or Enter ticks or picks; without a search field a letter jumps to the next option starting with it. Esc clears
   * the search, else is left to the panel around it, as Tab is. With a search field the focus stays in it (combobox); otherwise on the list.
   * Other attributes (class…) and attachments go to the wrapper.
   */
  import { tick, untrack } from 'svelte'
  import Icon from '../Icon.svelte'
  import ListSearch from '../inputs/ListSearch.svelte'
  import { matches, wantsSearch } from '../../lib/list-search.js'
  import { reveal } from '../../lib/reveal.js'

  /**
   * @typedef {{ value: any, label: string, icon?: string, tone?: string, hint?: string }} Option
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
   * @property {import('svelte').Snippet<[Option]>} [lead]
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
    lead,
    autofocus = true,
    class: className,
    ...rest
  } = $props()

  const uid = $props.id()
  /** @type {HTMLUListElement | undefined} */
  let list = $state()
  let query = $state('')

  /** @param {any} v */
  const isOn = (v) => (multiple ? Array.isArray(value) && value.includes(v) : value === v)
  // The values ticked as the list opened: these rows lead, above the rule, for as long as it stays open.
  const pinned = untrack(() => new Set(multiple && Array.isArray(value) ? value : []))
  const searchable = $derived(wantsSearch(search, options.length))
  const found = $derived(options.filter((o) => matches(o.label, query)))
  const top = $derived(found.filter((o) => pinned.has(o.value)))
  const others = $derived(found.filter((o) => !pinned.has(o.value)))
  const shown = $derived([...top, ...others])
  const hasLead = $derived(!!lead || options.some((o) => o.icon))
  // A single list marks its pick with a tick; with nothing picked (a list of things to pick from, such as FilterBar's
  // fields), it has no tick column, so its rows don't start with an empty gap.
  const hasTick = $derived(multiple || options.some((o) => o.value === value))
  // The row holding the keyboard: back to the top whenever the search changes; on the picked one as a single list opens.
  let active = $derived.by(() => {
    void query
    return untrack(() => (multiple ? 0 : Math.max(0, shown.findIndex((o) => o.value === value))))
  })

  /** @param {Option} o */
  function choose(o) {
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
    reveal(list, list?.querySelector(`[data-i="${i}"]`))
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
  }

  /** Attachment: takes the focus once the list is in place (the panel around it may still be moving into the top layer). */
  const focusIn = (/** @type {HTMLElement} */ node) => {
    if (autofocus) tick().then(() => node.focus({ preventScroll: true }))
  }
  const activeId = $derived(shown.length ? `${uid}-o-${active}` : undefined)
</script>

{#snippet row(/** @type {Option} */ o, /** @type {number} */ i)}
  <!-- Keyboard is handled on the search field or the listbox (aria-activedescendant); options take pointer input only. -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <li
    id="{uid}-o-{i}"
    data-i={i}
    class="option"
    class:active={i === active}
    role="option"
    aria-selected={isOn(o.value)}
    onpointerenter={() => (active = i)}
    onclick={() => choose(o)}
  >
    {#if multiple}
      <span class="box" aria-hidden="true"><Icon name="checkBold" size="sm" /></span>
    {:else if hasTick}
      <span class="tick" aria-hidden="true">{#if isOn(o.value)}<Icon name="check" size="sm" />{/if}</span>
    {/if}
    {#if hasLead}
      <span class="lead" data-tone={o.tone} aria-hidden="true">
        {#if lead}{@render lead(o)}{:else if o.icon}<Icon name={o.icon} />{/if}
      </span>
    {/if}
    <span class="label">{o.label}</span>
    {#if o.hint}<span class="hint">{o.hint}</span>{/if}
  </li>
{/snippet}

<div class={['option-list', className]} {...rest}>
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
    <ul
      id="{uid}-list"
      bind:this={list}
      class="list"
      role="listbox"
      aria-label={label}
      aria-multiselectable={multiple || undefined}
      tabindex={searchable ? -1 : 0}
      aria-activedescendant={searchable ? undefined : activeId}
      onkeydown={searchable ? undefined : onkeydown}
      onmousedown={searchable ? (e) => e.preventDefault() : undefined}
      {@attach searchable ? null : focusIn}
    >
      {#each top as o, i (o.value)}{@render row(o, i)}{/each}
      {#if top.length && others.length}<li class="sep" role="none"></li>{/if}
      {#each others as o, j (o.value)}{@render row(o, top.length + j)}{/each}
    </ul>
  {:else}
    <p class="empty" id="{uid}-list" role="status">{empty}</p>
  {/if}
</div>

<style>
  .option-list {
    display: flex;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
  }
  /* On the list, not the wrapper: an ancestor of the search field set to none stops Safari typing in it. */
  .list {
    user-select: none;
    margin: 0;
    padding: 4px;
    list-style: none;
    max-height: 296px;
    overflow-y: auto;
    overscroll-behavior: contain;
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
    color: var(--fg-2);
    white-space: nowrap;
  }
  /* The keyboard's row shows only while the list is in use (focused or under the pointer), not in a list at rest. */
  .option-list:is(:focus-within, :hover) .option.active {
    background: var(--control-3);
    color: var(--fg);
  }
  .list:focus-visible .option.active {
    box-shadow: inset 0 0 0 2px var(--accent);
  }
  /* The check box (Tile's): hidden on rows that are neither ticked nor under the pointer or keyboard, so the column of
     empty boxes doesn't crowd the list; brand-filled with a tick once ticked. */
  .box,
  .tick,
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
  .tick {
    display: inline-flex;
    color: var(--accent);
  }
  .lead {
    display: inline-flex;
    color: var(--muted);
  }
  .lead[data-tone] {
    color: var(--tone);
  }
  .label {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .hint {
    flex: none;
    color: var(--muted);
    font: var(--w-normal) 12px var(--font-data);
    font-variant-numeric: tabular-nums;
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
  }
</style>
