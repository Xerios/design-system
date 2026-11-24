<script>
  /**
   * A card of content with the actions that apply to it (edit, copy, rewrite, regenerate…) attached to it, so they read
   * as belonging to that content and not to the page around it: a drafted message, a snippet, a generated summary, a
   * saved note. At the top they sit in the top-right corner: on the title's row, or, with no title, in the corner with
   * the content's text wrapping around them. At the bottom they make a row under the content. Inline, for a line of
   * content (a command, a link, a key), they sit at the end of that line.
   *
   *   <ActionCard title="Summary" copy={summary}>
   *     {#snippet actions()}
   *       <ActionCard.Action icon="pencil" label="Edit" onclick={edit} />
   *       <ActionCard.Action icon="sparkle" label="Polish" onclick={polish} />
   *     {/snippet}
   *     <p>{summary}</p>
   *   </ActionCard>
   *   <ActionCard placement="bottom" copy={reply}><p>{reply}</p></ActionCard>
   *   <ActionCard reveal="hover" copy={() => code}><pre>{code}</pre></ActionCard>
   *   <ActionCard inline copy={command}><code>{command}</code></ActionCard>
   *
   * actions: a snippet of `ActionCard.Action`s (an icon and a label; see `labels`), each a `Button`, which brings the
   * spinner and error bubble of an async action (an onclick returning a promise). Any other button works too (a
   * `<Button iconOnly>`, a `MenuButton` for more), drawn as it is. Keep them few, ordered from the most used, and about
   * this card's content only.
   * copy: adds a Copy action after the others, copying this text (or what this function returns, which may be a
   * promise) to the clipboard. It turns to a tick, says "Copied" and announces it; a failure shows in a bubble under it.
   * copyLabel, copiedLabel: its label before and after (default 'Copy', 'Copied').
   * placement: top (default, the top-right corner) | bottom (a row under the content).
   * align: start (default) | end; where the row sits at the bottom.
   * inline: the content and the actions share one row, the actions at its end, level with the content's first line if
   * it wraps; the card is as short as its buttons allow. A title stays above, on its own row. Overrides `placement`.
   * labels: whether the actions show their labels beside their icons: hidden (icon only, the label as a tooltip),
   * shown, or fit: shown while they fit, and icon-only once the card is too narrow for them (at the bottom: its width;
   * on the title's row: what the title leaves uncut; in the corner with no title or inline: half the card). Default:
   * fit at the bottom, hidden at the top and inline.
   * title: a heading for the content, on the actions' row. icon: an Icon name before it.
   * level: the title's heading level, one below the heading the card sits under (default 3).
   * label: the accessible name of the group of actions (default: 'Actions', or the title's).
   * reveal: always (default) | hover. `hover` keeps the actions hidden until the pointer is over the card or the focus
   * is in it, for a list of many cards where they would be noise; they stay shown while one is busy or open, and on
   * touch screens, which have no hover.
   * children: the content. Other attributes, the class and attachments go to the card's box.
   * Keyboard: Tab reaches each action in turn (in hover mode, reaching one shows them all), Enter or Space presses it.
   *
   * @typedef {object} Props
   * @property {string} [title]
   * @property {string} [icon]
   * @property {2 | 3 | 4 | 5 | 6} [level]
   * @property {string} [label]
   * @property {string | (() => string | Promise<string>)} [copy]
   * @property {string} [copyLabel]
   * @property {string} [copiedLabel]
   * @property {'top' | 'bottom'} [placement]
   * @property {'start' | 'end'} [align]
   * @property {boolean} [inline]
   * @property {'hidden' | 'shown' | 'fit'} [labels]
   * @property {'always' | 'hover'} [reveal]
   * @property {import('svelte').Snippet} [actions]
   * @property {import('svelte').Snippet} [children]
   */
  import { setContext } from 'svelte'
  import Icon from '../Icon.svelte'
  import Action from './Action.svelte'
  import { ACTION_CARD } from './context.js'
  import { announce } from '../../lib/announce.js'
  import { observeSize } from '../../lib/observe.js'

  /** @type {Props & Omit<import('svelte/elements').HTMLAttributes<HTMLElement>, keyof Props>} */
  let {
    title,
    icon,
    level = 3,
    label,
    copy,
    copyLabel = 'Copy',
    copiedLabel = 'Copied',
    placement = 'top',
    align = 'start',
    inline = false,
    labels,
    reveal = 'always',
    actions,
    class: className,
    children,
    ...rest
  } = $props()

  const id = $props.id()
  const hasActions = $derived(!!actions || copy != null)
  const groupLabel = $derived(label ?? (title ? `${title} actions` : 'Actions'))
  const where = $derived(inline ? 'inline' : placement === 'bottom' ? 'bottom' : title ? 'head' : 'corner')
  const labelMode = $derived(labels ?? (where === 'bottom' ? 'fit' : 'hidden'))

  // fit: short of room for the labels. Measured by `fit` below.
  let cramped = $state(false)
  const showLabels = $derived(labelMode === 'shown' || (labelMode === 'fit' && !cramped))
  setContext(ACTION_CARD, {
    get labels() {
      return showLabels
    },
  })

  /** @type {HTMLElement | undefined} */
  let bar = $state()

  /**
   * Attachment on the card: with labels to fit, compares the actions' width with their labels (measured whenever they
   * show) to the room they have, and drops to icons when it is short. The width with labels is kept while they are
   * hidden, so they come back once the room is there again, and the card doesn't flip back and forth at the edge.
   * @param {HTMLElement} card
   */
  function fit(card) {
    if (labelMode !== 'fit' || !bar) {
      cramped = false
      return
    }
    const actionsBar = bar
    const spot = where
    void title // a new title changes the room on its row
    let full = 0

    function room() {
      if (spot === 'bottom') return /** @type {HTMLElement} */ (actionsBar.parentElement).clientWidth
      if (spot === 'corner') return /** @type {HTMLElement} */ (card.querySelector(':scope > .body')).clientWidth / 2
      if (spot === 'inline') return /** @type {HTMLElement} */ (actionsBar.parentElement).clientWidth / 2
      // On the title's row: what is left after the whole title and the gap.
      const head = /** @type {HTMLElement} */ (actionsBar.parentElement)
      const text = /** @type {HTMLElement} */ (head.querySelector('.title-text'))
      const heading = /** @type {HTMLElement} */ (text.parentElement)
      const titleWidth = heading.clientWidth - text.clientWidth + text.scrollWidth
      return head.clientWidth - titleWidth - (parseFloat(getComputedStyle(head).columnGap) || 0)
    }
    function check() {
      if (!cramped) full = actionsBar.getBoundingClientRect().width
      const short = full > room() + 0.5
      if (short !== cramped) cramped = short
    }
    const stops = [observeSize(card, check), observeSize(actionsBar, check)]
    return () => stops.forEach((stop) => stop())
  }

  let copied = $state(false)
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let timer

  async function copyText() {
    const text = typeof copy === 'function' ? await copy() : (copy ?? '')
    await navigator.clipboard.writeText(text)
    copied = true
    announce(copiedLabel, { delay: 0 })
    clearTimeout(timer)
    timer = setTimeout(() => (copied = false), 1500)
  }

  $effect(() => () => clearTimeout(timer))
