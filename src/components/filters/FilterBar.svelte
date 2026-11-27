<script>
  /**
   * A row of filters drawn from data (Linear's view filters): one FilterChip per filter, then a funnel button that adds
   * one. The button lists the fields (with a search field when there are many); picking one shows its value editor in
   * the same panel, under a header naming the field with a ‹ back to the list, and the filter joins the row as soon as it
   * has a value. A field already filtered is dimmed in the list and opens its chip instead, so each field has one filter.
   * With a `history`, the filters used most (and most lately) lead the list as "Recent", above a rule: the first few and
   * a "Show more" row for the rest, a ✕ on each to forget it, the condition muted. Those already applied are left out.
   * The "Recent" heading folds the list away and back (kept in the history's storage). Picking one applies it.
   * A filter left with no value (every value unticked, every word removed) leaves `filters` at once, so nothing filters
   * by it. While it is being added its chip goes too, and comes back as a value is picked again; edited in its own
   * chip's panel, the chip stays on the row until the panel closes, and picking a value again puts it back in its place.
   *
   *   <FilterBar bind:filters fields={[
   *     { key: 'status', label: 'Status', icon: 'circleDashed', options: [{ value: 'open', label: 'Open', icon: 'checkCircle', tone: 'success', hint: '12 items' }, …], plural: 'statuses' },
   *     { key: 'created', label: 'Created', icon: 'calendar', kind: 'date' },
   *     { key: 'words', label: 'Keywords', icon: 'search', kind: 'text' },
   *   ]} />
   *
   * fields: [{ key, label, icon?, kind?, options?, operators?, plural?, presets?, search?, format? }]. kind:
   *   'options' (the default): ticks values of `options` (OptionList's shape: { value, label, icon?, tone?, hint? });
   *     the filter's value is an array. The chip shows the values with their icons, up to three while their labels are
   *     short (24 characters together), else their icons and "4 {plural}" (default "values"). Conditions default to ['is', 'is not']. `search` as OptionList's.
   *   'date': a day from `presets` ([{ value, label }], default datePresets() in lib/dates.js: 1 day ago … 3 months ago)
   *     or a calendar; the value is a relative id ('-3d') or an ISO day, relativeDay(value) turns either into a day.
   *     Conditions default to ['after', 'before'].
   *   'text': words typed into a TagInput (Enter or a comma adds one); the value is an array of strings, applied as each
   *     word is added. The chip shows them as small label chips (three, then "+2"). Conditions default to
   *     ['contains', 'does not contain'].
   *   'boolean': on or off, with a switch on its row of the add list that flips it in place (the list stays open, as a
   *     context menu's toggle does). On, it is { field, op, value: true } and its chip is the field and a ✕.
   *     Conditions default to ['include', 'exclude'].
   *   'custom': the `panel` snippet edits the value and `summary` draws it on the chip; `format(value)` puts it in words
   *     for the recent list (default String(value)). Conditions default to ['is'].
   *     Without a `panel` snippet a custom field can't be edited, so the add button leaves it out.
   * operators: the conditions to choose from, the first being where a new filter starts. The first is the plain one (is,
   *   after, contains, include): the chip leaves it unsaid ("Posted 3 days ago"); any other shows between the field and
   *   the value ("Application | is not | 2 stages"), or first on a boolean chip ("Exclude | Easy apply"). The chip's field opens the conditions as a menu.
   * filters (bindable): [{ field, op, value }], field a key of `fields`. The app applies them; this only edits them.
   * onchange(filters): after every edit. label: the row's accessible name ("Filters"). addLabel: the button's ("Add filter").
   * history: where the filters used are counted: a key (kept in memory, for the page's life) or a FilterHistory from
   *   filterHistory(key, { storage }) in lib/filter-history.svelte.js, for storage of your own. A filter counts as used
   *   when it is added (as the add panel closes or goes back), changed in its chip (as its panel closes, or its condition
   *   is changed), switched on, or picked from the recent list. Without one there is no recent list.
   * recent: how many recent filters show before "Show more" (default 3).
   * panel: snippet ({ filter, field, set, close }) for a custom field's editor: set(value) stores a value, close() closes.
   * summary: snippet ({ filter, field }) drawing a custom field's value on its chip (default: the value as text).
   * Keyboard: the chips' parts and the add button are in the tab order. In the add panel, Enter or Space on a boolean
   * field flips it, Shift+Delete (or Delete with nothing typed) forgets the recent filter the keyboard is on, and Tab
   * reaches the "Recent" heading. Backspace on a field's values goes back to the field list, unless it deletes something
   * there (typed text, a word). Removing a filter moves the focus
   * to the next one, else the button.
   * Other attributes (class…) and attachments go to the row.
   */
  import { tick } from 'svelte'
  import Icon from '../Icon.svelte'
  import FilterChip from './FilterChip.svelte'
  import OptionList from './OptionList.svelte'
  import DateFilter from './DateFilter.svelte'
  import TagInput from '../inputs/TagInput.svelte'
  import AnchoredPanel from '../AnchoredPanel.svelte'
  import Button from '../Button.svelte'
  import { composing } from '../../lib/dom.js'
  import { tooltip } from '../../lib/tooltip.js'
  import { filterHistory, filterId } from '../../lib/filter-history.svelte.js'
  import { datePresets, formatDay, relativeDay } from '../../lib/dates.js'

  /**
   * @typedef {{ value: any, label: string, icon?: string, tone?: string, hint?: string }} Option
   * @typedef {{ key: string, label: string, icon?: string, kind?: 'options' | 'date' | 'text' | 'boolean' | 'custom', options?: Option[], operators?: string[], plural?: string, presets?: { value: string, label: string }[], search?: 'auto' | boolean, format?: (value: any) => string }} Field
   * @typedef {{ field: string, op: string, value: any }} Filter
   * @typedef {object} Props
   * @property {Field[]} fields
   * @property {Filter[]} [filters] bindable
   * @property {(filters: Filter[]) => void} [onchange]
   * @property {string} [label]
   * @property {string} [addLabel]
   * @property {string | import('../../lib/filter-history.svelte.js').FilterHistory} [history]
   * @property {number} [recent]
   * @property {import('svelte').Snippet<[{ filter: Filter, field: Field, set: (value: any) => void, close: () => void }]>} [panel]
   * @property {import('svelte').Snippet<[{ filter: Filter, field: Field }]>} [summary]
   */
  /** @type {Props & Omit<import('svelte/elements').HTMLAttributes<HTMLDivElement>, keyof Props>} */
  let {
    fields,
    filters = $bindable([]),
    onchange,
    label = 'Filters',
    addLabel = 'Add filter',
    history,
    recent = 3,
    panel,
    summary,
    class: className,
    ...rest
  } = $props()

  const uid = $props.id()
  /** @type {HTMLButtonElement | undefined} */
  let addButton = $state()
  /** @type {Record<string, { focus: () => void }>} */
  const chips = $state({})
  /** The field whose chip has its panel open. */
  let openKey = $state(/** @type {string | null} */ (null))
  /** The add panel: closed, listing the fields, or showing one field's values. */
  let adding = $state(/** @type {null | { key: string | null }} */ (null))
  /** A filter emptied while its panel is open: out of `filters`, but its chip stays on the row (at `at`) until it closes. */
  let held = $state(/** @type {null | { at: number, filter: Filter }} */ (null))
  /** The chips on the row: the filters, with the held one back in its place. */
  const rows = $derived.by(() => {
    if (!held || filters.some((x) => x.field === held?.filter.field)) return filters
    const at = Math.min(held.at, filters.length)
    return [...filters.slice(0, at), held.filter, ...filters.slice(at)]
  })

  const byKey = $derived(new Map(fields.map((f) => [f.key, f])))
  /** @param {Field} f */
  const kindOf = (f) => f.kind ?? 'options'
  /** Whether a field has something to edit it with: a custom one needs the `panel` snippet. @param {Field} f */
  const editable = (f) => kindOf(f) !== 'custom' || !!panel
  /** @param {Field} f */
  const isFlag = (f) => kindOf(f) === 'boolean'
  /** @param {Field} f */
  const operatorsOf = (f) =>
    f.operators ??
    { options: ['is', 'is not'], date: ['after', 'before'], text: ['contains', 'does not contain'], boolean: ['include', 'exclude'], custom: ['is'] }[kindOf(f)]

  /** Marks a recent filter's value in the field list apart from the fields' keys. */
  const RECENT = '\u0000recent:'
  const MORE = '\u0000recent-more'
  const hist = $derived(typeof history === 'string' ? filterHistory(history) : history)
  /** Whether the recent list shows all of them, not just the first `recent`. */
  let allRecent = $state(false)
  const applied = $derived(new Set(filters.map(filterId)))
  /** The recent filters that can still be applied (their field is here and editable, and they aren't applied), best first. */
  const recents = $derived(
    (hist?.ranked ?? []).flatMap((entry) => {
      const field = byKey.get(entry.field)
      if (!field || !editable(field) || isFlag(field) || isEmpty(entry.value) || applied.has(entry.id)) return []
      return [{ entry, field, value: `${RECENT}${entry.id}` }]
    }),
  )
  /** The add list: the recent filters and "Show more" (above a rule, unless folded away), then the fields; those already
   *  filtered by dimmed, a boolean one with its switch. */
  const listOptions = $derived([
    ...(hist?.collapsed ? [] : (allRecent ? recents : recents.slice(0, recent))).map(({ entry, field, value }) => {
      const said = describe(entry, field)
      return {
        value,
        label: [field.label, entry.op, said].filter(Boolean).join(' '),
        parts: [field.label, entry.op, said],
        icon: field.icon,
        top: true,
        removable: true,
      }
    }),
    ...(!hist?.collapsed && recents.length > recent
      ? [{ value: MORE, label: allRecent ? 'Show fewer' : `Show ${recents.length - recent} more`, icon: allRecent ? 'caretUp' : 'caretDown', top: true, action: true, muted: true }]
      : []),
    ...fields.filter(editable).map((f) => {
      const on = filters.some((x) => x.field === f.key)
      return { value: f.key, label: f.label, icon: f.icon, muted: on && !isFlag(f), switch: isFlag(f) ? on : undefined }
    }),
  ])
  /** @param {any} v */
  const isEmpty = (v) => v == null || v === '' || (Array.isArray(v) && !v.length)
  /** @param {string} key */
  const find = (key) => rows.find((x) => x.field === key)
  /** @param {string} key */
  const isHeld = (key) => held?.filter.field === key

  /** @param {Filter[]} next */
  function commitAll(next) {
    filters = next
    onchange?.(next)
  }
  /** Counts a field's filter as used, if it has something to filter by. @param {string} key */
  function used(key) {
    const f = filters.find((x) => x.field === key)
    if (f && !isEmpty(f.value)) hist?.record(f)
  }
  /** The filter a chip's panel opened on, to tell whether it changed by the time it closes. */
  let openedAs = /** @type {string | null} */ (null)
  /** @param {string} key @param {boolean} open */
  function setOpen(key, open) {
    if (open) {
      const f = find(key)
      openedAs = f ? filterId(f) : null
      openKey = key
    } else if (openKey === key) openKey = null
  }
  /** @param {string} key */
  function chipClosed(key) {
    prune(key)
    const f = filters.find((x) => x.field === key)
    if (f && filterId(f) !== openedAs) used(key)
  }
  /** Flips a boolean field: on adds its filter, off takes it out. @param {Field} field */
  function flip(field) {
    if (filters.some((x) => x.field === field.key)) commitAll(filters.filter((x) => x.field !== field.key))
    else {
      commitAll([...filters, { field: field.key, op: operatorsOf(field)[0], value: true }])
      used(field.key)
    }
  }
  /** Applies a recent filter, in place of the field's own if it has one, and closes the add panel.
   *  @param {import('../../lib/filter-history.svelte.js').HistoryEntry} entry @param {Field} field */
  function applyRecent(entry, field) {
    const ops = operatorsOf(field)
    const next = { field: field.key, op: ops.includes(entry.op) ? entry.op : ops[0], value: $state.snapshot(entry.value) }
    if (isHeld(field.key)) held = null
    const at = filters.findIndex((x) => x.field === field.key)
    commitAll(at < 0 ? [...filters, next] : filters.map((x, i) => (i === at ? next : x)))
    used(field.key)
    closeAdding(true)
  }
  /** @param {string} key @param {Partial<Filter>} patch */
  function update(key, patch) {
    if (held && isHeld(key)) {
      const filter = { ...held.filter, ...patch }
      if (isEmpty(filter.value)) held = { ...held, filter }
      else {
        const at = Math.min(held.at, filters.length)
        held = null
        commitAll([...filters.slice(0, at), filter, ...filters.slice(at)])
      }
      return
    }
    const at = filters.findIndex((x) => x.field === key)
    if (at < 0) return
    const filter = { ...filters[at], ...patch }
    // Emptied in the add panel: the filter is only being made, so its chip goes (ticking again brings it back).
    if (isEmpty(filter.value) && adding?.key === key) commitAll(filters.filter((_, i) => i !== at))
    else if (isEmpty(filter.value)) {
      // Nothing to filter by: out of `filters` now, its chip held on the row until its panel closes.
      held = { at, filter }
      commitAll(filters.filter((_, i) => i !== at))
    } else commitAll(filters.map((x, i) => (i === at ? filter : x)))
  }
  /** Stores a value for a field: on its filter, or as a new one once there is something to filter by. @param {string} key @param {any} value */
  function put(key, value) {
    const field = byKey.get(key)
    if (!field) return
    if (find(key)) update(key, { value })
    else if (!isEmpty(value)) commitAll([...filters, { field: key, op: operatorsOf(field)[0], value }])
  }
  /** Drops a field's chip if it has nothing left to filter by. @param {string} key */
  function prune(key) {
    if (isHeld(key)) held = null
    const f = filters.find((x) => x.field === key)
    if (f && isEmpty(f.value)) commitAll(filters.filter((x) => x !== f))
  }
  /** @param {string} key */
  async function remove(key) {
    const at = rows.findIndex((x) => x.field === key)
    if (at < 0) return
    if (openKey === key) openKey = null
    if (isHeld(key)) held = null
    commitAll(filters.filter((x) => x.field !== key))
    await tick()
    const next = rows[at] ?? rows[at - 1]
    if (next) chips[next.field]?.focus()
    else addButton?.focus()
  }

  /** A pick in the add list: a recent filter, a boolean field to flip, or a field to edit. @param {string} value */
  function pickField(value) {
    if (value === MORE) {
      allRecent = !allRecent
      return
    }
    const hit = recents.find((r) => r.value === value)
    if (hit) return applyRecent(hit.entry, hit.field)
    const field = byKey.get(value)
    if (!field) return
    if (isFlag(field)) flip(field)
    else if (find(value)) {
      adding = null
      setOpen(value, true)
    } else adding = { key: value }
  }
  /** Leaves a field's value step: its filter counts as used, or goes if it has nothing to filter by. @param {string} key */
  function leaveStep(key) {
    used(key)
    prune(key)
  }
  /** @param {boolean} refocus */
  function closeAdding(refocus) {
    const key = adding?.key
    adding = null
    allRecent = false
    if (key) leaveStep(key)
    if (refocus) addButton?.focus()
  }
  /** From a field's value step back to the field list. @param {string} key */
  function backToFields(key) {
    leaveStep(key)
    adding = { key: null }
  }

  /** Attachment on the add panel's value step: it replaces the field list, which held the focus, so the focus moves into
   *  it (OptionList takes it itself; a text or custom editor doesn't). */
  const focusIn = (/** @type {HTMLElement} */ node) => {
    tick().then(() => {
      if (node.contains(document.activeElement)) return
      ;/** @type {HTMLElement | null} */ (node.querySelector('input, textarea, button:not(:disabled), [tabindex]:not([tabindex="-1"])'))?.focus()
    })
  }

  /** The add panel's value step's keydown: Backspace goes back to the field list, whichever editor has the focus,
   *  unless the editor used it (a TagInput removing a word) or it deletes text where it was pressed. An onkeydown
   *  attribute, not a listener of its own: Svelte delegates those, calling the editor's (inside) before this one, so
   *  `defaultPrevented` says whether the editor used the key.
   *  @param {() => void} back */
  const NOT_TYPED = new Set(['checkbox', 'radio', 'button', 'submit', 'reset', 'range', 'color', 'file', 'image'])
  const backOnBackspace = (back) => (/** @type {KeyboardEvent} */ e) => {
    if (e.key !== 'Backspace' || e.defaultPrevented || composing(e) || e.ctrlKey || e.metaKey || e.altKey) return
    const t = /** @type {HTMLElement} */ (e.target)
    if (t.isContentEditable && t.textContent) return
    // Text a Backspace would delete (a checkbox's or a button-like input's value isn't).
    if (t instanceof HTMLTextAreaElement && t.value && !t.readOnly) return
    if (t instanceof HTMLInputElement && t.value && !t.readOnly && !NOT_TYPED.has(t.type)) return
    e.preventDefault()
    back()
  }

  /** How many values a chip spells out in full, and how long their labels may be together; past either, a count. */
  const SPELLED = { count: 3, chars: 24 }
  /** @param {Filter} filter @param {Field} field */
  const presetOf = (filter, field) => (field.presets ?? datePresets()).find((p) => p.value === filter.value)
  /** @param {Filter} filter @param {Field} field */
  const isPreset = (filter, field) => !!presetOf(filter, field)
  /** A filter's value in words: a day, the labels of the values ticked, the words, or a custom field's format.
   *  @param {Filter} filter @param {Field} field */
  function describe(filter, field) {
    const kind = kindOf(field)
    const v = filter.value
    if (kind === 'date') {
      const day = relativeDay(v)
      return presetOf(filter, field)?.label ?? (day ? formatDay(day) : String(v ?? ''))
    }
    if (kind === 'boolean') return ''
    if (kind === 'options' && Array.isArray(v)) return v.map((x) => field.options?.find((o) => o.value === x)?.label ?? String(x)).join(', ')
    if (kind === 'text' && Array.isArray(v)) return v.join(', ')
    if (kind === 'custom' && field.format) return field.format(v)
    return String(v ?? '')
  }
