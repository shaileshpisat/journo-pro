'use client'

import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react'
import { AppState, Action, Entry, ViewName } from '@/lib/types'
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
      return { ...state, view: action.payload, selectedEntry: null }
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
    case 'MOVE_FOLDER': {
      const { oldPath, newPath } = action.payload
      return {
        ...state,
        entries: state.entries.map((e) => {
          if (!e.folder) return e
          if (e.folder === oldPath) return { ...e, folder: newPath }
          if (e.folder.startsWith(oldPath + '/'))
            return { ...e, folder: newPath + e.folder.slice(oldPath.length) }
          return e
        }),
      }
    }
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
        const parsed: Entry[] = JSON.parse(stored)
        const hasSubFolders = parsed.some((e) => e.folder && e.folder.includes('/'))
        if (hasSubFolders || parsed.length > 0) {
          dispatch({ type: 'SET_ENTRIES', payload: parsed })
        }
      }
    } catch {}
    try {
      const storedView = window.localStorage.getItem('jp_view') as ViewName | null
      if (storedView) dispatch({ type: 'SET_VIEW', payload: storedView })
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

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>
}

export function useAppState(): AppContextType {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppState must be used within AppProvider')
  return ctx
}
