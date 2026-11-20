<script>
  /**
   * Collapsible card: a plain hairline card (like .data-table) whose 40px header toggles the body and fills on hover
   * like a table row. A hairline separates the header from the open body. Built on <details>, so it works without JS
   * and Find-in-page opens it.
   *
   * Header, left to right: chevron, `lead` (e.g. a status icon), `title`, `meta` (e.g. a phase), then `end` pushed
   * to the right (e.g. timings). `actions` sits in the top-right corner outside the toggle (e.g. a ⋯ menu).
   * `variant`: 'default', 'active' (indigo border, for something in progress) or 'empty' (dashed, muted title).
   * `dimmed` fades the whole card (pending or skipped). `open` sets whether it starts open; it re-applies when it changes.
   * `expandable={false}` locks the card shut (nothing inside yet): no hover, faded chevron, clicks and keys do nothing. When
   * it turns expandable again the card opens per `open`, so content that arrives unfolds by itself.
   * `loading` runs the working border (WorkingBorder): comets of colour circling the card's edge.
   */
  import Icon from './Icon.svelte'
  import WorkingBorder from './WorkingBorder.svelte'

  /**
   * @typedef {object} Props
   * @property {string} title
   * @property {boolean} [open]
   * @property {string} [variant]
   * @property {boolean} [dimmed]
   * @property {boolean} [expandable]
   * @property {boolean} [loading]
   * @property {import('svelte').Snippet} [lead]
   * @property {import('svelte').Snippet} [meta]
   * @property {import('svelte').Snippet} [end]
   * @property {import('svelte').Snippet} [actions]
   * @property {import('svelte').Snippet} [children]
   */
  /** @type {Props & Omit<import('svelte/elements').HTMLAttributes<HTMLDivElement>, keyof Props>} */
  let {
    title,
    open = true,
    variant = 'default',
    dimmed = false,
    expandable = true,
    loading = false,
    lead,
    meta,
    end,
    actions,
    class: className,
    children,
    ...rest
  } = $props()
</script>

<div class={['card', className]} {...rest} data-variant={variant} class:dimmed class:loading class:locked={!expandable}>
  <details open={expandable && open}>
    <summary
      tabindex={expandable ? undefined : -1}
      aria-disabled={expandable ? undefined : 'true'}
      onclick={(e) => {
        if (!expandable) e.preventDefault()
      }}
    >
      <span class="chev"><Icon name="caretRight" size="sm" /></span>
      {#if lead}<span class="lead">{@render lead()}</span>{/if}
      <span class="title">{title}</span>
      {#if meta}<span class="meta">{@render meta()}</span>{/if}
      {#if end}<span class="end">{@render end()}</span>{/if}
    </summary>
    {#if expandable}<div class="body">{@render children?.()}</div>{/if}
  </details>
  {#if loading}<WorkingBorder />{/if}
  {#if actions}<span class="actions">{@render actions()}</span>{/if}
</div>

<style>
  .card {
    position: relative;
    border: 1px solid var(--line-strong);
    border-radius: var(--r-xl);
    background: var(--fill-1);
  }
  .card.dimmed {
    opacity: 0.6;
  }
  .card[data-variant='active'] {
    border-color: var(--accent-line);
  }
  .card.loading {
    border-color: var(--line);
  } /* neutral edge under the comets, even for 'active' */
  .card[data-variant='empty'] {
    background: none;
    border-style: dashed;
  }
  .card[data-variant='empty'] :is(.title, .meta) {
    color: var(--muted);
  }

  details {
    overflow: clip;
    border-radius: calc(var(--r-xl) - 1px);
  }
  summary {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    flex-wrap: wrap;
    min-height: 40px;
    padding: var(--space-1) 16px;
    list-style: none;
    cursor: pointer;
    font: var(--w-medium) 12.5px var(--font-data);
    color: var(--fg);
    transition: background-color var(--dur) var(--ease-out);
  }
  /* Room for the corner actions, when there are any. */
  .card:has(> .actions) summary {
    padding-right: 40px;
  }
  summary::-webkit-details-marker {
    display: none;
  }
  summary:hover {
    background: var(--control-2);
  }
  summary:focus-visible {
    outline-offset: -2px;
    border-radius: var(--r-xl);
  }
  details[open] > summary {
    border-bottom: 1px solid var(--line);
  }
  .chev {
    display: inline-flex;
    color: var(--muted);
    rotate: 0deg;
    transition: rotate var(--dur) var(--ease-out);
  }
  details[open] .chev {
    rotate: 90deg;
  }
  .lead {
    display: inline-flex;
  }
  .meta {
    font: 400 12px var(--font-body);
    color: var(--muted);
  }
  .end {
    margin-left: auto;
    font: var(--w-medium) 11px var(--font-data);
    font-variant-numeric: tabular-nums;
    color: var(--muted);
  }
  /* Nothing inside: the header reads as a plain row, not a toggle. */
  .locked summary {
    cursor: default;
  }
  .locked summary:hover {
    background: none;
  }
  .locked .chev {
    opacity: 0.3;
  }

  .actions {
    position: absolute;
    top: 6px;
    right: 6px;
  }

  /* Body text lines up with the title, past the chevron. */
  .body {
    display: grid;
    gap: var(--space-2);
    padding: var(--space-3) 16px 16px calc(16px + 22px);
  }
</style>
