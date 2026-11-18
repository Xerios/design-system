<script>
  /** Kitchen sink: every field and choice control, and a form with submit-first validation (fieldErrors). */
  import Section from './Section.svelte'
  import Demo from './Demo.svelte'
  import Button from '../components/Button.svelte'
  import TextField from '../components/inputs/TextField.svelte'
  import SearchField from '../components/inputs/SearchField.svelte'
  import TextArea from '../components/inputs/TextArea.svelte'
  import Select from '../components/inputs/Select.svelte'
  import TagInput from '../components/inputs/TagInput.svelte'
  import Switch from '../components/inputs/Switch.svelte'
  import Segmented from '../components/inputs/Segmented.svelte'
  import ButtonGroup from '../components/inputs/ButtonGroup.svelte'
  import RadioGroup from '../components/inputs/RadioGroup.svelte'
  import Slider from '../components/inputs/Slider.svelte'
  import RangeSlider from '../components/inputs/RangeSlider.svelte'
  import DatePicker from '../components/inputs/DatePicker.svelte'
  import DateRangePicker from '../components/inputs/DateRangePicker.svelte'
  import { fieldErrors } from '../lib/field-errors.svelte.js'
  import { FIRST_INVALID } from '../lib/invalid.js'
  import { addDays, today } from '../lib/dates.js'

  let name = $state('')
  let search = $state('')
  let notes = $state('')
  let region = $state('eu')
  let tags = $state(['alpha', 'beta'])
  let live = $state(true)
  let view = $state('list')
  let filter = $state('all')
  let density = $state('comfortable')
  let opacity = $state(60)
  let price = $state(/** @type {[number, number]} */ ([20, 80]))
  let due = $state('')
  let stay = $state(/** @type {[string, string]} */ (['', '']))

  const REGIONS = [
    { value: 'eu', label: 'Europe', hint: 'Frankfurt', group: 'Close by' },
    { value: 'uk', label: 'United Kingdom', hint: 'London', group: 'Close by' },
    { value: 'us', label: 'United States', hint: 'Virginia', group: 'Further away' },
    { value: 'ap', label: 'Asia Pacific (a long name that gets cut off on the button)', hint: 'Singapore', group: 'Further away' },
  ]

  // A form: nothing shows until Submit; after that a field rechecks when it's left and clears as it's edited.
  let form = $state({ title: '', url: '', when: '' })
  const errors = fieldErrors(() => ({
    ...(form.title.trim() ? {} : { title: 'Enter a title.' }),
    ...(/^https:\/\/\S+$/.test(form.url) ? {} : { url: 'Enter an address starting with https://.' }),
    ...(form.when ? {} : { when: 'Pick a day.' }),
  }))
  let sent = $state('')
  let sending = $state(false)
  /** @param {SubmitEvent} e */
  async function submit(e) {
    e.preventDefault()
    sent = ''
    if (!errors.validate()) {
      ;/** @type {HTMLElement | null} */ (/** @type {HTMLFormElement} */ (e.currentTarget).querySelector(FIRST_INVALID))?.focus()
      return
    }
    if (sending) return
    sending = true
    await new Promise((resolve) => setTimeout(resolve, 1000))
    sending = false
    sent = `Sent “${form.title}”.`
  }
</script>

<Section
  id="inputs"
  title="Inputs"
  intro="Every field has a label, an optional ⓘ, and one way of showing its error (the invalid attachment and a bubble under it)."
