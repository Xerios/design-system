// Files picked or dropped: what a drop carries (folders included), matching a file against an `accept` list, sizes for
// display, image previews, and the attachment that makes an element a drop target.
//
//   <div {@attach fileDrop({ ondrop: (drop) => take(drop) })}>…</div>    data-dragging while files are over it
//   const { folder, files } = await filesOfDrop(drop)                    every file in it, with its path
//   droppedFiles(drop)                                                   the loose files, folders left out
//   accepts(file, 'image/*,.pdf')                                        as the file picker would filter it
//   fileSize(1536)                                                       '2 KB'
//   <img alt="" {@attach preview(file)} />                               an object URL, revoked when it goes

/**
 * What a drop carries: its entries (files and folders, readable after the event) and its loose files.
 * @typedef {object} Dropped
 * @property {FileSystemEntry[]} entries
 * @property {File[]} loose
 */

/**
 * A file with its path inside what was picked or dropped ('assets/app.css'), or just its name.
 * @typedef {object} PathedFile
 * @property {string} path
 * @property {File} file
 */

/**
 * What a drop carries. Call it in the drop handler itself: the browser empties the transfer once it returns.
 * @param {DataTransfer} data
 * @returns {Dropped}
 */
export function dropped(data) {
  // Entries must be taken before the event ends; the files in them can be read later.
  const entries = [...data.items].map((item) => item.webkitGetAsEntry?.()).filter((entry) => entry != null)
  return { entries, loose: [...data.files] }
}

/**
 * The loose files of a drop, leaving out folders (a drop lists each folder among its files too, with nothing in it).
 * @param {Dropped} drop
 * @returns {File[]}
 */
export function droppedFiles({ entries, loose }) {
  const folders = new Set(entries.filter((entry) => entry.isDirectory).map((entry) => entry.name))
  return loose.filter((file) => !folders.has(file.name))
}

/**
 * @param {FileSystemFileEntry} entry
 * @returns {Promise<File>}
 */
function fileOf(entry) {
  return new Promise((resolve, reject) => entry.file(resolve, reject))
}

/**
 * Every file under a dropped entry, with its path from `prefix`.
 * @param {FileSystemEntry} entry
 * @param {string} [prefix]
 * @returns {Promise<PathedFile[]>}
 */
export async function filesUnder(entry, prefix = '') {
  if (entry.isFile) return [{ path: prefix + entry.name, file: await fileOf(/** @type {FileSystemFileEntry} */ (entry)) }]
  if (!entry.isDirectory) return []
  const children = await readAll(/** @type {FileSystemDirectoryEntry} */ (entry).createReader())
  return (await Promise.all(children.map((child) => filesUnder(child, `${prefix}${entry.name}/`)))).flat()
}

/**
 * readEntries hands back a batch at a time, and an empty one at the end.
 * @param {FileSystemDirectoryReader} reader
 * @returns {Promise<FileSystemEntry[]>}
 */
async function readAll(reader) {
  /** @type {FileSystemEntry[]} */
  const batch = await new Promise((resolve, reject) => reader.readEntries(resolve, reject))
  return batch.length ? [...batch, ...(await readAll(reader))] : []
}

/**
 * Every file in a drop, with its path. One folder dropped: the paths start inside it, as a picked folder's would, and
 * `folder` is its name. Several things, or loose files: paths from the top, and `folder` is null. Rejects when the
 * browser can't read what was dropped.
 * @param {Dropped} drop
 * @returns {Promise<{ folder: string | null, files: PathedFile[] }>}
 */
export async function filesOfDrop({ entries, loose }) {
  const [single] = entries
  if (entries.length === 1 && single?.isDirectory) {
    const files = await filesUnder(single)
    return { folder: single.name, files: files.map(({ path, file }) => ({ path: path.slice(single.name.length + 1), file })) }
  }
  if (entries.length) return { folder: null, files: (await Promise.all(entries.map((entry) => filesUnder(entry)))).flat() }
  return { folder: null, files: loose.map((file) => ({ path: file.name, file })) }
}

/**
 * Whether a file fits an `accept` list ('image/*,.pdf,application/zip'), as the file picker filters. An empty list
 * takes anything. Dropped files skip the picker's filter, so check them with this.
 * @param {File} file
 * @param {string} accept
 */