</script>

{#snippet toolbar()}
  <div class={['actions', where === 'corner' && 'floating']} role="group" aria-label={groupLabel} bind:this={bar}>
    {@render actions?.()}
    {#if copy != null}
      <Action icon={copied ? 'check' : 'copy'} label={copied ? copiedLabel : copyLabel} onclick={copyText} />
    {/if}
  </div>
{/snippet}

<section
  class={['action-card', className]}
  data-reveal={reveal}
  aria-labelledby={title ? `${id}-title` : undefined}
  {...rest}
  {@attach fit}
>
  {#if title}
    <header class="head">
      <svelte:element this={`h${level}`} class="title" id="{id}-title">
        {#if icon}<Icon name={icon} size="sm" />{/if}
        <span class="title-text">{title}</span>
      </svelte:element>
      {#if hasActions && where === 'head'}{@render toolbar()}{/if}
    </header>
  {:else if hasActions && where === 'corner'}
    {@render toolbar()}
  {/if}
  {#if where === 'inline'}
    <div class="row">
      <div class="body">{@render children?.()}</div>
      {#if hasActions}{@render toolbar()}{/if}
    </div>
  {:else}
    <div class="body">{@render children?.()}</div>
  {/if}
  {#if hasActions && where === 'bottom'}
    <div class="foot" data-align={align}>{@render toolbar()}</div>
  {/if}
</section>

<style>
  .action-card {
    /* Holds the floated actions. */
    display: flow-root;
    min-width: 0;
    padding: var(--space-3) var(--space-4);
    border: 1px solid var(--line);
    border-radius: var(--r-lg);
    background: var(--surface);
  }

  /* The title's row is as tall as the buttons, pulled up and out so they sit snug in the corner. */
  .head {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    min-height: 28px;
    margin: calc(var(--space-1) * -1) calc(var(--space-2) * -1) var(--space-2) 0;
    user-select: none;
  }
  .title {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    flex: 1;
    min-width: 0;
    margin: 0;
    font-size: 13px;
    font-weight: var(--w-semibold);
    color: var(--fg);
  }
  .title :global(.icon) {
    flex: none;
    color: var(--muted);
  }
  .title-text {
    overflow: clip;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* As wide as its buttons, never wrapping, so its width is what the labels need. */
  .actions {
    display: flex;
    flex: none;
    align-items: center;
    gap: 2px;
    width: max-content;
    user-select: none;
  }
  /* No title: in the corner, pulled up and out by the same amount, with the content's first lines running around it. */
  .floating {
    float: right;
    margin: calc(var(--space-1) * -1) calc(var(--space-2) * -1) var(--space-1) var(--space-2);
  }
  /* Under the content, pulled out to the side it sits on by a button's padding, so the first icon lines up with the
     text above it, and down towards the card's edge as the corner ones are pulled up. */
  .foot {
    display: flex;
    min-width: 0;
    margin: var(--space-2) calc(var(--space-2) * -1) calc(var(--space-1) * -1);
  }
  .foot[data-align='end'] {
    justify-content: flex-end;
  }
  /* Inline: pulled out towards the card's edges as the corner buttons are, so the card is a button's height and a
     little; the content's first line is centred on the buttons and later lines run on under it. */
  .row {
    display: flex;
    align-items: flex-start;
    gap: var(--space-2);
    margin: calc(var(--space-2) * -1) calc(var(--space-2) * -1) calc(var(--space-2) * -1) 0;
  }
  .row > .body {
    flex: 1;
    min-width: 0;
    padding-block: calc((28px - 1lh) / 2);
  }

  /* A labelled action: the ghost .icon-btn grown to hold its label, a filled pill only under the pointer. */
  .actions :global(.btn.card-action) {
    min-height: 28px;
    padding: 0 var(--space-2);
    gap: 6px;
    border-color: transparent;
    background: none;
    box-shadow: none;
    font-size: 12px;
    color: var(--fg);
  }
  .actions :global(.btn.card-action .icon) {
    color: var(--muted);
  }
  .actions :global(.btn.card-action:hover:not(:disabled, [aria-disabled='true'])) {
    background: var(--control-3);
  }
  .actions :global(.btn.card-action:hover:not(:disabled, [aria-disabled='true']) .icon) {
    color: var(--fg-2);
  }
  .actions :global(.btn.card-action:active:not(:disabled, [aria-disabled='true'])) {
    background: var(--control-4);
  }

  .body {
    font-size: 13px;
    color: var(--fg);
  }
  .body > :global(:first-child) {
    margin-top: 0;
  }
  .body > :global(:last-child) {
    margin-bottom: 0;
  }

  /* Hover: shown while the pointer is over the card, the focus is in it, or one of its actions is busy or open. */
  [data-reveal='hover'] .actions {
    opacity: 0;
    transition: opacity var(--dur) var(--ease-out);
  }
  [data-reveal='hover']:is(:hover, :focus-within) .actions,
  [data-reveal='hover'] .actions:has(:global([aria-busy='true'], [aria-expanded='true'])) {
    opacity: 1;
  }
  @media (hover: none) {
    [data-reveal='hover'] .actions {
      opacity: 1;
    }
  }
</style>
