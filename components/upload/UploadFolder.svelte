<script>
  import { getContext } from 'svelte'
  import FileCard from './FileCard.svelte'
  import ErrorMessage from '../ErrorMessage.svelte'
  import { plural } from './common.js'
  import { fileDrop, fileSize, filesOfDrop } from '../../lib/files.js'
  import { announce } from '../../lib/announce.js'
  import { UPLOAD_ZONE } from './context.js'
  /**
   * A folder and every file in it, picked or dropped. The button becomes the folder: once one is chosen it reshapes into
   * a card with the folder's name, how many files it holds and their size, which opens the picker again to replace it,
   * and a ✕ that clears it. Import it as Upload.Folder (components/upload/index.js).
   *
   *   <Upload.Folder bind:folder onchange={(folder) => folder && zip(folder.files)} />
   *
   * folder: `{ name, files }` or null (bindable). Each file is `{ path, file }`, its path inside the folder
   * ('assets/app.css'), so the folder's own name is not part of it. onchange(folder): after a pick, a drop or a clear.
   * label: the button's text while empty (default "Choose folder"). id: on the button. disabled. error: a message from the
   * app, in a bubble under the control. Other attributes (class…) and attachments go to the wrapping <div>, which is
   * also where a folder can be dropped. A dropped folder is read before it is taken, which can take a moment for a big
   * one: the button says so meanwhile.
   *
   * Keyboard: Enter or Space opens the picker (to replace the folder, once there is one); Delete or Backspace clears it.
   * Tab reaches the ✕, which clears it and puts the focus back on the button.
   *
   * @typedef {object} Folder
   * @property {string} name
   * @property {import('../../lib/files.js').PathedFile[]} files
   *
   * @typedef {object} Props
   * @property {Folder | null} [folder]
   * @property {(folder: Folder | null) => void} [onchange]
   * @property {string} [label]
   * @property {string} [id]
   * @property {boolean} [disabled]
   * @property {string} [error]
   */
  /** @type {Props & Omit<import('svelte/elements').HTMLAttributes<HTMLDivElement>, keyof Props>} */
  let { folder = $bindable(null), onchange, label = 'Choose folder', id, disabled = false, error = '', class: className, ...rest } = $props()

  const uid = $props.id()
  /** @type {HTMLInputElement | undefined} */
  let input = $state()
  /** @type {HTMLButtonElement | undefined} */
  let main = $state()
  let dragging = $state(false)
  let reading = $state(false)
  let rejected = $state('')
  const problem = $derived(error || rejected)

  // Inside an Upload.Zone, the zone takes the drops and hands them here.
  /** @type {import('./context.js').UploadZoneContext | undefined} */
  const zone = getContext(UPLOAD_ZONE)
  $effect(() => {
    if (zone && !disabled) return zone.register(ondrop, 'Drop a folder here')
  })

  const item = $derived(
    folder && {
      name: folder.name,
      detail: `${plural(folder.files.length)} · ${fileSize(folder.files.reduce((sum, { file }) => sum + file.size, 0))}`,
      icon: 'folderSimple',
    },
  )

  /** @param {Folder | null} next */
  function choose(next) {
    rejected = ''
    if (next === folder) return
    const had = folder
    folder = next
    onchange?.(next)
    announce(next ? `${next.name} added, ${plural(next.files.length)}` : `${had?.name} removed`)
  }

  /** @param {File[]} files */
  function picked(files) {
    if (!files.length) {
      rejected = 'That folder is empty.'
      return
    }
    // Each path starts with the picked folder's name: drop it, so the paths start inside the folder.
    const name = files[0]?.webkitRelativePath.split('/')[0] || 'Folder'
    choose({ name, files: files.map((file) => ({ path: file.webkitRelativePath.split('/').slice(1).join('/') || file.name, file })) })
  }

  /** @param {import('../../lib/files.js').Dropped} drop */
  async function ondrop(drop) {
    if (disabled || reading) return
    rejected = ''
    reading = true
    try {
      const { folder: name, files } = await filesOfDrop(drop)
      if (name === null) rejected = 'Drop one folder here.'
      else if (!files.length) rejected = 'That folder is empty.'
      else choose({ name, files })
    } catch {
      rejected = 'Could not read what was dropped. Pick the folder with the button instead.'
    } finally {
      reading = false
    }
  }
</script>

<div class={['upload', className]} {...rest} {@attach fileDrop({ ondrop, ondragging: (over) => (dragging = over), disabled: disabled || !!zone })}>
  <FileCard
    bind:main
    {item}
    {label}
    icon="folderSimple"
    onpick={() => input?.click()}
    onclear={() => choose(null)}
    {disabled}
    dragging={dragging || !!zone?.dragging}
    busy={reading}
    busyLabel="Reading the folder…"
    {id}
    errorId={!!problem && `${uid}-error`}
  />
  <!-- Closing the file chooser fires a cancel event that bubbles: inside a <dialog> it would close the dialog too. -->
  <input
    bind:this={input}
    type="file"
    webkitdirectory
    hidden
    onchange={(event) => {
      const files = [...(event.currentTarget.files ?? [])]
      event.currentTarget.value = ''
      picked(files)
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
