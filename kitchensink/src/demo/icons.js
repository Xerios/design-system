// Glyphs the demo page uses beyond the built-in set and the kitchen sink's own (../icons.js), registered as an app would.
import { registerIcons } from '@xerios/design-system/components/Icon.svelte'
import tray from '@phosphor-icons/core/regular/tray.svg?raw'
import target from '@phosphor-icons/core/regular/target.svg?raw'
import users from '@phosphor-icons/core/regular/users-three.svg?raw'
import kanban from '@phosphor-icons/core/regular/kanban.svg?raw'
import listBullets from '@phosphor-icons/core/regular/list-bullets.svg?raw'
import gitBranch from '@phosphor-icons/core/regular/git-branch.svg?raw'
import lightning from '@phosphor-icons/core/regular/lightning.svg?raw'
import tag from '@phosphor-icons/core/regular/tag.svg?raw'
import bug from '@phosphor-icons/core/regular/bug.svg?raw'
import paintBrush from '@phosphor-icons/core/regular/paint-brush.svg?raw'
import phone from '@phosphor-icons/core/regular/device-mobile.svg?raw'
import share from '@phosphor-icons/core/regular/share-network.svg?raw'
import signalHigh from '@phosphor-icons/core/regular/cell-signal-high.svg?raw'
import signalMedium from '@phosphor-icons/core/regular/cell-signal-medium.svg?raw'
import signalLow from '@phosphor-icons/core/regular/cell-signal-low.svg?raw'
import user from '@phosphor-icons/core/regular/user-circle.svg?raw'

export function registerDemoIcons() {
  registerIcons({ tray, target, users, kanban, listBullets, gitBranch, lightning, tag, bug, paintBrush, phone, share, signalHigh, signalMedium, signalLow, user })
}