>
  <Demo label="Text field">
    <TextField bind:value={name} id="ks-name" label="Name" type="text" placeholder="Ada Lovelace" info="What people call you. Shown on your profile." />
  </Demo>
  <Demo label="Text field with an error">
    <TextField value="ada@" id="ks-email" label="Email" type="text" error="Enter a whole email address." />
  </Demo>
  <Demo label="Search (Esc clears, / focuses)">
    <SearchField bind:value={search} id="ks-search" label="Search" placeholder="Search" shortcut="/" />
  </Demo>
  <Demo label="Text area (grows with its text)">
    <TextArea bind:value={notes} id="ks-notes" label="Notes" placeholder="Anything worth writing down" />
  </Demo>
  <Demo label="Select, grouped">
    <Select bind:value={region} options={REGIONS} id="ks-region" label="Region" info="Where the files are served from." />
  </Demo>
  <Demo label="Select: loading, ghost, error">
    <Select value="eu" options={REGIONS} id="ks-region-2" label="Loading" loading="Checking regions…" />
    <Select value="eu" options={REGIONS} id="ks-region-3" label="Ghost" ghost />
    <Select value="eu" options={REGIONS} id="ks-region-4" label="With an error" error="This region is full." />
  </Demo>
  <Demo label="Tags (Enter or comma adds)">
    <TagInput
      bind:value={tags}
      id="ks-tags"
      label="Tags"
      placeholder="Add a tag"
      validate={(tag) => (/^[a-z0-9-]+$/.test(tag) ? '' : 'Lowercase letters, digits and dashes only.')}
    />
  </Demo>
  <Demo label="Switch">
    <Switch bind:checked={live} id="ks-live" label="Live" hint={live ? 'on' : 'off'} />
  </Demo>
  <Demo label="Segmented, ButtonGroup, RadioGroup">
    <div class="stack">
      <Segmented
        value={view}
        options={[
          { value: 'list', label: 'List', icon: 'sidebar' },
          { value: 'board', label: 'Board' },
        ]}
        label="View"
        onchange={(v) => (view = v)}
      />
      <ButtonGroup
        value={filter}
        options={[
          { value: 'all', label: 'All' },
          { value: 'open', label: 'Open' },
          { value: 'done', label: 'Done', hint: 'Finished this week' },
        ]}
        label="Show"
        onchange={(v) => (filter = v)}
      />
      <RadioGroup
        value={density}
        options={[
          { value: 'comfortable', label: 'Comfortable' },
          { value: 'compact', label: 'Compact', info: 'Smaller rows, more on screen.' },
        ]}
        label="Density"
        onchange={(v) => (density = v)}
      />
    </div>
  </Demo>
  <Demo label="Slider and range slider">
    <div class="stack">
      <Slider bind:value={opacity} id="ks-opacity" label="Opacity" format={(v) => `${v}%`} />
      <RangeSlider bind:value={price} min={0} max={200} step={5} gap={10} id="ks-price" label="Price" format={(v) => `€${v}`} />
    </div>
  </Demo>
  <Demo label="Date picker">
    <DatePicker bind:value={due} id="ks-due" label="Due date" min={today()} max={addDays(today(), 90)} info="Within the next 90 days." />
  </Demo>
  <Demo label="Date range picker">
    <DateRangePicker bind:value={stay} id="ks-stay" label="Stay" />
  </Demo>
  <Demo label="A form: errors only after Submit" wide>
    <form class="form" novalidate onsubmit={submit}>
      <TextField bind:value={form.title} id="ks-f-title" label="Title" type="text" {...errors.field('title')} />
      <TextField bind:value={form.url} id="ks-f-url" label="Address" type="text" placeholder="https://" {...errors.field('url')} />
      <DatePicker bind:value={form.when} id="ks-f-when" label="Publish on" error={errors.errors.when} />
      <div class="submit">
        <Button type="submit" variant="primary" pending={sending} pendingLabel="Sending…">Submit</Button>
        <Button type="button" onclick={() => ((form = { title: '', url: '', when: '' }), errors.reset(), (sent = ''))}>Reset</Button>
        {#if sent}<span class="small muted" role="status">{sent}</span>{/if}
      </div>
    </form>
  </Demo>
</Section>

<style>
  .stack {
    display: grid;
    gap: var(--space-3);
  }
  .form {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 220px), 1fr));
    gap: var(--space-4) var(--space-3);
    width: 100%;
    align-items: start;
  }
  .submit {
    grid-column: 1 / -1;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2);
  }
</style>
