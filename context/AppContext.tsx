'use client'

import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react'
import { AppState, Action, Entry, ViewName, EntryHistory, Comment, TimerState, CurrencySymbol, DEFAULT_SEARCH_FILTERS, SearchFilters, Project, Goal, Habit, PendingRecurringEntry, PERIOD_TAGS } from '@/lib/types'
import { SEED_ENTRIES } from '@/lib/seedData'
import { todayLocalStr, toLocalDateStr } from '@/lib/predicates'

const initialState: AppState = {
  entries: SEED_ENTRIES,
  view: 'home',
  selectedEntry: null,
  sidebarCollapsed: false,
  activeTimers: [],
  addFolderEntry: null,
  currency: '$' as CurrencySymbol,
  searchFilters: { ...DEFAULT_SEARCH_FILTERS },
  toast: null,
  projects: [],
  goals: [],
  habits: [],
  reloadPending: false,
  pendingRecurring: [],
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
      return { ...state, activeTimers: [...state.activeTimers, action.payload] }
    case 'REMOVE_TIMER':
      return { ...state, activeTimers: state.activeTimers.filter((t) => t.entryId !== action.payload.entryId) }
    case 'PAUSE_TIMER': {
      return {
        ...state,
        activeTimers: state.activeTimers.map((t) => {
          if (t.entryId !== action.payload.entryId || t.segments.length === 0) return t
          const segs = t.segments.map((seg, i) =>
            i === t.segments.length - 1 && seg.pausedAt === undefined
              ? { ...seg, pausedAt: Date.now() }
              : seg
          )
          return { ...t, segments: segs }
        }),
      }
    }
    case 'RESUME_TIMER': {
      return {
        ...state,
        activeTimers: state.activeTimers.map((t) => {
          if (t.entryId !== action.payload.entryId) return t
          return { ...t, segments: [...t.segments, { startedAt: Date.now(), description: '' }] }
        }),
      }
    }
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
        activeTimers: state.activeTimers.filter((t) => t.entryId !== entryId),
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
        const today = todayLocalStr()
        if (toLocalDateStr(entry.completedAt) !== today) {
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
    case 'PIN_COMMENT': {
      const { entryId, commentId } = action.payload
      const togglePin = (c: Comment) =>
        c.id === commentId ? { ...c, isPinned: !c.isPinned } : { ...c, isPinned: false }
      return {
        ...state,
        entries: state.entries.map((e) =>
          e.id === entryId ? { ...e, comments: (e.comments || []).map(togglePin) } : e
        ),
        selectedEntry:
          state.selectedEntry?.id === entryId
            ? { ...state.selectedEntry, comments: (state.selectedEntry.comments || []).map(togglePin) }
            : state.selectedEntry,
      }
    }
    case 'SET_CURRENCY':
      return { ...state, currency: action.payload }
    case 'SET_SEARCH_FILTERS':
      return { ...state, searchFilters: action.payload }
    case 'SET_TOAST':
      return { ...state, toast: action.payload }
    case 'SET_PROJECTS':
      return { ...state, projects: action.payload }
    case 'ADD_PROJECT':
      return { ...state, projects: [...state.projects, action.payload] }
    case 'UPDATE_PROJECT':
      return { ...state, projects: state.projects.map((p) => (p.id === action.payload.id ? action.payload : p)) }
    case 'DELETE_PROJECT':
      return { ...state, projects: state.projects.filter((p) => p.id !== action.payload), entries: state.entries.map((e) => e.pghMapping?.type === 'project' && e.pghMapping.id === action.payload ? { ...e, pghMapping: null } : e) }
    case 'SET_GOALS':
      return { ...state, goals: action.payload }
    case 'ADD_GOAL':
      return { ...state, goals: [...state.goals, action.payload] }
    case 'UPDATE_GOAL':
      return { ...state, goals: state.goals.map((g) => (g.id === action.payload.id ? action.payload : g)) }
    case 'DELETE_GOAL':
      return { ...state, goals: state.goals.filter((g) => g.id !== action.payload), entries: state.entries.map((e) => e.pghMapping?.type === 'goal' && e.pghMapping.id === action.payload ? { ...e, pghMapping: null } : e) }
    case 'SET_HABITS':
      return { ...state, habits: action.payload }
    case 'ADD_HABIT':
      return { ...state, habits: [...state.habits, action.payload] }
    case 'UPDATE_HABIT':
      return { ...state, habits: state.habits.map((h) => (h.id === action.payload.id ? action.payload : h)) }
    case 'DELETE_HABIT':
      return { ...state, habits: state.habits.filter((h) => h.id !== action.payload), entries: state.entries.map((e) => e.pghMapping?.type === 'habit' && e.pghMapping.id === action.payload ? { ...e, pghMapping: null } : e) }
    case 'ADD_HABIT_TRACKER_ENTRY':
      return {
        ...state,
        habits: state.habits.map((h) =>
          h.id === action.payload.habitId
            ? { ...h, tracker: [...h.tracker, action.payload.entry] }
            : h
        ),
      }
    case 'SET_RELOAD_PENDING':
      return { ...state, reloadPending: action.payload }
    case 'SET_PENDING_RECURRING':
      return { ...state, pendingRecurring: action.payload }
    case 'RESOLVE_RECURRING': {
      const { entryId, selectedTag } = action.payload
      const now = Date.now()
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
      return {
        ...state,
        entries: state.entries.map((e) => {
          if (e.id !== entryId) return e
          const otherTags = e.tags.filter((t): t is string =>
            (PERIOD_TAGS as readonly string[]).includes(t) && t !== selectedTag
          )
          const newTags = e.tags.filter((t) => !otherTags.includes(t))
          const newDate = advanceDate(e.actionDate!, selectedTag, todayStr)
          return {
            ...e,
            tags: newTags,
            actionDate: newDate,
            history: [...(e.history || []), { timestamp: now, field: 'actionDate', oldValue: e.actionDate, newValue: newDate }],
          }
        }),
        selectedEntry:
          state.selectedEntry?.id === entryId
            ? { ...state.selectedEntry, ...(() => {
                const otherTags = (state.selectedEntry!.tags || []).filter((t): t is string =>
                  (PERIOD_TAGS as readonly string[]).includes(t) && t !== selectedTag
                )
                return {
                  tags: state.selectedEntry!.tags.filter((t) => !otherTags.includes(t)),
                  actionDate: advanceDate(state.selectedEntry!.actionDate!, selectedTag, todayStr),
                }
              })() }
            : state.selectedEntry,
        pendingRecurring: state.pendingRecurring.filter((p) => p.entryId !== entryId),
      }
    }
    default:
      return state
  }
}

