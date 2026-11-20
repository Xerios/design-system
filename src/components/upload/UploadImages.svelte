<script>
  import { getContext, tick } from 'svelte'
  import Thumb from './Thumb.svelte'
  import ErrorMessage from '../ErrorMessage.svelte'
  import { IMAGE_MAX_SIZE, merge, oversize, rejection } from './common.js'
  import { accepts, droppedFiles, fileDrop } from '../../lib/files.js'
  import { announce } from '../../lib/announce.js'
  import { UPLOAD_ZONE } from './context.js'
  import { flip, scale } from '../../lib/motion.js'
  /**
   * Any number of images, picked or dropped: a wrapping grid of square thumbnails (each with its name and size, and a ✕
   * to remove it), ended by a dashed tile that adds more. Picking again adds to the grid; an image already in it is not
   * added twice. Import it as Upload.Images (components/upload/index.js).
   *
   *   <Upload.Images bind:files />
   *
   * files: the chosen Files (bindable; a new array on every change). onchange(files): after a pick, a drop or a removal.
   * label: the add tile's text (default "Add images"). accept: as on a file input (default "image/*"); dropped files are
   * held to it too, and a drop with nothing that fits says so under the control. maxSize: the largest image taken, in
   * bytes (default 10 MB; Infinity for none); bigger ones, picked or dropped, are left out and the reason shows under
   * the control, while the rest are added. id: on the add tile. disabled. error: a
   * message from the app, in a bubble under the control. Other attributes (class…) and attachments go to the wrapping
   * <div>, which is also where images can be dropped.
   *
   * Keyboard: Enter or Space on the add tile opens the picker. Tab goes through each thumbnail's ✕; removing one moves
   * the focus to the next ✕ (the previous one after the last, the add tile once the grid is empty).
   *
   * @typedef {object} Props
   * @property {File[]} [files]
   * @property {(files: File[]) => void} [onchange]
   * @property {string} [label]
   * @property {string} [accept]
   * @property {number} [maxSize]
   * @property {string} [id]
   * @property {boolean} [disabled]
   * @property {string} [error]
   */
  /** @type {Props & Omit<import('svelte/elements').HTMLAttributes<HTMLDivElement>, keyof Props>} */
  let {
    files = $bindable([]),
    onchange,
    label = 'Add images',
    accept = 'image/*',
    maxSize = IMAGE_MAX_SIZE,
    id,
    disabled = false,
    error = '',
    class: className,
    ...rest
  } = $props()

  const uid = $props.id()
  /** @type {HTMLInputElement | undefined} */
  let input = $state()
  /** @type {HTMLButtonElement | undefined} */
  let main = $state()
  /** @type {HTMLUListElement | undefined} */
  let grid = $state()
  let dragging = $state(false)
  let rejected = $state('')
  const problem = $derived(error || rejected)

  // Inside an Upload.Zone, the zone takes the drops and hands them here.
  /** @type {import('./context.js').UploadZoneContext | undefined} */
  const zone = getContext(UPLOAD_ZONE)
  $effect(() => {
    if (zone && !disabled) return zone.register(ondrop, 'Drop images here')
  })

  /** @param {File[]} more */
  function add(more) {
    rejected = ''
    const next = merge(files, more)
    if (next === files) return
    const count = next.length - files.length
    files = next
    onchange?.(next)
    announce(count === 1 ? `${next.at(-1)?.name} added` : `${count} images added`)
  }

  /** @param {File} file */
  async function remove(file) {
    const index = files.indexOf(file)
    files = files.filter((other) => other !== file)
    onchange?.(files)
    announce(`${file.name} removed`)
    // The thumbnail is on its way out (inert while it shrinks away): the focus goes to the ✕ now in its place.
    await tick()
    const clears = grid ? [...grid.querySelectorAll(':scope > li:not([inert]) .clear')] : []
    const next = /** @type {HTMLElement | undefined} */ (clears[index] ?? clears.at(-1))
    ;(next ?? main)?.focus()
  }

  /** Adds those that fit their type and size, and says why any were left out. The picker checks neither: its "All
   *  files" option lets any file through, and sizes are never checked. @param {File[]} more */
  function take(more) {
    const typed = more.filter((file) => accepts(file, accept))
    const fit = typed.filter((file) => file.size <= maxSize)
    const big = typed.filter((file) => file.size > maxSize)
    if (fit.length) add(fit)
    if (big.length) rejected = oversize(big, maxSize, 'images')
    else if (!typed.length) rejected = rejection(accept, more.length > 0)
  }

  /** @param {import('../../lib/files.js').Dropped} drop */
  function ondrop(drop) {
    if (!disabled) take(droppedFiles(drop))
  }
</script>

<div class={['upload', className]} {...rest} {@attach fileDrop({ ondrop, ondragging: (over) => (dragging = over), disabled: disabled || !!zone })}>
  <ul bind:this={grid} class="grid" aria-label="Chosen images">
    {#each files as file (file)}
      <li animate:flip transition:scale={{ start: 0.9 }}>
        <Thumb {file} onclear={() => remove(file)} {disabled} />
      </li>
    {/each}
    <li>
      <Thumb
        bind:main
        file={null}
        {label}
        icon="plus"
        square
        onpick={() => input?.click()}
        {disabled}
        dragging={dragging || !!zone?.dragging}
        {id}
        errorId={!!problem && `${uid}-error`}
      />
    </li>
  </ul>
  <!-- Closing the file chooser fires a cancel event that bubbles: inside a <dialog> it would close the dialog too. -->
  <input
    bind:this={input}
    type="file"
    {accept}
    multiple
    hidden
    onchange={(event) => {
      const picked = [...(event.currentTarget.files ?? [])]
      event.currentTarget.value = ''
      if (picked.length) take(picked)
    }}
    oncancel={(event) => event.stopPropagation()}
  />
  <ErrorMessage
    floating
    id="{uid}-error"
    message={problem}
    ondismiss={() => {
      rejected = ''
      main?.focus()
    }}
  />
</div>

<style>
  .upload {
    position: relative;
    max-width: 100%;
  }
  .grid {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: var(--space-3) var(--space-2);
    margin: 0;
    padding: 0;
    list-style: none;
  }
</style>
