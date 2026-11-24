<script>
  /** Kitchen sink: tooltips, ⓘ tips, a side tip beside a list, the popover, a modal with an unsaved-input guard, and alert / confirm / prompt. */
  import Section from './Section.svelte'
  import Demo from './Demo.svelte'
  import Case from './Case.svelte'
  import Button from '@xerios/design-system/components/Button.svelte'
  import Icon from '@xerios/design-system/components/Icon.svelte'
  import InfoTip from '@xerios/design-system/components/InfoTip.svelte'
  import Modal from '@xerios/design-system/components/Modal.svelte'
  import Drawer from '@xerios/design-system/components/Drawer.svelte'
  import Popover from '@xerios/design-system/components/Popover.svelte'
  import Tooltip from '@xerios/design-system/components/Tooltip.svelte'
  import SideTip from '@xerios/design-system/components/SideTip.svelte'
  import Switch from '@xerios/design-system/components/inputs/Switch.svelte'
  import TextField from '@xerios/design-system/components/inputs/TextField.svelte'
  import { alertDialog, confirmDialog, promptDialog } from '@xerios/design-system/lib/dialogs.svelte.js'
  import { tooltip } from '@xerios/design-system/lib/tooltip.js'

  let answer = $state('none yet')
  let onlyMine = $state(false)
  /** @type {Modal | undefined} */
  let modal = $state()
  let draft = $state('')
  /** @type {Drawer | undefined} */
  let drawer = $state()
  let drawerWidth = $state(/** @type {number | undefined} */ (undefined))

  // A list of your own with a SideTip: the row under the pointer or the focus says more.
  const TARGETS = [
    { label: 'Production', title: 'Production', text: 'What people use. A deploy here goes out to everyone at once.' },
    { label: 'Staging', title: 'Staging', text: 'A copy of production, on its own data, for a last look before release.' },
    { label: 'Preview', title: 'Preview', text: 'One per branch, gone a week after its last push.' },
  ]
  let targetAt = $state(-1)
  /** @type {HTMLUListElement | undefined} */
  let targetList = $state()

  async function confirmDiscard() {
    if (!draft.trim()) return true
    return confirmDialog({ title: 'Discard this note?', body: 'What you typed is lost.', confirmLabel: 'Discard', cancelLabel: 'Keep editing', danger: true })
  }
</script>

