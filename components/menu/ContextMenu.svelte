<script>
  /** The app's single context menu layer. Open it with the contextMenu attachment from lib/menu.svelte.js. */
  import MenuList from './MenuList.svelte';
  import { menu, closeMenu, anchorMoved } from '../../lib/menu.svelte.js';

  // Close on anything that would leave the menu floating in the wrong place.
  $effect(() => {
    if (!menu.open) return;
    const away = () => closeMenu({ restoreFocus: false });
    // A click on the button that opened the menu is left to that button (it toggles).
    const outside = (e) => !e.target.closest?.('.ctx-menu') && !menu.trigger?.contains(e.target) && away();
    // Scrolling only closes the menu once it would point at the wrong thing.
    const scrolled = (e) => !e.target.closest?.('.ctx-menu') && anchorMoved() && away();
    document.addEventListener('pointerdown', outside, true);
    document.addEventListener('scroll', scrolled, true);
    window.addEventListener('resize', away);
    window.addEventListener('blur', away);
    return () => {
      document.removeEventListener('pointerdown', outside, true);
      document.removeEventListener('scroll', scrolled, true);
      window.removeEventListener('resize', away);
      window.removeEventListener('blur', away);
    };
  });
</script>

{#if menu.open}
  {#key menu.items}
    <MenuList items={menu.items} x={menu.x} y={menu.y} label={menu.label} onclose={() => closeMenu()} />
  {/key}
{/if}
