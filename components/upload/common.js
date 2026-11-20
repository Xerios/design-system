// What the Upload components share: how they word what they turn away (a type they don't take, a file too big), the
// default size limit for images, and how a list takes more files.
import { fileSize } from '../../lib/files.js'

const list = new Intl.ListFormat('en-GB', { type: 'disjunction' })

/**
 * An accept list in words: 'image/*,.pdf' → 'image or PDF'.
 * @param {string} accept
 */
function kinds(accept) {
  const words = accept
    .split(',')
    .map((rule) => rule.trim())
    .filter(Boolean)
    .map((rule) => (rule.startsWith('.') ? rule.slice(1).toUpperCase() : rule.endsWith('/*') ? rule.slice(0, -2) : (rule.split('/')[1] ?? rule).toUpperCase()))
  return list.format([...new Set(words)])
}

/**
 * Why nothing in a drop was taken: none of its files fit `accept`, or it held only folders.
 * @param {string} accept
 * @param {boolean} hadFiles
 */
export function rejection(accept, hadFiles) {
  return hadFiles && accept ? `Only ${kinds(accept)} files can go here.` : 'Only files can go here, not folders.'
}

/**
 * Why files were left out for their size: one by name, several by count.
 * @param {File[]} skipped
 * @param {number} maxSize
 * @param {string} [noun] what several are called
 */
export function oversize(skipped, maxSize, noun = 'files') {
  const limit = fileSize(maxSize)
  const [one] = skipped
  return skipped.length === 1 && one ? `${one.name} is over ${limit}.` : `${skipped.length} ${noun} are over ${limit} and were left out.`
}

/** The default size limit for images: 10 MB. */
export const IMAGE_MAX_SIZE = 10 * 1024 ** 2

/** @param {File} a @param {File} b */
const same = (a, b) => a.name === b.name && a.size === b.size && a.lastModified === b.lastModified

/**
 * The list with `more` added at the end, leaving out files it already holds.
 * @param {File[]} files
 * @param {File[]} more
 */
export function merge(files, more) {
  const added = more.filter((file, i) => !files.some((had) => same(had, file)) && more.findIndex((other) => same(other, file)) === i)
  return added.length ? [...files, ...added] : files
}

// File formats by extension, coloured by family: documents blue, spreadsheets green, slides yellow, PDF red, images and
// media in the accent; anything else (archives, code, the unknown) grey.
const TONES = {
  danger: ['pdf'],
  info: ['doc', 'docx', 'odt', 'rtf', 'txt', 'md', 'pages'],
  success: ['xls', 'xlsx', 'csv', 'tsv', 'ods', 'numbers'],
  warning: ['ppt', 'pptx', 'odp', 'key'],
  accent: [
    'png',
    'jpg',
    'jpeg',
    'gif',
    'webp',
    'avif',
    'svg',
    'heic',
    'bmp',
    'ico',
    'tif',
    'tiff',
    'mp3',
    'wav',
    'flac',
    'm4a',
    'ogg',
    'mp4',
    'mov',
    'webm',
    'mkv',
    'avi',
  ],
}
const TONE_OF = new Map(Object.entries(TONES).flatMap(([tone, extensions]) => extensions.map((extension) => [extension, tone])))

/**
 * A file's format from its name: the extension to show on its icon ('PDF'; empty when it has none, or one too long to
 * fit, over four letters) and the tone to colour it in (a data-tone name, or 'accent').
 * @param {string} name
 */
export function fileFormat(name) {
  const dot = name.lastIndexOf('.')
  const extension = dot > 0 ? name.slice(dot + 1).toLowerCase() : ''
  return { ext: extension.length <= 4 ? extension.toUpperCase() : '', tone: TONE_OF.get(extension) ?? 'neutral' }
}

/** @param {number} count */
export const plural = (count) => `${count} ${count === 1 ? 'file' : 'files'}`