<Section id="overlays" title="Overlays" intro="Everything that floats draws in the top layer, so it shows above modal dialogs too.">
  <Demo label="Tooltip" description="On hover and keyboard focus.">
    <Case label="Attachment (hover or keyboard focus)">
      <button type="button" class="icon-btn" aria-label="Copy" {@attach tooltip('Copy')}><Icon name="external" /></button>
      <button type="button" class="btn" {@attach tooltip('Search everything', { shortcut: '/' })}>With a shortcut</button>
    </Case>
    <Case label="Around content">
      <Tooltip>
        {#snippet tip()}<strong>Build 1,024</strong><span>Finished 2 minutes ago</span>{/snippet}
        <span class="label-chip" data-tone="success"><span class="label-dot"></span>Live</span>
      </Tooltip>
    </Case>
  </Demo>
  <Demo label="Info tip" description="ⓘ beside a label, open on hover; a pinnable one stays open on a click.">
    <span class="field-head"
      ><span class="field-label">Retention</span><InfoTip lines={[{ text: 'How long logs are kept before they are deleted.' }]} label="About retention" /></span
    >
    <span class="field-head"
      ><span class="field-label">Pinnable</span><InfoTip
        pinnable
        label="About limits"
        lines={[
          { label: 'Requests', text: '1,000 a minute' },
          { label: 'Storage', text: '10 GB' },
        ]}
      /></span
    >
  </Demo>
  <Demo label="Side tip" description="Detail beside a list, level with its row.">
    <Case label="Beside a list of your own, level with the row under the pointer or the focus">
      <ul class="targets" bind:this={targetList}>
        {#each TARGETS as t, i (t.label)}
          <li>
            <button
              type="button"
              class="target"
              id="ks-target-{i}"
              aria-describedby={targetAt === i ? 'ks-target-tip' : undefined}
              onpointerenter={() => (targetAt = i)}
              onpointerleave={() => (targetAt = -1)}
              onfocus={() => (targetAt = i)}
              onblur={() => (targetAt = -1)}>{t.label}</button
            >
          </li>
        {/each}
      </ul>
      {#if targetAt >= 0}
        <SideTip id="ks-target-tip" for="ks-target-{targetAt}" beside={targetList} title={TARGETS[targetAt].title} text={TARGETS[targetAt].text} />
      {/if}
    </Case>
  </Demo>
  <Demo label="Popover" description="A panel opened from its button.">
    <Popover id="ks-popover" label="Filters" badge={onlyMine ? 1 : null}>
      {#snippet trigger()}<Icon name="funnel" />{/snippet}
      {#snippet children({ close })}
        <div class="panel">
          <Switch bind:checked={onlyMine} id="ks-mine" label="Only mine" />
          <Button small onclick={close}>Done</Button>
        </div>
      {/snippet}
    </Popover>
  </Demo>
  <Demo label="Modal" description="Asks before throwing away what's typed.">
    <Button onclick={() => modal?.show()}>Open the modal</Button>
  </Demo>
  <Demo label="Drawer" description="Drag its edge to resize it; Esc, the backdrop or ✕ closes it.">
    <Button onclick={() => drawer?.show()}>Open the drawer</Button>
    <span class="small muted">Width: {drawerWidth ? `${drawerWidth}px` : 'default'}</span>
  </Demo>
  <Demo label="Alert, confirm, prompt" description="Plain questions, awaited from script.">
    <Button onclick={async () => (await alertDialog({ title: 'Upload failed', body: 'The file is over 50 MB.' }), (answer = 'alert closed'))}>Alert</Button>
    <Button onclick={async () => (answer = String(await confirmDialog({ title: 'Delete 3 items?', confirmLabel: 'Delete', danger: true })))}>Confirm</Button>
    <Button
      onclick={async () =>
        (answer = String(await promptDialog({ title: 'Rename', label: 'Name', value: 'draft', validate: (v) => (v.trim() ? '' : 'Enter a name') })))}
      >Prompt</Button
    >
    <span class="small muted">Answer: {answer}</span>
  </Demo>
</Section>

<Modal bind:this={modal} title="A note" canClose={confirmDiscard} onclose={() => (draft = '')}>
  <form id="ks-modal-form" class="dialog-body" novalidate onsubmit={(e) => (e.preventDefault(), modal?.close())}>
    <TextField bind:value={draft} id="ks-modal-note" label="Note" type="text" placeholder="Type, then try Esc or the backdrop" autofocus />
  </form>
  <footer class="dialog-foot">
    <span class="spacer"></span>
    <Button onclick={() => modal?.requestClose()}>Cancel</Button>
    <Button type="submit" form="ks-modal-form" variant="primary">Save</Button>
  </footer>
</Modal>

<Drawer bind:this={drawer} label="Build 1,024" bind:width={drawerWidth}>
  <div class="sheet">
    <h2>Build 1,024</h2>
    <p class="muted">Finished 2 minutes ago, in 1m 12s.</p>
    {#each Array.from({ length: 12 }, (_, i) => i + 1) as step (step)}
      <p>Step {step}: compiled, checked and packed. The content scrolls inside the drawer, with its edges fading while there is more.</p>
    {/each}
    <div><Button variant="primary" onclick={() => drawer?.close()}>Done</Button></div>
  </div>
</Drawer>

<style>
  .sheet {
    display: grid;
    gap: var(--space-3);
  }
  .sheet h2 {
    font: var(--w-semibold) 16px var(--font-display);
  }
  .panel {
    display: grid;
    gap: var(--space-3);
    justify-items: start;
    padding: var(--space-3);
  }
  .targets {
    display: grid;
    gap: 2px;
    width: 200px;
    margin: 0;
    padding: 4px;
    list-style: none;
    border: 1px solid var(--line);
    border-radius: var(--r-lg);
    user-select: none;
  }
  .target {
    width: 100%;
    min-height: 32px;
    padding: 0 10px;
    border: 0;
    border-radius: var(--r-sm);
    background: none;
    color: var(--fg);
    font-size: 13px;
    text-align: left;
    cursor: pointer;
  }
  .target:hover,
  .target:focus-visible {
    background: var(--control-3);
  }
</style>
