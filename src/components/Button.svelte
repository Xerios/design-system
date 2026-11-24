<script>
  /**
   * The .btn pill (or an .icon-btn), with an optional icon, that runs an async action and shows while it runs.
   *
   *   <Button icon="refresh" onclick={() => refreshAll()}>Try again</Button>
   *   <Button variant="danger" icon="trash" pendingLabel="Removing…" onclick={remove}>Remove subdomain</Button>
   *   <Button iconOnly icon="refresh" label="Refresh" onclick={reload} />
   *   <Button type="submit" form="new-site" variant="primary" pending={submitting}>Create</Button>
   *   <Button href="/">Go to apps</Button>
   *
   * onclick may return a promise. Until it settles the button is busy, drawn as Select is while loading: it drops its
   * fill (a solid one becomes an outlined pill), the working sweep runs along its edge (.shimmer) and its label shimmers
   * (Shimmer), `pendingLabel` (if given) in its place; an
   * icon-only button shows a spinner instead of its icon. It is aria-busy, and further presses are ignored (a flag, not
   * only the look), so the action can't run twice; the focus stays on it. Under reduced motion the sweep and the spinner
   * hold still, so give a `pendingLabel` where you can: it says what is happening in words. The button shows no error
   * of its own: if the promise rejects, `onerror` gets the error (say what went wrong where it belongs: a toast, an
   * Empty.Error, a field's `error`); without one the rejection is thrown on, for the app's own error handling.
   * pending: busy from outside, e.g. a form submit button while its form's request runs.
   *
   * variant: secondary (default) | primary | danger. small: the 24px size (.btn-small, or .icon-btn-small with a small
   * icon). icon: an Icon name, before the label.
   * iconOnly: the round .icon-btn showing just the icon; `label` is then required, and becomes its accessible name and
   * its tooltip. An aria-label passed as well names it instead (say "Remove report.pdf" under the tooltip "Remove").
   * detail: a second line in an icon-only button's tooltip, what it applies to (a file name; see lib/tooltip.js).
   * iconSize: the icon's size (sm, md, lg) where the default doesn't suit the glyph: md on an icon-only button, else sm. href: a link drawn as a button (navigation, never an action). disabled: as on any button.
   * Other attributes (class, form, autofocus…) and attachments go to the <button> (or <a>).
   */
  import Icon from './Icon.svelte'
  import Shimmer from './Shimmer.svelte'
  import { tooltip } from '../lib/tooltip.js'

  /**
   * @typedef {object} Props
   * @property {'secondary' | 'primary' | 'danger'} [variant]
   * @property {boolean} [small]
   * @property {string} [icon]
   * @property {'sm' | 'md' | 'lg'} [iconSize]
   * @property {boolean} [iconOnly]
   * @property {string} [label] the accessible name and tooltip of an iconOnly button
   * @property {string} [detail] a second line in an iconOnly button's tooltip
   * @property {string} [href]
   * @property {'button' | 'submit' | 'reset'} [type]
   * @property {(event: MouseEvent) => unknown} [onclick]
   * @property {boolean} [pending]
   * @property {string} [pendingLabel]
   * @property {(error: unknown) => void} [onerror]
   * @property {boolean} [disabled]
   * @property {import('svelte').Snippet} [children]
   */
  /** @type {Props & Omit<import('svelte/elements').HTMLButtonAttributes & import('svelte/elements').HTMLAnchorAttributes, keyof Props>} */
  let {
    variant = 'secondary',
    small = false,
    icon,
    iconSize,
    iconOnly = false,
    label,
    detail,
    href,
    type = 'button',
    onclick,
    pending = false,
    pendingLabel,
    onerror,
    disabled = false,
    class: className,
    children,
    ...rest
  } = $props()

  let running = $state(false)
  const busy = $derived(pending || running)

  const classes = $derived([
    iconOnly ? 'icon-btn' : 'btn',
    !iconOnly && variant === 'primary' && 'btn-primary',
    !iconOnly && variant === 'danger' && 'btn-danger',
    !iconOnly && small && 'btn-small',
    iconOnly && small && 'icon-btn-small',
    busy && 'shimmer',
    className,
  ])

  /** @param {MouseEvent} event */
  async function run(event) {
    if (busy) {
      // A press while busy does nothing, a submit included.
      event.preventDefault()
      return
    }
    const result = onclick?.(event)
    if (!(result instanceof Promise)) return
    running = true
    try {
      await result
    } catch (failure) {
      if (!onerror) throw failure
      onerror(failure)
    } finally {
      running = false
    }
  }
</script>

{#snippet content()}
  {#if busy && iconOnly}<span class="spin"><Icon name="spinner" size={small ? 'sm' : 'md'} /></span>{:else if icon}<Icon name={icon} size={iconSize ?? (iconOnly && !small ? 'md' : 'sm')} />{/if}
  {#if !iconOnly}
    <span class="btn-label"
      >{#if busy}<Shimmer>{#if pendingLabel}{pendingLabel}{:else}{@render children?.()}{/if}</Shimmer
        >{:else}{@render children?.()}{/if}</span
    >
  {/if}
{/snippet}

{#if href}
  <a {href} class={classes} aria-label={iconOnly ? label : undefined} {@attach tooltip(iconOnly ? label : '', { detail })} {...rest}>{@render content()}</a>
{:else}
  <button
    {type}
    class={classes}
    {disabled}
    aria-label={iconOnly ? label : undefined}
    aria-busy={busy || undefined}
    aria-disabled={busy || undefined}
    {@attach tooltip(iconOnly ? label : '', { detail })}
    {...rest}
    onclick={run}>{@render content()}</button
  >
{/if}

<style>
  /* While busy the button keeps its place and its focus, but drops its fill, so the sweep along its edge (.shimmer) is
     what you see: an outlined pill with a shimmering label. A solid button (primary, danger) loses its colour with it,
     so it takes the secondary button's text and hairline (its white label would vanish without the fill). The fill eases
     back when the work is done (.btn transitions it). */
  [aria-busy='true'] {
    cursor: progress;
    background: none;
    box-shadow: none;
    filter: none;
  }
  .btn-primary[aria-busy='true'],
  .btn-danger[aria-busy='true'] {
    border-color: var(--line-strong);
    color: var(--fg-2);
  }
  .spin {
    display: inline-flex;
    animation: spin 0.9s linear infinite;
  }
  @keyframes spin {
    to {
      rotate: 1turn;
    }
  }
</style>
