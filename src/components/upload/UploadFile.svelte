<script>
  import { getContext } from 'svelte'
  import FileCard from './FileCard.svelte'
  import ErrorMessage from '../ErrorMessage.svelte'
  import { rejection, fileFormat } from './common.js'
  import { accepts, droppedFiles, fileDrop, fileSize } from '../../lib/files.js'
  import { announce } from '../../lib/announce.js'
  import { UPLOAD_ZONE } from './context.js'
  /**
   * One file, picked or dropped. The button becomes the file: once one is chosen it reshapes into a card with the file's
   * name and size, which opens the picker again to replace it, and a ✕ that clears it. Import it as Upload.File
   * (components/upload/index.js).
   *
   *   <Upload.File bind:file accept=".pdf" />
   *   <Upload.File label="Attach the contract" onchange={(file) => save(file)} error={form.errors.contract} />
   *
   * file: the chosen File, or null (bindable). onchange(file): after a pick, a drop or a clear.
   * label: the button's text while empty (default "Choose file"). accept: as on a file input ('.pdf,image/*'). Dropped
   * files are held to it too; a drop with nothing that fits says so under the control. id: on the button, for a
   * <label for>. disabled. error: a message from the app: the control turns red and shows it in a bubble underneath.
   * Other attributes (class…) and attachments go to the wrapping <div>, which is also where files can be dropped.
   *
   * Keyboard: Enter or Space opens the picker (to replace the file, once there is one); Delete or Backspace clears it.
   * Tab reaches the ✕, which clears it and puts the focus back on the button.
   *
   * @typedef {object} Props
   * @property {File | null} [file]
   * @property {(file: File | null) => void} [onchange]
   * @property {string} [label]
   * @property {string} [accept]
   * @property {string} [id]
   * @property {boolean} [disabled]
   * @property {string} [error]
   */
  /** @type {Props & Omit<import('svelte/elements').HTMLAttributes<HTMLDivElement>, keyof Props>} */
  let { file = $bindable(null), onchange, label = 'Choose file', accept = '', id, disabled = false, error = '', class: className, ...rest } = $props()

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
    if (zone && !disabled) return zone.register(ondrop, 'Drop a file here')
  })

  const item = $derived(file && { name: file.name, detail: fileSize(file.size), icon: 'fileBlank', ...fileFormat(file.name) })

  /** @param {File | null} next */
  function choose(next) {
    rejected = ''
    if (next === file) return
    const had = file
    file = next
    onchange?.(next)
    announce(next ? `${next.name} added` : `${had?.name} removed`)
  }

  /** @param {import('../../lib/files.js').Dropped} drop */
  function ondrop(drop) {
    if (disabled) return
    const files = droppedFiles(drop)
    const fit = files.find((candidate) => accepts(candidate, accept))
    if (fit) choose(fit)
    else rejected = rejection(accept, files.length > 0)
  }
</script>

<div class={['upload', className]} {...rest} {@attach fileDrop({ ondrop, ondragging: (over) => (dragging = over), disabled: disabled || !!zone })}>
  <FileCard
    bind:main
    {item}
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
      if (picked) choose(picked)
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
  /* As wide as what it shows, so the drop target is the control and not the row it sits in. Positioned, for the
     error bubble hanging under it. */
  .upload {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    width: fit-content;
    max-width: 100%;
  }
</style>
