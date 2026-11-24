// Made-up data for the demo page: a product team's issues in one project, grouped by status.
import { addDays, today } from '@xerios/design-system/lib/dates.js'

export const PEOPLE = [
  { value: 'ada', label: 'Ada Brandt', hint: 'Design' },
  { value: 'kofi', label: 'Kofi Mensah', hint: 'Web' },
  { value: 'li', label: 'Li Wei', hint: 'Platform' },
  { value: 'noor', label: 'Noor Haddad', hint: 'Mobile' },
]
export const initials = (/** @type {string} */ id) =>
  (PEOPLE.find((p) => p.value === id)?.label ?? '?')
    .split(' ')
    .map((w) => w[0])
    .join('')

export const LABELS = {
  design: { name: 'Design', tone: 'info' },
  bug: { name: 'Bug', tone: 'danger' },
  web: { name: 'Web', tone: 'success' },
  mobile: { name: 'Mobile', tone: 'warning' },
  docs: { name: 'Docs', tone: 'neutral' },
}

export const PRIORITIES = {
  urgent: { label: 'Urgent', icon: 'warning' },
  high: { label: 'High', icon: 'signalHigh' },
  medium: { label: 'Medium', icon: 'signalMedium' },
  low: { label: 'Low', icon: 'signalLow' },
}

/** @typedef {{ id: string, title: string, status: string, priority: keyof typeof PRIORITIES, labels: (keyof typeof LABELS)[], who: string, due: string }} Issue */
const day = (/** @type {number} */ n) => addDays(today(), n)
/** @type {Issue[]} */
export const ISSUES = [
  { id: 'NW-142', title: 'Date range picker for the reports view', status: 'progress', priority: 'high', labels: ['design', 'web'], who: 'kofi', due: day(2) },
  { id: 'NW-139', title: 'Sync fails when the device is offline', status: 'progress', priority: 'urgent', labels: ['bug', 'mobile'], who: 'noor', due: day(1) },
  { id: 'NW-151', title: 'Quieter hover states across the menus', status: 'progress', priority: 'medium', labels: ['design'], who: 'ada', due: day(5) },
  { id: 'NW-155', title: 'Keyboard shortcuts sheet', status: 'todo', priority: 'medium', labels: ['web', 'docs'], who: 'li', due: day(8) },
  { id: 'NW-158', title: 'Offline banner on the home screen', status: 'todo', priority: 'low', labels: ['mobile'], who: 'noor', due: day(12) },
  { id: 'NW-160', title: 'Export a view as CSV', status: 'todo', priority: 'high', labels: ['web'], who: 'kofi', due: day(9) },
  { id: 'NW-131', title: 'Tooltips close when the page scrolls', status: 'done', priority: 'medium', labels: ['bug', 'web'], who: 'li', due: day(-3) },
  { id: 'NW-127', title: 'Dark theme for the settings pages', status: 'done', priority: 'low', labels: ['design'], who: 'ada', due: day(-6) },
]

export const STATUSES = [
  { value: 'progress', label: 'In progress', icon: 'circleDashed', tone: 'warning' },
  { value: 'todo', label: 'Todo', icon: 'circleDashed', tone: 'neutral' },
  { value: 'done', label: 'Done', icon: 'checkCircle', tone: 'success' },
]

/** Issues closed per day over the last two weeks, for the chart in the first tile. */
export const THROUGHPUT = [2, 3, 1, 4, 3, 5, 2, 6, 4, 5, 7, 4, 6, 8]
