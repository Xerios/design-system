<script>
  /**
   * A span between two of a given list of dates, picked from that list: a compact range picker for when only some
   * days or moments can be chosen, at irregular times (say, when a job ran). No calendar and no typing.
   *
   *   <DateRangeSelect bind:value={span} dates={runs} id="runs" label="Runs" />
   *
   * value (bindable): [from, to], each one of `dates`, from ≤ to (equal for one date); ['', ''] for none.
   * dates: ISO days ('2026-11-18') or ISO moments ('2026-11-18T14:30:00Z'), in any order; they are ordered as text, so
   * keep to one form and one offset. The list shows them newest first as DD/MM/YYYY, moments with the time in the user's
   * time zone. The button shows a moment's time only where the day alone is ambiguous: both ends on the same day, or
   * another date on that end's day. The year shows once, at the end, when both ends are in the same past year; not at
   * all when it is this year; on both ends when they differ.
   * shortcuts: ready-made spans above the list, [{ label, range(dates) }], range given the dates oldest first and
   * returning [from, to], or null to show it disabled. Default: Most recent, Last 3, This month (dateListShortcuts in
   * lib/dates.js); [] for none. One press sets it and closes.
   * placeholder: the button's text with no value. error, info, hideLabel, disabled: as Select's.
   * The button opens a panel with the shortcuts and the list. The first press in the list starts a new span, the second
   * ends it (either way round; the same date again picks it alone) and closes; the dates between are tinted as the
   * pointer or the keyboard moves. Closing before the second press keeps the old span. A hint above the list says which
   * press is next, read out as it changes.
   * Keyboard: ArrowDown, ArrowUp, Enter or Space on the button opens the panel with the focus on the list. In the list,
   * ArrowUp / ArrowDown move a date, PageUp / PageDown ten, Home / End to the newest / oldest, Enter or Space picks.
   * Esc closes; Tab and Shift+Tab move between the shortcuts and the list, and close the panel past either end.
   * Other attributes and attachments go to the button.
   */
  import { tick } from 'svelte'
  import Icon from '../Icon.svelte'
  import ErrorMessage from '../ErrorMessage.svelte'
  import InfoTip from '../InfoTip.svelte'
  import RangeShortcuts from './RangeShortcuts.svelte'
  import { invalid } from '../../lib/invalid.js'
  import { topLayer } from '../../lib/dom.js'
  import { pop } from '../../lib/motion.js'
  import { compare, dateListShortcuts, dayOf, formatWhen, today } from '../../lib/dates.js'

  /**
   * @typedef {object} Props
   * @property {[string, string]} [value] bindable
   * @property {string[]} dates
   * @property {string} id
   * @property {string} label
   * @property {{ label: string, range: (dates: string[]) => [string, string] | null }[]} [shortcuts]
   * @property {string} [placeholder]
   * @property {boolean} [hideLabel]
   * @property {string} [error]
   * @property {string} [info]
   * @property {boolean} [disabled]
   */
  /** @type {Props & Omit<import('svelte/elements').HTMLButtonAttributes, keyof Props>} */
  let {
    value = $bindable(['', '']),
    dates,
    id,
    label,
    shortcuts = dateListShortcuts(),
    placeholder = 'Choose dates',
    hideLabel = false,
    error = '',
    info = '',
    disabled = false,
    class: className,
    ...rest
  } = $props()

  const uid = $props.id()
  const anchor = `--date-list-${uid}`
  /** @type {HTMLButtonElement | undefined} */
  let button = $state()
  /** @type {HTMLDivElement | undefined} */
  let sheet = $state()
  /** @type {HTMLUListElement | undefined} */
  let list = $state()
  let open = $state(false)
  /** The index in `newest` that holds the keyboard. */
  let active = $state(0)
  /** The first date of a span being chosen, until the second press. */
  let first = $state(/** @type {string | null} */ (null))
  /** The date under the pointer or the keyboard while choosing the second. */
  let pointed = $state(/** @type {string | null} */ (null))

  const oldest = $derived([...new Set(dates)].toSorted(compare))
  const newest = $derived(oldest.toReversed())
  const presets = $derived(shortcuts.map(({ label: name, range }) => ({ label: name, range: range(oldest) })))
  /** The span drawn in the list: the one being chosen, else the value. */
  const span = $derived(
    /** @type {[string, string] | null} */ (first ? [first, pointed ?? first].toSorted(compare) : value[0] && value[1] ? [value[0], value[1]] : null),
  )
  /** How many dates fall on each (local) day. */
  const perDay = $derived(oldest.reduce((counts, when) => counts.set(dayOf(when), (counts.get(dayOf(when)) ?? 0) + 1), new Map()))
  /**
   * One end of the value: its time only when the day alone doesn't tell it apart; its year unless both ends are in
   * this year, and only on the last end when both are in the same year.
   * @param {string} end @param {string} other @param {boolean} last
   */
  function formatEnd(end, other, last) {
    const year = dayOf(end).slice(0, 4)
    const sameYear = year === dayOf(other).slice(0, 4)
    return formatWhen(end, {
      time: dayOf(end) === dayOf(other) || perDay.get(dayOf(end)) > 1,
      year: !sameYear || (last && year !== today().slice(0, 4)),
    })
  }
  const shown = $derived(value[0] && value[1] ? (value[0] === value[1] ? formatEnd(value[0], value[0], true) : `${formatEnd(value[0], value[1], false)} – ${formatEnd(value[1], value[0], true)}`) : '')
  const empty = $derived(!newest.length)

  async function show() {
    if (disabled || empty) return
    first = null
    pointed = null
    active = Math.max(0, newest.indexOf(value[1]))
    open = true
    await tick()
    const el = /** @type {HTMLElement | null | undefined} */ (list?.querySelector(`[data-i="${active}"]`))
    if (list && el) list.scrollTop = el.offsetTop - (list.clientHeight - el.offsetHeight) / 2
    list?.focus()
  }
  /** Closes the panel; with refocus, the focus goes back on the button (at once, so a Tab moves on from there). */
  function close(refocus = true) {
    open = false
    if (refocus) button?.focus()
  }

  /** @param {[string, string]} range */
  function choose(range) {
    value = range
    first = null
    close()
  }
  /** @param {string} day */
  function pick(day) {
    if (!first) {
      first = day
      pointed = day
      return
    }
    choose(/** @type {[string, string]} */ ([first, day].toSorted(compare)))
  }

  /** @param {number} i */
  function moveTo(i) {
    active = Math.min(Math.max(i, 0), newest.length - 1)
    if (first) pointed = newest[active]
    list?.querySelector(`[data-i="${active}"]`)?.scrollIntoView({ block: 'nearest' })
  }

  /** @param {KeyboardEvent} e */
  function onButtonKey(e) {
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
      e.preventDefault()
      void show()
    }
  }
  /** @param {KeyboardEvent} e */
  function onListKey(e) {
    const to = { ArrowDown: active + 1, ArrowUp: active - 1, PageDown: active + 10, PageUp: active - 10, Home: 0, End: newest.length - 1 }[e.key]
    if (to !== undefined) moveTo(to)
    else if (e.key === 'Enter' || e.key === ' ') pick(newest[active])
    else return
    e.preventDefault()
  }
  /** Esc closes; tabbing past either end of the panel closes it from the button, so the focus moves on from there.
   *  @param {KeyboardEvent} e */
  function onPanelKey(e) {
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      close()
    } else if (e.key === 'Tab' && sheet) {
      const stops = [...sheet.querySelectorAll('button:not(:disabled), [role="listbox"]')]
      if (e.target === (e.shiftKey ? stops[0] : stops.at(-1))) close()
    }
  }
  /** A press outside the button and the panel closes it. The label counts as the button. @param {PointerEvent} e */
  function outside(e) {
    const target = /** @type {Element} */ (e.target)
    if (open && !button?.contains(target) && !sheet?.contains(target) && !target.closest?.(`label[for="${id}"]`)) close(false)
  }
