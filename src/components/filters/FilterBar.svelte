<script>
  /**
   * A row of filters drawn from data (Linear's view filters): one FilterChip per filter, then a funnel button that adds
   * one. The button lists the fields (with a search field when there are many); picking one shows its value editor in
   * the same panel, and the filter joins the row as soon as it has a value. A field already filtered opens its chip
   * instead, so each field has one filter. Unticking every value of a filter removes it as its panel closes.
   *
   *   <FilterBar bind:filters fields={[
   *     { key: 'status', label: 'Status', icon: 'circleDashed', options: [{ value: 'open', label: 'Open', icon: 'checkCircle', tone: 'success', hint: '12 items' }, …], plural: 'statuses' },
   *     { key: 'created', label: 'Created', icon: 'calendar', kind: 'date' },
   *     { key: 'words', label: 'Keywords', icon: 'search', kind: 'text' },
   *   ]} />
   *
   * fields: [{ key, label, icon?, kind?, options?, operators?, plural?, presets?, search? }]. kind:
   *   'options' (the default): ticks values of `options` (OptionList's shape: { value, label, icon?, tone?, hint? });
   *     the filter's value is an array. The chip shows one value with its icon, or several as their icons and
   *     "3 {plural}" (default "values"). Conditions default to ['is', 'is not']. `search` as OptionList's.
   *   'date': a day from `presets` ([{ value, label }], default datePresets() in lib/dates.js: 1 day ago … 3 months ago)
   *     or a calendar; the value is a relative id ('-3d') or an ISO day, relativeDay(value) turns either into a day.
   *     Conditions default to ['after', 'before'].
   *   'text': words typed into a TagInput (Enter or a comma adds one); the value is an array of strings, applied as each
   *     word is added. The chip shows them as small label chips (three, then "+2"). Conditions default to
   *     ['contains', 'does not contain'].
   *   'custom': the `panel` snippet edits the value and `summary` draws it on the chip. Conditions default to ['is'].
   *     Without a `panel` snippet a custom field can't be edited, so the add button leaves it out.
   * operators: the conditions to choose from, the first being where a new filter starts.
   * filters (bindable): [{ field, op, value }], field a key of `fields`. The app applies them; this only edits them.
   * onchange(filters): after every edit. label: the row's accessible name ("Filters"). addLabel: the button's ("Add filter").
   * panel: snippet ({ filter, field, set, close }) for a custom field's editor: set(value) stores a value, close() closes.
   * summary: snippet ({ filter, field }) drawing a custom field's value on its chip (default: the value as text).
   * Keyboard: the chips' parts and the add button are in the tab order. In the add panel, Backspace in an empty search
   * goes from a field's values back to the field list. Removing a filter moves the focus to the next one, else the button.
   * Other attributes (class…) and attachments go to the row.
   */
  import { tick } from 'svelte'
  import Icon from '../Icon.svelte'
  import FilterChip from './FilterChip.svelte'
  import OptionList from './OptionList.svelte'
  import DateFilter from './DateFilter.svelte'
  import TagInput from '../inputs/TagInput.svelte'
  import Panel from './Panel.svelte'
  import { tooltip } from '../../lib/tooltip.js'
  import { datePresets, formatDay, relativeDay } from '../../lib/dates.js'

  /**
   * @typedef {{ value: any, label: string, icon?: string, tone?: string, hint?: string }} Option
   * @typedef {{ key: string, label: string, icon?: string, kind?: 'options' | 'date' | 'text' | 'custom', options?: Option[], operators?: string[], plural?: string, presets?: { value: string, label: string }[], search?: 'auto' | boolean }} Field
   * @typedef {{ field: string, op: string, value: any }} Filter
   * @typedef {object} Props
   * @property {Field[]} fields
   * @property {Filter[]} [filters] bindable
   * @property {(filters: Filter[]) => void} [onchange]
   * @property {string} [label]
   * @property {string} [addLabel]
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
    panel,
    summary,
    class: className,
    ...rest
  } = $props()

  const uid = $props.id()
  const anchor = `--filter-add-${uid}`
  /** @type {HTMLButtonElement | undefined} */
  let addButton = $state()
  /** @type {Record<string, { focus: () => void }>} */
  const chips = $state({})
  /** The field whose chip has its panel open. */
  let openKey = $state(/** @type {string | null} */ (null))
  /** The add panel: closed, listing the fields, or showing one field's values. */
  let adding = $state(/** @type {null | { key: string | null }} */ (null))

  const byKey = $derived(new Map(fields.map((f) => [f.key, f])))
  /** @param {Field} f */
  const kindOf = (f) => f.kind ?? 'options'
  /** Whether a field has something to edit it with: a custom one needs the `panel` snippet. @param {Field} f */
  const editable = (f) => kindOf(f) !== 'custom' || !!panel
  const fieldOptions = $derived(fields.filter(editable).map((f) => ({ value: f.key, label: f.label, icon: f.icon })))
  /** @param {Field} f */
  const operatorsOf = (f) =>
    f.operators ?? { options: ['is', 'is not'], date: ['after', 'before'], text: ['contains', 'does not contain'], custom: ['is'] }[kindOf(f)]
  /** @param {any} v */
  const isEmpty = (v) => v == null || v === '' || (Array.isArray(v) && !v.length)
  /** @param {string} key */
  const find = (key) => filters.find((x) => x.field === key)

  /** @param {Filter[]} next */
  function commitAll(next) {
    filters = next
    onchange?.(next)
  }
  /** @param {string} key @param {Partial<Filter>} patch */
  function update(key, patch) {
    commitAll(filters.map((x) => (x.field === key ? { ...x, ...patch } : x)))
  }
  /** Stores a value for a field: on its filter, or as a new one once there is something to filter by. @param {string} key @param {any} value */
  function put(key, value) {
    const field = byKey.get(key)
    if (!field) return
    if (find(key)) update(key, { value })
    else if (!isEmpty(value)) commitAll([...filters, { field: key, op: operatorsOf(field)[0], value }])
  }
  /** Drops a field's filter if it has nothing left to filter by. @param {string} key */
  function prune(key) {
    const f = find(key)
    if (f && isEmpty(f.value)) commitAll(filters.filter((x) => x !== f))
  }
  /** @param {string} key */
  async function remove(key) {
    const at = filters.findIndex((x) => x.field === key)
    if (at < 0) return
    if (openKey === key) openKey = null
    commitAll(filters.filter((x) => x.field !== key))
    await tick()
    const next = filters[at] ?? filters[at - 1]
    if (next) chips[next.field]?.focus()
    else addButton?.focus()
  }

  /** @param {string} key */
  function pickField(key) {
    if (find(key)) {
      adding = null
      openKey = key
    } else adding = { key }
  }
  /** @param {boolean} refocus */
  function closeAdding(refocus) {
    const key = adding?.key
    adding = null
    if (key) prune(key)
    if (refocus) addButton?.focus()
  }

  /** Attachment on the add panel's value step: it replaces the field list, which held the focus, so the focus moves into
   *  it (OptionList takes it itself; a text or custom editor doesn't). */
  const focusIn = (/** @type {HTMLElement} */ node) => {
    tick().then(() => {
      if (node.contains(document.activeElement)) return
      ;/** @type {HTMLElement | null} */ (node.querySelector('input, textarea, button:not(:disabled), [tabindex]:not([tabindex="-1"])'))?.focus()
    })
  }

  /** @param {Filter} filter @param {Field} field */
  const presetOf = (filter, field) => (field.presets ?? datePresets()).find((p) => p.value === filter.value)
  /** @param {Filter} filter @param {Field} field */
  const isPreset = (filter, field) => !!presetOf(filter, field)
  /** @param {Filter} filter @param {Field} field */
  function describe(filter, field) {
    if (kindOf(field) === 'date') {
      const day = relativeDay(filter.value)
      return presetOf(filter, field)?.label ?? (day ? formatDay(day) : String(filter.value ?? ''))
    }
    return String(filter.value ?? '')
  }
