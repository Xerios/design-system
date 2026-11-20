// What an Upload.Zone hands the Upload inside it, so files dropped anywhere on the zone reach that Upload.

/**
 * @typedef {object} UploadZoneContext
 * @property {boolean} dragging files are dragged over the zone
 * @property {(take: (drop: import('../../lib/files.js').Dropped) => void, hint: string) => () => void} register makes an
 *   Upload the one that takes the zone's drops, with the line saying what to drop; returns its removal
 */

export const UPLOAD_ZONE = Symbol('upload-zone')
