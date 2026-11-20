<script>
  /**
   * Thinking text, like Linear's "Thinking…" label: the text rests in a quiet tone while a brighter band sweeps through it.
   * For labels of work in progress (researching, loading, a running step's phase).
   *
   *   <Shimmer>Researching…</Shimmer>
   *   <Shimmer text="Checking the model server…" />
   *   <Shimmer as="p" class="small">Loading the posting…</Shimmer>
   *
   * `active={false}` renders the same text without the sweep, so a label can stop shimmering without changing its markup.
   * Colours come from --shimmer-base / --shimmer-hi (theme tokens; override them on a parent to tint it). Styles live in
   * css/effects.css (.shimmer-text), so a .shimmer pill can pair its edge sweep with this label.
   */
  /**
   * @typedef {object} Props
   * @property {string} [text]
   * @property {string} [as]
   * @property {boolean} [active]
   * @property {import('svelte').Snippet} [children]
   */
  /** @type {Props & Omit<import('svelte/elements').HTMLAttributes<HTMLElement>, keyof Props>} */
  let { text = '', as = 'span', active = true, class: className, children, ...rest } = $props()
</script>

<svelte:element this={as} class={[className, active && 'shimmer-text']} {...rest}
  >{#if children}{@render children()}{:else}{text}{/if}</svelte:element
>
