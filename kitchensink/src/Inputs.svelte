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
  import FilterBar from '@xerios/design-system/components/filters/FilterBar.svelte'
  import FilterChip from '@xerios/design-system/components/filters/FilterChip.svelte'
  import OptionList from '@xerios/design-system/components/filters/OptionList.svelte'
  import { filterHistory } from '@xerios/design-system/lib/filter-history.svelte.js'
  import Icon from '@xerios/design-system/components/Icon.svelte'
  import { fieldErrors } from '@xerios/design-system/lib/field-errors.svelte.js'
  import { FIRST_INVALID } from '@xerios/design-system/lib/invalid.js'
  import { addDays, today } from '@xerios/design-system/lib/dates.js'

  let name = $state('')
  let search = $state('')
  let notes = $state('')
  let region = $state('eu')
  let longRegion = $state('ap')
  let tags = $state(['alpha', 'beta'])
  let live = $state(true)
  let view = $state('list')
  let filter = $state('all')
  let density = $state('comfortable')
  let opacity = $state(60)
  let years = $state(3)
  let band = $state(/** @type {[number, number]} */ ([2, 4]))
  let price = $state(/** @type {[number, number]} */ ([20, 80]))
  let due = $state('')
  let stay = $state(/** @type {[string, string]} */ (['', '']))
  let slot = $state('')
  let sundayDue = $state('')
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

  // Filters, on a job board: where a job is in your applications, how it's worked, the company, when it was posted,
  // words in the listing and a salary floor (a custom field with its own editor).
  const STAGES = [
    { value: 'new', label: 'Not applied', icon: 'circleDashed', hint: '48 jobs' },
    { value: 'applied', label: 'Applied', icon: 'paperPlane', tone: 'info', hint: '9 jobs' },
    { value: 'interview', label: 'Interviewing', icon: 'chatsCircle', tone: 'warning', hint: '3 jobs' },
    { value: 'offer', label: 'Offer', icon: 'checkCircle', tone: 'success', hint: '1 job' },
    { value: 'rejected', label: 'Rejected', icon: 'xCircle', tone: 'danger', hint: '6 jobs' },
  ]
  const MODES = [
    { value: 'remote', label: 'Remote', icon: 'globe', hint: '31 jobs' },
    { value: 'hybrid', label: 'Hybrid', icon: 'house', hint: '22 jobs' },
    { value: 'onsite', label: 'On-site', icon: 'buildings', hint: '14 jobs' },
  ]
  const LEVELS = ['Junior', 'Mid-level', 'Senior', 'Staff', 'Principal'].map((label) => ({ value: label.toLowerCase(), label }))
  const COMPANIES = [
    'Acme Robotics', 'Brightwave', 'Cobalt Labs', 'Driftwood Studio', 'Evergreen Health', 'Foxglove', 'Granite Bank',
    'Halcyon Travel', 'Ironbark Energy', 'Juniper Games', 'Kestrel Logistics', 'Lumen Data',
  ].map((label, i) => ({ value: label.toLowerCase().replace(/\s+/g, '-'), label, icon: 'buildings', hint: `${1 + ((i * 5) % 9)} jobs` }))
  /** @type {import('svelte').ComponentProps<typeof FilterBar>['fields']} */
  const FIELDS = [
    { key: 'stage', label: 'Application', icon: 'paperPlane', options: STAGES, plural: 'stages' },
    { key: 'mode', label: 'Work mode', icon: 'globe', options: MODES, plural: 'modes', operators: ['is any of', 'is not'] },
    { key: 'level', label: 'Seniority', icon: 'steps', options: LEVELS, plural: 'levels' },
    { key: 'company', label: 'Company', icon: 'buildings', options: COMPANIES, plural: 'companies' },
    { key: 'posted', label: 'Posted', icon: 'clock', kind: 'date' },
    { key: 'words', label: 'Keywords', icon: 'search', kind: 'text', operators: ['contain', "don't contain"] },
    { key: 'salary', label: 'Salary', icon: 'currencyEur', kind: 'custom', operators: ['at least', 'at most'], format: (k) => euros(k) },
    { key: 'easy', label: 'Easy apply', icon: 'cursorClick', kind: 'boolean' },
    { key: 'visa', label: 'Visa sponsorship', icon: 'briefcase', kind: 'boolean' },
  ]
  let filters = $state([
    { field: 'posted', op: 'after', value: '-3d' },
    { field: 'mode', op: 'is any of', value: ['remote'] },
  ])
  let manyFilters = $state([
    { field: 'stage', op: 'is not', value: ['applied', 'interview', 'rejected'] },
    { field: 'words', op: 'contain', value: ['svelte', 'typescript'] },
    { field: 'salary', op: 'at least', value: 70 },
  ])
  let noFilters = $state([])
  let recentFilters = $state([{ field: 'mode', op: 'is any of', value: ['remote'] }])
  // A history filled in advance, so the recent list shows at once.
  const seeded = filterHistory('ks-seeded')
  for (const [filter, times] of /** @type {const} */ ([
    [{ field: 'mode', op: 'is any of', value: ['remote'] }, 6],
    [{ field: 'stage', op: 'is', value: ['interview', 'offer'] }, 4],
    [{ field: 'posted', op: 'after', value: '-1w' }, 3],
    [{ field: 'level', op: 'is', value: ['senior'] }, 2],
    [{ field: 'words', op: 'contain', value: ['svelte'] }, 1],
    [{ field: 'salary', op: 'at least', value: 80 }, 1],
  ]))
    for (let i = 0; i < times; i++) seeded.record(filter)
  let chipOp = $state('is')
  let chipStages = $state(['applied'])
  let chipGone = $state(false)
  let picked = $state(['applied', 'interview'])
  let pickedCompanies = $state(['foxglove'])
  let pickedLevel = $state('senior')
  /** @param {number} k */
  const euros = (k) => `€${k}k`

  // Many options: past 8 the list gets a search field (accents don't matter: "zurich" finds Zürich).
  const CITIES = ['Amsterdam', 'Barcelona', 'Berlin', 'Copenhagen', 'Dublin', 'Helsinki', 'Kraków', 'Lisbon', 'London', 'Madrid', 'Milan', 'Munich', 'Paris', 'Prague', 'Stockholm', 'Vienna', 'Warsaw', 'Zürich']
  const LOCATIONS = [
    { value: 'anywhere', label: 'Anywhere (remote)', group: 'Remote' },
    ...CITIES.map((city) => ({ value: city, label: city, group: 'Offices' })),
  ]
  let location = $state('anywhere')
  const REGIONS = [
    { value: 'eu', label: 'Europe', hint: 'Frankfurt', group: 'Close by' },
    { value: 'uk', label: 'United Kingdom', hint: 'London', group: 'Close by' },
    { value: 'us', label: 'United States', hint: 'Virginia', group: 'Further away' },
    { value: 'ap', label: 'Asia Pacific (Singapore, Sydney, Tokyo and Mumbai edge locations)', hint: 'Singapore', group: 'Further away' },
  ]

  // Options with detail: a card beside the list while one is under the pointer or the keyboard.
  const MODELS = [
    { value: 'swift', label: 'Swift', hint: 'fast', detail: 'Answers in a blink. Good for short replies and autocomplete.' },
    { value: 'steady', label: 'Steady', hint: 'balanced', detail: { title: 'Steady, the default', text: 'Strong at most tasks at a fair speed and cost.' } },
    { value: 'deep', label: 'Deep', hint: 'thorough', detail: { title: 'Deep', text: 'Takes its time on long documents and hard problems.' } },
    { value: 'legacy', label: 'Legacy' },
  ]
  let model = $state('steady')
  const TIERS = [
    { value: 'free', label: 'Free', hint: '€0', detail: { summary: 'For trying it out on your own.', perks: ['3 projects', '1 GB storage'], limit: '100 requests a day' } },
    { value: 'team', label: 'Team', hint: '€12', detail: { summary: 'For a team shipping together.', perks: ['Unlimited projects', '50 GB storage', 'Shared views'], limit: '10,000 requests a day' } },
    { value: 'scale', label: 'Scale', hint: '€40', detail: { summary: 'For many teams, with controls for admins.', perks: ['Everything in Team', 'SSO and audit log', 'Priority support'], limit: 'No limit' } },
  ]
  let tier = $state('team')
  // Rows of your own: initials, a name and an email under it, and a role on the right.
  const PEOPLE = [
    { value: 'ada', label: 'Ada Brandt', email: 'ada@example.com', role: 'Owner' },
    { value: 'kofi', label: 'Kofi Mensah', email: 'kofi@example.com', role: 'Editor' },
    { value: 'li', label: 'Li Wei', email: 'li.wei@example.com', role: 'Editor' },
    { value: 'sam', label: 'Sam Okafor', email: 'sam.okafor@example.com', role: 'Viewer' },
  ]
  let assignee = $state('kofi')
  let reviewer = $state('li')
  // Separators: hairlines dividing the list without headings.
  const SORTS = [
    { value: 'new', label: 'Newest first' },
    { value: 'old', label: 'Oldest first' },
    { value: 'az', label: 'Name, A to Z', separator: true },
    { value: 'za', label: 'Name, Z to A' },
    { value: 'manual', label: 'Manual order', separator: true },
  ]
  let sort = $state('new')
  const initials = (/** @type {string} */ name) => name.split(' ').map((w) => w[0]).join('')
  const LEVEL_DETAILS = LEVELS.map((o, i) => ({ ...o, detail: { title: o.label, text: `About ${2 + i * 3} years in, give or take.` } }))
  let pickedLevelDetail = $state('mid-level')

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