</script>

<svelte:document onpointerdowncapture={outside} />

<div class="field">
  {#snippet fieldLabel()}<label for={id} class="field-label" class:sr-only={hideLabel} id="{id}-label">{label}</label>{/snippet}
  {#if info}
    <div class="field-head">{@render fieldLabel()}<InfoTip lines={[{ text: info }]} label="About {label}" /></div>
  {:else}
    {@render fieldLabel()}
  {/if}
  <button
    {id}
    bind:this={button}
    type="button"
    class={['trigger', className]}
    style:anchor-name={anchor}
    {...rest}
    disabled={disabled || empty}
    aria-haspopup="dialog"
    aria-expanded={open}
    aria-labelledby="{id}-label {id}"
    {@attach invalid(error && `${id}-error`)}
    onclick={() => (open ? close() : show())}
    onkeydown={onButtonKey}
  >
    <span class="value" class:placeholder={!shown}>{shown || (empty ? 'No dates' : placeholder)}</span>
    {#if !disabled && !empty}<span class="caret" class:flip={open}><Icon name="caretDown" size="sm" /></span>{/if}
  </button>
  {#if open}
    <div
      bind:this={sheet}
      class="panel"
      role="dialog"
      aria-label={label}
      tabindex="-1"
      data-floating
      style:position-anchor={anchor}
      {@attach topLayer(button)}
      transition:pop={{ from: button }}
      onkeydown={onPanelKey}
    >
      {#if shortcuts.length}<RangeShortcuts items={presets} {value} onpick={choose} />{/if}
      <p class="hint small muted" id="{id}-hint" aria-live="polite">{first ? `From ${formatWhen(first)}: pick the last date` : 'Pick the first date'}</p>
      <!-- Keyboard is handled on the listbox (aria-activedescendant pattern); options only take pointer input. -->
      <ul
        bind:this={list}
        class="list"
        role="listbox"
        tabindex="0"
        aria-multiselectable="true"
        aria-labelledby="{id}-label"
        aria-describedby="{id}-hint"
        aria-activedescendant="{id}-opt-{active}"
        onkeydown={onListKey}
      >
        {#each newest as day, i (day)}
          {@const inSpan = !!span && day >= span[0] && day <= span[1]}
          {@const edge = !!span && (day === span[0] || day === span[1])}
          <!-- svelte-ignore a11y_click_events_have_key_events -->
          <li
            id="{id}-opt-{i}"
            data-i={i}
            role="option"
            aria-selected={inSpan}
            class:active={i === active}
            class:edge
            class:between={inSpan && !edge}
            onpointerenter={() => ((active = i), first && (pointed = day))}
            onclick={() => pick(day)}
          >
            {formatWhen(day)}
          </li>
        {/each}
      </ul>
    </div>
  {/if}
  <ErrorMessage floating id="{id}-error" message={error} ondismiss={() => button?.focus()} />
</div>

<style>
  .field {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
  }
  /* Raised like Select's button: pressed to open a list. */
  .trigger {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    min-width: 120px;
    max-width: 100%;
    min-height: 32px;
    padding: 0 8px 0 10px;
    border: 1px solid var(--line-strong);
    border-radius: var(--r);
    background: var(--fill-2);
    color: var(--fg-2);
    font: 400 13px var(--font-data);
    font-variant-numeric: tabular-nums;
    text-align: left;
    cursor: pointer;
    --raise: var(--shadow-btn);
    box-shadow: var(--raise);
    transition:
      background-color var(--dur) var(--ease-out),
      border-color var(--dur) var(--ease-out),
      box-shadow var(--dur) var(--ease-out);
  }
  .trigger:hover:not(:disabled) {
    background: var(--fill-3);
    color: var(--fg);
  }
  .trigger[aria-expanded='true'] {
    background: var(--fill-4);
    color: var(--fg);
    box-shadow: none;
  }
  .trigger:disabled {
    --raise: 0 0 transparent;
    background: none;
    border-color: var(--line);
    cursor: default;
  }
  .trigger:focus-visible {
    border-color: var(--accent-line);
    box-shadow: var(--raise), var(--ring);
    outline: none;
  }
  .trigger:global([aria-invalid='true']) {
    border-color: var(--danger);
  }
  .value {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .placeholder {
    font-family: var(--font-body);
    color: var(--muted);
  }
  .caret {
    flex: none;
    display: inline-flex;
    color: var(--muted);
    transition: rotate var(--dur) var(--ease-out);
  }
  .caret.flip {
    rotate: 180deg;
  }
  /* Anchored under the button, flipping above or to its other side when there's no room. */
  /* A picker: its hint and dates are chrome, not text to copy (base.css). */
  .panel {
    user-select: none;
    -webkit-user-select: none;
    position: fixed;
    z-index: calc(var(--z-overlay) + 1);
    position-area: block-end span-inline-end;
    position-try-fallbacks:
      flip-block,
      flip-inline,
      flip-block flip-inline;
    position-visibility: anchors-visible;
    display: grid;
    gap: var(--space-2);
    width: max-content;
    min-width: max(anchor-size(width), 224px);
    max-width: calc(100dvw - 32px);
    margin-block: 4px;
    padding: var(--space-2);
    border: 1px solid var(--line-float);
    border-radius: var(--r-lg);
    background: var(--elevated);
    box-shadow: var(--shadow);
    color: var(--fg);
  }
  .hint {
    margin: 0;
    padding-inline: var(--space-2);
  }
  .list {
    max-height: min(264px, calc(100dvh - 160px));
    margin: 0;
    padding: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    list-style: none;
    border-radius: var(--r);
  }
  .list:focus {
    outline: none;
  }
  li {
    display: flex;
    align-items: center;
    min-height: 30px;
    padding: 0 var(--space-2);
    border-radius: var(--r);
    color: var(--fg-2);
    font: var(--w-medium) 12px var(--font-data);
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    cursor: pointer;
  }
  li:hover:not(.edge) {
    background: var(--fill-3);
    color: var(--fg);
  }
  .between {
    border-radius: 0;
    background: var(--accent-soft);
    color: var(--fg);
  }
  .edge {
    background: var(--brand);
    color: var(--accent-ink);
  }
  .list:focus-visible li.active {
    outline: 2px solid var(--accent);
    outline-offset: -2px;
  }
  @media (pointer: coarse) {
    li {
      min-height: 44px;
    }
  }
  @media (forced-colors: active) {
    .panel {
      border-color: CanvasText;
    }
    .edge {
      background: Highlight;
      color: HighlightText;
    }
    .between {
      outline: 1px solid Highlight;
      outline-offset: -1px;
    }
  }
</style>
