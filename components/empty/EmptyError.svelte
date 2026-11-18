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
   * It is an alert: read out when it appears, so someone who started the load hears that it failed.
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
  import Empty from './Empty.svelte'
  import Button from '../Button.svelte'

  /** @type {Props & Omit<import('svelte/elements').HTMLAttributes<HTMLDivElement>, keyof Props>} */
  let { title = 'Something went wrong', message = '', onretry, retryLabel = 'Try again', level = 3, children, ...rest } = $props()
</script>

<Empty {title} body={message} {level} icon="warning" data-tone="danger" role="alert" {...rest}>
  {#if onretry || children}
    <div class="actions">
      {#if onretry}<Button icon="refresh" onclick={onretry}>{retryLabel}</Button>{/if}
      {@render children?.()}
    </div>
  {/if}
</Empty>

<style>
  .actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--space-2);
  }
</style>
