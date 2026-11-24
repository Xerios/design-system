<script>
  /**
   * The kitchen sink: every token, atom and component of the design system on one page, in its states, to try by hand
   * (light and dark, keyboard, narrow widths, contrast settings) and to check a change against.
   *
   *   <KitchenSink />
   *
   * It lives in the kitchensink app beside the library (not in the published package); App.svelte gives it its page.
   * It brings no page chrome: its section headings are h2, under the page's h1. The host mounts the singletons it
   * uses, as an app does anyway: <ContextMenu /> and <Dialogs />.
   * toast(message, action?): the host's way of showing a toast, so the demos use the app's one toast region. Without it
   * the kitchen sink mounts a Toast of its own (a second live region: fine standalone, redundant inside an app).
   * nav (default true): a row of links to the areas at the top. Turn it off when the page shows KitchenSinkNav instead
   * (a sidebar menu that follows the scroll).
   * Each area is its own component in this folder, made of Section and Demo; a new component gets one Demo in the area
   * it belongs to, with each of its cases in a captioned Case inside it. Laid out as most kitchen sinks and docs sites
   * are: each component an entry with its name as a heading (beside its examples on a wide page, above them on a narrow
   * one), its cases in a grid of frames across the width. The areas run from what you interact with (Actions, Inputs, Overlays),
   * through what shows content and state (Content, Feedback), to what everything is built from (Atoms, Typography, Foundations).
   * Section rules run edge to edge: set --page-inset on the scroll area to its side padding so they reach through it.
   */
  import Actions from './Actions.svelte'
  import Inputs from './Inputs.svelte'
  import Overlays from './Overlays.svelte'
  import Content from './Content.svelte'
  import Feedback from './Feedback.svelte'
  import Atoms from './Atoms.svelte'
  import Typography from './Typography.svelte'
  import Foundations from './Foundations.svelte'
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
  <Actions />
  <Inputs />
  <Overlays />
  <Content />
  <Feedback {toast} />
  <Atoms />
  <Typography />
  <Foundations />
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
    color: var(--fg);
    font-size: 12px;
    font-weight: var(--w-medium);
    text-decoration: none;
  }
  .jump a:hover {
    background: var(--fill-3);
  }
</style>
