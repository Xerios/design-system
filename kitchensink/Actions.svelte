<script>
  /** Kitchen sink: buttons and their states, links, the context menu with its visible ⋯ twin, chips and small atoms. */
  import Section from './Section.svelte'
  import Demo from './Demo.svelte'
  import Button from '../components/Button.svelte'
  import Icon from '../components/Icon.svelte'
  import FileButton from '../components/inputs/FileButton.svelte'
  import MenuButton from '../components/menu/MenuButton.svelte'
  import { contextMenu } from '../lib/menu.svelte.js'
  import { tooltip } from '../lib/tooltip.js'

  /** @param {number} ms */
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
  const fail = () =>
    wait(1200).then(() => {
      throw new Error('The server refused it. Try again in a minute.')
    })

  let files = $state('')
  let picked = $state('nothing yet')
  let pending = $state(false)

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
    { label: 'Locked action', disabled: true },
    { label: 'Delete', icon: 'xBold', danger: true, action: () => (picked = 'Delete') },
  ]
</script>

<Section
  id="actions"
  title="Actions"
  intro="Button runs async work itself: a spinner while the promise runs, presses ignored meanwhile, a rejection shown under it."
>
  <Demo label="Variants">
    <Button>Secondary</Button>
    <Button variant="primary" icon="plus">Primary</Button>
    <Button variant="danger" icon="trash">Danger</Button>
    <Button small icon="cloud">Small</Button>
  </Demo>
  <Demo label="Async: resolves after 1.5s">
    <Button icon="refresh" pendingLabel="Refreshing…" onclick={() => wait(1500)}>Refresh</Button>
    <Button iconOnly icon="refresh" label="Refresh" onclick={() => wait(1500)} />
  </Demo>
  <Demo label="Async: rejects (bubble under the button)">
    <Button variant="primary" icon="rocket" pendingLabel="Deploying…" onclick={fail}>Deploy</Button>
  </Demo>
  <Demo label="Pending from outside, disabled">
    <Button variant="primary" {pending} pendingLabel="Saving…">Save</Button>
    <Button onclick={() => (pending = !pending)}>{pending ? 'Stop' : 'Start'} pending</Button>
    <Button disabled>Disabled</Button>
  </Demo>
  <Demo label="Icon buttons (tooltip = name)">
    <Button iconOnly icon="gear" label="Settings" />
    <Button iconOnly icon="star" label="Star" />
    <Button iconOnly icon="x" label="Close" />
  </Demo>
  <Demo label="Links">
    <Button href="#actions">A link drawn as a button</Button>
    <button type="button" class="linklike">A button that reads as a link</button>
    <a href="#actions">A plain link</a>
  </Demo>
  <Demo label="File button">
    <FileButton label="Choose files" multiple chosen={files} onfiles={(list) => (files = list.map((f) => f.name).join(', '))} onclear={() => (files = '')} />
  </Demo>
  <Demo label="Context menu and its ⋯ twin">
    <button type="button" class="target" {@attach contextMenu(menuItems, 'Demo item')}>Right-click, Shift+F10 or the Menu key</button>
    <MenuButton items={menuItems} label="Demo item" />
    <span class="small muted">Picked: {picked}</span>
  </Demo>
  <Demo label="Label chips and tones">
    {#each ['success', 'info', 'warning', 'neutral', 'danger'] as tone (tone)}
      <span class="label-chip" data-tone={tone}><span class="label-dot"></span>{tone}</span>
    {/each}
    <span class="label-chip"><Icon name="lock" size="sm" />With an icon</span>
    <span class="label-chip icon-only" {@attach tooltip('Starred')} aria-label="Starred" role="img"><Icon name="star" size="sm" /></span>
  </Demo>
  <Demo label="Counts, keys, dots">
    <span class="count">12</span>
    <kbd>⌘</kbd><kbd>K</kbd>
    <span class="new-dot" aria-hidden="true"></span><span class="small muted">new</span>
  </Demo>
</Section>

<style>
  .target {
    padding: var(--space-2) var(--space-3);
    background: none;
    border: 1px dashed var(--line-strong);
    border-radius: var(--r);
    color: var(--fg-2);
  }
</style>