function advanceDate(actionDate: string, tag: string, todayStr: string): string {
  const date = new Date(actionDate + 'T00:00:00')
  const today = new Date(todayStr + 'T00:00:00')

  if (!tag) return todayStr

  const step = (d: Date) => {
    switch (tag) {
      case 'weekly': d.setDate(d.getDate() + 7); break
      case 'monthly': d.setMonth(d.getMonth() + 1); break
      case 'quarterly': d.setMonth(d.getMonth() + 3); break
      default: d.setDate(d.getDate() + 1); break
    }
  }

  while (date < today) step(date)

  if (tag === 'weekdays') {
    while (date.getDay() === 0 || date.getDay() === 6)
      date.setDate(date.getDate() + 1)
  }

  if (tag === 'weekend') {
    while (date.getDay() !== 0 && date.getDay() !== 6)
      date.setDate(date.getDate() + 1)
  }

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

interface AppContextType {
  state: AppState
  dispatch: React.Dispatch<Action>
}

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const hydrated = useRef(false)

  // Auto-reload after 12 hours
  const RELOAD_INTERVAL = 12 * 60 * 60 * 1000

  // Hydrate from localStorage on mount
  useEffect(() => {
    if (hydrated.current) return
    hydrated.current = true

    // Check if 12 hours have passed since last reload
    try {
      const lastReload = window.localStorage.getItem('jp_lastReload')
      const now = Date.now()
      if (lastReload) {
        if (now - Number(lastReload) >= RELOAD_INTERVAL) {
          window.localStorage.setItem('jp_lastReload', String(now))
          dispatch({ type: 'SET_RELOAD_PENDING', payload: true })
        }
      } else {
        window.localStorage.setItem('jp_lastReload', String(now))
      }
    } catch {}
    try {
      const stored = window.localStorage.getItem('jp_entries')
      if (stored) {
        const parsed: Record<string, unknown>[] = JSON.parse(stored)
        const migrated: Entry[] = parsed.map((e) => {
          if (!('mentions' in e)) {
            const { entity, ...rest } = e
            return { ...rest, mentions: entity ? [entity as string] : [] } as unknown as Entry
          }
          return e as unknown as Entry
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
      const storedTimers = window.localStorage.getItem('jp_activeTimers')
      if (storedTimers) {
        const parsed: TimerState[] = JSON.parse(storedTimers)
        for (const t of parsed) {
          dispatch({ type: 'SET_TIMER', payload: t })
        }
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
    try {
      const storedProjects = window.localStorage.getItem('jp_projects')
      if (storedProjects) {
        const parsed: Project[] = JSON.parse(storedProjects)
        dispatch({ type: 'SET_PROJECTS', payload: parsed })
      }
    } catch {}
    try {
      const storedGoals = window.localStorage.getItem('jp_goals')
      if (storedGoals) {
        const parsed: Goal[] = JSON.parse(storedGoals)
        dispatch({ type: 'SET_GOALS', payload: parsed })
      }
    } catch {}
    try {
      const storedHabits = window.localStorage.getItem('jp_habits')
      if (storedHabits) {
        const parsed: Habit[] = JSON.parse(storedHabits)
        dispatch({ type: 'SET_HABITS', payload: parsed })
      }
    } catch {}
  }, [])

  const recurringChecked = useRef(false)

  // Check recurring tasks on every mount (after hydration)
  useEffect(() => {
    if (!hydrated.current || recurringChecked.current) return
    recurringChecked.current = true

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

    const multiTag: PendingRecurringEntry[] = []
    const singleTag: Entry[] = []

    for (const entry of state.entries) {
      if (!entry.isTask || entry.isTaskDone) continue
      if (!entry.tags.includes('recurring')) continue
      if (!entry.actionDate || entry.actionDate >= todayStr) continue

      const periodTags = entry.tags.filter((t) =>
        (PERIOD_TAGS as readonly string[]).includes(t as typeof PERIOD_TAGS[number])
      )

      if (periodTags.length > 1) {
        multiTag.push({ entryId: entry.id, text: entry.text, actionDate: entry.actionDate, periodTags })
      } else {
        singleTag.push(entry)
      }
    }

    if (multiTag.length > 0) {
      dispatch({ type: 'SET_PENDING_RECURRING', payload: multiTag })
    }

    for (const entry of singleTag) {
      const periodTag = entry.tags.find((t) =>
        (PERIOD_TAGS as readonly string[]).includes(t as typeof PERIOD_TAGS[number])
      ) || ''
      const newDate = advanceDate(entry.actionDate!, periodTag as string, todayStr)
      if (newDate !== entry.actionDate) {
        const now = Date.now()
        dispatch({
          type: 'UPDATE_ENTRY',
          payload: { ...entry, actionDate: newDate, history: [...(entry.history || []), { timestamp: now, field: 'actionDate', oldValue: entry.actionDate, newValue: newDate }] },
        })
      }
    }
  }, [state.entries, dispatch])

  const reloadTriggered = useRef(false)

  // Trigger reload when recurring tasks are resolved and reload is pending
  useEffect(() => {
    if (!hydrated.current || !state.reloadPending) return
    if (state.pendingRecurring.length > 0) return
    if (reloadTriggered.current) return
    reloadTriggered.current = true
    window.localStorage.setItem('jp_entries', JSON.stringify(state.entries))
    window.location.reload()
  }, [state.reloadPending, state.pendingRecurring, state.entries])

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

  // Persist active timers
  useEffect(() => {
    if (!hydrated.current) return
    if (state.activeTimers.length > 0) {
      window.localStorage.setItem('jp_activeTimers', JSON.stringify(state.activeTimers))
    } else {
      window.localStorage.removeItem('jp_activeTimers')
    }
  }, [state.activeTimers])

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

  // Persist projects
  useEffect(() => {
    if (!hydrated.current) return
    window.localStorage.setItem('jp_projects', JSON.stringify(state.projects))
  }, [state.projects])

  // Persist goals
  useEffect(() => {
    if (!hydrated.current) return
    window.localStorage.setItem('jp_goals', JSON.stringify(state.goals))
  }, [state.goals])

  // Persist habits
  useEffect(() => {
    if (!hydrated.current) return
    window.localStorage.setItem('jp_habits', JSON.stringify(state.habits))
  }, [state.habits])

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>
}

export function useAppState(): AppContextType {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useAppState must be used within AppProvider')
  return ctx
}
