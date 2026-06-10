'use client'

import { useState, useMemo } from 'react'
import { useAppState } from '@/context/AppContext'
import { Project, Goal, Habit, ProjectStatus, GoalStatus, HabitStatus, SmartGoal, HabitAnalysis } from '@/lib/types'
import { fmtDate } from '@/lib/formatters'
import { todayLocalStr } from '@/lib/predicates'
import Icon from '@/components/ui/Icon'

const PROJECT_STATUSES: ProjectStatus[] = ['idea', 'plan', 'active', 'on-hold', 'done', 'archived']
const GOAL_STATUSES: GoalStatus[] = ['plan', 'in-progress', 'off-track', 'delayed', 're-plan', 'achieved', 'archived']
const HABIT_STATUSES: HabitStatus[] = ['schedule', 'started', 'small-misses', 'missing-but-consistent', 'frequent-misses', 'irregular', 'cultivated', 'archived']

const PROJECT_STATUS_COLORS: Record<ProjectStatus, string> = {
  'idea': 'var(--color-text3)',
  'plan': 'var(--color-amber)',
  'active': 'var(--color-green)',
  'on-hold': 'var(--color-amber)',
  'done': 'var(--color-accent)',
  'archived': 'var(--color-text3)',
}

const GOAL_STATUS_COLORS: Record<GoalStatus, string> = {
  'plan': 'var(--color-amber)',
  'in-progress': 'var(--color-green)',
  'off-track': 'var(--color-red)',
  'delayed': 'var(--color-amber)',
  're-plan': 'var(--color-amber)',
  'achieved': 'var(--color-accent)',
  'archived': 'var(--color-text3)',
}

const HABIT_STATUS_COLORS: Record<HabitStatus, string> = {
  'schedule': 'var(--color-text3)',
  'started': 'var(--color-green)',
  'small-misses': 'var(--color-amber)',
  'missing-but-consistent': 'var(--color-amber)',
  'frequent-misses': 'var(--color-red)',
  'irregular': 'var(--color-red)',
  'cultivated': 'var(--color-accent)',
  'archived': 'var(--color-text3)',
}

const inputStyle: React.CSSProperties = {
  border: '1px solid var(--color-border)',
  borderRadius: 6,
  padding: '7px 10px',
  fontFamily: 'inherit',
  fontSize: 13,
  outline: 'none',
  width: '100%',
  background: 'var(--color-bg)',
  color: 'var(--color-text)',
}

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 500,
  color: 'var(--color-text3)',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: 4,
}

const emptyAnalysis: HabitAnalysis = { duration: null, specificTiming: null, money: null, frequency: null }
const emptySmart: SmartGoal = { specific: '', measurable: '', achievable: '', relevant: '', timeBound: '' }

function SectionHead({ title, count }: { title: string; count: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text)', letterSpacing: '-0.01em' }}>{title}</span>
      <span style={{ fontSize: 11, fontFamily: "'DM Mono', monospace", color: 'var(--color-text3)', background: 'var(--color-bg3)', borderRadius: 99, padding: '0 7px', lineHeight: '18px' }}>{count}</span>
    </div>
  )
}

function StatusSelect({ value, onChange, statuses }: {
  value: string; onChange: (v: string) => void; statuses: string[]
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} style={inputStyle}>
      {statuses.map((s) => (
        <option key={s} value={s}>{s}</option>
      ))}
    </select>
  )
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.3)', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div onClick={(e) => e.stopPropagation()} style={{
        background: '#fff', borderRadius: 14, border: '1px solid var(--color-border)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        maxWidth: 520, width: '90%', maxHeight: '85vh', overflow: 'auto',
        padding: 24,
      }}>
        {children}
      </div>
    </div>
  )
}

