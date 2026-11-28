<script>
  /** Kitchen sink: notices, errors, working states, empty states, the toast, the spotlight and the new-content glow. */
  import { tick } from 'svelte'
  import Section from './Section.svelte'
  import Demo from './Demo.svelte'
  import Case from './Case.svelte'
  import Button from '@xerios/design-system/components/Button.svelte'
  import Empty from '@xerios/design-system/components/empty/index.js'
  import ErrorMessage from '@xerios/design-system/components/ErrorMessage.svelte'
  import Notice from '@xerios/design-system/components/Notice.svelte'
  import Shimmer from '@xerios/design-system/components/Shimmer.svelte'
  import Toast from '@xerios/design-system/components/Toast.svelte'
  import WorkingBorder from '@xerios/design-system/components/WorkingBorder.svelte'
  import { spotlight } from '@xerios/design-system/lib/spotlight.js'
  import { edgeGlow } from '@xerios/design-system/lib/edge-glow.js'
  import { scrollFade } from '@xerios/design-system/lib/scroll-fade.js'

  // Edge glow: three short feeds, each adding a row where its glow points.
  let feeds = $state({
    below: Array.from({ length: 8 }, (_, i) => `Message ${i + 1}`),
    above: Array.from({ length: 8 }, (_, i) => `Item ${i + 1}`),
    held: Array.from({ length: 8 }, (_, i) => `Entry ${i + 1}`),
  })
  /** @type {Record<string, HTMLElement | undefined>} */
  const feedEls = {}
  let added = 0
  /** @param {'below' | 'above' | 'held'} key */
  async function arrive(key) {
    const el = feedEls[key]
    if (!el) return
    added += 1
    if (key === 'above') {
      // At the top a new row lands in view, and there is nothing to point at: go to the end first, as a feed someone
      // has read down would be. Then hold the rows in view where they are while the new one goes in above them (by
      // hand, so it doesn't hang on the browser's scroll anchoring, which the feed turns off).
      if (el.scrollTop < 1) el.scrollTop = el.scrollHeight
      const from = el.scrollHeight - el.scrollTop
      feeds.above.unshift(`New item ${added}`)
      await tick()
      el.scrollTop = el.scrollHeight - from
      edgeGlow(el, { side: 'above', announce: 'New item above' })
    } else {
      feeds[key].push(`New ${key === 'held' ? 'entry' : 'message'} ${added}`)
      edgeGlow(el, { duration: key === 'held' ? Infinity : 3000, announce: 'New message below' })
    }
  }

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
  <Demo label="Toast" description="At the bottom of the window; hover the stack to fan it out.">
    <Button onclick={() => show('Saved.')}>Show a toast</Button>
    <Button
      onclick={() => ['Build started.', 'Uploaded 12 files.', 'Cache cleared.', 'Saved.'].forEach((m, i) => setTimeout(() => show(m), i * 300))}
      >Show several</Button
    >
    <Button onclick={() => show('Deleted 3 items.', { label: 'Undo', run: () => show('Restored.') })}>With an action</Button>
  </Demo>
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
  <Demo label="Working" description="Shimmering text, and a border that runs while a card is at work.">
    <Shimmer>Checking the server…</Shimmer>
    <span class="label-chip shimmer"><Shimmer>Deploying</Shimmer></span>
    <div class="busy">A card at work<WorkingBorder /></div>
  </Demo>
  <Demo label="Spotlight" description="Points at something on the page.">
    <Button onclick={() => spotlight('ks-spot')}>Point at the target</Button>
    <span id="ks-spot" class="spot">The target</span>
  </Demo>
  <Demo label="Edge glow">
    <Case label="New below: fades after 3s, or once scrolled to the end">
      {@render feed('below')}
    </Case>
    <Case label="New above: from the end, as someone reading down would be">
      {@render feed('above')}
    </Case>
    <Case label="Held until seen (duration: Infinity)">
      {@render feed('held')}
    </Case>
  </Demo>
</Section>

{#if !hostToast}
  <Toast {toasts} onhold={hold} ondismiss={(id) => dismiss(Number(id))} />
{/if}

{#snippet feed(/** @type {'below' | 'above' | 'held'} */ key)}
  <div class="stack feed-case">
    <div class="feed-box">
      <ul class="feed" bind:this={feedEls[key]} {@attach scrollFade({ size: 24 })}>
      {#each feeds[key] as line (line)}<li class="small">{line}</li>{/each}
      </ul>
    </div>
    <div><Button small icon="plus" onclick={() => arrive(key)}>{key === 'above' ? 'Add above' : 'Add below'}</Button></div>
  </div>
{/snippet}

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
  .feed-case {
    width: 100%;
  }
  .feed-box {
    border: 1px solid var(--line);
    border-radius: var(--r-lg);
  }
  .feed {
    height: 160px;
    border-radius: calc(var(--r-lg) - 1px);
    margin: 0;
    padding: var(--space-2) var(--space-3);
    overflow: auto;
    list-style: none;
    overflow-anchor: none;
  }
  .feed li {
    padding-block: var(--space-1);
  }
  .spot {
    padding: var(--space-1) var(--space-2);
    border-radius: var(--r);
  }
</style>
