<script>
  /**
   * The kitchen sink's page: the areas menu and a theme switch in a sidebar, the kitchen sink itself in the scroll area
   * beside it, and the singletons an app mounts at its root (context menu, dialogs). Below 860px the sidebar stacks
   * above the view and its menu becomes a row.
   * The theme choice is kept in localStorage ('ks-theme') and applied before the first paint by index.html.
   */
  import KitchenSink from './KitchenSink.svelte'
  import KitchenSinkNav from './KitchenSinkNav.svelte'
  import Segmented from '@xerios/design-system/components/inputs/Segmented.svelte'
  import ContextMenu from '@xerios/design-system/components/menu/ContextMenu.svelte'
  import Dialogs from '@xerios/design-system/components/Dialogs.svelte'

  const THEMES = [
    { value: 'system', label: 'System', icon: 'monitor' },
    { value: 'light', label: 'Light', icon: 'sun' },
    { value: 'dark', label: 'Dark', icon: 'moon' },
  ]

  let theme = $state(document.documentElement.dataset.theme ?? 'system')

  /** @param {string} value */
  function setTheme(value) {
    theme = value
    if (value === 'system') delete document.documentElement.dataset.theme
    else document.documentElement.dataset.theme = value
    try {
      if (value === 'system') localStorage.removeItem('ks-theme')
      else localStorage.setItem('ks-theme', value)
    } catch {
      // Storage blocked (private mode, policy): the choice lasts until reload.
    }
  }
</script>

<div class="page shell">
  <aside class="side">
    <KitchenSinkNav />
    <div class="theme">
      <Segmented label="Theme" options={THEMES} value={theme} onchange={setTheme} iconOnly />
    </div>
  </aside>
  <main class="view">
    <h1>Design system</h1>
    <KitchenSink nav={false} />
  </main>
</div>

<ContextMenu />
<Dialogs />

<style>
  .page {
    display: grid;
    grid-template-columns: 200px minmax(0, 1fr);
    min-height: 100dvh;
  }
  .side {
    position: sticky;
    top: 0;
    align-self: start;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: var(--space-4);
    height: 100dvh;
    padding: var(--space-4) var(--space-3);
    border-right: 1px solid var(--line);
    overflow-y: auto;
  }
  .theme {
    padding: 0 var(--space-2);
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
  @media (max-width: 860px) {
    .page {
      grid-template-columns: minmax(0, 1fr);
    }
    .side {
      position: sticky;
      z-index: var(--z-sticky);
      height: auto;
      flex-direction: row;
      align-items: center;
      padding: var(--space-2) var(--space-3);
      border-right: 0;
      border-bottom: 1px solid var(--line);
      background: var(--bg);
    }
    .view {
      --page-inset: var(--space-4);
      padding-top: var(--space-4);
    }
  }
</style>
