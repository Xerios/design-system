// Labelled values as one import: <Metadata> is the list, <Metadata.Row> one label and its values.
//
//   import Metadata from '$ds/components/metadata/index.js'
//   <Metadata>
//     <Metadata.Row label="Properties">
//       <button type="button" class="chip-btn"><Icon name="circleDashed" />Planned</button>
//     </Metadata.Row>
//   </Metadata>
import Metadata from './Metadata.svelte'
import MetadataRow from './MetadataRow.svelte'

export default Object.assign(Metadata, { Row: MetadataRow })
export { MetadataRow }
