// The kitchen sink's own icons, registered the way an app registers its glyphs (README, Icons): the demos use some the
// design system does not ship, and the side menu gives each area one. Call registerAppIcons() before mounting.
import { registerIcons } from '@xerios/design-system/components/Icon.svelte'
import briefcase from '@phosphor-icons/core/regular/briefcase.svg?raw'
import buildings from '@phosphor-icons/core/regular/buildings.svg?raw'
import chatsCircle from '@phosphor-icons/core/regular/chats-circle.svg?raw'
import currencyEur from '@phosphor-icons/core/regular/currency-eur.svg?raw'
import globe from '@phosphor-icons/core/regular/globe.svg?raw'
import house from '@phosphor-icons/core/regular/house.svg?raw'
import paperPlane from '@phosphor-icons/core/regular/paper-plane-tilt.svg?raw'
import steps from '@phosphor-icons/core/regular/steps.svg?raw'
import xCircle from '@phosphor-icons/core/regular/x-circle.svg?raw'
import atom from '@phosphor-icons/core/regular/atom.svg?raw'
import bell from '@phosphor-icons/core/regular/bell.svg?raw'
import clock from '@phosphor-icons/core/regular/clock.svg?raw'
import cloud from '@phosphor-icons/core/regular/cloud.svg?raw'
import code from '@phosphor-icons/core/regular/code.svg?raw'
import cursorClick from '@phosphor-icons/core/regular/cursor-click.svg?raw'
import document from '@phosphor-icons/core/regular/file-text.svg?raw'
import flask from '@phosphor-icons/core/regular/flask.svg?raw'
import folder from '@phosphor-icons/core/regular/folder.svg?raw'
import lock from '@phosphor-icons/core/regular/lock.svg?raw'
import palette from '@phosphor-icons/core/regular/palette.svg?raw'
import rocket from '@phosphor-icons/core/regular/rocket.svg?raw'
import stack from '@phosphor-icons/core/regular/stack.svg?raw'
import swatches from '@phosphor-icons/core/regular/swatches.svg?raw'
import table from '@phosphor-icons/core/regular/table.svg?raw'
import textAa from '@phosphor-icons/core/regular/text-aa.svg?raw'
import textbox from '@phosphor-icons/core/regular/textbox.svg?raw'
import trash from '@phosphor-icons/core/regular/trash.svg?raw'
import pencil from '@phosphor-icons/core/regular/pencil-simple.svg?raw'
import sparkle from '@phosphor-icons/core/regular/sparkle.svg?raw'

export function registerAppIcons() {
  registerIcons({
    // Used by the demos.
    clock,
    cloud,
    code,
    document,
    flask,
    folder,
    lock,
    rocket,
    trash,
    pencil,
    sparkle,
    briefcase,
    buildings,
    chatsCircle,
    currencyEur,
    globe,
    house,
    paperPlane,
    steps,
    xCircle,
    // The side menu: the brand and one per area.
    swatches,
    cursorClick,
    textbox,
    stack,
    table,
    bell,
    atom,
    textAa,
    palette,
  })
}
