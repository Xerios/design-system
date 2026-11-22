<script>
  /**
   * Empty.Error: in place of a view that failed to load, what failed, why, and a way to try again.
   *
   *   <Empty.Error title="Couldn't load Dokploy" message={data.error} onretry={() => refreshAll()} />
   *   <Empty.Error title="Couldn't load the settings" message={failure} onretry={load}>
   *     <div><Button href="/settings/help">Get help</Button></div>
   *   </Empty.Error>
   *
   * title: what failed, as an outcome ("Couldn't load …"). message: why, in words someone can act on (often the
   * server's message). onretry: the retry; it may be async, and the button shows it working (Button). retryLabel:
   * the button's label ("Try again"). level: as Empty's. children: more actions, after the retry.
   * Laid out side by side: a large warning icon on the left, a vertical rule, then the title, message and actions,
   * aligned left. It is an alert: read out when it appears, so someone who started the load hears that it failed.
   * Other attributes (class, id…) and attachments go to the wrapper.
   *
   * @typedef {object} Props
   * @property {string} [title]
   * @property {string} [message]
   * @property {() => unknown} [onretry]
   * @property {string} [retryLabel]
   * @property {2 | 3 | 4 | 5 | 6} [level]
   * @property {import('svelte').Snippet} [children]
   */
  import Icon from '../Icon.svelte'
  import Button from '../Button.svelte'

  /** @type {Props & Omit<import('svelte/elements').HTMLAttributes<HTMLDivElement>, keyof Props>} */
  let {
    title = 'Something went wrong',
    message = '',
    onretry,
    retryLabel = 'Try again',
    level = 3,
    class: className,
    children,
    ...rest
  } = $props()
</script>

<div class={['empty-error', className]} data-tone="danger" role="alert" {...rest}>
  <span class="icon-slot"><Icon name="warning" size="lg" /></span>
  <span class="rule" aria-hidden="true"></span>
  <div class="text">
    <svelte:element this={`h${level}`} class="title">{title}</svelte:element>
    {#if message}<p>{message}</p>{/if}
    {#if onretry || children}
      <div class="actions">
        {#if onretry}<Button icon="refresh" onclick={onretry}>{retryLabel}</Button>{/if}
        {@render children?.()}
      </div>
    {/if}
  </div>
</div>

<style>
  .empty-error {
    width: fit-content;
    max-width: 480px;
    margin: 48px auto;
    display: grid;
    grid-template-columns: auto 1px minmax(0, 1fr);
    align-items: center;
    gap: var(--space-5);
    text-align: start;
  }
  .icon-slot {
    display: inline-flex;
    color: var(--tone, var(--muted));
  }
  .icon-slot :global(.icon) {
    --icon-size: 40px;
  }
  .rule {
    align-self: stretch;
    background: var(--line-strong);
  }
  .text {
    display: grid;
    gap: 6px;
    justify-items: start;
  }
  .title {
    font: var(--w-semibold) 15px var(--font-display);
    color: var(--fg);
  }
  p {
    color: var(--muted);
  }
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    margin-top: var(--space-1);
  }
</style>