</script>

{#snippet editor(/** @type {Field} */ field, /** @type {Filter} */ current, /** @type {() => void} */ close)}
  {#if kindOf(field) === 'options'}
    <OptionList
      value={current.value ?? []}
      options={field.options ?? []}
      label={field.label}
      search={field.search ?? 'auto'}
      onchange={(v) => put(field.key, v)}
    />
  {:else if kindOf(field) === 'date'}
    <DateFilter
      value={current.value}
      presets={field.presets ?? datePresets()}
      label={field.label}
      onpick={(v) => {
        put(field.key, v)
        close()
      }}
    />
  {:else if kindOf(field) === 'text'}
    <div class="words">
      <TagInput
        bind:value={() => (Array.isArray(current.value) ? current.value : []), (words) => put(field.key, words)}
        id="{uid}-{field.key}-words"
        label={field.label}
        hideLabel
        placeholder="Type a word, then Enter"
      />
    </div>
  {:else if panel}
    {@render panel({ filter: current, field, set: (v) => put(field.key, v), close })}
  {/if}
{/snippet}

{#snippet recentHead()}
  <!-- The history's clear() forgets them all, should an app want a button for it. -->
  <button
    type="button"
    class="recent-head"
    class:folded={hist?.collapsed}
    aria-expanded={!hist?.collapsed}
    onclick={() => hist?.setCollapsed(!hist.collapsed)}
  >
    <span>Recent</span>
    <Icon name="caretDown" size="sm" />
  </button>
{/snippet}

{#snippet recentText(/** @type {any} */ o)}
  {#if o.parts}{o.parts[0]} <span class="cond">{o.parts[1]}</span> {o.parts[2]}{:else}{o.label}{/if}
{/snippet}

{#snippet shown(/** @type {Filter} */ filter, /** @type {Field} */ field)}
  {#if kindOf(field) === 'options'}
    {@const on = (field.options ?? []).filter((o) => Array.isArray(filter.value) && filter.value.includes(o.value))}
    {#if on.length === 1}
      {#if on[0].icon}<span class="tone" data-tone={on[0].tone}><Icon name={on[0].icon} size="sm" /></span>{/if}
      <span class="text">{on[0].label}</span>
    {:else if on.length <= SPELLED.count && on.reduce((n, o) => n + o.label.length, 0) <= SPELLED.chars}
      <!-- Few and short: each value in full, with its icon. -->
      {#each on as o, i (o.value)}
        <span class="spelled">
          {#if o.icon}<span class="tone" data-tone={o.tone}><Icon name={o.icon} size="sm" /></span>{/if}
          <span class="text">{o.label}{#if i < on.length - 1},{/if}</span>
        </span>
      {/each}
    {:else}
      <span class="icons">
        {#each on.slice(0, 3) as o (o.value)}
          {#if o.icon}<span class="tone" data-tone={o.tone}><Icon name={o.icon} size="sm" /></span>{/if}
        {/each}
      </span>
      <span class="text"><span class="num">{on.length}</span> {field.plural ?? 'values'}</span>
    {/if}
  {:else if kindOf(field) === 'text'}
    {@const words = Array.isArray(filter.value) ? filter.value : [filter.value]}
    <span class="words-shown">
      {#each words.slice(0, 3) as word (word)}<span class="label-chip word">{word}</span>{/each}
      {#if words.length > 3}<span class="more">+{words.length - 3}</span>{/if}
    </span>
  {:else if kindOf(field) === 'custom' && summary}
    {@render summary({ filter, field })}
  {:else}
    <span class="text" class:num={kindOf(field) === 'date' && !isPreset(filter, field)}>{describe(filter, field)}</span>
  {/if}
{/snippet}

<div class={['filter-bar', className]} role="group" aria-label={label} {...rest}>
  {#each rows as filter (filter.field)}
    {@const field = byKey.get(filter.field)}
    {#if field}
      {#snippet editPanel(/** @type {{ close: () => void }} */ { close })}{@render editor(field, filter, close)}{/snippet}
      {#snippet chipValue()}<span class="summary">{@render shown(filter, field)}</span>{/snippet}
      <FilterChip
        bind:this={chips[filter.field]}
        field={{ label: field.label, icon: field.icon }}
        operator={filter.op}
        compact
        negated={filter.op !== operatorsOf(field)[0]}
        operators={operatorsOf(field)}
        onoperator={(op) => {
          update(field.key, { op })
          if (openKey !== field.key) used(field.key)
        }}
        onremove={() => remove(field.key)}
        bind:open={() => openKey === field.key, (v) => setOpen(field.key, v)}
        onclose={() => chipClosed(field.key)}
        panel={editable(field) && !isFlag(field) ? editPanel : undefined}
        value={isFlag(field) ? undefined : chipValue}
      />
    {/if}
  {/each}
  <Button
    iconOnly
    icon="funnel"
    label={addLabel}
    class="add"
    aria-haspopup="dialog"
    aria-expanded={!!adding}
    onclick={() => void (adding ? closeAdding(true) : (adding = { key: null }))}
    {@attach (node) => {
      addButton = node
    }}
  />
</div>

{#if adding && addButton}
  {@const field = adding.key ? byKey.get(adding.key) : null}
  <AnchoredPanel anchor={addButton} label={field ? field.label : addLabel} onclose={closeAdding}>
    {#if field}
      {#key field.key}
        <!-- svelte-ignore a11y_no_static_element_interactions -->
        <div class="step" onkeydown={backOnBackspace(() => backToFields(field.key))}>
          <div class="step-head">
            <!-- One button, chevron, icon and name: a press anywhere on it goes back. -->
            <button type="button" class="step-back" aria-label="Back to the fields" {@attach tooltip('Back to the fields')} onclick={() => backToFields(field.key)}>
              <span class="step-chevron"><Icon name="caretLeft" size="sm" /></span>
              {#if field.icon}<span class="step-icon"><Icon name={field.icon} size="sm" /></span>{/if}
              <span class="step-title">{field.label}</span>
            </button>
          </div>
          <div class="step-body" {@attach focusIn}>
            {@render editor(field, find(field.key) ?? { field: field.key, op: operatorsOf(field)[0], value: null }, () => closeAdding(true))}
          </div>
        </div>
      {/key}
    {:else}
      <OptionList
        options={listOptions}
        multiple={false}
        label={addLabel}
        placeholder="Filter by…"
        onpick={pickField}
        removeLabel="Forget"
        onremove={(o) => {
          const hit = recents.find((r) => r.value === o.value)
          if (hit) hist?.remove(hit.entry.id)
        }}
        head={recents.length ? recentHead : undefined}
        text={recentText}
      />
    {/if}
  </AnchoredPanel>
{/if}

<style>
  /* Chrome, not content: a press or drag across the row doesn't select its words. */
  .filter-bar {
    user-select: none;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2);
    min-width: 0;
  }
  .step,
  .step-body {
    display: flex;
    flex-direction: column;
    min-height: 0;
  }
  /* Which field is being added, with the way back to the list: a hairline under it from edge to edge. */
  .step-head {
    display: flex;
    min-height: 36px;
    padding: var(--space-1);
    border-bottom: 1px solid var(--line);
    /* Chrome, not content (the panel sits outside the row's own user-select: none). */
    user-select: none;
  }
  /* The whole header is the way back: the chevron, the field's icon and its name, muted (the values under it lead). */
  .step-back {
    display: flex;
    flex: 1;
    align-items: center;
    gap: var(--space-1);
    min-width: 0;
    min-height: 28px;
    padding: 0 var(--space-2) 0 var(--space-1);
    border: 0;
    border-radius: var(--r-sm);
    background: none;
    color: var(--muted);
    font: var(--w-semibold) 13px var(--font-body);
    text-align: start;
    cursor: pointer;
    transition: background-color var(--dur) var(--ease-out);
  }
  .step-back:hover {
    background: var(--control-2);
  }
  .step-back:active {
    background: var(--control-3);
  }
  .step-chevron {
    display: inline-flex;
    flex: none;
    justify-content: center;
    width: 16px;
  }
  /* As far from its name as a row's icon is from its label in the lists (OptionList's --space-2). */
  .step-icon {
    display: inline-flex;
    flex: none;
    margin-inline: 2px calc(var(--space-2) - var(--space-1));
  }
  .step-title {
    min-width: 0;
    overflow: clip;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  /* The recent filters' heading, which folds them away: muted while open (the filters under it lead), clear once folded
     (as Collapsible's header), its chevron turned to say which. */
  .recent-head {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    width: 100%;
    min-height: 28px;
    padding: 0 8px;
    border: 0;
    border-radius: var(--r-sm);
    background: none;
    color: var(--muted);
    font: var(--w-medium) 12px var(--font-body);
    text-align: start;
    cursor: pointer;
  }
  .recent-head:hover {
    background: var(--control-2);
  }
  /* Folded, nothing under it but the fields: a rule under it, across the list (through its padding, as the one between
     the recent filters and the fields). */
  .recent-head.folded {
    position: relative;
    margin-bottom: 9px;
    color: var(--fg);
  }
  .recent-head.folded::after {
    content: '';
    position: absolute;
    inset: auto -4px -5px;
    height: 1px;
    background: var(--line);
  }
  .recent-head :global(.icon) {
    color: var(--muted);
    transition: rotate var(--dur) var(--ease-out);
  }
  .recent-head.folded :global(.icon) {
    rotate: -90deg;
  }
  /* A recent filter's condition, set back between its field and its value. */
  .cond {
    color: var(--muted);
  }
  .words {
    width: 280px;
    max-width: 100%;
    padding: var(--space-2);
  }
  /* Within the chip's value, as wide as it lets it be: its text is what gives way. */
  .summary {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    max-width: 100%;
    vertical-align: top;
  }
  .text {
    min-width: 0;
    overflow: clip;
    text-overflow: ellipsis;
  }
  .num {
    font-family: var(--font-data);
    font-variant-numeric: tabular-nums;
  }
  .words-shown {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    min-width: 0;
  }
  /* The .label-chip atom, a size down to sit inside the chip's 26px row. */
  .word {
    min-height: 18px;
    padding: 0 6px;
    color: var(--fg-2);
  }
  .more {
    color: var(--muted);
    font-family: var(--font-data);
    font-variant-numeric: tabular-nums;
  }
  .icons {
    display: inline-flex;
    gap: 2px;
  }
  /* A value spelled out among others: its icon close to it, the next value a space further on (the summary's gap). */
  .spelled {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-width: 0;
  }
  .tone {
    display: inline-flex;
    color: var(--muted);
  }
  .tone[data-tone] {
    color: var(--tone);
  }
</style>