</script>

{#snippet editor(/** @type {Field} */ field, /** @type {Filter} */ current, /** @type {() => void} */ close, /** @type {(() => void) | undefined} */ back)}
  {#if kindOf(field) === 'options'}
    <OptionList
      value={current.value ?? []}
      options={field.options ?? []}
      label={field.label}
      search={field.search ?? 'auto'}
      onchange={(v) => put(field.key, v)}
      onback={back}
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

{#snippet shown(/** @type {Filter} */ filter, /** @type {Field} */ field)}
  {#if kindOf(field) === 'options'}
    {@const on = (field.options ?? []).filter((o) => Array.isArray(filter.value) && filter.value.includes(o.value))}
    {#if on.length === 1}
      {#if on[0].icon}<span class="tone" data-tone={on[0].tone}><Icon name={on[0].icon} size="sm" /></span>{/if}
      <span class="text">{on[0].label}</span>
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
  {#each filters as filter (filter.field)}
    {@const field = byKey.get(filter.field)}
    {#if field}
      {#snippet editPanel(/** @type {{ close: () => void }} */ { close })}{@render editor(field, filter, close, undefined)}{/snippet}
      <FilterChip
        bind:this={chips[filter.field]}
        field={{ label: field.label, icon: field.icon }}
        operator={filter.op}
        operators={operatorsOf(field)}
        onoperator={(op) => update(field.key, { op })}
        onremove={() => remove(field.key)}
        bind:open={() => openKey === field.key, (v) => (openKey = v ? field.key : openKey === field.key ? null : openKey)}
        onclose={() => prune(field.key)}
        panel={editable(field) ? editPanel : undefined}
      >
        {#snippet value()}<span class="summary">{@render shown(filter, field)}</span>{/snippet}
      </FilterChip>
    {/if}
  {/each}
  <button
    bind:this={addButton}
    type="button"
    class="icon-btn add"
    style:anchor-name={anchor}
    aria-label={addLabel}
    aria-haspopup="dialog"
    aria-expanded={!!adding}
    {@attach tooltip(addLabel)}
    onclick={() => (adding ? closeAdding(true) : (adding = { key: null }))}
  >
    <Icon name="funnel" />
  </button>
</div>

{#if adding && addButton}
  {@const field = adding.key ? byKey.get(adding.key) : null}
  <Panel anchor={addButton} name={anchor} label={field ? field.label : addLabel} onclose={closeAdding}>
    {#if field}
      {#key field.key}
        <div class="step" {@attach focusIn}>
          {@render editor(field, find(field.key) ?? { field: field.key, op: operatorsOf(field)[0], value: null }, () => closeAdding(true), () => (adding = { key: null }))}
        </div>
      {/key}
    {:else}
      <OptionList options={fieldOptions} multiple={false} label={addLabel} placeholder="Filter by…" onpick={pickField} />
    {/if}
  </Panel>
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
  .step {
    display: flex;
    flex-direction: column;
    min-height: 0;
  }
  .words {
    width: 280px;
    max-width: 100%;
    padding: var(--space-2);
  }
  .summary {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
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
  .tone {
    display: inline-flex;
    color: var(--muted);
  }
  .tone[data-tone] {
    color: var(--tone);
  }
</style>
