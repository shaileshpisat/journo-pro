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

export const DEFAULT_SEARCH_FILTERS: SearchFilters = {
  query: '',
  filterEntity: [],
  filterFolder: [],
  filterTag: [],
  filterFrom: '',
  filterTo: '',
  tasksOnly: false,
}

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
  | { type: 'SET_CURRENCY'; payload: CurrencySymbol }
  | { type: 'SET_SEARCH_FILTERS'; payload: SearchFilters }
  | { type: 'SET_TOAST'; payload: string | null }
