'use client'

import { useMemo, useRef, useState } from 'react'
import { useAppState } from '@/context/AppContext'
import { isToday, isOverdue, todayLocalStr, toLocalDateStr } from '@/lib/predicates'
import { fmtAmt, fmtDate, fmtDuration } from '@/lib/formatters'
import { EntryHistory, Reminder } from '@/lib/types'
import JournalInput from '@/components/entry/JournalInput'
import EntryCard from '@/components/entry/EntryCard'
import TodayTimeline, { TimeLogRowData } from '@/components/entry/TodayTimeline'
import Chip from '@/components/ui/Chip'
import FolderChip from '@/components/ui/FolderChip'
import SectionHead from '@/components/ui/SectionHead'
import Icon from '@/components/ui/Icon'

export default function HomeView() {
  const { state, dispatch } = useAppState()
  const { entries, activeTimers } = state
  const [showChanges, setShowChanges] = useState(true)
  const [showTimeTracking, setShowTimeTracking] = useState(true)
  const actionTodayRef = useRef<HTMLDivElement>(null)
  const needsActionRef = useRef<HTMLDivElement>(null)
  const remindersRef = useRef<HTMLDivElement>(null)
  const [showReminderForm, setShowReminderForm] = useState(false)
  const [newReminderTitle, setNewReminderTitle] = useState('')
  const [newReminderDate, setNewReminderDate] = useState(todayLocalStr())
  const [editingReminderId, setEditingReminderId] = useState<number | null>(null)
  const [commentHoveredId, setCommentHoveredId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editDate, setEditDate] = useState('')

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const activeEntries = entries.filter((e) => !e.archived)
  const todayEntries = activeEntries.filter((e) => isToday(e.timestamp) && (!e.actionDate || e.actionDate === todayLocalStr())).slice(0, 6)
  const todayAction = activeEntries.filter(
    (e) => e.actionDate === todayLocalStr()
  )
  const overdue = activeEntries.filter((e) => isOverdue(e) && !e.isTaskDone)

  const todayTags = [...new Set(todayEntries.flatMap((e) => e.tags))]
  const todayFolders = [...new Set(todayEntries.filter((e) => e.folder).map((e) => e.folder!))]
  const todayEntities = [...new Set(todayEntries.flatMap((e) => e.mentions ?? []))]
  const tagCount = (tag: string) => todayEntries.filter((e) => e.tags.includes(tag)).length
  const folderCount = (path: string) => todayEntries.filter((e) => e.folder === path).length
  const entityCount = (name: string) => todayEntries.filter((e) => (e.mentions ?? []).includes(name)).length
  const hasSummary = todayTags.length || todayFolders.length || todayEntities.length

  const todayHistory = useMemo(() => {
    const today = todayLocalStr()
    const items: { history: EntryHistory; entryText: string; timestamp: number }[] = []
    state.entries.forEach((e) => {
      if (!e.history) return
      e.history.forEach((h) => {
        if (toLocalDateStr(h.timestamp) === today) {
          items.push({ history: h, entryText: e.text, timestamp: h.timestamp })
        }
      })
    })
    return items.sort((a, b) => a.timestamp - b.timestamp)
  }, [state.entries])

  const todayTimeTracking = useMemo(() => {
    const today = todayLocalStr()
    const items: TimeLogRowData[] = []
    state.entries.forEach((e) => {
      if (!e.timeLogs) return
      e.timeLogs.forEach((log) => {
        if (toLocalDateStr(log.startedAt) === today) {
          items.push({ entryText: e.text, entryId: e.id, ...log })
        }
      })
    })
    return items.sort((a, b) => a.startedAt - b.startedAt)
  }, [state.entries])

  const todayStr = todayLocalStr()
  const visibleReminders = state.reminders.filter(
    (r) => !r.done || (r.completedAt && toLocalDateStr(r.completedAt) === todayStr)
  )
  const overdueReminders = visibleReminders.filter((r) => !r.done && r.date < todayStr)
  const todayReminders = visibleReminders.filter((r) => r.date === todayStr)
  const olderReminders = visibleReminders.filter((r) => r.date < todayStr)
  const futureReminders = visibleReminders.filter((r) => r.date > todayStr)
  const handleAddReminder = () => {
    if (!newReminderTitle.trim()) return
    dispatch({
      type: 'ADD_REMINDER',
      payload: { id: Date.now(), title: newReminderTitle.trim(), date: newReminderDate, done: false, completedAt: null },
    })
    setNewReminderTitle('')
    setNewReminderDate(todayLocalStr())
    setShowReminderForm(false)
  }

  const handleToggleReminder = (r: Reminder) => {
    dispatch({
      type: 'UPDATE_REMINDER',
      payload: { ...r, done: !r.done, completedAt: r.done ? null : new Date().toISOString() },
    })
  }

  const handleEditReminder = (r: Reminder) => {
    setEditingReminderId(r.id)
    setEditTitle(r.title)
    setEditDate(r.date)
  }

  const handleSaveEdit = () => {
    if (editingReminderId === null || !editTitle.trim()) return
    const reminder = state.reminders.find((r) => r.id === editingReminderId)
    if (!reminder) return
    dispatch({
      type: 'UPDATE_REMINDER',
      payload: { ...reminder, title: editTitle.trim(), date: editDate },
    })
    setEditingReminderId(null)
  }

  const handleCancelEdit = () => {
    setEditingReminderId(null)
  }

  const handleTimerToggle = (entry: import('@/lib/types').Entry) => {
    if (activeTimers.some((t) => t.entryId === entry.id)) return
    dispatch({ type: 'SET_TIMER', payload: { entryId: entry.id, segments: [{ startedAt: Date.now(), description: '' }] } })
  }

  const handleTaskToggle = (entry: import('@/lib/types').Entry) => {
    dispatch({ type: 'TOGGLE_TASK_DONE', payload: entry.id })
  }

  const handleAdvanceRecurring = (entry: import('@/lib/types').Entry) => {
    dispatch({ type: 'ADVANCE_RECURRING', payload: entry.id })
  }

  const recurringToday = todayAction.filter((e) => e.tags.includes('recurring'))
  const nonRecurringToday = todayAction.filter((e) => !e.tags.includes('recurring'))

  const sidebarW = state.sidebarCollapsed ? 52 : 220

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '48px 24px 80px' }}>
      {/* Floating reminders panel — fixed on the left */}
      <div
        ref={remindersRef}
        style={{
          position: 'fixed',
          left: sidebarW + 16,
          bottom: 24,
          width: 280,
          maxHeight: 'calc(100vh - 150px)',
          overflowY: 'auto',
          padding: 14,
          background: 'var(--color-bg2)',
          borderRadius: 'var(--radius)',
          border: '1px solid var(--color-border)',
          zIndex: 40,
          display: 'block',
        }}
      >
          <div className="flex justify-between items-center mb-2.5">
            <div className="flex items-center gap-2">
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--color-text2)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                }}
              >
                Reminders
              </span>
              {visibleReminders.length > 0 && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    background: overdueReminders.length > 0 ? 'var(--color-red)' : 'var(--color-bg3)',
                    color: overdueReminders.length > 0 ? '#fff' : 'var(--color-text3)',
                    borderRadius: 99,
                    padding: '1px 6px',
                    minWidth: 18,
                    textAlign: 'center',
                  }}
                >
                  {visibleReminders.length}
                </span>
              )}
            </div>
            <button
              onClick={() => setShowReminderForm((v) => !v)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 3,
                padding: '3px 8px',
                borderRadius: 6,
                border: '1px solid var(--color-border)',
                background: '#fff',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 11,
                fontWeight: 500,
                color: 'var(--color-text2)',
              }}
            >
              <Icon name="plus" size={11} />
              Add
            </button>
          </div>

          {showReminderForm && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                marginBottom: 10,
                padding: 8,
                background: '#fff',
                borderRadius: 6,
                border: '1px solid var(--color-border)',
              }}
            >
              <input
                placeholder="Reminder text…"
                value={newReminderTitle}
                onChange={(e) => setNewReminderTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddReminder() }}
                style={{
                  border: 'none',
                  outline: 'none',
                  fontFamily: 'inherit',
                  fontSize: 12,
                  color: 'var(--color-text)',
                  background: 'transparent',
                }}
              />
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <input
                  type="date"
                  value={newReminderDate}
                  onChange={(e) => setNewReminderDate(e.target.value)}
                  style={{
                    flex: 1,
                    fontFamily: 'inherit',
                    fontSize: 11,
                    border: '1px solid var(--color-border)',
                    borderRadius: 4,
                    padding: '3px 6px',
                    color: 'var(--color-text2)',
                  }}
                />
                <button
                  onClick={handleAddReminder}
                  style={{
                    padding: '3px 10px',
                    borderRadius: 4,
                    border: 'none',
                    background: 'var(--color-accent)',
                    color: '#fff',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: 11,
                    fontWeight: 600,
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          )}

          {visibleReminders.length === 0 && !showReminderForm && (
            <p style={{ fontSize: 12, color: 'var(--color-text3)', textAlign: 'center', margin: '12px 0' }}>
              No reminders yet.
            </p>
          )}

          {todayReminders.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text2)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 4 }}>
                Today
              </span>
              {todayReminders.map((r) => (
                editingReminderId === r.id ? (
                  <div key={r.id} style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '6px 8px', borderRadius: 4, background: '#fff', marginBottom: 3, border: '1px solid var(--color-accent)' }}>
                    <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') handleCancelEdit() }} placeholder="Reminder text…" style={{ border: '1px solid var(--color-border)', borderRadius: 4, padding: '4px 6px', fontFamily: 'inherit', fontSize: 12, outline: 'none', color: 'var(--color-text)' }} />
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} style={{ flex: 1, fontFamily: 'inherit', fontSize: 11, border: '1px solid var(--color-border)', borderRadius: 4, padding: '3px 6px', color: 'var(--color-text2)' }} />
                      <button onClick={handleSaveEdit} style={{ padding: '3px 10px', borderRadius: 4, border: 'none', background: 'var(--color-accent)', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 11, fontWeight: 600 }}>Save</button>
                      <button onClick={handleCancelEdit} style={{ padding: '3px 8px', borderRadius: 4, border: '1px solid var(--color-border)', background: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 11, color: 'var(--color-text2)' }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 6px', borderRadius: 4, background: '#fff', marginBottom: 3 }}>
                    <span onClick={() => handleToggleReminder(r)} style={{ cursor: 'pointer', display: 'flex', flexShrink: 0 }}>
                      <Icon name={r.done ? 'checkSquare' : 'square'} size={14} color="var(--color-text3)" />
                    </span>
                    <span title={r.title} style={{ flex: 1, fontSize: 12, color: r.done ? 'var(--color-text3)' : 'var(--color-text)', textDecoration: r.done ? 'line-through' : 'none', lineHeight: 1.3, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</span>
                    <span onClick={() => handleEditReminder(r)} style={{ cursor: 'pointer', display: 'flex', flexShrink: 0, opacity: 0.4 }}>
                      <Icon name="edit" size={12} color="var(--color-text3)" />
                    </span>
                  </div>
                )
              ))}
            </div>
          )}

          {olderReminders.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-red)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 4 }}>
                Older
              </span>
              {olderReminders.map((r) => (
                editingReminderId === r.id ? (
                  <div key={r.id} style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '6px 8px', borderRadius: 4, background: '#fff', marginBottom: 3, border: '1px solid var(--color-accent)' }}>
                    <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') handleCancelEdit() }} placeholder="Reminder text…" style={{ border: '1px solid var(--color-border)', borderRadius: 4, padding: '4px 6px', fontFamily: 'inherit', fontSize: 12, outline: 'none', color: 'var(--color-text)' }} />
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} style={{ flex: 1, fontFamily: 'inherit', fontSize: 11, border: '1px solid var(--color-border)', borderRadius: 4, padding: '3px 6px', color: 'var(--color-text2)' }} />
                      <button onClick={handleSaveEdit} style={{ padding: '3px 10px', borderRadius: 4, border: 'none', background: 'var(--color-accent)', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 11, fontWeight: 600 }}>Save</button>
                      <button onClick={handleCancelEdit} style={{ padding: '3px 8px', borderRadius: 4, border: '1px solid var(--color-border)', background: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 11, color: 'var(--color-text2)' }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 6px', borderRadius: 4, background: '#fff', marginBottom: 3 }}>
                    <span onClick={() => handleToggleReminder(r)} style={{ cursor: 'pointer', display: 'flex', flexShrink: 0 }}>
                      <Icon name={r.done ? 'checkSquare' : 'square'} size={14} color="var(--color-text3)" />
                    </span>
                    <span title={r.title} style={{ flex: 1, fontSize: 12, color: r.done ? 'var(--color-text3)' : 'var(--color-text)', textDecoration: r.done ? 'line-through' : 'none', lineHeight: 1.3, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</span>
                    <span onClick={() => handleEditReminder(r)} style={{ cursor: 'pointer', display: 'flex', flexShrink: 0, opacity: 0.4 }}>
                      <Icon name="edit" size={12} color="var(--color-text3)" />
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--color-red)', flexShrink: 0 }}>
                      {new Date(r.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                )
              ))}
            </div>
          )}

          {futureReminders.length > 0 && (
            <div style={{ marginBottom: 2 }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--color-text2)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 4 }}>
                Future
              </span>
              {futureReminders.map((r) => (
                editingReminderId === r.id ? (
                  <div key={r.id} style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '6px 8px', borderRadius: 4, background: '#fff', marginBottom: 3, border: '1px solid var(--color-accent)' }}>
                    <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(); if (e.key === 'Escape') handleCancelEdit() }} placeholder="Reminder text…" style={{ border: '1px solid var(--color-border)', borderRadius: 4, padding: '4px 6px', fontFamily: 'inherit', fontSize: 12, outline: 'none', color: 'var(--color-text)' }} />
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} style={{ flex: 1, fontFamily: 'inherit', fontSize: 11, border: '1px solid var(--color-border)', borderRadius: 4, padding: '3px 6px', color: 'var(--color-text2)' }} />
                      <button onClick={handleSaveEdit} style={{ padding: '3px 10px', borderRadius: 4, border: 'none', background: 'var(--color-accent)', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 11, fontWeight: 600 }}>Save</button>
                      <button onClick={handleCancelEdit} style={{ padding: '3px 8px', borderRadius: 4, border: '1px solid var(--color-border)', background: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 11, color: 'var(--color-text2)' }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 6px', borderRadius: 4, background: '#fff', marginBottom: 3 }}>
                    <span onClick={() => handleToggleReminder(r)} style={{ cursor: 'pointer', display: 'flex', flexShrink: 0 }}>
                      <Icon name={r.done ? 'checkSquare' : 'square'} size={14} color="var(--color-text3)" />
                    </span>
                    <span title={r.title} style={{ flex: 1, fontSize: 12, color: r.done ? 'var(--color-text3)' : 'var(--color-text)', textDecoration: r.done ? 'line-through' : 'none', lineHeight: 1.3, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</span>
                    <span onClick={() => handleEditReminder(r)} style={{ cursor: 'pointer', display: 'flex', flexShrink: 0, opacity: 0.4 }}>
                      <Icon name="edit" size={12} color="var(--color-text3)" />
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--color-text3)', flexShrink: 0 }}>
                      {new Date(r.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                )
              ))}
            </div>
          )}
        </div>

      <p
          style={{
            textAlign: 'center',
            fontSize: 13,
            color: 'var(--color-text3)',
            marginBottom: 6,
            fontFamily: "'DM Mono', monospace",
          }}
        >
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </p>
        <h1
          style={{
            textAlign: 'center',
            fontSize: 26,
            fontWeight: 300,
            color: 'var(--color-text)',
            marginBottom: 32,
            letterSpacing: '-0.03em',
          }}
        >
          What&apos;s happening?
        </h1>

        <JournalInput />

        {/* Today summary pills */}
        {todayEntries.length > 0 && hasSummary && (
          <div
            style={{
              maxWidth: 680,
              margin: '16px auto 0',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 16,
              padding: '14px 18px',
              background: '#fff',
              borderRadius: 12,
              border: '1px solid var(--color-border)',
            }}
          >
            {todayEntities.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'var(--color-text3)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Entities
                </span>
                {todayEntities.map((e) => (
                  <Chip key={e} icon="entity" label={`${e} (${entityCount(e)})`} small />
                ))}
              </div>
            )}
            {todayFolders.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'var(--color-text3)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Folders
                </span>
                {todayFolders.map((f) => (
                  <FolderChip key={f} path={f} small count={folderCount(f)} />
                ))}
              </div>
            )}
            {todayTags.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'var(--color-text3)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Tags
                </span>
                {todayTags.map((t) => (
                  <Chip key={t} icon="tag" label={`#${t} (${tagCount(t)})`} small />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Quick nav */}
        {(todayAction.length > 0 || overdue.length > 0 || overdueReminders.length > 0) && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginTop: 24,
              justifyContent: 'center',
            }}
          >
            {todayAction.length > 0 && (
              <button
                onClick={() => scrollTo(actionTodayRef)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 16px',
                  borderRadius: 99,
                  border: '1px solid var(--color-amber)',
                  background: 'var(--color-amber-light)',
                  color: 'var(--color-text)',
                  fontFamily: 'inherit',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: 'var(--color-amber)',
                  }}
                />
                Action Today
                <span style={{ fontSize: 11, color: 'var(--color-text3)' }}>
                  {todayAction.length}
                </span>
              </button>
            )}
            {overdue.length > 0 && (
              <button
                onClick={() => scrollTo(needsActionRef)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 16px',
                  borderRadius: 99,
                  border: '1px solid var(--color-red)',
                  background: 'var(--color-red-light)',
                  color: 'var(--color-text)',
                  fontFamily: 'inherit',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: 'var(--color-red)',
                  }}
                />
                Needs Action
                <span style={{ fontSize: 11, color: 'var(--color-text3)' }}>
                  {overdue.length}
                </span>
              </button>
            )}
            {overdueReminders.length > 0 && (
              <button
                onClick={() => scrollTo(remindersRef)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 16px',
                  borderRadius: 99,
                  border: '1px solid var(--color-accent)',
                  background: 'var(--color-accent-light)',
                  color: 'var(--color-text)',
                  fontFamily: 'inherit',
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                <Icon name="bell" size={14} color="var(--color-accent)" />
                Reminders
                <span style={{ fontSize: 11, color: 'var(--color-text3)' }}>
                  {overdueReminders.length}
                </span>
              </button>
            )}
          </div>
        )}

        {/* Today timeline */}
        {(todayEntries.length > 0 || todayHistory.length > 0 || todayTimeTracking.length > 0) && (
          <div style={{ marginTop: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--color-text2)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                }}
              >
                Today
              </span>
              {todayEntries.length > 0 && (
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text3)' }}>
                  {todayEntries.length} new {todayEntries.length === 1 ? 'entry' : 'entries'}
                </span>
              )}
              {todayHistory.length > 0 && (
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text3)' }}>
                  {todayHistory.length} {todayHistory.length === 1 ? 'change' : 'changes'}
                </span>
              )}
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
                {todayHistory.length > 0 && (
                  <span
                    onClick={() => setShowChanges((v) => !v)}
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: 'var(--color-text3)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      userSelect: 'none',
                    }}
                  >
                    <span
                      style={{
                        width: 28,
                        height: 14,
                        borderRadius: 99,
                        background: showChanges ? 'var(--color-accent)' : 'var(--color-bg3)',
                        position: 'relative',
                        transition: 'background 0.15s',
                      }}
                    >
                      <span
                        style={{
                          position: 'absolute',
                          top: 2,
                          left: showChanges ? 16 : 2,
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          background: '#fff',
                          transition: 'left 0.15s',
                        }}
                      />
                    </span>
                    Changes
                  </span>
                )}
                {todayTimeTracking.length > 0 && (
                  <span
                    onClick={() => setShowTimeTracking((v) => !v)}
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: 'var(--color-text3)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      userSelect: 'none',
                    }}
                  >
                    <span
                      style={{
                        width: 28,
                        height: 14,
                        borderRadius: 99,
                        background: showTimeTracking ? 'var(--color-accent)' : 'var(--color-bg3)',
                        position: 'relative',
                        transition: 'background 0.15s',
                      }}
                    >
                      <span
                        style={{
                          position: 'absolute',
                          top: 2,
                          left: showTimeTracking ? 16 : 2,
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          background: '#fff',
                          transition: 'left 0.15s',
                        }}
                      />
                    </span>
                    Time
                  </span>
                )}
              </div>
            </div>
            <TodayTimeline
              entries={todayEntries}
              historyItems={showChanges ? todayHistory : []}
              timeTrackingItems={showTimeTracking ? todayTimeTracking : []}
              onClick={(e) => dispatch({ type: 'SELECT_ENTRY', payload: e })}
              activeTimers={activeTimers}
              onTimerToggle={handleTimerToggle}
              onTaskToggle={handleTaskToggle}
              currency={state.currency}
            />
          </div>
        )}

        {/* Action today */}
        {todayAction.length > 0 && (
          <div
            ref={actionTodayRef}
            style={{
              marginTop: 32,
              padding: 16,
              background: 'var(--color-amber-light)',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--color-amber)',
            }}
          >
            <SectionHead title="Action today" count={todayAction.length} />
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', overflowY: 'hidden', paddingBottom: 4 }}>
              {nonRecurringToday.map((e) => (
                <div key={e.id} style={{ minWidth: 260, maxWidth: 280, flexShrink: 0 }}>
                  <EntryCard
                    entry={e}
                    onClick={() => dispatch({ type: 'SELECT_ENTRY', payload: e })}
                    minimal
                    timerActive={activeTimers.some((t) => t.entryId === e.id)}
                    onTimerToggle={handleTimerToggle}
                    onTaskToggle={handleTaskToggle}
                    currency={state.currency}
                  />
                </div>
              ))}
              {recurringToday.map((e) => {
                const amt = fmtAmt(e.amount, e.amountType, state.currency)
                const totalTracked = e.timeLogs ? e.timeLogs.reduce((s, l) => s + l.duration, 0) : 0
                const timerActive = activeTimers.some((t) => t.entryId === e.id)
                return (
                  <div key={e.id} style={{ minWidth: 260, maxWidth: 280, flexShrink: 0 }}>
                    <div
                      onClick={() => dispatch({ type: 'SELECT_ENTRY', payload: e })}
                      style={{
                        background: '#fff',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius)',
                        padding: '8px 12px',
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                        <button
                          onClick={(ev) => { ev.stopPropagation(); handleAdvanceRecurring(e) }}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '1px 0 0 0',
                            color: 'var(--color-text3)',
                            flexShrink: 0,
                          }}
                        >
                          <Icon name="square" size={14} />
                        </button>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, color: 'var(--color-text)', lineHeight: 1.45, margin: 0 }}>
                            {e.text}
                          </p>
                          <div style={{ display: 'flex', gap: 6, marginTop: 4, alignItems: 'center', flexWrap: 'wrap' }}>
                            {e.actionDate && (
                              <span style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: 'var(--color-amber)' }}>
                                {fmtDate(e.actionDate)}
                              </span>
                            )}
                            {amt && (
                              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, fontWeight: 500, color: amt.color }}>
                                {amt.label}
                              </span>
                            )}
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                          <button
                            onClick={(ev) => { ev.stopPropagation(); handleTimerToggle(e) }}
                            style={{
                              background: timerActive ? 'var(--color-red-light)' : totalTracked > 0 ? 'var(--color-accent-light)' : 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '3px 4px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 3,
                              borderRadius: 6,
                              color: timerActive ? 'var(--color-red)' : totalTracked > 0 ? 'var(--color-accent)' : 'var(--color-text3)',
                              fontFamily: "'DM Mono', monospace",
                              fontSize: 11,
                            }}
                            title={timerActive ? 'Timer running' : totalTracked > 0 ? `${fmtDuration(totalTracked)} tracked` : 'Start timer'}
                          >
                            {timerActive ? (
                              <Icon name="pause" size={12} />
                            ) : totalTracked > 0 ? (
                              <span style={{ fontWeight: 500 }}>{fmtDuration(totalTracked)}</span>
                            ) : (
                              <Icon name="stopwatch" size={12} />
                            )}
                          </button>
                          <div
                            onMouseEnter={() => setCommentHoveredId(e.id)}
                            onMouseLeave={() => setCommentHoveredId(null)}
                            style={{ position: 'relative' }}
                          >
                            <button
                              onClick={(ev) => { ev.stopPropagation(); dispatch({ type: 'SELECT_ENTRY', payload: e }) }}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '3px 4px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 3,
                                borderRadius: 4,
                                color: 'var(--color-text3)',
                                fontSize: 11,
                                fontFamily: "'DM Mono', monospace",
                              }}
                            >
                              <Icon name="messageSquare" size={12} />
                              {(e.comments?.length ?? 0) > 0 && <span>{e.comments.length}</span>}
                            </button>
                            {commentHoveredId === e.id && (
                              <div
                                style={{
                                  position: 'absolute',
                                  bottom: '100%',
                                  right: 0,
                                  marginBottom: 6,
                                  background: '#1a1a18',
                                  color: '#fff',
                                  borderRadius: 8,
                                  padding: '8px 10px',
                                  fontSize: 11,
                                  lineHeight: 1.4,
                                  whiteSpace: 'nowrap',
                                  zIndex: 100,
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                                  pointerEvents: 'none',
                                }}
                              >
                                {(e.comments?.length ?? 0) > 0 ? (
                                  <>
                                    <div style={{ fontWeight: 500, marginBottom: 2 }}>
                                      {e.comments[e.comments.length - 1].text}
                                    </div>
                                    <div style={{ opacity: 0.6, fontFamily: "'DM Mono', monospace" }}>
                                      {new Date(e.comments[e.comments.length - 1].timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                                    </div>
                                  </>
                                ) : (
                                  <span style={{ opacity: 0.6 }}>No comments yet</span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Needs action */}
        {overdue.length > 0 && (
          <div
            ref={needsActionRef}
            style={{
              marginTop: 20,
              padding: 16,
              background: 'var(--color-red-light)',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--color-red)',
            }}
          >
            <SectionHead title="Needs action" count={overdue.length} />
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', overflowY: 'hidden', paddingBottom: 4 }}>
              {[...overdue]
                .sort((a, b) => (a.actionDate! > b.actionDate! ? 1 : -1))
                .map((e) => (
                  <div key={e.id} style={{ minWidth: 260, maxWidth: 280, flexShrink: 0 }}>
                    <EntryCard
                      entry={e}
                      onClick={() => dispatch({ type: 'SELECT_ENTRY', payload: e })}
                      overdue
                      minimal
                      timerActive={activeTimers.some((t) => t.entryId === e.id)}
                      onTimerToggle={handleTimerToggle}
                      onTaskToggle={handleTaskToggle}
                      currency={state.currency}
                    />
                  </div>
                ))}
            </div>
          </div>
        )}
    </div>
  )
}
