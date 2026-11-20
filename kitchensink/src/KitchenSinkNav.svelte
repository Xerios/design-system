<script>
  /**
   * The kitchen sink's side menu, built on the design system's SideMenu: the areas as icon rows, each with a count of its
   * demos; the area in view is marked current (it follows the scroll), and choosing one jumps there and moves the focus
   * to its heading. The theme switch (system, light, dark) sits in the footer.
   *
   *   <KitchenSinkNav onpick={closeDrawer} />
   *
   * onpick: after an area is chosen (to close a drawer it sits in).
   * Other attributes (class…) and attachments go to the <nav>.
   */
  import Icon from '@xerios/design-system/components/Icon.svelte'
  import ButtonGroup from '@xerios/design-system/components/inputs/ButtonGroup.svelte'
  import SideMenu from '@xerios/design-system/components/side-menu/index.js'
  import { AREAS, jump } from './areas.js'
  import { THEMES, setTheme, theme } from './theme.svelte.js'

  /** @type {{ onpick?: () => void } & import('svelte/elements').HTMLAttributes<HTMLElement>} */
  let { onpick, ...rest } = $props()

  let current = $state(AREAS[0]?.id ?? '')
  /** @type {Record<string, number>} */
  let counts = $state({})

  /** Attachment: counts each area's demos, and marks the area whose top has scrolled into the upper part of the window as current. */
  function follow() {
    const sections = AREAS.map((area) => document.getElementById(area.id)).filter((el) => el !== null)
    counts = Object.fromEntries(sections.map((section) => [section.id, section.querySelectorAll('figure.demo').length]))
    const observer = new IntersectionObserver(
      (entries) => {
        const seen = entries.filter((entry) => entry.isIntersecting).map((entry) => entry.target.id)
        if (seen.length) current = AREAS.find((area) => seen.includes(area.id))?.id ?? current
      },
      // A band across the upper third: an area becomes current as its top reaches it.
      { rootMargin: '-10% 0px -60% 0px' },
    )
    for (const section of sections) observer.observe(section)
    return () => observer.disconnect()
  }
</script>

<SideMenu label="Design system areas" {...rest} {@attach follow}>
  {#snippet header()}<span class="brand"><Icon name="swatches" size="lg" />Design system</span>{/snippet}

  <SideMenu.Group>
    {#each AREAS as area (area.id)}
      <SideMenu.Item
        href="#{area.id}"
        icon={area.icon}
        label={area.label}
        count={counts[area.id] || null}
        current={current === area.id ? 'location' : false}
        onclick={(/** @type {MouseEvent} */ e) => {
          current = area.id
          jump(e, area.id)
          onpick?.()
        }}
      />
    {/each}
  </SideMenu.Group>

  {#snippet footer()}
    <ButtonGroup label="Theme" options={THEMES} value={theme.value} onchange={setTheme} />
  {/snippet}
</SideMenu>

<style>
  .brand {
    display: inline-flex;
    align-items: center;
    gap: var(--gap);
    min-height: 32px;
    padding-inline: var(--bleed);
    margin-inline-start: calc(var(--bleed) * -1);
    color: var(--fg);
    font: var(--w-semibold) 14px var(--font-display);
  }
  .brand > :global(.icon) {
    color: var(--muted);
  }
</style>
