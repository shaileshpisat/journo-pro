'use client'

import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react'
import { AppState, Action, Entry, ViewName, EntryHistory, Comment, TimerState, CurrencySymbol, DEFAULT_SEARCH_FILTERS, SearchFilters } from '@/lib/types'
import { SEED_ENTRIES } from '@/lib/seedData'

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

const initialState: AppState = {
  entries: SEED_ENTRIES,
  view: 'home',
  selectedEntry: null,
  sidebarCollapsed: false,
  activeTimer: null,
  addFolderEntry: null,
  currency: '$' as CurrencySymbol,
  searchFilters: { ...DEFAULT_SEARCH_FILTERS },
  toast: null,
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_ENTRIES':
      return { ...state, entries: action.payload }
    case 'ADD_ENTRY':
      return { ...state, entries: [action.payload, ...state.entries] }
    case 'UPDATE_ENTRY':
      return {
        ...state,
        entries: state.entries.map((e) => (e.id === action.payload.id ? action.payload : e)),
        selectedEntry:
          state.selectedEntry?.id === action.payload.id ? action.payload : state.selectedEntry,
      }
    case 'DELETE_ENTRY':
      return {
        ...state,
        entries: state.entries.filter((e) => e.id !== action.payload),
        selectedEntry: state.selectedEntry?.id === action.payload ? null : state.selectedEntry,
      }
    case 'SET_VIEW':
      return { ...state, view: action.payload, selectedEntry: null, searchFilters: { ...DEFAULT_SEARCH_FILTERS } }
    case 'SELECT_ENTRY':
      return { ...state, selectedEntry: action.payload }
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarCollapsed: !state.sidebarCollapsed }
    case 'SET_TIMER':
      return { ...state, activeTimer: action.payload }
    case 'LOG_TIME': {
      const { entryId, log } = action.payload
      return {
        ...state,
        entries: state.entries.map((e) =>
          e.id === entryId ? { ...e, timeLogs: [...(e.timeLogs ?? []), log] } : e
        ),
        selectedEntry:
          state.selectedEntry?.id === entryId
            ? { ...state.selectedEntry, timeLogs: [...(state.selectedEntry.timeLogs ?? []), log] }
            : state.selectedEntry,
        activeTimer: null,
      }
    }
    case 'SET_ADD_FOLDER_ENTRY':
      return { ...state, addFolderEntry: action.payload }
    case 'MARK_TASK':
      return {
        ...state,
        entries: state.entries.map((e) =>
          e.id === action.payload ? { ...e, isTask: true, isTaskDone: false, completedAt: null, history: [...(e.history || []), { timestamp: Date.now(), field: 'isTask', oldValue: false, newValue: true }] } : e
        ),
        selectedEntry:
          state.selectedEntry?.id === action.payload
            ? { ...state.selectedEntry, isTask: true, isTaskDone: false, completedAt: null, history: [...(state.selectedEntry.history || []), { timestamp: Date.now(), field: 'isTask', oldValue: false, newValue: true }] }
            : state.selectedEntry,
      }
    case 'TOGGLE_TASK_DONE': {
      const entry = state.entries.find((e) => e.id === action.payload)
      if (!entry) return state
      if (entry.isTaskDone && entry.completedAt) {
        const today = new Date().toISOString().split('T')[0]
        if (entry.completedAt.split('T')[0] !== today) {
          return { ...state, toast: 'Cannot undo — task was completed on a previous day' }
        }
      }
      const now = Date.now()
      return {
        ...state,
        toast: null,
        entries: state.entries.map((e) =>
          e.id === action.payload
            ? { ...e, isTaskDone: !e.isTaskDone, completedAt: e.isTaskDone ? null : new Date().toISOString(), history: [...(e.history || []), { timestamp: now, field: 'isTaskDone', oldValue: e.isTaskDone, newValue: !e.isTaskDone }] }
            : e
        ),
        selectedEntry:
          state.selectedEntry?.id === action.payload
            ? { ...state.selectedEntry, isTaskDone: !state.selectedEntry.isTaskDone, completedAt: state.selectedEntry.isTaskDone ? null : new Date().toISOString(), history: [...(state.selectedEntry.history || []), { timestamp: now, field: 'isTaskDone', oldValue: state.selectedEntry.isTaskDone, newValue: !state.selectedEntry.isTaskDone }] }
            : state.selectedEntry,
      }
    }
    case 'MOVE_FOLDER': {
      const { oldPath, newPath } = action.payload
      const now = Date.now()
      return {
        ...state,
        entries: state.entries.map((e) => {
          if (!e.folder) return e
          if (e.folder === oldPath)
            return { ...e, folder: newPath, history: [...(e.history || []), { timestamp: now, field: 'folder', oldValue: oldPath, newValue: newPath }] }
          if (e.folder.startsWith(oldPath + '/'))
            return { ...e, folder: newPath + e.folder.slice(oldPath.length), history: [...(e.history || []), { timestamp: now, field: 'folder', oldValue: e.folder, newValue: newPath + e.folder.slice(oldPath.length) }] }
          return e
        }),
      }
    }
    case 'ARCHIVE_ENTRY':
      return {
        ...state,
        entries: state.entries.map((e) =>
          e.id === action.payload ? { ...e, archived: true, history: [...(e.history || []), { timestamp: Date.now(), field: 'archived', oldValue: false, newValue: true }] } : e
        ),
        selectedEntry:
          state.selectedEntry?.id === action.payload
            ? { ...state.selectedEntry, archived: true, history: [...(state.selectedEntry.history || []), { timestamp: Date.now(), field: 'archived', oldValue: false, newValue: true }] }
            : state.selectedEntry,
      }
    case 'RESTORE_ENTRY':
      return {
        ...state,
        entries: state.entries.map((e) =>
          e.id === action.payload ? { ...e, archived: false, history: [...(e.history || []), { timestamp: Date.now(), field: 'archived', oldValue: true, newValue: false }] } : e
        ),
        selectedEntry:
          state.selectedEntry?.id === action.payload
            ? { ...state.selectedEntry, archived: false, history: [...(state.selectedEntry.history || []), { timestamp: Date.now(), field: 'archived', oldValue: true, newValue: false }] }
            : state.selectedEntry,
      }
    case 'ADD_COMMENT': {
      const { entryId, comment } = action.payload
      const now = Date.now()
      return {
        ...state,
        entries: state.entries.map((e) =>
          e.id === entryId
            ? { ...e, comments: [...(e.comments || []), comment], history: [...(e.history || []), { timestamp: now, field: 'commentAdded', oldValue: null, newValue: comment.text }] }
            : e
        ),
        selectedEntry:
          state.selectedEntry?.id === entryId
            ? { ...state.selectedEntry, comments: [...(state.selectedEntry.comments || []), comment], history: [...(state.selectedEntry.history || []), { timestamp: now, field: 'commentAdded', oldValue: null, newValue: comment.text }] }
            : state.selectedEntry,
      }
    }
    case 'EDIT_COMMENT': {
      const { entryId, commentId, text } = action.payload
      const now = Date.now()
      return {
        ...state,
        entries: state.entries.map((e) => {
          if (e.id !== entryId) return e
          const oldText = (e.comments || []).find((c) => c.id === commentId)?.text ?? ''
          return { ...e, comments: (e.comments || []).map((c) => c.id === commentId ? { ...c, text } : c), history: [...(e.history || []), { timestamp: now, field: 'commentEdited', oldValue: oldText, newValue: text }] }
        }),
        selectedEntry:
          state.selectedEntry?.id === entryId
            ? { ...state.selectedEntry, comments: (state.selectedEntry.comments || []).map((c) => c.id === commentId ? { ...c, text } : c), history: [...(state.selectedEntry.history || []), { timestamp: now, field: 'commentEdited', oldValue: (state.selectedEntry.comments || []).find((c) => c.id === commentId)?.text ?? '', newValue: text }] }
            : state.selectedEntry,
      }
    }
    case 'SET_CURRENCY':
      return { ...state, currency: action.payload }
    case 'SET_SEARCH_FILTERS':
      return { ...state, searchFilters: action.payload }
    case 'SET_TOAST':
      return { ...state, toast: action.payload }
    default:
      return state
  }
}

