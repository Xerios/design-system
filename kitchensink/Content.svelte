<script>
  /** Kitchen sink: collapsibles, tables, inline markdown, a resizable panel and a scroll area with faded edges. */
  import Section from './Section.svelte'
  import Demo from './Demo.svelte'
  import Collapsible from '../components/Collapsible.svelte'
  import CollapsibleAdvanced from '../components/CollapsibleAdvanced.svelte'
  import Icon from '../components/Icon.svelte'
  import Md from '../components/Md.svelte'
  import Splitter from '../components/Splitter.svelte'
  import Table from '../components/Table.svelte'
  import { scrollFade } from '../lib/scroll-fade.js'

  const PEOPLE = [
    { id: 1, name: 'Ada Lovelace', team: 'Engines', commits: 128, joined: '2025-03-02' },
    { id: 2, name: 'Grace Hopper', team: 'Compilers', commits: 342, joined: '2024-11-20' },
    { id: 3, name: 'Alan Turing', team: 'Engines', commits: 87, joined: '2026-01-15' },
    { id: 4, name: 'Katherine Johnson', team: 'Orbits', commits: 210, joined: '2025-07-30' },
    { id: 5, name: 'Edsger Dijkstra', team: 'Compilers', commits: 19, joined: '2026-06-01' },
  ]
  /** @typedef {(typeof PEOPLE)[number]} Person */
  const COLUMNS = [
    { key: 'name', label: 'Name', header: true, sortValue: (/** @type {Person} */ p) => p.name, value: (/** @type {Person} */ p) => p.name },
    { key: 'team', label: 'Team', sortValue: (/** @type {Person} */ p) => p.team, value: (/** @type {Person} */ p) => p.team },
    { key: 'commits', label: 'Commits', num: true, sortValue: (/** @type {Person} */ p) => p.commits, value: (/** @type {Person} */ p) => p.commits },
    { key: 'joined', label: 'Joined', num: true, sortValue: (/** @type {Person} */ p) => p.joined, value: (/** @type {Person} */ p) => p.joined },
  ]
  const GROUPS = [...new Set(PEOPLE.map((p) => p.team))].map((team) => ({
    key: team,
    label: team,
    rows: PEOPLE.filter((p) => p.team === team),
    info: [{ text: `Everyone on the ${team} team.` }],
  }))
  let sort = $state(/** @type {{ key: string, dir: number } | null} */ ({ key: 'commits', dir: -1 }))
  let open = $state(true)
  let width = $state(260)
  const LINES = Array.from({ length: 24 }, (_, i) => `Line ${i + 1}: scroll to see the edges fade while there is more.`)
</script>

<Section id="content" title="Content" intro="Containers and data: sections that fold, tables that sort and group, panels that resize.">
  <Demo label="Collapsible (bindable, with a count and an ⓘ)">
    <div class="full">
      <Collapsible title="Requirements" count={3} info="What has to be true before it ships." bind:open>
        <p class="small">Tests pass, the docs say what changed, and someone else has read it.</p>
      </Collapsible>
      <Collapsible title="Closed to start" open={false}><p class="small">Opened.</p></Collapsible>
    </div>
  </Demo>
  <Demo label="Collapsible card: default, active, empty, locked, working">
    <div class="full stack">
      <CollapsibleAdvanced title="Build">
        {#snippet lead()}<Icon name="check" size="sm" />{/snippet}
        {#snippet end()}<span class="small muted">1m 12s</span>{/snippet}
        <p class="small">Compiled 1,024 modules.</p>
      </CollapsibleAdvanced>
      <CollapsibleAdvanced title="Deploy" variant="active" loading open={false}>
        {#snippet meta()}uploading{/snippet}
      </CollapsibleAdvanced>
      <CollapsibleAdvanced title="Smoke tests" variant="empty" expandable={false} />
    </div>
  </Demo>
  <Demo label="Table: sortable columns, groups, row menu (right-click a row)" wide>
    <div class="full">
      <Table
        label="People"
        columns={COLUMNS}
        groups={GROUPS}
        key={(/** @type {Person} */ p) => p.id}
        bind:sort
        rowLabel={(/** @type {Person} */ p) => p.name}
        rowMenu={(/** @type {Person} */ p) => [{ label: `Message ${p.name.split(' ')[0]}` }, { separator: true }, { label: 'Remove', danger: true }]}
      />
    </div>
  </Demo>
  <Demo label="Plain .data-table">
    <div class="data-table full">
      <table>
        <thead><tr><th scope="col">Region</th><th scope="col" class="num">Latency</th></tr></thead>
        <tbody>
          <tr><th scope="row">Frankfurt</th><td class="num">12 ms</td></tr>
          <tr><th scope="row">Singapore</th><td class="num">184 ms</td></tr>
        </tbody>
      </table>
    </div>
  </Demo>
  <Demo label="Inline markdown, no {'{@html}'}">
    <p><Md text={'**Bold**, *italic*, `code`, and [a link](https://example.com) or a bare https://example.com.'} /></p>
  </Demo>
  <Demo label="Splitter (drag, arrows, double-click resets)" wide>
    <div class="split">
      <div class="pane">Main</div>
      <Splitter value={width} min={160} max={480} defaultValue={260} side="end" oninput={(w) => (width = w)} />
      <div class="pane side" style:width="{width}px">Panel, {width}px</div>
    </div>
  </Demo>
  <Demo label="Scroll fade">
    <ul class="scroll full" {@attach scrollFade({ size: 24 })}>
      {#each LINES as line (line)}<li class="small">{line}</li>{/each}
    </ul>
  </Demo>
</Section>

<style>
  .full {
    width: 100%;
    min-width: 0;
  }
  .stack {
    display: grid;
    gap: var(--space-2);
  }
  .split {
    display: flex;
    width: 100%;
    height: 120px;
    border: 1px solid var(--line);
    border-radius: var(--r);
    overflow: clip;
  }
  .pane {
    flex: 1;
    display: grid;
    place-items: center;
    min-width: 0;
    color: var(--muted);
  }
  .side {
    flex: none;
    background: var(--fill-1);
  }
  .scroll {
    max-height: 140px;
    overflow-y: auto;
    padding: var(--space-2);
    border: 1px solid var(--line);
    border-radius: var(--r);
  }
</style>
