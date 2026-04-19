export type AmountType = 'inflow' | 'outflow'

export interface TimeLog {
  startedAt: number
  duration: number
}

export type ViewName =
  | 'home'
  | 'inbox'
  | 'search'
  | 'calendar'
  | 'folders'
  | 'settings'
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
  entity: string | null
  timeLogs: TimeLog[]
}

export interface FolderNode {
  name: string
  path: string
  children: FolderNode[]
}

export interface TimerState {
  entryId: number
  startedAt: number
  baseElapsed: number
}

export interface AppState {
  entries: Entry[]
  view: ViewName
  selectedEntry: Entry | null
  sidebarCollapsed: boolean
  activeTimer: TimerState | null
  addFolderEntry: Entry | null
}

export type Action =
  | { type: 'SET_ENTRIES'; payload: Entry[] }
  | { type: 'ADD_ENTRY'; payload: Entry }
  | { type: 'UPDATE_ENTRY'; payload: Entry }
  | { type: 'DELETE_ENTRY'; payload: number }
  | { type: 'SET_VIEW'; payload: ViewName }
  | { type: 'SELECT_ENTRY'; payload: Entry | null }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_TIMER'; payload: TimerState | null }
  | { type: 'LOG_TIME'; payload: { entryId: number; log: TimeLog } }
  | { type: 'SET_ADD_FOLDER_ENTRY'; payload: Entry | null }
  | { type: 'MOVE_FOLDER'; payload: { oldPath: string; newPath: string } }
