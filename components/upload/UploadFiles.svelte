<script>
  import { getContext, tick } from 'svelte'
  import FileCard from './FileCard.svelte'
  import ErrorMessage from '../ErrorMessage.svelte'
  import { merge, plural, rejection, fileFormat } from './common.js'
  import { accepts, droppedFiles, fileDrop, fileSize } from '../../lib/files.js'
  import { announce } from '../../lib/announce.js'
  import { UPLOAD_ZONE } from './context.js'
  import { flip, slide } from '../../lib/motion.js'
  /**
   * Any number of files, picked or dropped: a list of cards (name and size, a ✕ to remove each) above the button that
   * adds more. Picking again adds to the list; a file already in it is not added twice. Import it as Upload.Files
   * (components/upload/index.js).
   *
   *   <Upload.Files bind:files accept=".csv" />
   *
   * files: the chosen Files (bindable; a new array on every change). onchange(files): after a pick, a drop or a removal.
   * label: the button's text while the list is empty (default "Choose files"); addLabel: once it isn't (default "Add
   * files"). accept: as on a file input; dropped files are held to it too, and a drop with nothing that fits says so
   * under the control. id: on the button. disabled. error: a message from the app, in a bubble under the control.
   * Other attributes (class…) and attachments go to the wrapping <div>, which is also where files can be dropped.
   *
   * Keyboard: Enter or Space on the button opens the picker. Tab goes through each card's ✕; removing one moves the
   * focus to the next ✕ (the previous one after the last, the button once the list is empty).
   *
   * @typedef {object} Props
   * @property {File[]} [files]
   * @property {(files: File[]) => void} [onchange]
   * @property {string} [label]
   * @property {string} [addLabel]
   * @property {string} [accept]
   * @property {string} [id]
   * @property {boolean} [disabled]
   * @property {string} [error]
   */
  /** @type {Props & Omit<import('svelte/elements').HTMLAttributes<HTMLDivElement>, keyof Props>} */
  let {
    files = $bindable([]),
    onchange,
    label = 'Choose files',
    addLabel = 'Add files',
    accept = '',
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
  let list = $state()
  let dragging = $state(false)
  let rejected = $state('')
  const problem = $derived(error || rejected)

  // Inside an Upload.Zone, the zone takes the drops and hands them here.
  /** @type {import('./context.js').UploadZoneContext | undefined} */
  const zone = getContext(UPLOAD_ZONE)
  $effect(() => {
    if (zone && !disabled) return zone.register(ondrop, 'Drop files here')
  })

  /** @param {File[]} more */
  function add(more) {
    rejected = ''
    const next = merge(files, more)
    if (next === files) return
    const count = next.length - files.length
    files = next
    onchange?.(next)
    announce(count === 1 ? `${next.at(-1)?.name} added` : `${plural(count)} added`)
  }

  /** @param {File} file */
  async function remove(file) {
    const index = files.indexOf(file)
    files = files.filter((other) => other !== file)
    onchange?.(files)
    announce(`${file.name} removed`)
    // The card is on its way out (inert while it slides away): the focus goes to the ✕ now in its place.
    await tick()
    const clears = list ? [...list.querySelectorAll(':scope > li:not([inert]) .clear')] : []
    const next = /** @type {HTMLElement | undefined} */ (clears[index] ?? clears.at(-1))
    ;(next ?? main)?.focus()
  }

  /** @param {import('../../lib/files.js').Dropped} drop */
  function ondrop(drop) {
    if (disabled) return
    const dropped = droppedFiles(drop)
    const fit = dropped.filter((file) => accepts(file, accept))
    if (fit.length) add(fit)
    else rejected = rejection(accept, dropped.length > 0)
  }
</script>

<div class={['upload', className]} {...rest} {@attach fileDrop({ ondrop, ondragging: (over) => (dragging = over), disabled: disabled || !!zone })}>
  {#if files.length}
    <ul bind:this={list} class="list" aria-label="Chosen files">
      {#each files as file (file)}
        <li animate:flip transition:slide>
          <FileCard
            item={{ name: file.name, detail: fileSize(file.size), icon: 'fileBlank', ...fileFormat(file.name) }}
            onclear={() => remove(file)}
            {disabled}
          />
        </li>
      {/each}
    </ul>
  {/if}
  <FileCard
    bind:main
    item={null}
    label={files.length ? addLabel : label}
    icon={files.length ? 'plus' : 'upload'}
    onpick={() => input?.click()}
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
    multiple
    hidden
    onchange={(event) => {
      const picked = [...(event.currentTarget.files ?? [])]
      event.currentTarget.value = ''
      if (picked.length) add(picked)
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
    gap: var(--space-2);
    width: fit-content;
    max-width: 100%;
  }
  .list {
    display: grid;
    max-width: 100%;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  /* Spaced by padding, not gap, so a card sliding away takes its space with it. */
  .list > li {
    min-width: 0;
    padding-bottom: var(--space-1);
  }
  .list > li:last-child {
    padding-bottom: 0;
  }
</style>
