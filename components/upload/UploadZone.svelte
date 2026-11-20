<script>
  import { setContext, untrack } from 'svelte'
  import Icon from '../Icon.svelte'
  import { fileDrop } from '../../lib/files.js'
  import { fade, durations } from '../../lib/motion.js'
  import { UPLOAD_ZONE } from './context.js'
  /**
   * A larger place to drop files on, for the Upload inside it: whatever is dropped anywhere on the zone goes to that
   * Upload as if dropped on its button (held to its `accept`, with its error under it). Import it as Upload.Zone
   * (components/upload/index.js).
   *
   *   <Upload.Zone>
   *     <Upload.Images bind:files />
   *   </Upload.Zone>
   *
   *   <Upload.Zone bare>                    any area (a card, a dialog's body), marked only while files are over it
   *     …the area's content…
   *     <Upload.Folder bind:folder />
   *   </Upload.Zone>
   *
   * By default it is a dashed area: an icon and the hint over its content, all centred. bare: no frame of its own (it
   * takes its parent's corner radius); while files are dragged over it, a dashed overlay with the hint covers it.
   * hint: the line saying what to drop (default: the Upload's own, such as "Drop images here"). One Upload per zone;
   * with more, the first takes the drops. While that Upload is disabled the zone takes nothing.
   * Other attributes (class…) and attachments go to the <div>.
   *
   * Keyboard: the zone is not a control. The Upload inside is reached and used as usual.
   *
   * @typedef {object} Props
   * @property {boolean} [bare]
   * @property {string} [hint]
   * @property {import('svelte').Snippet} [children]
   */
  /** @type {Props & Omit<import('svelte/elements').HTMLAttributes<HTMLDivElement>, keyof Props>} */
  let { bare = false, hint, class: className, children, ...rest } = $props()

  /** @type {{ take: (drop: import('../../lib/files.js').Dropped) => void, hint: string }[]} */
  let takers = $state.raw([])
  let dragging = $state(false)
  const line = $derived(hint ?? takers[0]?.hint ?? 'Drop files here')

  /** @type {import('./context.js').UploadZoneContext} */
  const zone = {
    get dragging() {
      return dragging
    },
    // Called from the Upload's effect: untracked, so that effect doesn't rerun as the list changes.
    register: (take, ownHint) =>
      untrack(() => {
        const taker = { take, hint: ownHint }
        takers = [...takers, taker]
        return () => {
          takers = takers.filter((other) => other !== taker)
        }
      }),
  }
  setContext(UPLOAD_ZONE, zone)
</script>

<div
  class={['zone', bare ? 'bare' : 'framed', dragging && 'dragging', className]}
  {...rest}
  {@attach fileDrop({ ondrop: (drop) => takers[0]?.take(drop), ondragging: (over) => (dragging = over), disabled: !takers.length })}
>
  {#if !bare}
    <p class="hint"><Icon name="upload" size="lg" />{line}</p>
  {/if}
  {@render children?.()}
  {#if bare && dragging}
    <div class="overlay" aria-hidden="true" transition:fade={{ duration: durations.short3 }}><Icon name="upload" />{line}</div>
  {/if}
</div>

<style>
  .zone {
    position: relative;
    min-width: 0;
  }
  .framed {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-3);
    min-height: 140px;
    padding: var(--space-4);
    border: 1px dashed var(--line-strong);
    border-radius: var(--r-lg);
    background: var(--fill-1);
    transition:
      border-color var(--dur) var(--ease-out),
      background-color var(--dur) var(--ease-out);
  }
  .framed.dragging {
    border-color: var(--accent);
    background: var(--accent-soft);
  }
  .bare {
    border-radius: inherit;
  }
  .hint {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-1);
    margin: 0;
    color: var(--fg-2);
    font-size: 13px;
    text-align: center;
  }
  .hint > :global(.icon) {
    color: var(--muted);
  }
  /* Over the content, letting the drag events through to it (the zone counts them as they cross its children). On a
     solid surface under the tint, so the content doesn't show through. */
  .overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    border: 1px dashed var(--accent);
    border-radius: inherit;
    background: linear-gradient(var(--accent-soft), var(--accent-soft)), var(--surface);
    color: var(--fg);
    font-size: 13px;
    pointer-events: none;
  }
</style>
