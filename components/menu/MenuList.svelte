<script>
  /**
   * One level of the context menu. Renders its own submenu (recursively) to the side.
   * x/y: preferred top-left corner. flipX: right edge to align to when there is no room on the right.
   */
  import { tick } from 'svelte'
  // oxlint-disable-next-line import/no-self-import -- a recursive component: importing itself is how Svelte 5 renders its own submenu
  import MenuList from './MenuList.svelte'
  import Icon from '../Icon.svelte'

  let { items, x, y, flipX = x, label, level = 0, autofocus = true, onclose, onback = null } = $props()

  let sub = $state(null) // { index, x, y, flipX }
  const buttons = []
  const usable = $derived(items.map((it, i) => (it.separator || it.disabled ? -1 : i)).filter((i) => i >= 0))

  /** Attachment: measures the menu once rendered (off-screen, so its size isn't squeezed by the viewport edge), then
   *  keeps it inside the viewport. Runs again if the position or items change. */
  function place(node) {
    node.style.left = node.style.top = '-9999px'
    const r = node.getBoundingClientRect()
    let left = x,
      top = y
    if (left + r.width > innerWidth - 8) left = flipX - r.width
    if (top + r.height > innerHeight - 8) top = innerHeight - 8 - r.height
    node.style.left = `${Math.max(8, left)}px`
    node.style.top = `${Math.max(8, top)}px`
    if (autofocus) tick().then(() => focusAt(usable[0]))
  }

  function focusAt(i) {
    if (i == null) return
    buttons[i]?.focus()
  }

  function step(from, delta) {
    if (!usable.length) return
    const at = usable.indexOf(from)
    const next = at < 0 ? (delta > 0 ? 0 : usable.length - 1) : (at + delta + usable.length) % usable.length
    focusAt(usable[next])
  }

  function openSub(i, focus = false) {
    const r = buttons[i].getBoundingClientRect()
    sub = { index: i, x: r.right - 4, y: r.top - 5, flipX: r.left + 4, focus }
  }

  function activate(i, e) {
    const item = items[i]
    if (item.children) {
      e?.preventDefault()
      return openSub(i, true)
    }
    item.action?.()
    onclose()
  }

  function onkeydown(e) {
    const i = buttons.indexOf(document.activeElement)
    switch (e.key) {
      case 'ArrowDown':
        step(i, 1)
        break
      case 'ArrowUp':
        step(i, -1)
        break
      case 'Home':
        focusAt(usable[0])
        break
      case 'End':
        focusAt(usable.at(-1))
        break
      case 'ArrowRight':
        if (items[i]?.children) openSub(i, true)
        break
      case 'ArrowLeft':
        if (onback) onback()
        break
      case 'Escape':
        if (onback) onback()
        else onclose()
        break
      case 'Tab':
        onclose()
        break
      default:
        // Type-ahead: jump to the next item starting with that letter.
        if (e.key.length === 1 && /\S/.test(e.key)) {
          const k = e.key.toLowerCase()
          const order = usable.slice(usable.indexOf(i) + 1).concat(usable.slice(0, usable.indexOf(i) + 1))
          focusAt(order.find((j) => items[j].label.toLowerCase().startsWith(k)))
        } else return
    }
    e.preventDefault()
    e.stopPropagation()
  }

  function hover(i) {
    if (items[i].separator || items[i].disabled) return
    focusAt(i)
    if (items[i].children) openSub(i)
    else sub = null
  }
</script>

