<script>
  /**
   * Small ⓘ button with a tooltip, the place for descriptions and help text: the `tooltip` attachment (lib/tooltip.js)
   * on an icon button, with its content as text, or your own. It opens on hover, keyboard focus or a press (so a tap
   * shows it), above the ⓘ (below it where there is no room). With `pinnable`, a press pins it open over a dimmed page so its text can be selected and copied; a press
   * outside it, Esc, scrolling the page, or pressing the ⓘ again closes it.
   *
   *   <InfoTip label="About retention" text="How long logs are kept." />
   *   <InfoTip pinnable label="About limits" text="10,000 requests a day, 10 GB of storage." />
   *   <InfoTip label="About builds"><strong>Build 1,024</strong><span>Finished 2 minutes ago</span></InfoTip>
   *   <button …>Compact <InfoTip decorative text="Smaller rows." /></button>
   *
   * `text`: the tip's text. children: the tip's content instead, drawn as you like (its children are stacked, a <strong>
   * first reading as the heading).
   * `label`: the button's accessible name; `pinnable`: a press pins the tip open.
   * `decorative`: for an ⓘ inside another control (a radio option, a tab), which can't hold a button: a plain icon,
   * hidden from screen readers and out of the Tab order, whose tip opens on hover only; the control gives the same text
   * as its own description (aria-describedby), and a press goes to the control. `label` and `pinnable` don't apply.
   * Keyboard: Tab to it opens the tip, Enter or Space pins it (with `pinnable`), Esc closes it without closing a dialog
   * around it. Other attributes (class…) and attachments go to the ⓘ button (the icon's <span> when decorative).
   */
  import Icon from './Icon.svelte'
  import { tooltip } from '../lib/tooltip.js'

  /**
   * @typedef {object} Props
   * @property {string} [label]
   * @property {string} [text]
   * @property {import('svelte').Snippet} [children]
   * @property {boolean} [pinnable]
   * @property {boolean} [decorative]
   */
  /** @type {Props & Omit<import('svelte/elements').HTMLButtonAttributes, keyof Props>} */
  let { label = 'More information', text, pinnable = false, decorative = false, children, class: className, ...rest } = $props()
</script>

{#snippet tip()}
  {#if children}{@render children()}{:else}<span>{text}</span>{/if}
{/snippet}

{#if decorative}
  <span class={['info', 'decorative', className]} {...rest} aria-hidden="true" {@attach tooltip(tip, { placement: 'above' })}>
    <Icon name="infoCircle" size="sm" />
  </span>
{:else}
  <!-- A press on the ⓘ is its own: it doesn't also reach a row or header it sits in. -->
  <button
    type="button"
    class={['info', className]}
    {...rest}
    aria-label={label}
    {@attach tooltip(tip, { press: pinnable ? 'pin' : 'open', placement: 'above' })}
    onclick={(e) => e.stopPropagation()}
  >
    <Icon name="infoCircle" size="sm" />
  </button>
{/if}

<style>
  .info {
    display: inline-grid;
    place-items: center;
    width: 24px;
    height: 24px;
    flex: none;
    padding: 0;
    border: 0;
    border-radius: var(--r-pill);
    background: none;
    color: var(--faint);
  }
  .info:not(.decorative):hover,
  .info:focus-visible,
  .info[aria-expanded='true'] {
    color: var(--fg-2);
    background: var(--control-3);
  }
  /* Inside a control: the icon alone, sized by it, in the control's own row; the control draws the hover. */
  .decorative {
    display: inline-flex;
    width: auto;
    height: auto;
    color: var(--muted);
  }
</style>
