<script>
  /**
   * Internal to filters/: the value editor of a date filter in FilterBar. Ready-made relative days ("3 days ago") in a
   * column beside a month calendar; a press on either picks. The value is a relative id ('-3d', see relativeDay in
   * lib/dates.js), which keeps its meaning as the days pass, or an ISO day picked on the calendar.
   *
   *   <DateFilter value="-3d" presets={datePresets()} label="Updated" onpick={(v) => …} />
   *
   * Keyboard: the list first (arrows, Enter or Space picks), Tab to the calendar (its own keys, see Calendar).
   */
  import { untrack } from 'svelte'
  import Calendar from '../inputs/Calendar.svelte'
  import OptionList from './OptionList.svelte'
  import { relativeDay, today } from '../../lib/dates.js'

  /**
   * @typedef {object} Props
   * @property {string | null | undefined} value
   * @property {{ value: string, label: string }[]} presets
   * @property {string} label
   * @property {(value: string) => void} onpick
   */
  /** @type {Props} */
  let { value, presets, label, onpick } = $props()

  const day = $derived(value ? relativeDay(value) : null)
  const preset = $derived(presets.some((p) => p.value === value) ? value : undefined)
  let month = $state(untrack(() => day ?? today()))
  let focus = $state(untrack(() => day ?? today()))
</script>

<div class="date-filter">
  <OptionList class="presets" value={preset} options={presets} multiple={false} search={false} label="{label}: ready-made days" {onpick} />
  <div class="calendar">
    <Calendar bind:month bind:focus selected={day ? [day] : []} {onpick} {label} />
  </div>
</div>

<style>
  /* The presets and the calendar side by side, split by a rule running the panel's full height; stacked when narrow. */
  .date-filter {
    user-select: none;
    display: grid;
    grid-template-columns: auto auto;
  }
  .calendar {
    padding: var(--space-2) var(--space-3) var(--space-3);
    border-inline-start: 1px solid var(--line);
  }
  @media (max-width: 480px) {
    .date-filter {
      grid-template-columns: auto;
    }
    .calendar {
      border-inline-start: 0;
      border-top: 1px solid var(--line);
    }
  }
</style>
