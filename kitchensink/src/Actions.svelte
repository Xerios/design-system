<script>
  /** Kitchen sink: Button in all its states, the context menu with its visible ⋯ twin. */
  import Section from './Section.svelte'
  import Demo from './Demo.svelte'
  import Case from './Case.svelte'
  import Button from '@xerios/design-system/components/Button.svelte'
  import ErrorMessage from '@xerios/design-system/components/ErrorMessage.svelte'
  import MenuButton from '@xerios/design-system/components/menu/MenuButton.svelte'
  import { contextMenu } from '@xerios/design-system/lib/menu.svelte.js'

  /** @param {number} ms */
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
  const fail = () =>
    wait(1200).then(() => {
      throw new Error('The server refused it. Try again in a minute.')
    })

  let picked = $state('nothing yet')
  let deployError = $state('')
  let pending = $state(false)
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
  intro="Button runs async work itself: a spinner while the promise runs, presses ignored meanwhile, a rejection handed to onerror."
>
  <Demo label="Button" description="Variants, icons, and async work with its pending state.">
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
    <Case label="Async: rejects, and onerror says so beside it">
      <Button
        variant="primary"
        icon="rocket"
        pendingLabel="Deploying…"
        onclick={() => ((deployError = ''), fail())}
        onerror={(e) => (deployError = e instanceof Error ? e.message : 'That didn’t work.')}>Deploy</Button
      >
      <ErrorMessage message={deployError} />
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
  <Demo label="Context menu" description="Right-click, Shift+F10 or the Menu key; MenuButton is its visible ⋯ twin.">
    <button type="button" class="target" {@attach contextMenu(menuItems, 'Demo item')}>Right-click, Shift+F10 or the Menu key</button>
    <MenuButton items={menuItems} label="Demo item" />
    <span class="small muted">Picked: {picked}, compact rows {compact ? 'on' : 'off'}</span>
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
