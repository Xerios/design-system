<script>
  /**
   * The kitchen sink's areas as a vertical menu, for a page's sidebar: the area in view is marked current (it follows
   * the scroll), and choosing one jumps there and moves the focus to its heading.
   *
   *   <AppShell>
   *     {#snippet sidebar()}<KitchenSinkNav />{/snippet}
   *     <KitchenSink nav={false} />
   *   </AppShell>
   *
   * Other attributes (class…) and attachments go to the <nav>.
   */
  import { AREAS, jump } from './areas.js'

  /** @type {import('svelte/elements').HTMLAttributes<HTMLElement>} */
  let { class: className, ...rest } = $props()
  let current = $state(AREAS[0].id)

  /** Attachment: marks the area whose top has scrolled into the upper part of the window as current. */
  function follow() {
    const sections = AREAS.map((area) => document.getElementById(area.id)).filter((el) => el !== null)
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

<nav aria-label="Design system areas" class={['ks-nav', className]} {...rest} {@attach follow}>
  <span class="title">Kitchen sink</span>
  <ul>
    {#each AREAS as area (area.id)}
      <li>
        <a href="#{area.id}" aria-current={current === area.id ? 'location' : undefined} onclick={(e) => ((current = area.id), jump(e, area.id))}
          >{area.label}</a
        >
      </li>
    {/each}
  </ul>
</nav>

<style>
  .ks-nav {
    display: grid;
    gap: var(--space-2);
  }
  .title {
    padding: 0 var(--space-2);
    font-size: 12px;
    font-weight: var(--w-medium);
    color: var(--muted);
  }
  ul {
    display: grid;
    gap: 2px;
  }
  a {
    display: flex;
    align-items: center;
    min-height: 28px;
    padding: 0 var(--space-2);
    border-radius: var(--r);
    color: var(--fg-2);
    font-size: 13px;
    font-weight: var(--w-medium);
    text-decoration: none;
    transition:
      background-color var(--dur) var(--ease-out),
      color var(--dur) var(--ease-out);
  }
  a:hover {
    background: var(--fill-2);
    color: var(--fg);
  }
  a[aria-current='location'] {
    background: var(--fill-3);
    color: var(--fg);
  }
  /* A narrow window puts the menu in a row above the view. */
  @media (max-width: 860px) {
    .title {
      display: none;
    }
    ul {
      display: flex;
      flex-wrap: wrap;
    }
  }
  @media (forced-colors: active) {
    a[aria-current='location'] {
      outline: 1px solid Highlight;
      outline-offset: -1px;
    }
  }
</style>