export function accepts(file, accept) {
  const rules = accept
    .split(',')
    .map((rule) => rule.trim().toLowerCase())
    .filter(Boolean)
  if (!rules.length) return true
  const name = file.name.toLowerCase()
  const type = file.type.toLowerCase()
  return rules.some((rule) => (rule.startsWith('.') ? name.endsWith(rule) : rule.endsWith('/*') ? type.startsWith(rule.slice(0, -1)) : type === rule))
}

/** @param {number} value */
const tenths = (value) => value.toFixed(1).replace(/\.0$/, '')

/**
 * A size in bytes, for display: '512 B', '12 KB', '1.2 MB', '10 MB', '3.4 GB'.
 * @param {number} bytes
 */
export function fileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 ** 2) return `${Math.round(bytes / 1024)} KB`
  if (bytes < 1024 ** 3) return `${tenths(bytes / 1024 ** 2)} MB`
  return `${tenths(bytes / 1024 ** 3)} GB`
}

/**
 * Attachment for an <img>: shows a File or Blob through an object URL, revoked when the image goes or the file changes.
 * A Content Security Policy must allow it: `blob:` in img-src (Upload.Image and Upload.Images draw with this).
 * @param {Blob} file
 */
export const preview = (file) => (/** @type {HTMLImageElement} */ img) => {
  const url = URL.createObjectURL(file)
  img.src = url
  return () => URL.revokeObjectURL(url)
}

// A drag that starts in the page (an image or a link dragged from it) is marked with this type, so drop targets let it
// pass: Chrome hands a dragged image over as a file too, and taking it would add a copy of what is already on the page.
const FROM_PAGE = 'application/x-dragged-from-page'
let marking = false
function markPageDrags() {
  if (marking) return
  marking = true
  window.addEventListener('dragstart', (event) => event.dataTransfer?.setData(FROM_PAGE, '1'), true)
}

/** Files from outside the page: the types of a drag can be read while it is under way, its data only on the drop.
 *  @param {DragEvent} event */
function carriesFiles(event) {
  const types = event.dataTransfer?.types ?? []
  return types.includes('Files') && !types.includes(FROM_PAGE)
}

/**
 * Attachment: makes an element a drop target for files and folders. Drags of anything else (text, links), and of
 * anything dragged from the page itself, pass by.
 *   ondrop(drop): what was dropped, as read by dropped(). Its entries can be read later; the event itself can't.
 *   ondragging(over): true as files are dragged over the element, false as they leave or drop. The element also has
 *     data-dragging meanwhile, for CSS.
 *   disabled: not a target.
 *
 * @param {{ ondrop: (drop: Dropped) => void, ondragging?: (over: boolean) => void, disabled?: boolean }} options
 */
export const fileDrop =
  ({ ondrop, ondragging, disabled = false }) =>
  (/** @type {HTMLElement} */ node) => {
    if (disabled) return
    markPageDrags()
    // dragenter and dragleave fire for every child crossed, so count them to know when the pointer has left.
    let depth = 0
    /** @param {number} next */
    function track(next) {
      const was = depth > 0
      depth = Math.max(0, next)
      if (was === depth > 0) return
      node.toggleAttribute('data-dragging', depth > 0)
      ondragging?.(depth > 0)
    }

    /** @param {DragEvent} event */
    function enter(event) {
      if (!carriesFiles(event)) return
      event.preventDefault()
      track(depth + 1)
    }
    /** @param {DragEvent} event */
    function over(event) {
      if (!carriesFiles(event) || !event.dataTransfer) return
      event.preventDefault()
      event.dataTransfer.dropEffect = 'copy'
    }
    /** @param {DragEvent} event */
    function leave(event) {
      if (carriesFiles(event)) track(depth - 1)
    }
    /** @param {DragEvent} event */
    function drop(event) {
      track(0)
      if (!carriesFiles(event) || !event.dataTransfer) return
      event.preventDefault()
      ondrop(dropped(event.dataTransfer))
    }

    node.addEventListener('dragenter', enter)
    node.addEventListener('dragover', over)
    node.addEventListener('dragleave', leave)
    node.addEventListener('drop', drop)
    return () => {
      node.removeEventListener('dragenter', enter)
      node.removeEventListener('dragover', over)
      node.removeEventListener('dragleave', leave)
      node.removeEventListener('drop', drop)
      if (depth > 0) track(0)
    }
  }
