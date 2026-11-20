// Filters as one import: <FilterBar> draws a row of filters from data and adds, edits and removes them; <FilterBar.Chip>
// is one filter (field, condition, value, ✕) for a row of your own; <FilterBar.Options> the list of values to tick that
// their panels hold.
//
//   import FilterBar from '@xerios/design-system/components/filters/index.js'
//   <FilterBar bind:filters fields={FIELDS} />
import FilterBar from './FilterBar.svelte'
import FilterChip from './FilterChip.svelte'
import OptionList from './OptionList.svelte'

export default Object.assign(FilterBar, { Chip: FilterChip, Options: OptionList })
export { FilterChip, OptionList }
