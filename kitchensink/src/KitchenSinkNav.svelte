<script>
  /**
   * The kitchen sink's side menu, built on the design system's SideMenu: the areas as icon rows, each with a count of its
   * components, and under the area in view its components, one row each (as a docs site lists them). The component in
   * view is marked current (it follows the scroll), and choosing an area or a component jumps there and moves the focus
   * to its heading. The theme switch (system, light, dark) sits in the footer.
   *
   *   <KitchenSinkNav onpick={closeDrawer} />
   *
   * onpick: after an area or component is chosen (to close a drawer it sits in).
   * Other attributes (class…) and attachments go to the <nav>.
   */
  import Icon from '@xerios/design-system/components/Icon.svelte'
  import ButtonGroup from '@xerios/design-system/components/inputs/ButtonGroup.svelte'
  import SideMenu from '@xerios/design-system/components/side-menu/index.js'
  import { AREAS, jump } from './areas.js'
  import { PACKAGE } from './package.js'
  import { THEMES, setTheme, theme } from './theme.svelte.js'

  /** @type {{ onpick?: () => void } & import('svelte/elements').HTMLAttributes<HTMLElement>} */
  let { onpick, ...rest } = $props()

  let area = $state(AREAS[0]?.id ?? '')
  let demo = $state('')
  /** Each area's components, read from the page: their heading ids and names. @type {Record<string, { id: string, label: string }[]>} */
  let demos = $state({})

  /**
   * Attachment: lists each area's components, and marks as current the first thing (an area's heading, or a component)
   * that is in the upper part of the window: an area's heading until it scrolls past, then its components in turn.
   */
  function follow() {
    /** @type {Map<Element, { area: string, demo: string }>} */
    const where = new Map()
    for (const a of AREAS) {
      const section = document.getElementById(a.id)
      const heading = document.getElementById(`${a.id}-title`)
      if (!section || !heading) continue
      where.set(heading, { area: a.id, demo: '' })
      const articles = /** @type {HTMLElement[]} */ ([...section.querySelectorAll('article.demo')])
      demos[a.id] = articles.map((el) => ({ id: el.id, label: el.dataset.label ?? el.id }))
      for (const el of articles) where.set(el, { area: a.id, demo: el.id })
    }
    const order = [...where.keys()]
    const seen = new Set()
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) entry.isIntersecting ? seen.add(entry.target) : seen.delete(entry.target)
        const first = order.find((el) => seen.has(el))
        const at = first && where.get(first)
        if (at) ({ area, demo } = at)
      },
      // A band across the upper third of the window.
      { rootMargin: '-10% 0px -60% 0px' },
    )
    for (const el of order) observer.observe(el)
    return () => observer.disconnect()
  }

  /**
   * @param {MouseEvent} e
   * @param {string} areaId
   * @param {string} [demoId]
   */
  function pick(e, areaId, demoId = '') {
    area = areaId
    demo = demoId
    jump(e, demoId || areaId)
    onpick?.()
  }
</script>

<SideMenu label="Design system areas" {...rest} {@attach follow}>
  {#snippet header()}<span class="brand"><Icon name="swatches" size="lg" />{PACKAGE}</span>{/snippet}

  <SideMenu.Group>
    {#each AREAS as a (a.id)}
      <SideMenu.Item
        href="#{a.id}"
        icon={a.icon}
        label={a.label}
        count={demos[a.id]?.length || null}
        current={area === a.id && !demo ? 'location' : false}
        open={area === a.id}
        onclick={(/** @type {MouseEvent} */ e) => pick(e, a.id)}
      >
        {#each demos[a.id] ?? [] as d (d.id)}
          <SideMenu.Item
            href="#{d.id}"
            label={d.label}
            current={demo === d.id ? 'location' : false}
            onclick={(/** @type {MouseEvent} */ e) => pick(e, a.id, d.id)}
          />
        {/each}
      </SideMenu.Item>
    {/each}
  </SideMenu.Group>
  <SideMenu.Group title="Together">
    <SideMenu.Item href="demo.html" icon="eye" label="Demo page" />
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
