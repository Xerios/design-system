<script>
  /** Kitchen sink: Button in all its states, the file button, the context menu with its visible ⋯ twin, and tiles. */
  import Section from './Section.svelte'
  import Demo from './Demo.svelte'
  import Case from './Case.svelte'
  import Button from '../components/Button.svelte'
  import FileButton from '../components/inputs/FileButton.svelte'
  import MenuButton from '../components/menu/MenuButton.svelte'
  import Tile from '../components/tiles/Tile.svelte'
  import { contextMenu } from '../lib/menu.svelte.js'

  /** @param {number} ms */
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
  const fail = () =>
    wait(1200).then(() => {
      throw new Error('The server refused it. Try again in a minute.')
    })

  let files = $state('')
  let picked = $state('nothing yet')
  let pending = $state(false)
  let pressed = $state('nothing yet')
  let compact = $state(false)

  const menuItems = () => [
    { label: 'Open', icon: 'eye', action: () => (picked = 'Open') },
    { label: 'Rename…', hint: 'F2', action: () => (picked = 'Rename') },
    { label: 'Add to favourites', icon: 'star', action: () => (picked = 'Favourite') },
    { label: 'Refresh', icon: 'refresh', action: () => (picked = 'Refresh') },
    {
      label: 'Sort by',
      children: [
        { label: 'Name', checked: true, action: () => (picked = 'Sort by name') },
        { label: 'Date', checked: false, action: () => (picked = 'Sort by date') },
      ],
    },
    { label: 'Documentation', href: 'https://developer.mozilla.org/' },
    { separator: true },
    { label: 'Compact rows', toggle: true, checked: compact, action: (/** @type {boolean} */ on) => (compact = on) },
    { separator: true },
    { label: 'Locked action', disabled: true },
    { label: 'Delete', icon: 'xBold', danger: true, action: () => (picked = 'Delete') },
  ]
</script>

<Section
  id="actions"
  title="Actions"
  intro="Button runs async work itself: a spinner while the promise runs, presses ignored meanwhile, a rejection shown under it."
>
  <Demo label="Button">
    <Case label="Variants">
      <Button>Secondary</Button>
      <Button variant="primary" icon="plus">Primary</Button>
      <Button variant="danger" icon="trash">Danger</Button>
      <Button small icon="cloud">Small</Button>
    </Case>
    <Case label="Async: resolves after 1.5s">
      <Button icon="refresh" pendingLabel="Refreshing…" onclick={() => wait(1500)}>Refresh</Button>
      <Button iconOnly icon="refresh" label="Refresh" onclick={() => wait(1500)} />
    </Case>
    <Case label="Async: rejects (bubble under the button)">
      <Button variant="primary" icon="rocket" pendingLabel="Deploying…" onclick={fail}>Deploy</Button>
    </Case>
    <Case label="Pending from outside, disabled">
      <Button variant="primary" {pending} pendingLabel="Saving…">Save</Button>
      <Button onclick={() => (pending = !pending)}>{pending ? 'Stop' : 'Start'} pending</Button>
      <Button disabled>Disabled</Button>
    </Case>
    <Case label="Icon buttons (tooltip = name)">
      <Button iconOnly icon="gear" label="Settings" />
      <Button iconOnly icon="star" label="Star" />
      <Button iconOnly icon="x" label="Close" />
    </Case>
    <Case label="As a link">
      <Button href="#actions">A link drawn as a button</Button>
    </Case>
  </Demo>
  <Demo label="File button">
    <FileButton label="Choose files" multiple chosen={files} onfiles={(list) => (files = list.map((f) => f.name).join(', '))} onclear={() => (files = '')} />
  </Demo>
  <Demo label="Context menu and its ⋯ twin">
    <button type="button" class="target" {@attach contextMenu(menuItems, 'Demo item')}>Right-click, Shift+F10 or the Menu key</button>
    <MenuButton items={menuItems} label="Demo item" />
    <span class="small muted">Picked: {picked}, compact rows {compact ? 'on' : 'off'}</span>
  </Demo>
  <Demo label="Tile" span={2}>
    <Case label="Links: a call to action, an arrow that nudges on hover, ↗ for another site">
      <div class="tiles">
        <Tile title="Typography" icon="document" href="#typography" cta="See the styles">Headings, lists, quotes and code for long-form text.</Tile>
        <Tile title="Phosphor icons" icon="star" href="https://phosphoricons.com">The icon set, in its regular weight.</Tile>
        <Tile title="Foundations" icon="eye" href="#foundations" arrow={false}>Colours, type, radii and spacing, without an arrow.</Tile>
      </div>
    </Case>
    <Case label="Buttons, holding more than a line of text">
      <div class="tiles">
        <Tile title="New project" icon="plus" cta="Start" onclick={() => (pressed = 'New project')}>An empty project with the defaults.</Tile>
        <Tile title="Production" icon="cloud" onclick={() => (pressed = 'Production')}>
          <div class="meta">
            <span class="label-chip" data-tone="success"><span class="label-dot"></span>Healthy</span>
            <span class="data">3 regions · 42 ms</span>
          </div>
        </Tile>
        <Tile title="Import" icon="upload" disabled onclick={() => (pressed = 'Import')}>Paused while another import runs.</Tile>
      </div>
      <span class="small muted" role="status">Pressed: {pressed}</span>
    </Case>
    <Case label="Horizontal, for a list">
      <div class="list">
        <Tile horizontal title="Keyboard shortcuts" icon="keyboard" href="#actions">Every key the page answers to.</Tile>
        <Tile horizontal title="Appearance" icon="monitor" arrow onclick={() => (pressed = 'Appearance')}>Theme, density and motion.</Tile>
      </div>
    </Case>
    <Case label="Content only, not interactive">
      <div class="tiles">
        <Tile title="Storage" icon="folder"><span class="data">12.4 GB</span> of 50 GB used.</Tile>
      </div>
    </Case>
  </Demo>
</Section>

<style>
  .tiles {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 220px), 1fr));
    gap: var(--space-2);
    width: 100%;
  }
  .list {
    display: grid;
    gap: var(--space-2);
    width: 100%;
  }
  .meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2);
  }
  .data {
    font-family: var(--font-data);
    font-variant-numeric: tabular-nums;
  }
  .target {
    padding: var(--space-2) var(--space-3);
    background: none;
    border: 1px dashed var(--line-strong);
    border-radius: var(--r);
    color: var(--fg-2);
  }
</style>
