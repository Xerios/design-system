// The side menu as one import: <SideMenu> is the column, <SideMenu.Group> a run of rows (with a heading that folds it,
// or none), <SideMenu.Item> one row (a link, or a button), which can hold more items under it.
//
//   import SideMenu from '@xerios/design-system/components/side-menu/index.js'
//   <SideMenu label="Sections">
//     <SideMenu.Group>
//       <SideMenu.Item href="/inbox" icon="inbox" label="Inbox" count={3} />
//     </SideMenu.Group>
//   </SideMenu>
import SideMenu from './SideMenu.svelte'
import SideMenuGroup from './SideMenuGroup.svelte'
import SideMenuItem from './SideMenuItem.svelte'

export default Object.assign(SideMenu, { Group: SideMenuGroup, Item: SideMenuItem })
export { SideMenuGroup, SideMenuItem }
