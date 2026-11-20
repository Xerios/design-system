<script>
  /** Kitchen sink: notices, errors, working states, empty states, the toast and the spotlight. */
  import Section from './Section.svelte'
  import Demo from './Demo.svelte'
  import Case from './Case.svelte'
  import Button from '../components/Button.svelte'
  import Empty from '../components/empty/index.js'
  import ErrorMessage from '../components/ErrorMessage.svelte'
  import Notice from '../components/Notice.svelte'
  import Shimmer from '../components/Shimmer.svelte'
  import Toast from '../components/Toast.svelte'
  import WorkingBorder from '../components/WorkingBorder.svelte'
  import { spotlight } from '../lib/spotlight.js'

  /** @param {number} ms */
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

  /** @type {{ toast?: (message: string, action?: { label: string, run: () => void }) => void }} */
  let { toast: hostToast } = $props()

  // The host's toasts when it passes them (the app's single region); otherwise a Toast of the kitchen sink's own, whose
  // list and timers it keeps here, as an app would.
  /** @type {{ id: number, message: string, action?: { label: string, run: () => void } }[]} */
  let toasts = $state([])
  let held = false
  /** @type {Map<number, ReturnType<typeof setTimeout>>} */
  const timers = new Map()
  let shown = 0
  /** @param {number} id */
  const arm = (id) => timers.set(id, setTimeout(() => dismiss(id), 5000))
  /** @param {string} message @param {{ label: string, run: () => void }} [action] */
  function show(message, action) {
    if (hostToast) return hostToast(message, action)
    const id = ++shown
    toasts.push({ id, message, action })
    if (!held) arm(id)
  }
  /** @param {number} id */
  function dismiss(id) {
    clearTimeout(timers.get(id))
    timers.delete(id)
    toasts = toasts.filter((t) => t.id !== id)
  }
  /** @param {boolean} on */
  function hold(on) {
    held = on
    for (const timer of timers.values()) clearTimeout(timer)
    timers.clear()
    if (!on) for (const t of toasts) arm(t.id)
  }
  let floating = $state('That name is taken.')
</script>

<Section id="feedback" title="Feedback" intro="Standing conditions, failures, work in progress and nothing-here states.">
  <Demo label="Notices" wide>
    <div class="stack">
      {#each ['neutral', 'info', 'success', 'warning', 'danger'] as tone (tone)}
        <Notice {tone}>A {tone} notice, about a standing condition of the page. <button type="button" class="linklike">Act on it</button>.</Notice>
      {/each}
    </div>
  </Demo>
  <Demo label="Error message">
    <Case label="Inline (an alert)">
      <ErrorMessage message="Couldn't save. The server didn't answer." />
    </Case>
    <Case label="Floating, under its control">
      <div class="anchor">
        <Button onclick={() => (floating = floating ? '' : 'That name is taken.')}>Toggle the bubble</Button>
        <ErrorMessage floating message={floating} />
      </div>
    </Case>
  </Demo>
  <Demo label="Working">
    <Shimmer>Checking the server…</Shimmer>
    <span class="label-chip shimmer"><Shimmer>Deploying</Shimmer></span>
    <div class="busy">A card at work<WorkingBorder /></div>
  </Demo>
  <Demo label="Toast (bottom of the window; hover the stack to fan it out)">
    <Button onclick={() => show('Saved.')}>Show a toast</Button>
    <Button
      onclick={() => ['Build started.', 'Uploaded 12 files.', 'Cache cleared.', 'Saved.'].forEach((m, i) => setTimeout(() => show(m), i * 300))}
      >Show several</Button
    >
    <Button onclick={() => show('Deleted 3 items.', { label: 'Undo', run: () => show('Restored.') })}>With an action</Button>
  </Demo>
  <Demo label="Spotlight">
    <Button onclick={() => spotlight('ks-spot')}>Point at the target</Button>
    <span id="ks-spot" class="spot">The target</span>
  </Demo>
  <Demo label="Empty">
    <Case label="Empty">
      <Empty title="Nothing here yet" body="Things you add show up here.">
        <div><Button variant="primary" icon="plus">Add one</Button></div>
      </Empty>
    </Case>
    <Case label="Empty.Error (retry is async)">
      <Empty.Error title="Couldn't load the list" message="The server took too long to answer." onretry={() => wait(1500)} />
    </Case>
  </Demo>
</Section>

{#if !hostToast}
  <Toast {toasts} onhold={hold} ondismiss={(id) => dismiss(Number(id))} />
{/if}

<style>
  .stack {
    display: grid;
    gap: var(--space-2);
  }
  .anchor {
    position: relative;
    padding-bottom: 44px;
  }
  .busy {
    position: relative;
    padding: var(--space-3) var(--space-4);
    border: 1px solid var(--line);
    border-radius: var(--r-xl);
    color: var(--fg-2);
  }
  .spot {
    padding: var(--space-1) var(--space-2);
    border-radius: var(--r);
  }
</style>
