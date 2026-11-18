<script module>
  // Phosphor icons (regular weight, one family everywhere), bundled as inline SVG strings (Vite's ?raw).
  // This file holds the general-purpose set the design system's own components draw with. An app adds its own once,
  // before it mounts:
  //
  //   import { registerIcons } from '$ds/components/Icon.svelte';
  //   import briefcase from '@phosphor-icons/core/regular/briefcase.svg?raw';
  //   registerIcons({ briefcase });
  //
  // Then <Icon name="briefcase" /> works everywhere, including in options and menu items that take an icon name.
  import x from '@phosphor-icons/core/regular/x.svg?raw'
  import search from '@phosphor-icons/core/regular/magnifying-glass.svg?raw'
  import caretDown from '@phosphor-icons/core/regular/caret-down.svg?raw'
  import caretRight from '@phosphor-icons/core/regular/caret-right.svg?raw'
  import check from '@phosphor-icons/core/regular/check.svg?raw'
  import external from '@phosphor-icons/core/regular/arrow-square-out.svg?raw'
  import star from '@phosphor-icons/core/regular/star.svg?raw'
  import starFill from '@phosphor-icons/core/fill/star-fill.svg?raw'
  import more from '@phosphor-icons/core/regular/dots-three.svg?raw'
  import upload from '@phosphor-icons/core/regular/upload-simple.svg?raw'
  import arrowLeft from '@phosphor-icons/core/regular/arrow-left.svg?raw'
  import arrowRight from '@phosphor-icons/core/regular/arrow-right.svg?raw'
  import arrowDown from '@phosphor-icons/core/regular/arrow-down.svg?raw'
  import undo from '@phosphor-icons/core/regular/arrow-counter-clockwise.svg?raw'
  import plus from '@phosphor-icons/core/regular/plus.svg?raw'
  import minus from '@phosphor-icons/core/regular/minus.svg?raw'
  import funnel from '@phosphor-icons/core/regular/funnel-simple.svg?raw'
  import history from '@phosphor-icons/core/regular/clock-counter-clockwise.svg?raw'
  import undoArc from '@phosphor-icons/core/regular/arrow-u-up-left.svg?raw'
  import redoArc from '@phosphor-icons/core/regular/arrow-u-up-right.svg?raw'
  import sidebar from '@phosphor-icons/core/regular/sidebar-simple.svg?raw'
  import eye from '@phosphor-icons/core/regular/eye.svg?raw'
  import eyeSlash from '@phosphor-icons/core/regular/eye-slash.svg?raw'
  import caretUp from '@phosphor-icons/core/regular/caret-up.svg?raw'
  import expandAll from '@phosphor-icons/core/regular/arrows-out-line-vertical.svg?raw'
  import collapseAll from '@phosphor-icons/core/regular/arrows-in-line-vertical.svg?raw'
  import gear from '@phosphor-icons/core/regular/gear-six.svg?raw'
  import sun from '@phosphor-icons/core/regular/sun.svg?raw'
  import moon from '@phosphor-icons/core/regular/moon.svg?raw'
  import monitor from '@phosphor-icons/core/regular/monitor.svg?raw'
  import keyboard from '@phosphor-icons/core/regular/keyboard.svg?raw'
  import infoCircle from '@phosphor-icons/core/regular/info.svg?raw'
  import prohibit from '@phosphor-icons/core/regular/prohibit.svg?raw'
  import checkBold from '@phosphor-icons/core/bold/check-bold.svg?raw'
  import xBold from '@phosphor-icons/core/bold/x-bold.svg?raw'
  import refresh from '@phosphor-icons/core/regular/arrow-clockwise.svg?raw'
  import spinner from '@phosphor-icons/core/regular/spinner-gap.svg?raw'
  import checkCircle from '@phosphor-icons/core/regular/check-circle.svg?raw'
  import warning from '@phosphor-icons/core/regular/warning-circle.svg?raw'
  import circleDashed from '@phosphor-icons/core/regular/circle-dashed.svg?raw'
  import minusCircle from '@phosphor-icons/core/regular/minus-circle.svg?raw'
  import stop from '@phosphor-icons/core/fill/stop-fill.svg?raw'
  import stopCircle from '@phosphor-icons/core/regular/stop-circle.svg?raw'

  const ICONS = {
    x,
    search,
    caretDown,
    caretRight,
    check,
    external,
    star,
    starFill,
    more,
    upload,
    arrowLeft,
    arrowRight,
    arrowDown,
    undo,
    plus,
    minus,
    funnel,
    history,
    undoArc,
    redoArc,
    sidebar,
    eye,
    eyeSlash,
    caretUp,
    expandAll,
    collapseAll,
    gear,
    sun,
    moon,
    monitor,
    keyboard,
    infoCircle,
    prohibit,
    checkBold,
    xBold,
    refresh,
    spinner,
    checkCircle,
    warning,
    circleDashed,
    minusCircle,
    stop,
    stopCircle,
  }

  /** Adds icons (name → SVG markup using currentColor) to the registry, replacing any of the same name. Call before mounting. */
  export function registerIcons(icons) {
    Object.assign(ICONS, icons)
  }
  /** Every registered name (for a gallery, or to check a name exists). */
  export const iconNames = () => Object.keys(ICONS)
</script>

<script>
  /**
   * size: sm (14px) | md (16px) | lg (20px), from the --icon-* tokens.
   * label: give one only when the icon carries meaning that no visible text repeats;
   * otherwise it is decorative and hidden from assistive tech.
   * Other attributes (class…) and attachments go to the wrapping <span>.
   *
   * @typedef {object} Props
   * @property {string} name
   * @property {'sm' | 'md' | 'lg'} [size]
   * @property {string | null} [label]
   */
  /** @type {Props & Omit<import('svelte/elements').HTMLAttributes<HTMLSpanElement>, keyof Props>} */
  let { name, size = 'md', label = null, class: className, ...rest } = $props()
</script>

<!-- allow-html: ICONS holds SVG markup bundled at build time or passed to registerIcons by app code, never user input -->
<span class={['icon', size, className]} role={label ? 'img' : undefined} aria-label={label} aria-hidden={label ? undefined : 'true'} {...rest}
  >{@html ICONS[name]}</span
>

<style>
  /* Never the target of a click: the press belongs to the button or link around it. */
  .icon {
    display: inline-flex;
    flex: none;
    pointer-events: none;
    width: var(--icon-size);
    height: var(--icon-size);
  }
  .icon :global(svg) {
    width: 100%;
    height: 100%;
    display: block;
  }
  .sm {
    --icon-size: var(--icon-sm);
  }
  .md {
    --icon-size: var(--icon-md);
  }
  .lg {
    --icon-size: var(--icon-lg);
  }
</style>