interface AppContextType {
  state: AppState
  dispatch: React.Dispatch<Action>
}

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const hydrated = useRef(false)

  // Hydrate from localStorage on mount
  useEffect(() => {
    if (hydrated.current) return
    hydrated.current = true
    try {
      const stored = window.localStorage.getItem('jp_entries')
      if (stored) {
        const parsed: (Entry & { entity?: string | null })[] = JSON.parse(stored)
        const migrated: Entry[] = parsed.map((e) => {
          if (!('mentions' in e)) {
            const { entity, ...rest } = e
            return { ...rest, mentions: entity ? [entity] : [] }
          }
          return e as Entry
        })
        const hasSubFolders = migrated.some((e) => e.folder && e.folder.includes('/'))
        if (hasSubFolders || migrated.length > 0) {
          dispatch({ type: 'SET_ENTRIES', payload: migrated })
        }
      }
    } catch {}
    try {
      const storedView = window.localStorage.getItem('jp_view') as ViewName | null
      if (storedView) dispatch({ type: 'SET_VIEW', payload: storedView })
    } catch {}
    try {
      const storedTimer = window.localStorage.getItem('jp_activeTimer')
      if (storedTimer) {
        const parsed: TimerState = JSON.parse(storedTimer)
        dispatch({ type: 'SET_TIMER', payload: parsed })
      }
    } catch {}
    try {
      const storedCurrency = window.localStorage.getItem('jp_currency') as CurrencySymbol | null
      if (storedCurrency) dispatch({ type: 'SET_CURRENCY', payload: storedCurrency })
    } catch {}
    try {
      const storedFilters = window.localStorage.getItem('jp_searchFilters')
      if (storedFilters) {
        const parsed: SearchFilters = JSON.parse(storedFilters)
        dispatch({ type: 'SET_SEARCH_FILTERS', payload: parsed })
      }
    } catch {}
  }, [])

  // Persist entries
  useEffect(() => {
    if (!hydrated.current) return
    window.localStorage.setItem('jp_entries', JSON.stringify(state.entries))
  }, [state.entries])

  // Persist view
  useEffect(() => {
    if (!hydrated.current) return
    window.localStorage.setItem('jp_view', state.view)
  }, [state.view])

  // Persist active timer
  useEffect(() => {
    if (!hydrated.current) return
    if (state.activeTimer) {
      window.localStorage.setItem('jp_activeTimer', JSON.stringify(state.activeTimer))
    } else {
      window.localStorage.removeItem('jp_activeTimer')
    }
  }, [state.activeTimer])

  // Persist currency
  useEffect(() => {
    if (!hydrated.current) return
    window.localStorage.setItem('jp_currency', state.currency)
  }, [state.currency])

  // Persist search filters
  useEffect(() => {
    if (!hydrated.current) return
    window.localStorage.setItem('jp_searchFilters', JSON.stringify(state.searchFilters))
  }, [state.searchFilters])

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>
}

export function useAppState(): AppContextType {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppState must be used within AppProvider')
  return ctx
}
