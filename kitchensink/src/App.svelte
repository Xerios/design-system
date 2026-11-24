<script>
  /**
   * The kitchen sink's page: its side menu (the areas, the theme switch) beside the scroll area holding the kitchen sink,
   * and the singletons an app mounts at its root (context menu, dialogs). Below 860px the menu moves into a drawer,
   * opened from a bar at the top.
   */
  import { MediaQuery } from 'svelte/reactivity'
  import KitchenSink from './KitchenSink.svelte'
  import KitchenSinkNav from './KitchenSinkNav.svelte'
  import { PACKAGE } from './package.js'
  import Button from '@xerios/design-system/components/Button.svelte'
  import Dialogs from '@xerios/design-system/components/Dialogs.svelte'
  import Drawer from '@xerios/design-system/components/Drawer.svelte'
  import ContextMenu from '@xerios/design-system/components/menu/ContextMenu.svelte'

  const narrow = new MediaQuery('max-width: 860px')
  /** @type {Drawer | undefined} */
  let drawer = $state()
</script>

<div class="page shell">
  {#if narrow.current}
    <header class="bar">
      <Button iconOnly icon="sidebar" label="Open the menu" onclick={() => drawer?.show()} />
      <span class="bar-title">{PACKAGE}</span>
    </header>
    <Drawer bind:this={drawer} label="Menu" side="start" defaultWidth={280} resizable={false}>
      <KitchenSinkNav onpick={() => drawer?.close()} />
    </Drawer>
  {:else}
    <aside class="side">
      <KitchenSinkNav />
    </aside>
  {/if}
  <main class="view">
    <h1>Kitchen sink</h1>
    <KitchenSink nav={false} />
  </main>
</div>

<ContextMenu />
<Dialogs />

<style>
  .page {
    display: grid;
    grid-template-columns: 272px minmax(0, 1fr);
    min-height: 100dvh;
  }
  .side {
    position: sticky;
    top: 0;
    align-self: start;
    height: 100dvh;
    padding-block: var(--space-2);
    border-right: 1px solid var(--line);
  }
  .view {
    --page-inset: var(--space-8);
    min-width: 0;
    padding: var(--space-6) var(--page-inset) var(--space-8);
  }
  h1 {
    font-family: var(--font-display);
    font-size: 20px;
    font-weight: var(--w-semibold);
    padding-bottom: var(--space-2);
  }
  .bar {
    position: sticky;
    top: 0;
    z-index: var(--z-header);
    display: flex;
    align-items: center;
    gap: var(--space-2);
    min-height: 44px;
    padding: 0 var(--space-3);
    border-bottom: 1px solid var(--line);
    background: var(--bg);
  }
  .bar-title {
    font-weight: var(--w-semibold);
  }
  @media (max-width: 860px) {
    .page {
      grid-template-columns: minmax(0, 1fr);
      grid-template-rows: auto 1fr;
    }
    .view {
      --page-inset: var(--space-4);
      padding-top: var(--space-4);
    }
  }
</style>
