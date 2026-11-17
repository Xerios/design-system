<script>
  /** Inline markdown (**bold**, *italic*, `code`, [links](…), bare URLs) without {@html}. See lib/inline-md.js. */
  import { inlineMd } from '../lib/inline-md.js';
  let { text } = $props();
</script>

{#each inlineMd(text) as p, k (k)}{#if p.href}<a class="md-link" href={p.href} target="_blank" rel="noopener">{#if p.b}<strong>{p.text}</strong>{:else}{p.text}{/if}</a>{:else if p.code}<code class="md-code">{p.text}</code>{:else if p.b && p.i}<strong><em>{p.text}</em></strong>{:else if p.b}<strong>{p.text}</strong>{:else if p.i}<em>{p.text}</em>{:else}{p.text}{/if}{/each}

<style>
  .md-link { color: var(--accent); }
  .md-code { font: 400 0.88em var(--font-mono); padding: 1px 5px; border-radius: 4px; background: var(--fill-2); border: 1px solid var(--line-strong); color: var(--fg-2); }
  strong { font-weight: var(--w-semibold); }
</style>
