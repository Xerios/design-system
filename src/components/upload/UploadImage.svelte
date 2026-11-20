<script>
  import { getContext } from 'svelte'
  import Thumb from './Thumb.svelte'
  import ErrorMessage from '../ErrorMessage.svelte'
  import { IMAGE_MAX_SIZE, oversize, rejection } from './common.js'
  import { accepts, droppedFiles, fileDrop } from '../../lib/files.js'
  import { announce } from '../../lib/announce.js'
  import { UPLOAD_ZONE } from './context.js'
  /**
   * One image, picked or dropped, shown as a thumbnail. The button becomes the image: once one is chosen it reshapes into
   * a square thumbnail of it (cropped to fill), with the name and size under it, which opens the picker again to replace
   * it, and a ✕ in its corner that clears it. Import it as Upload.Image (components/upload/index.js).
   *
   *   <Upload.Image bind:file label="Choose logo" accept="image/png,image/svg+xml" />
   *
   * file: the chosen File, or null (bindable). onchange(file): after a pick, a drop or a clear.
   * label: the button's text while empty (default "Choose image"). accept: as on a file input (default "image/*").
   * Dropped files are held to it too; a drop with nothing that fits says so under the control. maxSize: the largest
   * image taken, in bytes (default 10 MB; Infinity for none); a bigger one, picked or dropped, is turned away with the
   * reason under the control. id: on the button.
   * disabled. error: a message from the app: the control turns red and shows it in a bubble underneath.
   * Other attributes (class…) and attachments go to the wrapping <div>, which is also where an image can be dropped.
   *
   * Keyboard: Enter or Space opens the picker (to replace the image, once there is one); Delete or Backspace clears it.
   * Tab reaches the ✕, which clears it and puts the focus back on the button.
   *
   * @typedef {object} Props
   * @property {File | null} [file]
   * @property {(file: File | null) => void} [onchange]
   * @property {string} [label]
   * @property {string} [accept]
   * @property {number} [maxSize]
   * @property {string} [id]
   * @property {boolean} [disabled]
   * @property {string} [error]
   */
  /** @type {Props & Omit<import('svelte/elements').HTMLAttributes<HTMLDivElement>, keyof Props>} */
  let {
    file = $bindable(null),
    onchange,
    label = 'Choose image',
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
  let dragging = $state(false)
  let rejected = $state('')
  const problem = $derived(error || rejected)

  // Inside an Upload.Zone, the zone takes the drops and hands them here.
  /** @type {import('./context.js').UploadZoneContext | undefined} */
  const zone = getContext(UPLOAD_ZONE)
  $effect(() => {
    if (zone && !disabled) return zone.register(ondrop, 'Drop an image here')
  })

  /** @param {File | null} next */
  function choose(next) {
    rejected = ''
    if (next === file) return
    const had = file
    file = next
    onchange?.(next)
    announce(next ? `${next.name} added` : `${had?.name} removed`)
  }

  /** Takes the first that fits its type and size, or says why none does. The picker checks neither: its "All files"
   *  option lets any file through, and sizes are never checked. @param {File[]} files */
  function take(files) {
    const typed = files.filter((candidate) => accepts(candidate, accept))
    const fit = typed.find((candidate) => candidate.size <= maxSize)
    if (fit) choose(fit)
    else rejected = typed.length ? oversize(typed.slice(0, 1), maxSize) : rejection(accept, files.length > 0)
  }

  /** @param {import('../../lib/files.js').Dropped} drop */
  function ondrop(drop) {
    if (!disabled) take(droppedFiles(drop))
  }
</script>

<div class={['upload', className]} {...rest} {@attach fileDrop({ ondrop, ondragging: (over) => (dragging = over), disabled: disabled || !!zone })}>
  <Thumb
    bind:main
    {file}
    {label}
    onpick={() => input?.click()}
    onclear={() => choose(null)}
    {disabled}
    dragging={dragging || !!zone?.dragging}
    {id}
    errorId={!!problem && `${uid}-error`}
  />
  <!-- Closing the file chooser fires a cancel event that bubbles: inside a <dialog> it would close the dialog too. -->
  <input
    bind:this={input}
    type="file"
    {accept}
    hidden
    onchange={(event) => {
      const [picked] = event.currentTarget.files ?? []
      event.currentTarget.value = ''
      if (picked) take([picked])
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
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    width: fit-content;
    max-width: 100%;
  }
</style>
