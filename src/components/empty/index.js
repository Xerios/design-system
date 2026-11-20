// Empty states as one import: <Empty> for a view with nothing in it, <Empty.Error> for one that failed to load.
//
//   import Empty from '@xerios/design-system/components/empty/index.js'
//   <Empty title="No calls yet" body="…" />
//   <Empty.Error title="Couldn't load the list" message={error} onretry={reload} />
import Empty from './Empty.svelte'
import EmptyError from './EmptyError.svelte'

export default Object.assign(Empty, { Error: EmptyError })
export { EmptyError }
