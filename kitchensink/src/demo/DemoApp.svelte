<script>
  /**
   * The demo page: one screen of a made-up issue tracker, built only from the design system, so most of it shows at once
   * working together (the README's screenshot is taken of it, see scripts/screenshot.js). A side menu; a view card with
   * breadcrumbs, a view switch and actions; a filter row and search; a notice, stat tiles with charts and a grouped
   * table; and beside it, past a splitter, the chosen issue: its properties, a summary card, build cards and settings.
   * A toast stands at the bottom. Below 1100px the issue drops under the list; below 860px the menu moves into a drawer.
   */
  import { MediaQuery } from 'svelte/reactivity'
  import ActionCard from '@xerios/design-system/components/action-card/index.js'
  import Breadcrumbs from '@xerios/design-system/components/Breadcrumbs.svelte'
  import Button from '@xerios/design-system/components/Button.svelte'
  import Canvas from '@xerios/design-system/components/Canvas.svelte'
  import Collapsible from '@xerios/design-system/components/Collapsible.svelte'
  import CollapsibleAdvanced from '@xerios/design-system/components/CollapsibleAdvanced.svelte'
  import Dialogs from '@xerios/design-system/components/Dialogs.svelte'
  import Drawer from '@xerios/design-system/components/Drawer.svelte'
  import Icon from '@xerios/design-system/components/Icon.svelte'
  import Metadata from '@xerios/design-system/components/metadata/index.js'
  import Notice from '@xerios/design-system/components/Notice.svelte'
  import SideMenu from '@xerios/design-system/components/side-menu/index.js'
  import Splitter from '@xerios/design-system/components/Splitter.svelte'
  import Table from '@xerios/design-system/components/Table.svelte'
  import Toast from '@xerios/design-system/components/Toast.svelte'
  import Tile from '@xerios/design-system/components/tiles/Tile.svelte'
  import ButtonGroup from '@xerios/design-system/components/inputs/ButtonGroup.svelte'
  import DatePicker from '@xerios/design-system/components/inputs/DatePicker.svelte'
  import SearchField from '@xerios/design-system/components/inputs/SearchField.svelte'
  import Select from '@xerios/design-system/components/inputs/Select.svelte'
  import Slider from '@xerios/design-system/components/inputs/Slider.svelte'
  import Switch from '@xerios/design-system/components/inputs/Switch.svelte'
  import FilterBar from '@xerios/design-system/components/filters/FilterBar.svelte'
  import ContextMenu from '@xerios/design-system/components/menu/ContextMenu.svelte'
  import MenuButton from '@xerios/design-system/components/menu/MenuButton.svelte'
  import { tooltip } from '@xerios/design-system/lib/tooltip.js'
  import { formatShort } from '@xerios/design-system/lib/dates.js'
  import { THEMES, setTheme, theme } from '../theme.svelte.js'
  import { PACKAGE } from '../package.js'
  import { ISSUES, LABELS, PEOPLE, PRIORITIES, STATUSES, THROUGHPUT, initials } from './data.js'

  /** @typedef {import('./data.js').Issue} Issue */

  const narrow = new MediaQuery('max-width: 860px')
  /** @type {Drawer | undefined} */
  let drawer = $state()

  let page = $state('issues')
  let layout = $state('list')
  let search = $state('')
  let detailWidth = $state(380)
  let chosen = $state('NW-142')
  const issue = $derived(ISSUES.find((i) => i.id === chosen) ?? ISSUES[0])
  const status = $derived(STATUSES.find((s) => s.value === issue.status) ?? STATUSES[0])

  // The filter row: by label and when the issue is due.
  /** @type {import('svelte').ComponentProps<typeof FilterBar>['fields']} */
  const FIELDS = [
    { key: 'status', label: 'Status', icon: 'circleDashed', options: STATUSES, plural: 'statuses' },
    { key: 'who', label: 'Assignee', icon: 'user', options: PEOPLE, plural: 'people' },
    { key: 'labels', label: 'Labels', icon: 'tag', options: Object.entries(LABELS).map(([value, l]) => ({ value, label: l.name, tone: l.tone })), plural: 'labels' },
    { key: 'due', label: 'Due', icon: 'calendar', kind: 'date' },
    { key: 'words', label: 'Keywords', icon: 'search', kind: 'text' },
  ]
  let filters = $state([
    { field: 'labels', op: 'is', value: ['design', 'web'] },
    { field: 'who', op: 'is not', value: ['li'] },
  ])

  // The table: one group per status, a row menu, the chosen issue held.
  const COLUMNS = [
    { key: 'priority', label: 'Priority', hideLabel: true, shrink: true, sortValue: (/** @type {Issue} */ i) => Object.keys(PRIORITIES).indexOf(i.priority) },
    { key: 'id', label: 'ID', shrink: true, sortValue: (/** @type {Issue} */ i) => i.id },
    { key: 'title', label: 'Title', header: true, sortValue: (/** @type {Issue} */ i) => i.title },
    { key: 'labels', label: 'Labels' },
    { key: 'who', label: 'Assignee', hideLabel: true, shrink: true, center: true },
    { key: 'due', label: 'Due', num: true, shrink: true, desc: false, sortValue: (/** @type {Issue} */ i) => i.due },
  ]
  const GROUPS = STATUSES.map((s) => ({ key: s.value, label: s.label, tone: s.tone, rows: ISSUES.filter((i) => i.status === s.value) }))
  let sort = $state(/** @type {{ key: string, dir: number } | null} */ ({ key: 'due', dir: 1 }))
  let collapsed = $state(/** @type {string[]} */ ([]))
  const rowMenu = (/** @type {Issue} */ i) => [
    { label: 'Open', icon: 'arrowRight', action: () => (chosen = i.id) },
    { label: 'Copy link', icon: 'link' },
    { separator: true },
    { label: 'Close issue', icon: 'checkCircle' },
  ]

  // The chosen issue's side: a summary that can be polished, its builds, its settings.
  let summary = $state('the picker should take a start and end day, remember the last range, and offer shortcuts for this week and last month. keyboard first.')
  const wait = (/** @type {number} */ ms) => new Promise((done) => setTimeout(done, ms))
  async function polish() {
    await wait(1200)
    summary = 'Pick a start and an end day, with shortcuts for this week and last month. The last range is remembered, and the whole picker works from the keyboard.'
  }
  let notify = $state(true)
  let estimate = $state(5)
  let cycle = $state('c24')
  const CYCLES = [
    { value: 'c23', label: 'Cycle 23', hint: 'ended' },
    { value: 'c24', label: 'Cycle 24', hint: 'current', detail: { title: 'Cycle 24', text: 'Two weeks, ending on Friday. 18 of 26 issues closed.' } },
    { value: 'c25', label: 'Cycle 25', hint: 'next' },
  ]
  let due = $state(ISSUES[0].due)

  /** @param {CanvasRenderingContext2D} ctx @param {{ width: number, height: number, canvas: HTMLCanvasElement }} f */
  function bars(ctx, { width, height, canvas }) {
    void theme.value
    ctx.fillStyle = getComputedStyle(canvas).color
    const gap = 3
    const top = Math.max(...THROUGHPUT)
    const w = (width - gap * (THROUGHPUT.length - 1)) / THROUGHPUT.length
    THROUGHPUT.forEach((v, i) => {
      ctx.globalAlpha = i === THROUGHPUT.length - 1 ? 1 : 0.55
      ctx.beginPath()
      ctx.roundRect(i * (w + gap), height * (1 - v / top), w, (height * v) / top, 2)
      ctx.fill()
    })
  }

  // A toast that stays until dismissed: the demo has no timers to run.
  let toasts = $state([{ id: 1, message: 'NW-131 moved to Done', action: { label: 'Undo', icon: 'undo', run: () => {} } }])