<div class="ctx-menu" role="menu" aria-label={label} tabindex="-1" {@attach place} {onkeydown} oncontextmenu={(e) => e.preventDefault()}>
  {#each items as item, i (i)}
    {#if item.separator}
      <div class="sep" role="separator"></div>
    {:else if item.href}
      <a
        bind:this={buttons[i]}
        class="item"
        role="menuitem"
        tabindex="-1"
        href={item.href}
        target="_blank"
        rel="noopener"
        onclick={() => activate(i)}
        onpointerenter={() => hover(i)}
      >
        <span class="check" aria-hidden="true"
          >{#if item.icon}<Icon name={item.icon} size="sm" />{/if}</span
        >
        <span class="label">{item.label}</span>
        <span class="hint"><Icon name="external" size="sm" /></span>
      </a>
    {:else}
      <button
        bind:this={buttons[i]}
        type="button"
        class="item"
        class:danger={item.danger}
        class:open={sub?.index === i}
        role={item.checked !== undefined ? 'menuitemradio' : 'menuitem'}
        aria-checked={item.checked}
        aria-haspopup={item.children ? 'menu' : undefined}
        aria-expanded={item.children ? sub?.index === i : undefined}
        disabled={item.disabled}
        tabindex="-1"
        onclick={(e) => activate(i, e)}
        onpointerenter={() => hover(i)}
      >
        <span class="check"
          >{#if item.checked}<Icon name="check" size="sm" />{:else if item.icon}<Icon name={item.icon} size="sm" />{/if}</span
        >
        <span class="label">{item.label}</span>
        {#if item.children}<span class="hint"><Icon name="caretRight" size="sm" /></span>{:else if item.hint}<span class="hint">{item.hint}</span>{/if}
      </button>
    {/if}
  {/each}
</div>

{#if sub}
  {#key sub.index}
    <MenuList
      items={items[sub.index].children}
      x={sub.x}
      y={sub.y}
      flipX={sub.flipX}
      label={items[sub.index].label}
      level={level + 1}
      autofocus={sub.focus}
      {onclose}
      onback={() => {
        const i = sub.index
        sub = null
        focusAt(i)
      }}
    />
  {/key}
{/if}

<style>
  .ctx-menu {
    position: fixed;
    z-index: var(--z-menu);
    min-width: 220px;
    max-width: min(340px, calc(100dvw - 16px));
    max-height: calc(100dvh - 16px);
    overflow-y: auto;
    overscroll-behavior: contain;
    border: 1px solid transparent;
    background:
      linear-gradient(var(--elevated), var(--elevated)) padding-box,
      var(--edge-grad-float);
    color: var(--fg-2);
    border-radius: var(--r-lg);
    padding: 4px;
    box-shadow: var(--shadow);
    font-size: 13px;
    animation: pop var(--dur-fast) var(--ease-out);
  }
  .ctx-menu:focus {
    outline: none;
  }
  .item {
    all: unset;
    box-sizing: border-box;
    width: 100%;
    display: grid;
    grid-template-columns: 14px 1fr auto;
    align-items: center;
    gap: 8px;
    min-height: 32px;
    padding: 0 var(--space-3) 0 var(--space-2);
    border-radius: var(--r-sm);
    cursor: pointer;
    color: var(--fg-2);
    font-weight: var(--w-medium);
    text-decoration: none;
  }
  .item:focus,
  .item.open {
    background: var(--fill-3);
    color: var(--fg);
    outline: none;
  }
  .item :global(.icon) {
    color: var(--muted);
  }
  .item:focus-visible {
    box-shadow: inset 0 0 0 2px var(--accent);
  }
  .item:disabled {
    color: var(--muted);
    opacity: 0.6;
  }
  .danger {
    color: var(--danger);
  }
  /* A danger item's icon is in its red too, not the muted grey of the others. */
  .danger :global(.icon) {
    color: currentColor;
  }
  .check {
    display: inline-flex;
    color: var(--accent);
  }
  .label {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .hint {
    display: inline-flex;
    color: var(--faint);
    font-size: 12px;
    font-weight: 400;
    font-family: var(--font-data);
    font-variant-numeric: tabular-nums;
  }
  .sep {
    height: 1px;
    background: var(--line);
    margin: 4px -4px;
  }
  @keyframes pop {
    from {
      opacity: 0;
      scale: 0.96;
    }
  }
</style>
