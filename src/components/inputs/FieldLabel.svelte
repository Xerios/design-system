<script>
  /**
   * A field's label: its text, an optional dimmed note after it ("(optional)"), and an optional ⓘ with help text. The
   * fields (TextField, Select, TagInput…) all draw theirs with it; use it for a custom control so its label matches.
   *
   *   <FieldLabel for="name" label="Name" note="(optional)" info="What people call you." />
   *   <input id="name" />
   *   <FieldLabel id="plan-label" label="Plan" />   (no `for`: a <span>, for a group named with aria-labelledby)
   *
   * label: the text. for: the control's id; without it the label is a <span>. id: the label's own id.
   * note: dimmed text after the label (.label-note), read by screen readers as part of the name.
   * info: help text behind an ⓘ after the label (InfoTip, named "About {label}"); the two then sit in a .field-head row.
   * hideLabel: the label is kept for screen readers only; an ⓘ stays visible.
   * Other attributes, the class and attachments go to the label element.
   * Keyboard: the ⓘ is a tab stop and opens its tip on focus (see InfoTip).
   *
   * @typedef {object} Props
   * @property {string} label
   * @property {string} [for]
   * @property {string} [note]
   * @property {string} [info]
   * @property {boolean} [hideLabel]
   */
  import InfoTip from '../InfoTip.svelte'

  /** @type {Props & Omit<import('svelte/elements').HTMLLabelAttributes, keyof Props>} */
  let { label, for: htmlFor, note = '', info = '', hideLabel = false, class: className, ...rest } = $props()
</script>

{#snippet text()}
  <svelte:element
    this={htmlFor ? 'label' : 'span'}
    for={htmlFor}
    class={['field-label', hideLabel && 'sr-only', className]}
    {...rest}>{label}{#if note}{' '}<span class="label-note">{note}</span>{/if}</svelte:element
  >
{/snippet}

{#if info}
  <div class="field-head">{@render text()}<InfoTip text={info} label="About {label}" /></div>
{:else}
  {@render text()}
{/if}
