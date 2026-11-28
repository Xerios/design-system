// The library's package name and links, read from its package.json, for the kitchen sink's and the demo's titles and
// menus (the pages' <title>s get the name from vite.config.js).
import pkg from '../../package.json'

export const PACKAGE = pkg.name
/**
 * The published site's address (the GitHub Pages build sets VITE_PAGES_URL; see .github/workflows/pages.yml), or ''
 * in other builds and in dev. The links out (the title's link, the npm and GitHub badges) show only when it is set.
 */
export const PAGES_URL = import.meta.env.VITE_PAGES_URL ?? ''
/** The package's page on npm. */
export const NPM_URL = `https://www.npmjs.com/package/${pkg.name}`
/** The repository on GitHub, from package.json's repository field (git+https://…/owner/repo.git → https://…/owner/repo). */
export const REPO_URL = pkg.repository.url.replace(/^git\+/, '').replace(/\.git$/, '')
/** owner/repo, for the GitHub badge. */
const REPO = new URL(REPO_URL).pathname.slice(1)
/** shields.io badges for them: the published version, and the repository's stars. */
export const NPM_BADGE = `https://img.shields.io/npm/v/${pkg.name}?logo=npm&label=npm`
export const REPO_BADGE = `https://img.shields.io/github/stars/${REPO}?logo=github&label=GitHub`
