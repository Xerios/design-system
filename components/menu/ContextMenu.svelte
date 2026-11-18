<script>
  /** The app's single context menu layer. Open it with the contextMenu attachment from lib/menu.svelte.js. */
  import MenuList from './MenuList.svelte'
  import { menu, closeMenu, anchorMoved } from '../../lib/menu.svelte.js'

  // Close on anything that would leave the menu floating in the wrong place.
  const away = () => menu.open && closeMenu({ restoreFocus: false })
  // A click on the button that opened the menu is left to that button (it toggles).
  const outside = (e) => menu.open && !e.target.closest?.('.ctx-menu') && !menu.trigger?.contains(e.target) && away()
  // Scrolling only closes the menu once it would point at the wrong thing.
  const scrolled = (e) => menu.open && !e.target.closest?.('.ctx-menu') && anchorMoved() && away()
</script>

<svelte:document onpointerdowncapture={outside} onscrollcapture={scrolled} />
<svelte:window onresize={away} onblur={away} />

{#if menu.open}
  {#key menu.items}
    <MenuList items={menu.items} x={menu.x} y={menu.y} label={menu.label} onclose={() => closeMenu()} />
  {/key}
{/if}
