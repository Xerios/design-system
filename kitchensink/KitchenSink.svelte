<script>
  /**
   * The kitchen sink: every token, atom and component of the design system on one page, in its states, to try by hand
   * (light and dark, keyboard, narrow widths, contrast settings) and to check a change against.
   *
   *   import KitchenSink from '$ds/kitchensink/KitchenSink.svelte'
   *   <KitchenSink />
   *
   * Mount it inside a page (it brings no page chrome: its section headings are h2, under the page's h1). The host
   * mounts the singletons it uses, as an app does anyway: <ContextMenu /> and <Dialogs />.
   * toast(message, action?): the host's way of showing a toast, so the demos use the app's one toast region. Without it
   * the kitchen sink mounts a Toast of its own (a second live region: fine standalone, redundant inside an app).
   * nav (default true): a row of links to the areas at the top. Turn it off when the page shows KitchenSinkNav instead
   * (a sidebar menu that follows the scroll).
   * Each area is its own component in this folder (Foundations, Actions, Feedback, Inputs, Overlays, Content), made of
   * Section and Demo; a new component gets a Demo in the area it belongs to.
   */
  import Foundations from './Foundations.svelte'
  import Actions from './Actions.svelte'
  import Feedback from './Feedback.svelte'
  import Inputs from './Inputs.svelte'
  import Overlays from './Overlays.svelte'
  import Content from './Content.svelte'
  import { AREAS, jump } from './areas.js'

  /** @type {{ toast?: (message: string, action?: { label: string, run: () => void }) => void, nav?: boolean }} */
  let { toast, nav = true } = $props()
</script>

<div class="kitchen-sink">
  {#if nav}
    <nav aria-label="Design system areas" class="jump">
      {#each AREAS as area (area.id)}
        <a href="#{area.id}" onclick={(e) => jump(e, area.id)}>{area.label}</a>
      {/each}
    </nav>
  {/if}
  <Foundations />
  <Actions />
  <Feedback {toast} />
  <Inputs />
  <Overlays />
  <Content />
</div>

<style>
  .kitchen-sink {
    display: grid;
    min-width: 0;
  }
  .jump {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1);
    padding-bottom: var(--space-4);
  }
  .jump a {
    display: inline-flex;
    align-items: center;
    min-height: 28px;
    padding: 0 var(--space-3);
    border-radius: var(--r-pill);
    background: var(--fill-2);
    color: var(--fg-2);
    font-size: 12px;
    font-weight: var(--w-medium);
    text-decoration: none;
  }
  .jump a:hover {
    background: var(--fill-3);
    color: var(--fg);
  }
</style>
