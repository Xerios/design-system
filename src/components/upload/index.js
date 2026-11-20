// File pickers as one import. Each is a button that becomes what it picked (a card, or a thumbnail for images), with a
// ✕ to clear it, and each takes files dropped on it:
//   <Upload.File> one file             <Upload.Files> any number, as a list of cards
//   <Upload.Folder> a folder's files   <Upload.Image> one image        <Upload.Images> any number, as a grid
// <Upload.Zone> around one of them gives it a larger place to drop on: a dashed area, or with `bare` any area at all.
//
//   import Upload from '@xerios/design-system/components/upload/index.js'
//   <Upload.File bind:file accept=".pdf" />
//   <Upload.Zone><Upload.Images bind:files /></Upload.Zone>
import UploadFile from './UploadFile.svelte'
import UploadFiles from './UploadFiles.svelte'
import UploadFolder from './UploadFolder.svelte'
import UploadImage from './UploadImage.svelte'
import UploadImages from './UploadImages.svelte'
import UploadZone from './UploadZone.svelte'

export default { File: UploadFile, Files: UploadFiles, Folder: UploadFolder, Image: UploadImage, Images: UploadImages, Zone: UploadZone }
export { UploadFile, UploadFiles, UploadFolder, UploadImage, UploadImages, UploadZone }
