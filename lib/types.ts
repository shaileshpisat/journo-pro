export type AmountType = 'inflow' | 'outflow'

export type CurrencySymbol = '$' | '€' | '£' | '₹' | '¥' | '₽' | '₩'

export interface TimeLog {
  startedAt: number
  duration: number
  description?: string
}

export interface EntryHistory {
  timestamp: number
  field: string
  oldValue: unknown
  newValue: unknown
}

export interface Comment {
  id: number
  text: string
  timestamp: string
  isPinned?: boolean
}

export type ProjectStatus = 'idea' | 'plan' | 'active' | 'on-hold' | 'done' | 'archived'
export type GoalStatus = 'plan' | 'in-progress' | 'off-track' | 'delayed' | 're-plan' | 'achieved' | 'archived'
export type HabitStatus = 'schedule' | 'started' | 'small-misses' | 'missing-but-consistent' | 'frequent-misses' | 'irregular' | 'cultivated' | 'archived'

export interface SmartGoal {
  specific: string
  measurable: string
  achievable: string
  relevant: string
  timeBound: string
}

export interface HabitAnalysis {
  duration: number | null
  specificTiming: string | null
  money: number | null
  frequency: string | null
}

export interface HabitTrackerEntry {
  date: string
  completed: boolean
  note?: string
}

export interface Project {
  id: number
  title: string
  startDate: string | null
  endDate: string | null
  status: ProjectStatus
  description?: string
  createdAt: string
  updatedAt: string
}

export interface Goal {
  id: number
  title: string
  startDate: string | null
  endDate: string | null
  status: GoalStatus
  smart: SmartGoal | null
  description?: string
  createdAt: string
  updatedAt: string
}

export interface Habit {
  id: number
  title: string
  startDate: string | null
  endDate: string | null
  status: HabitStatus
  analysis: HabitAnalysis
  tracker: HabitTrackerEntry[]
  description?: string
  createdAt: string
  updatedAt: string
}

export interface PGHMapping {
  type: 'project' | 'goal' | 'habit'
  id: number
}

export type ViewName =
  | 'home'
  | 'inbox'
  | 'search'
  | 'tasks'
  | 'calendar'
  | 'folders'
  | 'settings'
  | 'archive'
  | 'entities'
  | 'transactions'
  | 'parallel'
  | 'pgh'
  | `folder:${string}`

export interface Entry {
  id: number
  text: string
  timestamp: string
  actionDate: string | null
  tags: string[]
  folder: string | null
  amount: number | null
  amountType: AmountType | null
  mentions: string[]
  timeLogs: TimeLog[]
  history: EntryHistory[]
  isTask: boolean
  isTaskDone: boolean
  completedAt: string | null
  archived: boolean
  comments: Comment[]
  pghMapping: PGHMapping | null
}

export interface FolderNode {
  name: string
  path: string
  children: FolderNode[]
}

export interface SearchFilters {
  query: string
  filterEntity: string[]
  filterFolder: string[]
  filterTag: string[]
  filterFrom: string
  filterTo: string
  tasksOnly: boolean
}

export interface TimerSegment {
  startedAt: number
  pausedAt?: number
  description: string
}

export interface TimerState {
  entryId: number
  segments: TimerSegment[]
}

export interface Reminder {
  id: number
  title: string
  date: string    // YYYY-MM-DD
  done: boolean
  completedAt: string | null  // ISO timestamp when marked done
}

export const DEFAULT_SEARCH_FILTERS: SearchFilters = {
  query: '',
  filterEntity: [],
  filterFolder: [],
  filterTag: [],
  filterFrom: '',
  filterTo: '',
  tasksOnly: false,
}

export interface PendingRecurringEntry {
  entryId: number
  text: string
  actionDate: string
  periodTags: string[]
}

export const PERIOD_TAGS = ['daily', 'weekdays', 'weekend', 'weekly', 'monthly', 'quarterly'] as const

export interface AppState {
  entries: Entry[]
  view: ViewName
  selectedEntry: Entry | null
  sidebarCollapsed: boolean
  activeTimers: TimerState[]
  addFolderEntry: Entry | null
  currency: CurrencySymbol
  searchFilters: SearchFilters
  toast: string | null
  projects: Project[]
  goals: Goal[]
  habits: Habit[]
  reminders: Reminder[]
  reloadPending: boolean
  pendingRecurring: PendingRecurringEntry[]
}

export type Action =
  | { type: 'SET_ENTRIES'; payload: Entry[] }
  | { type: 'ADD_ENTRY'; payload: Entry }
  | { type: 'UPDATE_ENTRY'; payload: Entry }
  | { type: 'DELETE_ENTRY'; payload: number }
  | { type: 'SET_VIEW'; payload: ViewName }
  | { type: 'SELECT_ENTRY'; payload: Entry | null }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_TIMER'; payload: TimerState }
  | { type: 'REMOVE_TIMER'; payload: { entryId: number } }
  | { type: 'PAUSE_TIMER'; payload: { entryId: number } }
  | { type: 'RESUME_TIMER'; payload: { entryId: number } }
  | { type: 'LOG_TIME'; payload: { entryId: number; log: TimeLog } }
  | { type: 'SET_ADD_FOLDER_ENTRY'; payload: Entry | null }
  | { type: 'MOVE_FOLDER'; payload: { oldPath: string; newPath: string } }
  | { type: 'MARK_TASK'; payload: number }
  | { type: 'TOGGLE_TASK_DONE'; payload: number }
  | { type: 'ARCHIVE_ENTRY'; payload: number }
  | { type: 'RESTORE_ENTRY'; payload: number }
  | { type: 'ADD_COMMENT'; payload: { entryId: number; comment: Comment } }
  | { type: 'EDIT_COMMENT'; payload: { entryId: number; commentId: number; text: string } }
  | { type: 'PIN_COMMENT'; payload: { entryId: number; commentId: number } }
  | { type: 'SET_CURRENCY'; payload: CurrencySymbol }
  | { type: 'SET_SEARCH_FILTERS'; payload: SearchFilters }
  | { type: 'SET_TOAST'; payload: string | null }
  | { type: 'SET_PROJECTS'; payload: Project[] }
  | { type: 'ADD_PROJECT'; payload: Project }
  | { type: 'UPDATE_PROJECT'; payload: Project }
  | { type: 'DELETE_PROJECT'; payload: number }
  | { type: 'SET_GOALS'; payload: Goal[] }
  | { type: 'ADD_GOAL'; payload: Goal }
  | { type: 'UPDATE_GOAL'; payload: Goal }
  | { type: 'DELETE_GOAL'; payload: number }
  | { type: 'SET_HABITS'; payload: Habit[] }
  | { type: 'ADD_HABIT'; payload: Habit }
  | { type: 'UPDATE_HABIT'; payload: Habit }
  | { type: 'DELETE_HABIT'; payload: number }
  | { type: 'ADD_HABIT_TRACKER_ENTRY'; payload: { habitId: number; entry: HabitTrackerEntry } }
  | { type: 'SET_RELOAD_PENDING'; payload: boolean }
  | { type: 'SET_PENDING_RECURRING'; payload: PendingRecurringEntry[] }
  | { type: 'RESOLVE_RECURRING'; payload: { entryId: number; selectedTag: string } }
  | { type: 'SET_REMINDERS'; payload: Reminder[] }
  | { type: 'ADD_REMINDER'; payload: Reminder }
  | { type: 'UPDATE_REMINDER'; payload: Reminder }
  | { type: 'DELETE_REMINDER'; payload: number }
