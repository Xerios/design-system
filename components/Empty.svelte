<script>
  /** Empty state: a title, an optional line saying why or what to do, and optional actions (children) below it. */
  let { title, body = '', children } = $props();
</script>

<div class="empty">
  <h3>{title}</h3>
  {#if body}<p>{body}</p>{/if}
  {@render children?.()}
</div>

<style>
  .empty { max-width: 420px; margin: 48px auto; text-align: center; display: grid; gap: 6px; }
  h3 { font: var(--w-semibold) 15px var(--font-display); color: var(--fg); }
  p { color: var(--muted); }
</style>
