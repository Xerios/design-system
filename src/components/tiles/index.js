// Tiles as one import: <Tile> is one tile (a link, a button, a checkbox, or content), <Tile.Group> a choice made of the
// tiles inside it (one, or several with `multiple`).
//
//   import Tile from '@xerios/design-system/components/tiles/index.js'
//   <Tile title="Docs" icon="document" href="/docs">Guides and reference.</Tile>
//   <Tile.Group label="Plan" bind:value={plan}>
//     <Tile value="free" title="Free">Up to 3 projects.</Tile>
//   </Tile.Group>
import Tile from './Tile.svelte'
import TileGroup from './TileGroup.svelte'

export default Object.assign(Tile, { Group: TileGroup })
export { TileGroup }
