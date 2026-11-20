// The two typefaces the tokens name (--font-body / --font-display: Inter; --font-data: JetBrains Mono), bundled with
// the app so nothing loads from the network. Import once from the app's entry, or skip it and point the --font-*
// tokens at your own faces.
// oxlint-disable-next-line import/no-unassigned-import -- a font package exports nothing; importing it is what registers its @font-face CSS
import '@fontsource-variable/inter';
// oxlint-disable-next-line import/no-unassigned-import -- same: imported only for its @font-face CSS
import '@fontsource-variable/jetbrains-mono';
