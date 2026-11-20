<script>
  /** Kitchen sink: every field and choice control (tiles among them), and a form with submit-first validation (fieldErrors). */
  import Section from './Section.svelte'
  import Demo from './Demo.svelte'
  import Case from './Case.svelte'
  import Button from '@xerios/design-system/components/Button.svelte'
  import TextField from '@xerios/design-system/components/inputs/TextField.svelte'
  import SearchField from '@xerios/design-system/components/inputs/SearchField.svelte'
  import TextArea from '@xerios/design-system/components/inputs/TextArea.svelte'
  import Select from '@xerios/design-system/components/inputs/Select.svelte'
  import TagInput from '@xerios/design-system/components/inputs/TagInput.svelte'
  import Switch from '@xerios/design-system/components/inputs/Switch.svelte'
  import Segmented from '@xerios/design-system/components/inputs/Segmented.svelte'
  import ButtonGroup from '@xerios/design-system/components/inputs/ButtonGroup.svelte'
  import RadioGroup from '@xerios/design-system/components/inputs/RadioGroup.svelte'
  import Slider from '@xerios/design-system/components/inputs/Slider.svelte'
  import RangeSlider from '@xerios/design-system/components/inputs/RangeSlider.svelte'
  import DatePicker from '@xerios/design-system/components/inputs/DatePicker.svelte'
  import DateRangePicker from '@xerios/design-system/components/inputs/DateRangePicker.svelte'
  import DateRangeSelect from '@xerios/design-system/components/inputs/DateRangeSelect.svelte'
  import Tile from '@xerios/design-system/components/tiles/Tile.svelte'
  import TileGroup from '@xerios/design-system/components/tiles/TileGroup.svelte'
  import FieldLabel from '@xerios/design-system/components/inputs/FieldLabel.svelte'
  import Upload from '@xerios/design-system/components/upload/index.js'
  import { fieldErrors } from '@xerios/design-system/lib/field-errors.svelte.js'
  import { FIRST_INVALID } from '@xerios/design-system/lib/invalid.js'
  import { addDays, today } from '@xerios/design-system/lib/dates.js'

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
  let slot = $state('')
  let runs = $state(/** @type {[string, string]} */ (['', '']))
  let plan = $state('team')
  let topics = $state(['deploys', 'mentions'])
  let backups = $state(true)
  let keep = $state('30')
  let upFile = $state(/** @type {File | null} */ (null))
  let upFiles = $state(/** @type {File[]} */ ([]))
  let upFolder = $state(/** @type {{ name: string, files: { path: string, file: File }[] } | null} */ (null))
  let upImage = $state(/** @type {File | null} */ (null))
  let upImages = $state(/** @type {File[]} */ ([]))
  let zoneImages = $state(/** @type {File[]} */ ([]))
  let zoneFile = $state(/** @type {File | null} */ (null))
  const KEEP = [
    { value: '7', label: '7 days' },
    { value: '30', label: '30 days' },
    { value: '90', label: '90 days' },
  ]
  // Some days ahead to choose from, and some irregular moments in the past weeks.
  const SLOTS = [2, 3, 6, 9, 13, 20, 27].map((n) => addDays(today(), n))
  const RUNS = [0, 1, 3, 4, 8, 15, 22, 31, 45].map(
    (n, i) => `${addDays(today(), -n)}T${String(6 + ((i * 5) % 14)).padStart(2, '0')}:${i % 2 ? '30' : '05'}:00Z`,
  )

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
    <Case label="With an ⓘ">
      <TextField bind:value={name} id="ks-name" label="Name" type="text" placeholder="Ada Lovelace" info="What people call you. Shown on your profile." />
    </Case>
    <Case label="With an error">
      <div class="bubble-room">
        <TextField value="ada@" id="ks-email" label="Email" type="text" error="Enter a whole email address." />
      </div>
    </Case>
  </Demo>
  <Demo label="Search (Esc clears, / focuses)">
    <SearchField bind:value={search} id="ks-search" label="Search" placeholder="Search" shortcut="/" />
  </Demo>
  <Demo label="Text area (grows with its text)">
    <TextArea bind:value={notes} id="ks-notes" label="Notes" placeholder="Anything worth writing down" />
  </Demo>
  <Demo label="Select">
    <Case label="Grouped">
      <Select bind:value={region} options={REGIONS} id="ks-region" label="Region" info="Where the files are served from." />
    </Case>
    <Case label="Loading, ghost, error">
      <div class="bubble-room">
        <Select value="eu" options={REGIONS} id="ks-region-2" label="Loading" loading="Checking regions…" />
        <Select value="eu" options={REGIONS} id="ks-region-3" label="Ghost" ghost />
        <Select value="eu" options={REGIONS} id="ks-region-4" label="With an error" error="This region is full." />
      </div>
    </Case>
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
    <Case label="Within the next 90 days">
      <DatePicker bind:value={due} id="ks-due" label="Due date" min={today()} max={addDays(today(), 90)} info="Within the next 90 days." />
    </Case>
    <Case label="Only some days">
      <DatePicker bind:value={slot} id="ks-slot" label="Slot" allowed={SLOTS} />
    </Case>
  </Demo>
  <Demo label="Date range picker">
    <DateRangePicker bind:value={stay} id="ks-stay" label="Stay" />
  </Demo>
  <Demo label="Range from a list of dates">
    <DateRangeSelect bind:value={runs} dates={RUNS} id="ks-runs" label="Runs" />
  </Demo>
  <Demo label="Upload" span={2}>
    <Case label="File: pick or drop, and the button becomes the file">
      <Upload.File bind:file={upFile} />
      <span class="small muted">file: <span class="data">{upFile?.name ?? 'null'}</span></span>
    </Case>
    <Case label="Files: a list, added to">
      <Upload.Files bind:files={upFiles} />
      <span class="small muted">files: <span class="data">{upFiles.length}</span></span>
    </Case>
    <Case label="Folder: every file in it, with its path">
      <Upload.Folder bind:folder={upFolder} />
      <span class="small muted">first path: <span class="data">{upFolder?.files[0]?.path ?? 'null'}</span></span>
    </Case>
    <Case label="Image: a thumbnail">
      <Upload.Image bind:file={upImage} />
    </Case>
    <Case label="Images: a grid, added to">
      <Upload.Images bind:files={upImages} />
    </Case>
    <Case label="Image: at most 100 KB (the default is 10 MB)">
      <div class="bubble-room">
        <Upload.Image label="Choose icon" maxSize={100 * 1024} />
      </div>
    </Case>
    <Case label="Zone: drop anywhere on it">
      <Upload.Zone class="full">
        <Upload.Images bind:files={zoneImages} />
      </Upload.Zone>
    </Case>
    <Case label="Zone, bare: any area, marked only while files are over it">
      <div class="drop-panel">
        <Upload.Zone bare>
          <div class="drop-panel-body">
            <p class="small muted">A panel with content of its own. Files dropped anywhere on it go to the picker below.</p>
            <Upload.File bind:file={zoneFile} />
          </div>
        </Upload.Zone>
      </div>
    </Case>
    <Case label="With an error, or disabled">
      <div class="bubble-room">
        <Upload.File label="Attach the contract" accept=".pdf" error="Attach the signed contract." />
        <Upload.File label="Choose file" disabled />
      </div>
    </Case>
  </Demo>
  <Demo label="Tile group" span={2}>
    <Case label="One choice: arrows move and choose">
      <div class="full">
        <TileGroup label="Plan" bind:value={plan} columns={3} info="Change it any time. The new price starts on the day it changes.">
          <Tile value="hobby" title="Hobby" icon="flask">
            <p class="price"><span class="data">€0</span> a month</p>
            <ul class="ticks">
              <li>One project</li>
              <li>Community support</li>
            </ul>
          </Tile>
          <Tile value="team" title="Team" icon="rocket">
            <p class="price"><span class="data">€12</span> a seat, a month</p>
            <ul class="ticks">
              <li>Unlimited projects</li>
              <li>Shared settings and roles</li>
              <li>Support within a day</li>
            </ul>
          </Tile>
          <Tile value="custom" title="Custom" icon="lock" disabled>Agreed with us first, so it can't be chosen here.</Tile>
        </TileGroup>
      </div>
      <span class="small muted">Plan: {plan}</span>
    </Case>
    <Case label="Several: checkbox tiles, horizontal">
      <div class="full">
        <TileGroup label="Notify me about" multiple bind:value={topics} columns={2}>
          <Tile horizontal value="deploys" title="Deploys" icon="rocket">When one starts, finishes or fails.</Tile>
          <Tile horizontal value="builds" title="Builds" icon="code">Only the ones that fail.</Tile>
          <Tile horizontal value="mentions" title="Mentions" icon="star">When someone names you in a comment.</Tile>
          <Tile horizontal value="billing" title="Billing" icon="document">Invoices and changes to the plan.</Tile>
        </TileGroup>
      </div>
      <span class="small muted">Chosen: {topics.join(', ') || 'none'}</span>
    </Case>
    <Case label="A checkbox tile on its own: its top row toggles it, the field under it doesn't">
      <div class="one-tile">
        <Tile title="Nightly backups" icon="history" bind:checked={backups}>
          <div class="stack">
            <p>A copy of every database at 02:00.</p>
            {#if backups}<Select bind:value={keep} options={KEEP} id="ks-keep" label="Keep for" />{/if}
          </div>
        </Tile>
      </div>
    </Case>
  </Demo>
  <Demo label="Field label (for a custom control)">
    <Case label="Plain">
      <FieldLabel for="ks-fl-plain" label="Project" />
    </Case>
    <Case label="With a note">
      <FieldLabel for="ks-fl-note" label="Description" note="(optional)" />
    </Case>
    <Case label="With a note and an ⓘ">
      <FieldLabel for="ks-fl-info" label="Budget" note="(per month)" info="Spending stops once it is reached." />
    </Case>
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
  /* Room under a field showing its error for the bubble hanging below it (its offset and one line), so the bubble stays
     inside its Demo instead of covering the one tucked under it. Lays its fields out as a Case does. */
  .bubble-room {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2);
    padding-bottom: calc(var(--space-2) + var(--space-8));
  }
  .stack {
    display: grid;
    gap: var(--space-3);
  }
  .price {
    color: var(--fg-2);
  }
  .data {
    font-family: var(--font-data);
    font-variant-numeric: tabular-nums;
    color: var(--fg);
  }
  .ticks {
    display: grid;
    gap: var(--space-1);
    margin-top: var(--space-2);
    padding-inline-start: var(--space-4);
    list-style: disc;
  }
  .full {
    width: 100%;
    min-width: 0;
  }
  .drop-panel {
    width: 100%;
    border: 1px solid var(--line);
    border-radius: var(--r);
  }
  .drop-panel-body {
    display: grid;
    justify-items: start;
    gap: var(--space-2);
    padding: var(--space-3);
  }
  .drop-panel-body p {
    margin: 0;
  }
  .one-tile {
    width: 100%;
    max-width: 320px;
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
