<script>
  /**
   * Kitchen sink: the global classes in css/atoms.css drawn on plain elements: chips, counts, keys, links, the plain table;
   * and the light and texture from css/effects.css and the tokens: shine, corner glow, grain.
   */
  import Section from './Section.svelte'
  import Demo from './Demo.svelte'
  import Case from './Case.svelte'
  import Icon from '@xerios/design-system/components/Icon.svelte'
  import { tooltip } from '@xerios/design-system/lib/tooltip.js'
</script>

<Section id="atoms" title="Atoms" intro="Classes for plain elements, for the small things that don't need a component.">
  <Demo label="Chip buttons">
    <Case label="Borderless: hover for the fill">
      <button type="button" class="chip-btn"><Icon name="circleDashed" />Planned</button>
      <button type="button" class="chip-btn"><Icon name="monitor" />Web app</button>
      <a class="chip-btn" href="#atoms"><Icon name="link" />A link</a>
      <button type="button" class="chip-btn" disabled><Icon name="star" />Disabled</button>
    </Case>
    <Case label="Suggested: dashed until taken, solid on hover">
      <button type="button" class="chip-btn suggested"><Icon name="plus" />Frontend</button>
      <button type="button" class="chip-btn suggested"><span class="label-dot" style:--dot="var(--success)"></span>Ready to ship</button>
      <button type="button" class="btn btn-small suggested"><Icon name="plus" size="sm" />Assign to me</button>
    </Case>
    <Case label="Outlined, led by dots">
      <button type="button" class="chip-btn outlined"><span class="label-dot" style:--dot="var(--info)"></span>Design</button>
      <button type="button" class="chip-btn outlined"><span class="label-dot" style:--dot="var(--warning)"></span>Core experience</button>
    </Case>
  </Demo>
  <Demo label="Label chips and tones">
    {#each ['success', 'info', 'warning', 'neutral', 'danger'] as tone (tone)}
      <span class="label-chip" data-tone={tone}><span class="label-dot"></span>{tone}</span>
    {/each}
    <span class="label-chip"><Icon name="lock" size="sm" />With an icon</span>
    <span class="label-chip suggested"><span class="label-dot" style:--dot="var(--info)"></span>Suggested</span>
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
  <Demo label="Shine (.shine): a beam on the edge, placed with --shine-x and --shine-y">
    <div class="specimen shine">Default</div>
    <div class="specimen shine" style:--shine-x="100%" style:--shine-y="0">Top right</div>
  </Demo>
  <Demo label="Corner glow (.corner-glow): a soft light from the top-left corner">
    <div class="specimen">Without</div>
    <div class="specimen"><span class="corner-glow" aria-hidden="true"></span>With</div>
  </Demo>
  <Demo label="Grain (--grain): film grain over the scrim, as modal backdrops draw it">
    <div class="specimen scrim">Scrim</div>
    <div class="specimen scrim grain">Scrim with grain</div>
  </Demo>
</Section>

<style>
  .full {
    width: 100%;
    min-width: 0;
  }
  /* A card to light: its own stacking context, so the shine stays under the page's sticky parts and the glow behind
     the label. It shrinks to 120px so a pair fits side by side in one column of the Section. */
  .specimen {
    position: relative;
    isolation: isolate;
    display: flex;
    align-items: flex-end;
    flex: 1 1 120px;
    max-width: 160px;
    min-height: 96px;
    padding: var(--space-3);
    border: 1px solid var(--line);
    border-radius: var(--r-xl);
    background: var(--view-bg);
    font-size: 12px;
    color: var(--fg-2);
  }
  .scrim {
    background: linear-gradient(var(--scrim), var(--scrim)), var(--view-bg);
  }
  .scrim.grain {
    background:
      var(--grain) 0 0 / 256px 256px,
      linear-gradient(var(--scrim), var(--scrim)),
      var(--view-bg);
  }
</style>
