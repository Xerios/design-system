<script>
  /** Kitchen sink: the tokens (colour, type, radius, spacing, elevation) and every registered icon. */
  import Section from './Section.svelte'
  import Demo from './Demo.svelte'
  import Icon, { iconNames } from '../components/Icon.svelte'

  const COLOURS = [
    { group: 'Surfaces', tokens: ['--bg', '--view-bg', '--surface', '--surface-2', '--surface-3', '--elevated'] },
    { group: 'Text', tokens: ['--fg', '--fg-2', '--muted', '--faint'] },
    { group: 'Fills (on any surface)', tokens: ['--fill-1', '--fill-2', '--fill-3', '--fill-4'] },
    { group: 'Accent', tokens: ['--accent', '--brand', '--accent-soft', '--accent-line'] },
    { group: 'Tones', tokens: ['--success', '--info', '--warning', '--neutral', '--danger'] },
  ]
  const RADII = ['--r-sm', '--r', '--r-lg', '--r-xl', '--r-pill']
  const SPACING = ['--space-1', '--space-2', '--space-3', '--space-4', '--space-5', '--space-6', '--space-8']
  const SHADOWS = ['--shadow-sm', '--shadow-md', '--shadow-btn', '--shadow']
</script>

<Section id="foundations" title="Foundations" intro="The tokens everything is drawn with (css/tokens.css). Switch the theme to see both sides of each.">
  {#each COLOURS as { group, tokens } (group)}
    <Demo label={group}>
      <ul class="swatches">
        {#each tokens as token (token)}
          <li><span class="swatch" style:background="var({token})"></span><code>{token}</code></li>
        {/each}
      </ul>
    </Demo>
  {/each}
  <Demo label="Type">
    <div class="type">
      <span class="body">Body, 13px: the default for text and controls</span>
      <span class="small muted">Secondary and labels, 12px</span>
      <span class="count">11px counts</span>
      <span class="mono">Data: 2026-11-18 · 1,024 ms</span>
      <span class="eyebrow">Eyebrow, a section label</span>
    </div>
  </Demo>
  <Demo label="Radii">
    {#each RADII as token (token)}<span class="radius" style:border-radius="var({token})"><code>{token.slice(2)}</code></span>{/each}
  </Demo>
  <Demo label="Spacing (4px base)">
    <ul class="spacing">
      {#each SPACING as token (token)}<li><span class="bar" style:width="var({token})"></span><code>{token}</code></li>{/each}
    </ul>
  </Demo>
  <Demo label="Elevation (floating layers only)">
    {#each SHADOWS as token (token)}<span class="raised" style:box-shadow="var({token})"><code>{token.slice(2)}</code></span>{/each}
  </Demo>
  <Demo label="Icons, as registered (Phosphor regular)" wide>
    <ul class="icons">
      {#each iconNames() as name (name)}
        <li><Icon {name} /><code>{name}</code></li>
      {/each}
    </ul>
  </Demo>
</Section>

<style>
  .swatches,
  .spacing,
  .icons {
    display: grid;
    gap: var(--space-1);
    width: 100%;
  }
  .swatches li,
  .spacing li {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }
  .swatch {
    width: 28px;
    height: 20px;
    flex: none;
    border-radius: var(--r-sm);
    box-shadow: inset 0 0 0 1px var(--line-strong);
  }
  code {
    font: 12px var(--font-data);
    color: var(--fg-2);
  }
  .type {
    display: grid;
    gap: var(--space-2);
  }
  .mono {
    font-family: var(--font-data);
    font-variant-numeric: tabular-nums;
  }
  .radius,
  .raised {
    display: grid;
    place-items: center;
    width: 64px;
    height: 48px;
    border: 1px solid var(--line-strong);
    background: var(--elevated);
  }
  .raised {
    border: 0;
    border-radius: var(--r-lg);
  }
  .bar {
    height: 8px;
    border-radius: 2px;
    background: var(--brand);
  }
  .icons {
    grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  }
  .icons li {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    min-width: 0;
    color: var(--fg-2);
  }
</style>