</script>

{#snippet menu()}
  <SideMenu label="Workspace">
    {#snippet header()}<span class="brand"><span class="logo" aria-hidden="true">N</span>Northwind</span>{/snippet}
    {#snippet actions()}
      <Button iconOnly icon="search" label="Search" />
      <Button iconOnly icon="pencil" label="New issue" />
    {/snippet}
    <SideMenu.Group>
      <SideMenu.Item icon="tray" label="Inbox" count={4} current={page === 'inbox'} onclick={() => (page = 'inbox')} />
      <SideMenu.Item icon="target" label="My issues" current={page === 'mine'} onclick={() => (page = 'mine')} />
    </SideMenu.Group>
    <SideMenu.Group title="Workspace">
      <SideMenu.Item icon="folder" label="Projects" open>
        <SideMenu.Item icon="rocket" label="Spring release" open>
          <SideMenu.Item label="Issues" current={page === 'issues'} onclick={() => (page = 'issues')} />
          <SideMenu.Item label="Updates" current={page === 'updates'} onclick={() => (page = 'updates')} />
        </SideMenu.Item>
        <SideMenu.Item icon="phone" label="Mobile app" />
      </SideMenu.Item>
      <SideMenu.Item icon="stack" label="Views" current={page === 'views'} onclick={() => (page = 'views')} />
    </SideMenu.Group>
    <SideMenu.Group title="Teams">
      <SideMenu.Item icon="paintBrush" label="Design" count={7} />
      <SideMenu.Item icon="code" label="Engineering" count={19} />
    </SideMenu.Group>
    <SideMenu.Group title={PACKAGE}>
      <SideMenu.Item icon="swatches" label="Kitchen sink" href="./" />
    </SideMenu.Group>
    {#snippet footer()}
      <ButtonGroup iconOnly label="Theme" options={THEMES} value={theme.value} onchange={setTheme} />
    {/snippet}
  </SideMenu>
{/snippet}

{#snippet cell(/** @type {Issue} */ i, /** @type {{ key: string }} */ col)}
  {#if col.key === 'priority'}
    <span class="priority" data-level={i.priority}><Icon name={PRIORITIES[i.priority].icon} label={PRIORITIES[i.priority].label} /></span>
  {:else if col.key === 'id'}
    <span class="data muted">{i.id}</span>
  {:else if col.key === 'title'}
    {i.title}
  {:else if col.key === 'labels'}
    <span class="chips">
      {#each i.labels as l (l)}
        <span class="label-chip"><span class="label-dot" style:--dot="var(--{LABELS[l].tone})"></span>{LABELS[l].name}</span>
      {/each}
    </span>
  {:else if col.key === 'who'}
    <span class="avatar" {@attach tooltip(PEOPLE.find((p) => p.value === i.who)?.label ?? '')}>{initials(i.who)}</span>
  {:else if col.key === 'due'}
    <span class="data">{formatShort(i.due)}</span>
  {/if}
{/snippet}

<div class="app shell">
  {#if narrow.current}
    <header class="bar">
      <Button iconOnly icon="sidebar" label="Open the menu" onclick={() => drawer?.show()} />
      <span class="brand"><span class="logo" aria-hidden="true">N</span>Northwind</span>
    </header>
    <Drawer bind:this={drawer} label="Menu" side="start" defaultWidth={280} resizable={false}>
      {@render menu()}
    </Drawer>
  {:else}
    <aside class="side">{@render menu()}</aside>
  {/if}

  <main class="view shine">
    <header class="head">
      <Breadcrumbs
        items={[
          { label: 'Projects', icon: 'folder', href: '#' },
          { label: 'Spring release', href: '#' },
          { label: 'Issues' },
        ]}
      />
      <span class="spacer"></span>
      <ButtonGroup
        iconOnly
        label="Layout"
        value={layout}
        onchange={(v) => (layout = v)}
        options={[
          { value: 'list', label: 'List', icon: 'listBullets' },
          { value: 'board', label: 'Board', icon: 'kanban' },
        ]}
      />
      <Button iconOnly icon="share" label="Share" />
      <Button variant="primary" icon="plus">New issue</Button>
    </header>

    <div class="tools">
      <FilterBar bind:filters fields={FIELDS} label="Issue filters" />
      <span class="spacer"></span>
      <SearchField bind:value={search} id="demo-search" label="Search issues" placeholder="Search" shortcut="/" class="search" />
    </div>

    <div class="body" style:--detail-w="{detailWidth}px">
      <div class="list">
        <Notice tone="info" icon="lightning">
          Code freeze for the spring release starts on Friday: after that, only fixes merge. <button type="button" class="linklike">See the plan</button>
        </Notice>

        <div class="stats">
          <Tile title="Closed" icon="checkCircle">
            <span class="figure"><span class="value">8</span> <span class="small muted">today, 60 in two weeks</span></span>
            <div class="chart"><Canvas animate={false} draw={bars} label="Issues closed per day over the last two weeks" /></div>
          </Tile>
          <Tile title="Cycle 24" icon="history">
            <span class="figure"><span class="value">69%</span> <span class="small muted">18 of 26 done</span></span>
            <div class="meter" role="meter" aria-label="Cycle progress" aria-valuenow="69" aria-valuemin="0" aria-valuemax="100"><span style:width="69%"></span></div>
          </Tile>
          <Tile title="Preview build" icon="gitBranch">
            <span class="figure"><span class="label-chip shimmer">Deploying</span></span>
            <span class="small muted"><span class="data">nw-142-date-range</span>, started 2 min ago</span>
          </Tile>
        </div>

        <Table label="Issues" columns={COLUMNS} groups={GROUPS} key={(/** @type {Issue} */ i) => i.id} bind:sort bind:collapsed selected={chosen} onselect={(/** @type {Issue} */ i) => (chosen = i.id)} rowMenu={rowMenu} rowLabel={(/** @type {Issue} */ i) => `${i.id} ${i.title}`} {cell} />
      </div>

      <Splitter value={detailWidth} min={300} max={560} defaultValue={380} side="end" label="Resize the issue panel" oninput={(w) => (detailWidth = w)} />

      <aside class="detail" aria-label="Issue {issue.id}">
        <div class="detail-head">
          <span class="data muted">{issue.id}</span>
          <span class="spacer"></span>
          <Button iconOnly small icon="link" label="Copy link" />
          <MenuButton label="More actions for {issue.id}" items={() => rowMenu(issue)} />
        </div>
        <h2>{issue.title}</h2>

        <Metadata>
          <Metadata.Row label="Status">
            <button type="button" class="chip-btn" data-tone={status.tone}><Icon name={status.icon} />{status.label}</button>
            <button type="button" class="chip-btn"><Icon name={PRIORITIES[issue.priority].icon} />{PRIORITIES[issue.priority].label}</button>
          </Metadata.Row>
          <Metadata.Row label="Assignee">
            <button type="button" class="chip-btn"><span class="avatar small">{initials(issue.who)}</span>{PEOPLE.find((p) => p.value === issue.who)?.label}</button>
          </Metadata.Row>
          <Metadata.Row label="Labels" labelTip="Add a label" onlabelclick={() => {}}>
            {#each issue.labels as l (l)}
              <button type="button" class="chip-btn outlined"><span class="label-dot" style:--dot="var(--{LABELS[l].tone})"></span>{LABELS[l].name}</button>
            {/each}
            <button type="button" class="chip-btn suggested" {@attach tooltip('Suggested: add the Docs label')}><span class="label-dot" style:--dot="var(--neutral)"></span>Docs</button>
          </Metadata.Row>
        </Metadata>

        <ActionCard title="Summary" icon="document" copy={() => summary}>
          {#snippet actions()}
            <ActionCard.Action icon="sparkle" label="Polish" pendingLabel="Polishing…" onclick={polish} />
          {/snippet}
          <p>{summary}</p>
        </ActionCard>

        <div class="builds">
          <CollapsibleAdvanced title="Checks" open={false}>
            {#snippet lead()}<Icon name="checkCircle" size="sm" />{/snippet}
            {#snippet end()}<span class="small muted data">1m 12s</span>{/snippet}
            <p class="small">Lint, types and 412 tests passed.</p>
          </CollapsibleAdvanced>
          <CollapsibleAdvanced title="Preview deploy" variant="active" loading open={false}>
            {#snippet meta()}uploading{/snippet}
          </CollapsibleAdvanced>
        </div>

        <Collapsible title="Planning" info="Where this issue sits in the cycle, and who hears about it.">
          <div class="fields">
            <Select bind:value={cycle} options={CYCLES} id="demo-cycle" label="Cycle" />
            <DatePicker bind:value={due} id="demo-due" label="Due date" />
            <Slider bind:value={estimate} min={1} max={8} id="demo-estimate" label="Estimate" format={(v) => `${v} pt`} />
            <Switch bind:checked={notify} id="demo-notify" label="Notify watchers" />
          </div>
        </Collapsible>
      </aside>
    </div>
  </main>
</div>

<Toast {toasts} onhold={() => {}} ondismiss={(id) => (toasts = toasts.filter((t) => t.id !== Number(id)))} />
<ContextMenu />
<Dialogs />

<style>
  .app {
    display: grid;
    grid-template-columns: 248px minmax(0, 1fr);
    height: 100dvh;
  }
  .side {
    min-height: 0;
    padding-block: var(--space-2);
  }
  .brand {
    display: inline-flex;
    align-items: center;
    gap: var(--gap, var(--space-2));
    min-height: 32px;
    color: var(--fg);
    font: var(--w-semibold) 14px var(--font-display);
  }
  .logo {
    display: inline-grid;
    place-items: center;
    width: 20px;
    height: 20px;
    border-radius: var(--r-sm);
    background: var(--brand);
    color: var(--accent-ink);
    font-size: 12px;
  }
  .bar {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    min-height: 44px;
    padding: 0 var(--space-3);
  }

  /* The view card, inset in the frame (Linear's app). */
  .view {
    --page-inset: var(--space-4);
    display: grid;
    grid-template-rows: auto auto minmax(0, 1fr);
    min-width: 0;
    min-height: 0;
    margin: var(--space-2) var(--space-2) var(--space-2) 0;
    border: 1px solid var(--view-line);
    border-radius: var(--r-lg);
    background: var(--view-bg);
    box-shadow: var(--view-shadow);
    overflow: clip;
  }
  .head,
  .tools {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: var(--space-2);
    padding: var(--space-2) var(--page-inset);
    border-bottom: 1px solid var(--line);
  }
  .head {
    min-height: 48px;
  }
  .spacer {
    flex: 1;
  }
  .tools :global(.search) {
    width: 200px;
  }

  .body {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto var(--detail-w);
    min-height: 0;
  }
  .list,
  .detail {
    display: flex;
    flex-direction: column;
    gap: var(--space-4);
    min-width: 0;
    min-height: 0;
    padding: var(--space-4) var(--page-inset);
    overflow-y: auto;
  }
  .detail {
    gap: var(--space-5);
  }

  .stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
    gap: var(--space-3);
  }
  .figure {
    display: flex;
    align-items: baseline;
    gap: var(--space-2);
    margin-bottom: var(--space-2);
  }
  .value {
    font: var(--w-semibold) 20px var(--font-data);
    font-variant-numeric: tabular-nums;
    color: var(--fg);
  }
  .chart {
    height: 32px;
    color: var(--accent);
  }
  .meter {
    height: 6px;
    margin-top: var(--space-3);
    border-radius: var(--r-pill);
    background: var(--fill-3);
    overflow: clip;
  }
  .meter > span {
    display: block;
    height: 100%;
    border-radius: inherit;
    background: var(--brand);
  }

  .data {
    font-family: var(--font-data);
    font-variant-numeric: tabular-nums;
    font-size: 12px;
  }
  .chips {
    display: inline-flex;
    gap: var(--space-1);
  }
  .priority {
    display: inline-flex;
    color: var(--muted);
  }
  .priority[data-level='urgent'] {
    color: var(--warning);
  }
  .avatar {
    display: inline-grid;
    place-items: center;
    width: 22px;
    height: 22px;
    flex: none;
    border-radius: var(--r-pill);
    background: var(--accent-soft);
    color: var(--fg);
    font: var(--w-semibold) 11px var(--font-body);
    user-select: none;
  }
  .avatar.small {
    width: 18px;
    height: 18px;
  }

  .detail-head {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    min-height: 24px;
  }
  h2 {
    margin-top: calc(var(--space-4) * -1);
    font: var(--w-semibold) 17px/1.35 var(--font-display);
  }
  .builds {
    display: grid;
    gap: var(--space-2);
  }
  .fields {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    align-items: end;
    gap: var(--space-4);
    padding-top: var(--space-2);
  }

  /* The issue drops under the list; the page scrolls as one. */
  @media (max-width: 1100px) {
    .app {
      height: auto;
      min-height: 100dvh;
    }
    .body {
      grid-template-columns: minmax(0, 1fr);
    }
    .body > :global(:nth-child(2)) {
      display: none;
    }
    .list,
    .detail {
      overflow: visible;
    }
    .detail {
      border-top: 1px solid var(--line);
    }
  }
  @media (max-width: 860px) {
    .app {
      grid-template-columns: minmax(0, 1fr);
      grid-template-rows: auto 1fr;
    }
    .view {
      margin: 0;
      border-inline: 0;
      border-radius: 0;
    }
  }
</style>
