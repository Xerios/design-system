<script>
  /**
   * Private to filters/ (not exported): FilterChip's condition, a select drawn as one of the chip's segments, its text
   * and no arrow. Where the browser can style its list (appearance: base-select), the list opens over the chip with
   * the chosen condition on top of the segment's own text, as a pop-up menu does, so moving to another is the shortest
   * reach; it is the context menu's surface in the chip's type, and fades in and out. Elsewhere the native list opens.
   *
   *   <ConditionSelect id="{uid}-op" label="Status condition" value={operator} options={operators} onchange={(op) => …} />
   *
   * value: the chosen condition. options: the conditions to choose from. label: its accessible name. onchange(op).
   * focus(): puts the focus on it. Other attributes (id…) and attachments go to the <select>.
   * Keyboard: a select's: Enter, Space or the arrows open the list, the arrows move in it, Enter picks, Esc closes.
   */
  import { tooltip } from '../../lib/tooltip.js'

  /**
   * @typedef {object} Props
   * @property {string} value
   * @property {string[]} options
   * @property {string} label
   * @property {(op: string) => void} [onchange]
   */
  /** @type {Props & Omit<import('svelte/elements').HTMLSelectAttributes, keyof Props>} */
  let { value, options, label, onchange, class: className, ...rest } = $props()

  const uid = $props.id()
  /** @type {HTMLSelectElement | undefined} */
  let select = $state()
  /** Where the chosen condition sits in the list, taken just before it opens and held while it is open and closing, so
      a pick doesn't move the list as it fades out. */
  let chosen = $state(0)
  const holdChosen = () => (chosen = Math.max(0, options.indexOf(value)))

  export function focus() {
    select?.focus()
  }
</script>

<select
  bind:this={select}
  class={['condition-select', className]}
  aria-label={label}
  {...rest}
  style:--chosen={chosen}
  style:--condition-anchor="--{uid}-condition"
  {value}
  {@attach tooltip('Change condition')}
  onpointerdown={holdChosen}
  onkeydown={holdChosen}
  onchange={(e) => onchange?.(e.currentTarget.value)}
>
  {#each options as op (op)}
    <option class={op === value ? 'holds' : 'keys'} value={op}>{op}</option>
  {/each}
</select>

<style>
  /* A segment of the chip, as its buttons are: as readable as the field name beside it; hovering changes only the fill. */
  .condition-select {
    anchor-name: var(--condition-anchor);
    appearance: none;
    flex: none;
    display: inline-flex;
    align-items: center;
    min-width: 0;
    min-height: 0;
    margin: 0;
    padding: 0 var(--space-2);
    border: 0;
    border-radius: 0;
    background: none;
    color: var(--fg-2);
    font: inherit;
    cursor: pointer;
    transition:
      background-color var(--dur) var(--ease-out),
      color var(--dur) var(--ease-out);
  }
  .condition-select:hover {
    background: var(--control-3);
  }
  .condition-select:active,
  .condition-select:open {
    background: var(--control-4);
  }
  /* Inside the pill, so the next segment doesn't cover the ring. */
  .condition-select:focus-visible {
    outline-offset: -2px;
  }

  /* --chosen (set on the select): the chosen condition's index, held while open. */
  @supports (appearance: base-select) {
    .condition-select,
    .condition-select::picker(select) {
      appearance: base-select;
    }
    .condition-select::picker-icon {
      display: none;
    }
    .condition-select::picker(select) {
      --option-h: 28px;
      /* Its own border and padding, so its options' text lands on the segment's. */
      --picker-edge: calc(var(--space-1) + 1px);
      position-anchor: var(--condition-anchor);
      position-area: none;
      position-try-fallbacks: none;
      inset: auto;
      top: max(var(--space-1), calc(anchor(center) - var(--option-h) * (var(--chosen, 0) + 0.5) - var(--picker-edge)));
      left: calc(anchor(left) - var(--picker-edge));
      margin: 0;
      min-width: calc(anchor-size(width) + var(--picker-edge) * 2);
      max-height: calc(100dvh - var(--space-1) * 2);
      padding: var(--space-1);
      border: 1px solid transparent;
      border-radius: var(--r-lg);
      background:
        linear-gradient(var(--elevated), var(--elevated)) padding-box,
        var(--edge-grad-float);
      box-shadow: var(--shadow);
      color: var(--fg);
    }
    /* Fades in as it opens and out as it closes (a pick included), held on the top layer until the fade ends. Without
       motion it simply appears and goes (base.css's reduced-motion rule doesn't reach this pseudo-element). */
    @media (prefers-reduced-motion: no-preference) {
      .condition-select::picker(select) {
        opacity: 0;
        transition:
          opacity var(--dur-exit) var(--ease-exit),
          display var(--dur-exit) allow-discrete,
          overlay var(--dur-exit) allow-discrete;
      }
      .condition-select:open::picker(select) {
        opacity: 1;
        transition-duration: var(--dur-enter);
        transition-timing-function: var(--ease-enter);
      }
      @starting-style {
        .condition-select:open::picker(select) {
          opacity: 0;
        }
      }
    }
    option {
      box-sizing: border-box;
      display: flex;
      align-items: center;
      min-height: var(--option-h);
      padding: 0 var(--space-2);
      border-radius: var(--r-sm);
      background: none;
      color: var(--fg);
      font: var(--w-medium) 12px/14px var(--font-body);
      white-space: nowrap;
      cursor: pointer;
    }
    option::checkmark {
      display: none;
    }
    /* The chosen condition is solid brand, as Select's chosen option. Under the pointer or the keyboard it is held, and
       any other the keyboard is on keyed (css/atoms.css: .holds, .keys): a gap of the list's surface just inside the
       edge. The others take a fill under the pointer. */
    option:checked {
      background: var(--brand);
      color: var(--accent-ink);
    }
    option:not(:checked):hover {
      background: var(--control-3);
    }
    option:not(:checked):active {
      background: var(--control-4);
    }
    @media (forced-colors: active) {
      option:checked {
        background: Highlight;
        color: HighlightText;
      }
    }
  }
</style>