function ProjectForm({ project, onSave, onClose }: {
  project?: Project; onSave: (p: Project) => void; onClose: () => void
}) {
  const [title, setTitle] = useState(project?.title ?? '')
  const [description, setDescription] = useState(project?.description ?? '')
  const [status, setStatus] = useState<ProjectStatus>(project?.status ?? 'idea')
  const [startDate, setStartDate] = useState(project?.startDate ?? '')
  const [endDate, setEndDate] = useState(project?.endDate ?? '')

  const save = () => {
    if (!title.trim()) return
    const now = new Date().toISOString()
    onSave({
      id: project?.id ?? Date.now(),
      title: title.trim(),
      description: description.trim() || undefined,
      status,
      startDate: startDate || null,
      endDate: endDate || null,
      createdAt: project?.createdAt ?? now,
      updatedAt: now,
    })
  }

  return (
    <div>
      <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px' }}>{project ? 'Edit Project' : 'New Project'}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <div style={labelStyle}>Title</div>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Project title" style={inputStyle} autoFocus />
        </div>
        <div>
          <div style={labelStyle}>Description</div>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" style={{ ...inputStyle, resize: 'vertical', minHeight: 60 }} rows={3} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <div style={labelStyle}>Status</div>
            <StatusSelect value={status} onChange={(v) => setStatus(v as ProjectStatus)} statuses={PROJECT_STATUSES} />
          </div>
          <div>
            <div style={labelStyle}>Start date</div>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={inputStyle} />
          </div>
        </div>
        <div>
          <div style={labelStyle}>End date</div>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={inputStyle} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
        <button onClick={onClose} style={{ background: 'var(--color-bg2)', color: 'var(--color-text2)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '7px 14px', fontFamily: 'inherit', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
        <button onClick={save} style={{ background: 'var(--color-accent)', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 16px', fontFamily: 'inherit', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Save</button>
      </div>
    </div>
  )
}

function GoalForm({ goal, onSave, onClose }: {
  goal?: Goal; onSave: (g: Goal) => void; onClose: () => void
}) {
  const [title, setTitle] = useState(goal?.title ?? '')
  const [description, setDescription] = useState(goal?.description ?? '')
  const [status, setStatus] = useState<GoalStatus>(goal?.status ?? 'plan')
  const [startDate, setStartDate] = useState(goal?.startDate ?? '')
  const [endDate, setEndDate] = useState(goal?.endDate ?? '')
  const [useSmart, setUseSmart] = useState(!!goal?.smart)
  const [smart, setSmart] = useState<SmartGoal>(goal?.smart ?? emptySmart)

  const save = () => {
    if (!title.trim()) return
    const now = new Date().toISOString()
    onSave({
      id: goal?.id ?? Date.now(),
      title: title.trim(),
      description: description.trim() || undefined,
      status,
      startDate: startDate || null,
      endDate: endDate || null,
      smart: useSmart ? smart : null,
      createdAt: goal?.createdAt ?? now,
      updatedAt: now,
    })
  }

  return (
    <div>
      <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px' }}>{goal ? 'Edit Goal' : 'New Goal'}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <div style={labelStyle}>Title</div>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Goal title" style={inputStyle} autoFocus />
        </div>
        <div>
          <div style={labelStyle}>Description</div>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" style={{ ...inputStyle, resize: 'vertical', minHeight: 60 }} rows={3} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <div style={labelStyle}>Status</div>
            <StatusSelect value={status} onChange={(v) => setStatus(v as GoalStatus)} statuses={GOAL_STATUSES} />
          </div>
          <div>
            <div style={labelStyle}>Start date</div>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={inputStyle} />
          </div>
        </div>
        <div>
          <div style={labelStyle}>End date</div>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={inputStyle} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 8, borderTop: '1px solid var(--color-border)' }}>
          <div
            onClick={() => setUseSmart(!useSmart)}
            style={{
              width: 36, height: 20, borderRadius: 99,
              background: useSmart ? 'var(--color-accent)' : 'var(--color-bg3)',
              cursor: 'pointer', position: 'relative', transition: 'background 0.15s', flexShrink: 0,
            }}
          >
            <div style={{
              width: 16, height: 16, borderRadius: 99, background: '#fff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              position: 'absolute', top: 2,
              left: useSmart ? 18 : 2,
              transition: 'left 0.15s',
            }} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text)' }}>S.M.A.R.T. Goal</span>
        </div>

        {useSmart && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 12, background: 'var(--color-bg2)', borderRadius: 8 }}>
            {(['specific', 'measurable', 'achievable', 'relevant', 'timeBound'] as (keyof SmartGoal)[]).map((field) => (
              <div key={field}>
                <div style={{ ...labelStyle, textTransform: 'capitalize' }}>{field === 'timeBound' ? 'Time-bound' : field}</div>
                <textarea
                  value={smart[field]}
                  onChange={(e) => setSmart({ ...smart, [field]: e.target.value })}
                  placeholder={`Describe the ${field} aspect...`}
                  style={{ ...inputStyle, resize: 'vertical', minHeight: 50 }}
                  rows={2}
                />
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
        <button onClick={onClose} style={{ background: 'var(--color-bg2)', color: 'var(--color-text2)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '7px 14px', fontFamily: 'inherit', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
        <button onClick={save} style={{ background: 'var(--color-accent)', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 16px', fontFamily: 'inherit', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Save</button>
      </div>
    </div>
  )
}

function HabitForm({ habit, onSave, onClose }: {
  habit?: Habit; onSave: (h: Habit) => void; onClose: () => void
}) {
  const [title, setTitle] = useState(habit?.title ?? '')
  const [description, setDescription] = useState(habit?.description ?? '')
  const [status, setStatus] = useState<HabitStatus>(habit?.status ?? 'schedule')
  const [startDate, setStartDate] = useState(habit?.startDate ?? '')
  const [endDate, setEndDate] = useState(habit?.endDate ?? '')
  const [analysis, setAnalysis] = useState<HabitAnalysis>(habit?.analysis ?? emptyAnalysis)

  const save = () => {
    if (!title.trim()) return
    const now = new Date().toISOString()
    onSave({
      id: habit?.id ?? Date.now(),
      title: title.trim(),
      description: description.trim() || undefined,
      status,
      startDate: startDate || null,
      endDate: endDate || null,
      analysis,
      tracker: habit?.tracker ?? [],
      createdAt: habit?.createdAt ?? now,
      updatedAt: now,
    })
  }

  return (
    <div>
      <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 16px' }}>{habit ? 'Edit Habit' : 'New Habit'}</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <div style={labelStyle}>Title</div>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Habit title" style={inputStyle} autoFocus />
        </div>
        <div>
          <div style={labelStyle}>Description</div>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" style={{ ...inputStyle, resize: 'vertical', minHeight: 60 }} rows={3} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <div style={labelStyle}>Status</div>
            <StatusSelect value={status} onChange={(v) => setStatus(v as HabitStatus)} statuses={HABIT_STATUSES} />
          </div>
          <div>
            <div style={labelStyle}>Start date</div>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={inputStyle} />
          </div>
        </div>
        <div>
          <div style={labelStyle}>End date</div>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={inputStyle} />
        </div>

        <div style={{ paddingTop: 8, borderTop: '1px solid var(--color-border)' }}>
          <div style={labelStyle}>Analysis Parameters</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 6 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--color-text3)', marginBottom: 3 }}>Duration (minutes)</div>
              <input type="number" value={analysis.duration ?? ''} onChange={(e) => setAnalysis({ ...analysis, duration: e.target.value ? Number(e.target.value) : null })} placeholder="e.g. 30" style={inputStyle} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--color-text3)', marginBottom: 3 }}>Money (₹)</div>
              <input type="number" value={analysis.money ?? ''} onChange={(e) => setAnalysis({ ...analysis, money: e.target.value ? Number(e.target.value) : null })} placeholder="e.g. 500" style={inputStyle} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--color-text3)', marginBottom: 3 }}>Specific timing</div>
              <input value={analysis.specificTiming ?? ''} onChange={(e) => setAnalysis({ ...analysis, specificTiming: e.target.value || null })} placeholder="e.g. 7:00 AM" style={inputStyle} />
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--color-text3)', marginBottom: 3 }}>Frequency</div>
              <input value={analysis.frequency ?? ''} onChange={(e) => setAnalysis({ ...analysis, frequency: e.target.value || null })} placeholder="e.g. Daily, 3x/week" style={inputStyle} />
            </div>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
        <button onClick={onClose} style={{ background: 'var(--color-bg2)', color: 'var(--color-text2)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '7px 14px', fontFamily: 'inherit', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
        <button onClick={save} style={{ background: 'var(--color-accent)', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 16px', fontFamily: 'inherit', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Save</button>
      </div>
    </div>
  )
}

function HabitTracker({ habit }: { habit: Habit }) {
  const { dispatch } = useAppState()
  const today = todayLocalStr()
  const last7 = useMemo(() => {
    const days: string[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      days.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`)
    }
    return days
  }, [])

  const completionRate = useMemo(() => {
    if (habit.tracker.length === 0) return 0
    return Math.round((habit.tracker.filter((t) => t.completed).length / habit.tracker.length) * 100)
  }, [habit.tracker])

  const toggleDay = (date: string) => {
    const existing = habit.tracker.find((t) => t.date === date)
    if (existing) {
      const updated = habit.tracker.map((t) => t.date === date ? { ...t, completed: !t.completed } : t)
      dispatch({ type: 'UPDATE_HABIT', payload: { ...habit, tracker: updated, updatedAt: new Date().toISOString() } })
    } else {
      dispatch({ type: 'ADD_HABIT_TRACKER_ENTRY', payload: { habitId: habit.id, entry: { date, completed: true } } })
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
        {last7.map((d) => {
          const tracked = habit.tracker.find((t) => t.date === d)
          const isCompleted = tracked?.completed ?? false
          const isToday = d === today
          return (
            <div key={d} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              <span style={{ fontSize: 9, color: 'var(--color-text3)', fontWeight: 500 }}>
                {new Date(d).toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2)}
              </span>
              <div
                onClick={() => toggleDay(d)}
                style={{
                  width: 24, height: 24, borderRadius: 6,
                  background: isCompleted ? 'var(--color-accent)' : 'var(--color-bg3)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: isToday ? '2px solid var(--color-accent)' : 'none',
                  transition: 'all 0.12s',
                }}
              >
                {isCompleted && <Icon name="check" size={12} color="#fff" />}
              </div>
            </div>
          )
        })}
      </div>
      <div style={{ fontSize: 11, color: 'var(--color-text3)' }}>
        {completionRate}% completion rate · {habit.tracker.filter((t) => t.completed).length}/{habit.tracker.length} days
      </div>
      {habit.analysis.duration && (
        <div style={{ fontSize: 11, color: 'var(--color-text2)', marginTop: 4 }}>
          {habit.analysis.duration} min{habit.analysis.frequency ? ` · ${habit.analysis.frequency}` : ''}{habit.analysis.specificTiming ? ` · ${habit.analysis.specificTiming}` : ''}{habit.analysis.money ? ` · ₹${habit.analysis.money}` : ''}
        </div>
      )}
    </div>
  )
}

function EntityCard({ project, goal, habit, mappedTasks, onEdit, onDelete }: {
  project?: Project; goal?: Goal; habit?: Habit; mappedTasks: number; onEdit: () => void; onDelete: () => void
}) {
  const entity = project ?? goal ?? habit
  if (!entity) return null

  const statusColors = project ? PROJECT_STATUS_COLORS : goal ? GOAL_STATUS_COLORS : HABIT_STATUS_COLORS

  return (
    <div style={{
      background: '#fff', border: '1px solid var(--color-border)', borderRadius: 10,
      padding: 14,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--color-text)', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {entity.title}
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10, fontWeight: 500, color: statusColors[entity.status as keyof typeof statusColors] ?? 'var(--color-text3)', background: 'var(--color-bg2)', borderRadius: 99, padding: '1px 7px', lineHeight: '18px' }}>
              {entity.status}
            </span>
            {entity.startDate && (
              <span style={{ fontSize: 10, color: 'var(--color-text3)' }}>
                {fmtDate(entity.startDate)}{entity.endDate ? ` – ${fmtDate(entity.endDate)}` : ''}
              </span>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          <button onClick={onEdit} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--color-text3)', borderRadius: 4 }} title="Edit">
            <Icon name="edit" size={13} />
          </button>
          <button onClick={onDelete} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, color: 'var(--color-text3)', borderRadius: 4 }} title="Delete">
            <Icon name="trash" size={13} />
          </button>
        </div>
      </div>

      {entity.description && (
        <div style={{ fontSize: 12, color: 'var(--color-text2)', marginBottom: 8, lineHeight: 1.4 }}>
          {entity.description}
        </div>
      )}

      {goal && goal.smart && (
        <div style={{ marginBottom: 8 }}>
          {(['specific', 'measurable', 'achievable', 'relevant', 'timeBound'] as (keyof SmartGoal)[]).map((field) => {
            if (!goal.smart![field]) return null
            return (
              <div key={field} style={{ fontSize: 11, color: 'var(--color-text2)', marginBottom: 3, lineHeight: 1.4 }}>
                <span style={{ fontWeight: 500, textTransform: 'capitalize' }}>{field === 'timeBound' ? 'Time-bound' : field}: </span>
                {goal.smart![field]}
              </div>
            )
          })}
        </div>
      )}

      {habit && <HabitTracker habit={habit} />}

      {mappedTasks > 0 && (
        <div style={{ fontSize: 11, color: 'var(--color-accent)', marginTop: 8 }}>
          {mappedTasks} task{mappedTasks !== 1 ? 's' : ''} mapped
        </div>
      )}
    </div>
  )
}

export default function PGHView() {
  const { state, dispatch } = useAppState()
  const { projects, goals, habits, entries } = state
  const [activeTab, setActiveTab] = useState<'projects' | 'goals' | 'habits'>('projects')
  const [showProjectForm, setShowProjectForm] = useState(false)
  const [showGoalForm, setShowGoalForm] = useState(false)
  const [showHabitForm, setShowHabitForm] = useState(false)
  const [editingProject, setEditingProject] = useState<Project | undefined>()
  const [editingGoal, setEditingGoal] = useState<Goal | undefined>()
  const [editingHabit, setEditingHabit] = useState<Habit | undefined>()
  const [confirmDelete, setConfirmDelete] = useState<{ type: string; id: number } | null>(null)

  const activeProjects = projects.filter((p) => p.status !== 'archived')
  const archivedProjects = projects.filter((p) => p.status === 'archived')
  const activeGoals = goals.filter((g) => g.status !== 'archived')
  const archivedGoals = goals.filter((g) => g.status === 'archived')
  const activeHabits = habits.filter((h) => h.status !== 'archived')
  const archivedHabits = habits.filter((h) => h.status === 'archived')

  const getMappedTasks = (type: 'project' | 'goal' | 'habit', id: number) =>
    entries.filter((e) => e.pghMapping?.type === type && e.pghMapping.id === id).length

  const handleSaveProject = (p: Project) => {
    if (editingProject) {
      dispatch({ type: 'UPDATE_PROJECT', payload: p })
    } else {
      dispatch({ type: 'ADD_PROJECT', payload: p })
    }
    setShowProjectForm(false)
    setEditingProject(undefined)
  }

  const handleSaveGoal = (g: Goal) => {
    if (editingGoal) {
      dispatch({ type: 'UPDATE_GOAL', payload: g })
    } else {
      dispatch({ type: 'ADD_GOAL', payload: g })
    }
    setShowGoalForm(false)
    setEditingGoal(undefined)
  }

  const handleSaveHabit = (h: Habit) => {
    if (editingHabit) {
      dispatch({ type: 'UPDATE_HABIT', payload: h })
    } else {
      dispatch({ type: 'ADD_HABIT', payload: h })
    }
    setShowHabitForm(false)
    setEditingHabit(undefined)
  }

  const handleDelete = () => {
    if (!confirmDelete) return
    if (confirmDelete.type === 'project') dispatch({ type: 'DELETE_PROJECT', payload: confirmDelete.id })
    else if (confirmDelete.type === 'goal') dispatch({ type: 'DELETE_GOAL', payload: confirmDelete.id })
    else if (confirmDelete.type === 'habit') dispatch({ type: 'DELETE_HABIT', payload: confirmDelete.id })
    setConfirmDelete(null)
  }

  const totalCount = projects.length + goals.length + habits.length
  const activeCount = activeProjects.length + activeGoals.length + activeHabits.length

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px 80px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.02em', margin: 0, marginBottom: 4 }}>
            Projects · Goals · Habits
          </h2>
          <span style={{ fontSize: 12, color: 'var(--color-text3)' }}>
            {activeCount} active · {totalCount} total
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 20, background: 'var(--color-bg2)', borderRadius: 10, padding: 3 }}>
        {(['projects', 'goals', 'habits'] as const).map((tab) => {
          const counts = { projects: activeProjects.length, goals: activeGoals.length, habits: activeHabits.length }
          return (
            <div
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1, textAlign: 'center', padding: '8px 12px', borderRadius: 8,
                cursor: 'pointer', fontSize: 13, fontWeight: activeTab === tab ? 600 : 400,
                background: activeTab === tab ? '#fff' : 'transparent',
                color: activeTab === tab ? 'var(--color-text)' : 'var(--color-text2)',
                boxShadow: activeTab === tab ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                transition: 'all 0.12s',
              }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, marginLeft: 6, color: 'var(--color-text3)' }}>
                {counts[tab]}
              </span>
            </div>
          )
        })}
      </div>

      {/* Content */}
      {activeTab === 'projects' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button
              onClick={() => { setEditingProject(undefined); setShowProjectForm(true) }}
              style={{ background: 'var(--color-accent)', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', fontFamily: 'inherit', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Icon name="plus" size={13} />
              New Project
            </button>
          </div>
          {activeProjects.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-text3)', fontSize: 14 }}>
              No projects yet. Create your first project to get started.
            </div>
          )}
          <div style={{ display: 'grid', gap: 10 }}>
            {activeProjects.map((p) => (
              <EntityCard
                key={p.id}
                project={p}
                mappedTasks={getMappedTasks('project', p.id)}
                onEdit={() => { setEditingProject(p); setShowProjectForm(true) }}
                onDelete={() => setConfirmDelete({ type: 'project', id: p.id })}
              />
            ))}
          </div>
          {archivedProjects.length > 0 && (
            <div style={{ marginTop: 32 }}>
              <SectionHead title="Archived" count={archivedProjects.length} />
              <div style={{ display: 'grid', gap: 10 }}>
                {archivedProjects.map((p) => (
                  <EntityCard
                    key={p.id}
                    project={p}
                    mappedTasks={getMappedTasks('project', p.id)}
                    onEdit={() => { setEditingProject(p); setShowProjectForm(true) }}
                    onDelete={() => setConfirmDelete({ type: 'project', id: p.id })}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'goals' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button
              onClick={() => { setEditingGoal(undefined); setShowGoalForm(true) }}
              style={{ background: 'var(--color-accent)', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', fontFamily: 'inherit', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Icon name="plus" size={13} />
              New Goal
            </button>
          </div>
          {activeGoals.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-text3)', fontSize: 14 }}>
              No goals yet. Create your first goal to get started.
            </div>
          )}
          <div style={{ display: 'grid', gap: 10 }}>
            {activeGoals.map((g) => (
              <EntityCard
                key={g.id}
                goal={g}
                mappedTasks={getMappedTasks('goal', g.id)}
                onEdit={() => { setEditingGoal(g); setShowGoalForm(true) }}
                onDelete={() => setConfirmDelete({ type: 'goal', id: g.id })}
              />
            ))}
          </div>
          {archivedGoals.length > 0 && (
            <div style={{ marginTop: 32 }}>
              <SectionHead title="Archived" count={archivedGoals.length} />
              <div style={{ display: 'grid', gap: 10 }}>
                {archivedGoals.map((g) => (
                  <EntityCard
                    key={g.id}
                    goal={g}
                    mappedTasks={getMappedTasks('goal', g.id)}
                    onEdit={() => { setEditingGoal(g); setShowGoalForm(true) }}
                    onDelete={() => setConfirmDelete({ type: 'goal', id: g.id })}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'habits' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <button
              onClick={() => { setEditingHabit(undefined); setShowHabitForm(true) }}
              style={{ background: 'var(--color-accent)', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', fontFamily: 'inherit', fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Icon name="plus" size={13} />
              New Habit
            </button>
          </div>
          {activeHabits.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--color-text3)', fontSize: 14 }}>
              No habits yet. Create your first habit to get started.
            </div>
          )}
          <div style={{ display: 'grid', gap: 10 }}>
            {activeHabits.map((h) => (
              <EntityCard
                key={h.id}
                habit={h}
                mappedTasks={getMappedTasks('habit', h.id)}
                onEdit={() => { setEditingHabit(h); setShowHabitForm(true) }}
                onDelete={() => setConfirmDelete({ type: 'habit', id: h.id })}
              />
            ))}
          </div>
          {archivedHabits.length > 0 && (
            <div style={{ marginTop: 32 }}>
              <SectionHead title="Archived" count={archivedHabits.length} />
              <div style={{ display: 'grid', gap: 10 }}>
                {archivedHabits.map((h) => (
                  <EntityCard
                    key={h.id}
                    habit={h}
                    mappedTasks={getMappedTasks('habit', h.id)}
                    onEdit={() => { setEditingHabit(h); setShowHabitForm(true) }}
                    onDelete={() => setConfirmDelete({ type: 'habit', id: h.id })}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showProjectForm && (
        <Modal onClose={() => { setShowProjectForm(false); setEditingProject(undefined) }}>
          <ProjectForm project={editingProject} onSave={handleSaveProject} onClose={() => { setShowProjectForm(false); setEditingProject(undefined) }} />
        </Modal>
      )}
      {showGoalForm && (
        <Modal onClose={() => { setShowGoalForm(false); setEditingGoal(undefined) }}>
          <GoalForm goal={editingGoal} onSave={handleSaveGoal} onClose={() => { setShowGoalForm(false); setEditingGoal(undefined) }} />
        </Modal>
      )}
      {showHabitForm && (
        <Modal onClose={() => { setShowHabitForm(false); setEditingHabit(undefined) }}>
          <HabitForm habit={editingHabit} onSave={handleSaveHabit} onClose={() => { setShowHabitForm(false); setEditingHabit(undefined) }} />
        </Modal>
      )}
      {confirmDelete && (
        <Modal onClose={() => setConfirmDelete(null)}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, margin: '0 0 12px' }}>Delete {confirmDelete.type}?</h3>
            <p style={{ fontSize: 13, color: 'var(--color-text2)', margin: 0 }}>
              This will remove the {confirmDelete.type} and unmap all associated tasks.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 20 }}>
              <button onClick={() => setConfirmDelete(null)} style={{ background: 'var(--color-bg2)', color: 'var(--color-text2)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '7px 14px', fontFamily: 'inherit', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleDelete} style={{ background: 'var(--color-red)', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 16px', fontFamily: 'inherit', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Delete</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
