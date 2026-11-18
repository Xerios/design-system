<script>
  import Icon from './Icon.svelte'
  /**
   * An inline notice: a tinted strip with an icon and a line or two of text, for a standing condition of the page
   * (a mode it is in, something that is locked). The icon stays on the first line however far the text wraps.
   *
   *   <Notice tone="warning">Changes here are not saved.</Notice>
   *   <Notice icon="prohibit">Read-only. <a href="/settings">Unlock it</a>.</Notice>
   *
   * tone: success | info | warning | neutral | danger (colours the icon and the fill). icon: an Icon name.
   * children: the text; links and buttons inside it are reachable with the keyboard as usual.
   * Other attributes (class, id…) and attachments go to the strip.
   *
   * @typedef {object} Props
   * @property {'success' | 'info' | 'warning' | 'neutral' | 'danger'} [tone]
   * @property {string} [icon]
   * @property {import('svelte').Snippet} [children]
   */
  /** @type {Props & Omit<import('svelte/elements').HTMLAttributes<HTMLParagraphElement>, keyof Props>} */
  let { tone = 'neutral', icon = 'infoCircle', class: className, children, ...rest } = $props()
</script>

<p class={['notice', className]} data-tone={tone} {...rest}>
  <Icon name={icon} size="sm" />
  <span class="text">{@render children?.()}</span>
</p>

<style>
  .notice {
    display: flex;
    width: fit-content;
    align-items: flex-start;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    border: 1px solid var(--line);
    border-radius: var(--r);
    background: var(--tone-soft);
    font-size: 12px;
    color: var(--fg-2);
  }
  /* One line tall, so the icon sits centred on the first line of text. */
  .notice :global(.icon) {
    flex: none;
    height: 1lh;
    color: var(--tone);
  }
  .text {
    max-width: 75ch;
  }
</style>
