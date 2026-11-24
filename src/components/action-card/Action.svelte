<script>
  /**
   * One action of an ActionCard: an icon and a label, drawn as the card says (see its `labels`): the icon and the label
   * side by side, or the round icon-only button with the label as its tooltip and accessible name. It is a `Button`, so
   * an onclick that returns a promise shows a spinner while it runs and a rejection's message in a bubble under it.
   *
   *   <ActionCard.Action icon="pencil" label="Edit" onclick={edit} />
   *   <ActionCard.Action icon="sparkle" label="Polish" pendingLabel="Polishing…" onclick={polish} />
   *
   * icon: an Icon name (required, it is all that shows when the card is short of room). label: what it does, short.
   * pendingLabel: its label while the action runs, when the label shows. onclick, href, disabled and other attributes
   * go to the Button. Outside an ActionCard it is icon-only.
   *
   * @typedef {object} Props
   * @property {string} icon
   * @property {string} label
   * @property {string} [pendingLabel]
   * @property {(event: MouseEvent) => unknown} [onclick]
   */
  import { getContext } from 'svelte'
  import Button from '../Button.svelte'
  import { ACTION_CARD } from './context.js'

  /** @type {Props & Omit<import('svelte').ComponentProps<typeof Button>, keyof Props | 'iconOnly' | 'children'>} */
  let { icon, label, pendingLabel, class: className, ...rest } = $props()

  /** @type {import('./context.js').ActionCardContext | undefined} */
  const card = getContext(ACTION_CARD)
</script>

{#if card?.labels}
  <Button {icon} {pendingLabel} class={['card-action', className]} {...rest}>{label}</Button>
{:else}
  <Button iconOnly {icon} {label} class={className} {...rest} />
{/if}
