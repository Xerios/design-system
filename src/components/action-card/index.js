// Action cards as one import: <ActionCard> is the card, <ActionCard.Action> one of its actions (an icon and a label that
// drops to the icon alone when the card is short of room).
//
//   import ActionCard from '@xerios/design-system/components/action-card/index.js'
//   <ActionCard title="Summary" copy={summary}>
//     {#snippet actions()}<ActionCard.Action icon="pencil" label="Edit" onclick={edit} />{/snippet}
//     <p>{summary}</p>
//   </ActionCard>
import ActionCard from './ActionCard.svelte'
import Action from './Action.svelte'

export default Object.assign(ActionCard, { Action })
export { Action as CardAction }
