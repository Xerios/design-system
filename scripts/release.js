// Cuts a release: `pnpm release [patch|minor|major|x.y.z] [--dry] [--no-git] [--no-shot]`.
// Bumps `version` in package.json, turns `## [Unreleased]` in CHANGELOG.md into `## [x.y.z] - YYYY-MM-DD` under a
// fresh empty `[Unreleased]`, updates the compare links at the bottom, checks the build, retakes the README's
// screenshot (docs/screenshot.png, from the kitchen sink's demo page in the dark theme: `pnpm screenshot`), then commits
// and tags `vx.y.z`. The README shows the screenshot from `main`, so it appears once the release commit is pushed.
// `--no-shot` keeps the screenshot as it is (the kitchen sink is still built, as a check).
// With no level it picks one from the changelog: a **Breaking** entry bumps the minor while on 0.x (the major after),
// anything else the patch. `--dry` prints what it would do and writes nothing; `--no-git` skips the commit and tag.
// It never pushes or publishes: it prints the commands for that at the end.
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { execSync } from 'node:child_process'

const args = process.argv.slice(2)
const dry = args.includes('--dry')
const git = !args.includes('--no-git')
const shot = !args.includes('--no-shot')
const level = args.find((a) => !a.startsWith('--'))

const fail = (msg) => {
	console.error(`release: ${msg}`)
	process.exit(1)
}
const run = (cmd) => execSync(cmd, { stdio: 'inherit' })
const read = (cmd) => execSync(cmd, { encoding: 'utf8' }).trim()

const pkgText = readFileSync('package.json', 'utf8')
const log = readFileSync('CHANGELOG.md', 'utf8')
const SHOT = 'docs/screenshot.png'
const shotBefore = existsSync(SHOT) ? readFileSync(SHOT) : null
const current = JSON.parse(pkgText).version

// What is under [Unreleased], up to the next release heading or the link list.
const head = log.match(/^## \[Unreleased\][^\n]*\n/m)
if (!head) fail('CHANGELOG.md has no "## [Unreleased]" heading')
const start = head.index + head[0].length
const rest = log.slice(start)
const end = rest.search(/^## \[|^\[[^\]]+\]: /m)
const notes = (end < 0 ? rest : rest.slice(0, end)).trim()
if (!notes) fail('nothing under [Unreleased] in CHANGELOG.md; add the changes first')

const [maj, min, pat] = current.split('.').map(Number)
const breaking = /\*\*Breaking\*\*/.test(notes)
const auto = breaking ? (maj === 0 ? 'minor' : 'major') : 'patch'
const bumps = {
	patch: `${maj}.${min}.${pat + 1}`,
	minor: `${maj}.${min + 1}.0`,
	major: `${maj + 1}.0.0`,
}
const next = /^\d+\.\d+\.\d+$/.test(level ?? '') ? level : bumps[level ?? auto]
if (!next) fail(`unknown level "${level}"; use patch, minor, major or x.y.z`)
const newer = (a, b) => {
	const [x, y] = [a, b].map((v) => v.split('.').map(Number))
	for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] > y[i]
	return false
}
if (!newer(next, current)) fail(`${next} is not newer than ${current}`)
if (breaking && level === 'patch') fail('[Unreleased] has a **Breaking** entry; a patch release is not enough')

if (git && !dry) {
	if (read('git status --porcelain --untracked-files=no')) fail('commit or stash your changes first (or pass --no-git)')
	if (read(`git tag --list v${next}`)) fail(`tag v${next} already exists`)
}

// package.json: replace the value in place so the file's formatting stays as it is.
const pkgOut = pkgText.replace(/("version":\s*")[^"]+(")/, `$1${next}$2`)

// CHANGELOG.md: the release heading under a fresh [Unreleased], then the links.
const date = new Date().toLocaleDateString('sv') // YYYY-MM-DD, local time
let logOut = `${log.slice(0, head.index)}## [Unreleased]\n\n## [${next}] - ${date}\n${log.slice(start)}`
const repo = log.match(/^\[Unreleased\]: (\S+)\/compare\//m)?.[1]
if (!repo) fail('CHANGELOG.md has no "[Unreleased]: …/compare/…" link at the bottom')
logOut = logOut.replace(
	/^\[Unreleased\]: .*$/m,
	`[Unreleased]: ${repo}/compare/v${next}...HEAD\n[${next}]: ${repo}/compare/v${current}...v${next}`,
)

console.log(`release: ${current} → ${next}${level ? '' : ` (${auto}${breaking ? ', has breaking changes' : ''})`}`)
if (dry) {
	console.log(`\n## [${next}] - ${date}\n\n${notes}\n\n(dry run: nothing written)`)
	process.exit(0)
}

writeFileSync('package.json', pkgOut)
writeFileSync('CHANGELOG.md', logOut)
const undo = () => {
	writeFileSync('package.json', pkgText)
	writeFileSync('CHANGELOG.md', log)
	if (shotBefore) writeFileSync(SHOT, shotBefore)
}

try {
	run('pnpm build')
	// The screenshot builds the kitchen sink first, so either way it is checked.
	run(shot ? 'pnpm screenshot' : 'pnpm build:kitchensink')
} catch {
	undo()
	fail(`the build${shot ? ' or the screenshot' : ''} failed; package.json, CHANGELOG.md and the screenshot are back as they were`)
}

if (git) {
	run(`git add package.json CHANGELOG.md ${SHOT}`)
	run(`git commit -m "Release v${next}"`)
	run(`git tag -a v${next} -m "v${next}"`)
}

console.log(`\nrelease: v${next} is ready. To ship it:\n  git push --follow-tags\n  pnpm publish`)