{#snippet salaryPanel(/** @type {{ filter: { value: any }, set: (value: any) => void }} */ { filter, set })}
  <div class="filter-salary">
    <Slider bind:value={() => filter.value ?? 50, (k) => set(k)} min={20} max={200} step={5} id="ks-filter-salary" label="Yearly salary" format={euros} />
  </div>
{/snippet}
{#snippet salarySummary(/** @type {{ filter: { value: any } }} */ { filter })}<span class="num">{euros(filter.value)}</span>{/snippet}

<Section
  id="inputs"
  title="Inputs"
  intro="Every field has a label, an optional ⓘ, and one way of showing its error (the invalid attachment and a bubble under it)."
>
  <Demo label="Text field" description="A labelled input, with an optional ⓘ and an error bubble.">
    <Case label="With an ⓘ">
      <TextField bind:value={name} id="ks-name" label="Name" type="text" placeholder="Ada Lovelace" info="What people call you. Shown on your profile." />
    </Case>
    <Case label="With an error">
      <div class="bubble-room">
        <TextField value="ada@" id="ks-email" label="Email" type="text" error="Enter a whole email address." />
      </div>
    </Case>
  </Demo>
  <Demo label="Search field" description="Esc clears it; / focuses it from anywhere.">
    <SearchField bind:value={search} id="ks-search" label="Search" placeholder="Search" shortcut="/" />
  </Demo>
  <Demo label="Text area" description="Grows with its text.">
    <TextArea bind:value={notes} id="ks-notes" label="Notes" placeholder="Anything worth writing down" />
  </Demo>
  <Demo label="Select" description="One of a list: groups, separators, search, detail beside it, rows of your own.">
    <Case label="Grouped">
      <Select bind:value={region} options={REGIONS} id="ks-region" label="Region" info="Where the files are served from." />
    </Case>
    <Case label="A long value in a narrow place: cut off on the button, whole in its tooltip">
      <div class="narrow-field">
        <Select bind:value={longRegion} options={REGIONS} id="ks-region-long" label="Region" />
      </div>
    </Case>
    <Case label="Many options: a search field narrows the list">
      <Select bind:value={location} options={LOCATIONS} id="ks-location" label="Location" />
    </Case>
    <Case label="Detail beside the list: hover an option or arrow through them">
      <Select bind:value={model} options={MODELS} id="ks-model" label="Model" />
    </Case>
    <Case label="Rich detail, drawn by the detail snippet">
      <Select bind:value={tier} options={TIERS} id="ks-tier" label="Plan">
        {#snippet detail(o)}
          <h4>{o.label}</h4>
          <p>{o.detail.summary}</p>
          <ul>{#each o.detail.perks as perk (perk)}<li>{perk}</li>{/each}</ul>
          <hr />
          <small>{o.detail.limit}</small>
        {/snippet}
      </Select>
    </Case>
    <Case label="Rows of your own, drawn by the item snippet">
      <Select bind:value={assignee} options={PEOPLE} id="ks-assignee" label="Assignee">
        {#snippet item(o)}
          <span class="person-initials" aria-hidden="true">{initials(o.label)}</span>
          <span class="person">
            <span>{o.label}</span>
            <span class="person-email">{o.email}</span>
          </span>
          <span class="person-role">{o.role}</span>
        {/snippet}
      </Select>
    </Case>
    <Case label="The chosen option drawn by the display snippet">
      <Select bind:value={reviewer} options={PEOPLE} id="ks-reviewer" label="Reviewer">
        {#snippet display(o)}
          <span class="person-initials" aria-hidden="true">{initials(o.label)}</span>
          <span class="person-name">{o.label}</span>
        {/snippet}
      </Select>
    </Case>
    <Case label="Separators between options, without headings">
      <Select bind:value={sort} options={SORTS} id="ks-sort" label="Sort" />
    </Case>
    <Case label="Loading">
      <Select value="eu" options={REGIONS} id="ks-region-2" label="Region" loading="Checking regions…" />
    </Case>
    <Case label="Ghost">
      <Select value="eu" options={REGIONS} id="ks-region-3" label="Region" ghost />
    </Case>
    <Case label="With an error">
      <div class="bubble-room">
        <Select value="eu" options={REGIONS} id="ks-region-4" label="Region" error="This region is full." />
      </div>
    </Case>
    <Case label="Disabled">
      <Select value="eu" options={REGIONS} id="ks-region-5" label="Region" disabled />
    </Case>
  </Demo>
  <Demo label="Filter bar" description="The applied filters as chips, and a button to add one." wide>
    <Case label="Applied filters: a relative date and a list of values">
      <FilterBar bind:filters fields={FIELDS} label="Job filters" panel={salaryPanel} summary={salarySummary} history="ks-jobs" />
    </Case>
    <Case label="Recent filters lead the add list (the most used first), and a boolean field flips in place">
      <FilterBar bind:filters={recentFilters} fields={FIELDS} label="Job filters" panel={salaryPanel} summary={salarySummary} history={seeded} />
    </Case>
    <Case label="Several values, typed keywords and a custom field (salary, with a slider)">
      <FilterBar bind:filters={manyFilters} fields={FIELDS} label="Job filters" panel={salaryPanel} summary={salarySummary} />
    </Case>
    <Case label="Nothing filtered yet (the custom field is left out without a panel snippet)">
      <FilterBar bind:filters={noFilters} fields={FIELDS} label="Job filters" />
    </Case>
  </Demo>
  <Demo label="Filter chip" description="One filter: a field, a condition and its values." wide>
    <Case label="A condition menu and a list of values">
      {#if chipGone}
        <Button small onclick={() => (chipGone = false)}>Bring the filter back</Button>
      {:else}
        <FilterChip
          field={{ label: 'Application', icon: 'paperPlane' }}
          operator={chipOp}
          operators={['is', 'is not']}
          onoperator={(op) => (chipOp = op)}
          onremove={() => (chipGone = true)}
        >
          {#snippet value()}<span class="num">{chipStages.length}</span> {chipStages.length === 1 ? 'stage' : 'stages'}{/snippet}
          {#snippet panel()}<OptionList bind:value={chipStages} options={STAGES} label="Application" />{/snippet}
        </FilterChip>
      {/if}
    </Case>
    <Case label="One condition, a value with no editor">
      <FilterChip field={{ label: 'Role', icon: 'briefcase' }} operator="is" onremove={() => {}}>
        {#snippet value()}Frontend engineer{/snippet}
      </FilterChip>
    </Case>
  </Demo>
  <Demo label="Option list" description="A list to pick from, inside a panel.">
    <Case label="Several, with icons, tones and counts">
      <div class="panel-like"><OptionList bind:value={picked} options={STAGES} label="Application" autofocus={false} /></div>
    </Case>
    <Case label="More than 8: a search field narrows it">
      <div class="panel-like"><OptionList bind:value={pickedCompanies} options={COMPANIES} label="Company" autofocus={false} /></div>
    </Case>
    <Case label="One, no icons">
      <div class="panel-like"><OptionList bind:value={pickedLevel} options={LEVELS} multiple={false} label="Seniority" autofocus={false} /></div>
    </Case>
    <Case label="With detail beside it: hover a row, or arrow through with the focus in it">
      <div class="panel-like"><OptionList bind:value={pickedLevelDetail} options={LEVEL_DETAILS} multiple={false} label="Seniority" autofocus={false} /></div>
    </Case>
  </Demo>
  <Demo label="Tag input" description="Enter or a comma adds a tag.">
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
  <Demo label="Segmented, ButtonGroup, RadioGroup" description="One of a few options.">
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
  <Demo label="Slider" description="One value, or a range.">
    <Case label="Fine steps: no ticks">
      <div class="stack">
        <Slider bind:value={opacity} id="ks-opacity" label="Opacity" format={(v) => `${v}%`} />
        <RangeSlider bind:value={price} min={0} max={200} step={5} gap={10} id="ks-price" label="Price" format={(v) => `€${v}`} />
      </div>
    </Case>
    <Case label="A few stops: a tick at each">
      <div class="stack">
        <Slider bind:value={years} min={0} max={10} id="ks-years" label="Years of experience" format={(v) => (v === 10 ? '10+' : String(v))} />
        <RangeSlider bind:value={band} min={1} max={5} id="ks-band" label="Seniority" format={(v) => LEVELS[v - 1].label} />
      </div>
    </Case>
  </Demo>
  <Demo label="Date picker" description="A date from a calendar.">
    <Case label="Within the next 90 days">
      <DatePicker bind:value={due} id="ks-due" label="Due date" min={today()} max={addDays(today(), 90)} info="Within the next 90 days." />
    </Case>
    <Case label="Only some days">
      <DatePicker bind:value={slot} id="ks-slot" label="Slot" allowed={SLOTS} />
    </Case>
    <Case label="Weeks from Sunday (weekStart: 7)">
      <DatePicker bind:value={sundayDue} id="ks-sunday" label="Delivery" weekStart={7} />
    </Case>
  </Demo>
  <Demo label="Date range picker" description="A start and an end date.">
    <DateRangePicker bind:value={stay} id="ks-stay" label="Stay" />
  </Demo>
  <Demo label="Date range select" description="A range picked out of a list of dates.">
    <DateRangeSelect bind:value={runs} dates={RUNS} id="ks-runs" label="Runs" />
  </Demo>
  <Demo label="Upload" description="Files, folders and images, picked or dropped." span={2}>
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
  <Demo label="Tile group" description="Choices drawn as tiles: one, or several." span={2}>
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
  <Demo label="Field label" description="The label, note and ⓘ for a control of your own.">
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
  <Demo label="Form" description="Errors show only after Submit." wide>
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
  .panel-like {
    width: 280px;
    max-width: 100%;
    border: 1px solid var(--line-float);
    border-radius: var(--r-lg);
    background: var(--elevated);
  }
  .num {
    font-family: var(--font-data);
    font-variant-numeric: tabular-nums;
  }
  .filter-salary {
    padding: var(--space-3);
    width: 280px;
  }
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
  .person-initials {
    display: grid;
    place-items: center;
    flex: none;
    width: 24px;
    height: 24px;
    border-radius: var(--r-pill);
    background: var(--fill-3);
    color: var(--fg-2);
    font-size: 11px;
    font-weight: var(--w-semibold);
  }
  .person {
    display: grid;
    flex: 1;
    min-width: 0;
    line-height: 1.3;
  }
  .person-email {
    color: var(--muted);
    font: 12px var(--font-data);
    overflow: clip;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .person-name {
    min-width: 0;
    overflow: clip;
    text-overflow: ellipsis;
  }
  .person-role {
    flex: none;
    color: var(--muted);
    font-size: 12px;
  }
  /* Narrower than the long value, wherever the demo's column is: the button stops at its container and cuts it off. */
  .narrow-field {
    width: 200px;
    max-width: 100%;
  }
</style>
