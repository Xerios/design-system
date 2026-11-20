<script>
  /** Kitchen sink: the global classes in css/atoms.css drawn on plain elements: chips, counts, keys, links, the plain table. */
  import Section from './Section.svelte'
  import Demo from './Demo.svelte'
  import Icon from '../components/Icon.svelte'
  import { tooltip } from '../lib/tooltip.js'
</script>

<Section id="atoms" title="Atoms" intro="Classes for plain elements, for the small things that don't need a component.">
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
  <Demo label="Links">
    <button type="button" class="linklike">A button that reads as a link</button>
    <a href="#atoms">A plain link</a>
  </Demo>
  <Demo label="Plain .data-table">
    <div class="data-table full">
      <table>
        <thead><tr><th scope="col">Region</th><th scope="col" class="num">Latency</th></tr></thead>
        <tbody>
          <tr><th scope="row">Frankfurt</th><td class="num">12 ms</td></tr>
          <tr><th scope="row">Singapore</th><td class="num">184 ms</td></tr>
        </tbody>
      </table>
    </div>
  </Demo>
</Section>

<style>
  .full {
    width: 100%;
    min-width: 0;
  }
</style>
