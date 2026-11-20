<script>
  /**
   * The visible ⋯ button of the context menu: opens the same menu as right-click (ContextMenu, lib/menu.svelte.js)
   * below itself, for mouse, touch and keyboard users. Anything with a context menu also gets one, so nothing is
   * reachable by right-click only.
   *
   *   <li {@attach contextMenu(() => rowMenu(row), row.name)}>… <MenuButton items={() => rowMenu(row)} label={row.name} /></li>
   *
   * items: a function returning the menu items (run when it opens, so they reflect current state; shape in
   * lib/menu.svelte.js). label: what the actions are for ("More actions for {label}"). Pressing it again closes the
   * menu. Other attributes (class…) and attachments go to the button.
   */
  import Icon from '../Icon.svelte'
  import { menu, openMenuFrom, closeMenu } from '../../lib/menu.svelte.js'
  import { tooltip } from '../../lib/tooltip.js'

  /**
   * @typedef {object} Props
   * @property {() => import('../../lib/menu.svelte.js').MenuItem[]} items
   * @property {string} label
   */
  /** @type {Props & Omit<import('svelte/elements').HTMLButtonAttributes, keyof Props>} */
  let { items, label, class: className, ...rest } = $props()
  let button = $state()
  const expanded = $derived(menu.open && menu.trigger === button)

  function toggle(e) {
    e.stopPropagation()
    if (expanded) closeMenu()
    else openMenuFrom(button, items(), label)
  }
</script>

<button
  bind:this={button}
  type="button"
  class={['icon-btn more', className]}
  {...rest}
  aria-label="More actions for {label}"
  aria-haspopup="menu"
  aria-expanded={expanded}
  {@attach tooltip('More actions')}
  onclick={toggle}
>
  <Icon name="more" size="lg" />
</button>
