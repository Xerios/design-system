<script>
  /** Visible "More actions" button: the same menu as right-click, for mouse, touch and keyboard users. */
  import Icon from './Icon.svelte';
  import { menu, openMenuFrom, closeMenu } from '../lib/menu.svelte.js';
  import { tooltip } from '../lib/tooltip.js';

  let { items, label } = $props();
  let button = $state();
  const expanded = $derived(menu.open && menu.trigger === button);

  function toggle(e) {
    e.stopPropagation();
    if (expanded) closeMenu();
    else openMenuFrom(button, items(), label);
  }
</script>

<button
  bind:this={button}
  type="button"
  class="icon-btn more"
  aria-label="More actions for {label}"
  aria-haspopup="menu"
  aria-expanded={expanded}
  {@attach tooltip('More actions')}
  onclick={toggle}>
  <Icon name="more" size="lg" />
</button>
