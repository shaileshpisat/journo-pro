# JournoPro — Codebase Map

> Reference document for feature development and bug fixes.
> Last updated: 2026-06-16 (added Reminders feature — standalone reminders with title, date, checkbox)

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Tech Stack](#2-tech-stack)
3. [Directory Structure](#3-directory-structure)
4. [Data Model](#4-data-model)
5. [State Management](#5-state-management)
6. [Routing / View System](#6-routing--view-system)
7. [Styling System](#7-styling-system)
8. [File Reference](#8-file-reference)
   - [Config & Entry Points](#config--entry-points)
   - [lib/ — Types, Parsing, Utilities](#lib--types-parsing-utilities)
   - [hooks/ & context/](#hooks--context)
   - [components/ui/](#componentsui)
   - [components/entry/](#componentsentry)
   - [components/layout/](#componentslayout)
   - [components/modals/](#componentsmodals)
   - [components/views/](#componentsviews)
9. [Key Flows](#9-key-flows)
10. [Common Patterns](#10-common-patterns)
11. [localStorage Keys](#11-localstorage-keys)

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│  page.tsx                                           │
│    └─ AppProvider (useReducer + localStorage sync)  │
│         └─ App.tsx (view router)                    │
│              ├─ Sidebar                             │
│              └─ <ActiveView>   ← one of 8+ views    │
│                   ├─ EntryDetail (overlay)          │
│                   ├─ FloatingTimer (fixed)          │
│                   └─ AddFolderModal (overlay)       │
└─────────────────────────────────────────────────────┘
```

- **No URL routing** — active view is a string in `AppState.view`.
- **No backend** — all data lives in `localStorage`.
- **All components are `'use client'`** — no server components below `page.tsx`.
- **Single state tree** in `AppContext` via `useReducer`.

---

## 2. Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Framework | Next.js (App Router) | 16.2.4 |
| UI | React | 19.2.4 |
| Language | TypeScript (strict) | 5 |
| Styling | Tailwind CSS v4 (`@theme`) | 4 |
| Fonts | DM Sans + DM Mono (Google Fonts) | — |
| Persistence | localStorage | — |

---

## 3. Directory Structure

```
src/
├── app/
│   ├── globals.css          # Design tokens (@theme), global resets, fonts
│   ├── layout.tsx           # Root HTML shell + metadata
│   └── page.tsx             # Entry: AppProvider + App
├── lib/
│   ├── types.ts             # All TypeScript types and interfaces
│   ├── parser.ts            # Natural language entry parser
│   ├── formatters.ts        # fmtTime, fmtDate, fmtAmt
│   ├── predicates.ts        # isToday, isPast, isOverdue
│   ├── folderUtils.ts       # Folder tree building and matching
│   └── seedData.ts          # 14 sample entries for first load
├── hooks/
│   └── useLocalStorage.ts   # Generic localStorage hook (SSR-safe)
├── context/
│   └── AppContext.tsx        # Global state: useReducer + provider + hooks
├── components/
│   ├── ui/
│   │   ├── Icon.tsx          # SVG icon registry (22 icons)
│   │   ├── Chip.tsx          # Pill badge
│   │   ├── FolderChip.tsx    # Folder path badge
│   │   ├── SectionHead.tsx   # Section header with count badge
│   │   └── FieldBlock.tsx    # Label + value display block
│   ├── entry/
│   │   ├── EntryCard.tsx     # Entry row (normal / minimal / overdue)
│   │   ├── JournalInput.tsx  # Text input with live parse preview
│   │   ├── TodayTimeline.tsx # Hourly timeline of today's entries
│   │   └── EntryDetail.tsx   # Full-screen entry view + inline edit
│   ├── layout/
│   │   ├── Sidebar.tsx       # Collapsible nav + folder tree
│   │   ├── NavItem.tsx       # Single nav row
│   │   └── FolderTreeNode.tsx # Recursive folder tree item
│   ├── modals/
│   │   ├── AddFolderModal.tsx  # Assign entry to folder
│   │   └── MoveFolderModal.tsx # Move folder to new parent
│       ├── FloatingTimer.tsx     # Fixed top timer bar (parallel timers)
│       └── views/
│           ├── HomeView.tsx
│           ├── InboxView.tsx
│           ├── SearchView.tsx
│           ├── CalendarView.tsx
│           ├── FoldersView.tsx
│           ├── FolderDetailView.tsx
│           ├── ParallelView.tsx   # Weekly hourly blocks per timer
│           ├── SettingsView.tsx
│           └── PGHView.tsx        # Projects, Goals, Habits dashboard
└── App.tsx                   # View router shell
```

---

## 4. Data Model

### `Comment` — user comment on an entry

```ts
interface Comment {
  id: number
  text: string
  timestamp: string     // ISO 8601
  isPinned?: boolean    // Single pinned comment shown at top
}
```

### `Entry` — core record

```ts
interface Entry {
  id: number            // Date.now() at creation
  text: string          // Raw entry text
  timestamp: string     // ISO 8601 creation time
  actionDate: string | null  // "YYYY-MM-DD" when action needed
  tags: string[]        // Parsed from #tag
  folder: string | null // Slash-delimited path: "Clients/Acme Corp"
  amount: number | null
  amountType: 'inflow' | 'outflow' | null
  mentions: string[]    // Parsed from @mention (supports multiple)
  timeLogs: TimeLog[]   // Timer tracking entries
  history: EntryHistory[] // Audit trail of changes
  isTask: boolean       // Marked as task
  isTaskDone: boolean   // Completed state
  completedAt: string | null  // ISO timestamp when task was completed
  archived: boolean     // Soft-delete
  comments: Comment[]   // User comments
}
```

### `FolderNode` — folder tree node

```ts
interface FolderNode {
  name: string       // Leaf segment: "Acme Corp"
  path: string       // Full path: "Clients/Acme Corp"
  children: FolderNode[]
}
```

### `CurrencySymbol` — available currency symbols

```ts
type CurrencySymbol = '$' | '€' | '£' | '₹' | '¥' | '₽' | '₩'
```

### `TimerState` — active timer (parallel)

```ts
interface TimerSegment {
  startedAt: number       // Date.now()
  pausedAt?: number       // undefined = running
  description: string
}

interface TimerState {
  entryId: number
  segments: TimerSegment[]  // supports pause/resume
}
```

### `Reminder` — standalone reminder with checkbox

```ts
interface Reminder {
  id: number
  title: string
  date: string     // YYYY-MM-DD
  done: boolean
}
```

Reminders are independent of `Entry` — they have their own state array (`AppState.reminders`), actions (`ADD_REMINDER` / `UPDATE_REMINDER` / `DELETE_REMINDER` / `SET_REMINDERS`), and localStorage key (`jp_reminders`).

### PGH Entities — Project, Goal, Habit

```ts
type ProjectStatus = 'idea' | 'plan' | 'active' | 'on-hold' | 'done' | 'archived'
type GoalStatus = 'plan' | 'in-progress' | 'off-track' | 'delayed' | 're-plan' | 'achieved' | 'archived'
type HabitStatus = 'schedule' | 'started' | 'small-misses' | 'missing-but-consistent' | 'frequent-misses' | 'irregular' | 'cultivated' | 'archived'

interface SmartGoal {
  specific: string; measurable: string; achievable: string
  relevant: string; timeBound: string
}

interface HabitAnalysis {
  duration: number | null       // minutes
  specificTiming: string | null  // e.g. "7:00 AM"
  money: number | null
  frequency: string | null       // e.g. "Daily", "3x/week"
}

interface HabitTrackerEntry {
  date: string        // YYYY-MM-DD
  completed: boolean
  note?: string
}

interface Project {
  id: number; title: string; startDate: string | null; endDate: string | null
  status: ProjectStatus; description?: string; createdAt: string; updatedAt: string
}

interface Goal {
  id: number; title: string; startDate: string | null; endDate: string | null
  status: GoalStatus; smart: SmartGoal | null; description?: string; createdAt: string; updatedAt: string
}

interface Habit {
  id: number; title: string; startDate: string | null; endDate: string | null
  status: HabitStatus; analysis: HabitAnalysis; tracker: HabitTrackerEntry[]
  description?: string; createdAt: string; updatedAt: string
}

interface PGHMapping {
  type: 'project' | 'goal' | 'habit'
  id: number
}
```

Entry now includes `pghMapping: PGHMapping | null` to link a task to a PGH entity.

### `ViewName` — all valid views

```ts
type ViewName =
  | 'home' | 'inbox' | 'search' | 'calendar'
  | 'folders' | 'settings' | 'parallel' | 'pgh'
  | `folder:${string}`   // e.g. "folder:Clients/Acme Corp"
```

---

## 5. State Management

**Location:** `src/context/AppContext.tsx`

### AppState shape

```ts
{
  entries: Entry[]         // All journal entries
  view: ViewName           // Active view
  selectedEntry: Entry | null   // Opens EntryDetail overlay
  sidebarCollapsed: boolean
  activeTimers: TimerState[]
  addFolderEntry: Entry | null  // Opens AddFolderModal
  currency: CurrencySymbol
  searchFilters: SearchFilters  // Persistent search view filters
  toast: string | null         // Toast notification message
  projects: Project[]       // All projects
  goals: Goal[]             // All goals
  habits: Habit[]           // All habits
  reloadPending: boolean    // True when 12-hour auto-reload is queued
  pendingRecurring: PendingRecurringEntry[]  // Recurring tasks with multiple period tags awaiting user pick
  reminders: Reminder[]        // Standalone reminders (title, date, done)
}
```

### Actions

| Action type | Payload | Effect |
|---|---|---|
| `ADD_ENTRY` | `Entry` | Prepend to entries array |
| `UPDATE_ENTRY` | `Entry` | Replace by id; updates selectedEntry if open |
| `DELETE_ENTRY` | `number` (id) | Remove from entries; clear selectedEntry |
| `SET_ENTRIES` | `Entry[]` | Replace full array (used for hydration) |
| `SET_VIEW` | `ViewName` | Change active view; clears selectedEntry AND resets `searchFilters` to `DEFAULT_SEARCH_FILTERS` |
| `SELECT_ENTRY` | `Entry \| null` | Open/close EntryDetail overlay |
| `TOGGLE_SIDEBAR` | — | Toggle sidebarCollapsed |
| `SET_TIMER` | `TimerState` | Start a new parallel timer (appends to array) |
| `REMOVE_TIMER` | `{ entryId: number }` | Remove a timer from activeTimers |
| `PAUSE_TIMER` | `{ entryId: number }` | Pause a specific timer by entryId |
| `RESUME_TIMER` | `{ entryId: number }` | Resume a specific timer by entryId |
| `LOG_TIME` | `{ entryId: number, log: TimeLog }` | Log time + remove timer from activeTimers |
| `SET_ADD_FOLDER_ENTRY` | `Entry \| null` | Open/close AddFolderModal |
| `MOVE_FOLDER` | `{ oldPath, newPath }` | Rename folder path on all matching entries |
| `ADD_COMMENT` | `{ entryId: number, comment: Comment }` | Append comment to entry.comments; records `commentAdded` in history |
| `EDIT_COMMENT` | `{ entryId: number, commentId: number, text: string }` | Update comment text by id; records `commentEdited` in history |
| `PIN_COMMENT` | `{ entryId: number, commentId: number }` | Toggle `isPinned` on comment; unpins all others on the same entry (only one can be pinned) |
| `SET_CURRENCY` | `CurrencySymbol` | Update currency symbol used for all amount displays |
| `SET_SEARCH_FILTERS` | `SearchFilters` | Persist search view filters (query, entity/folder/tag selections, date range, tasksOnly) |
| `SET_TOAST` | `string \| null` | Show/dismiss toast notification (auto-dismissed after 3s) |
| `TOGGLE_TASK_DONE` | `number` (id) | Toggle task done state; sets `completedAt` (ISO) when completing; clears on undo; blocks undo past same-day |
| `SET_PROJECTS` / `ADD_PROJECT` / `UPDATE_PROJECT` / `DELETE_PROJECT` | various | CRUD for projects; DELETE also unmaps all entries from that project |
| `SET_GOALS` / `ADD_GOAL` / `UPDATE_GOAL` / `DELETE_GOAL` | various | CRUD for goals; DELETE also unmaps all entries from that goal |
| `SET_HABITS` / `ADD_HABIT` / `UPDATE_HABIT` / `DELETE_HABIT` | various | CRUD for habits; DELETE also unmaps all entries from that habit |
| `ADD_HABIT_TRACKER_ENTRY` | `{ habitId, entry: HabitTrackerEntry }` | Append a new daily tracker entry to a habit |
| `SET_RELOAD_PENDING` | `boolean` | Set/clear reload-pending flag for 12-hour auto-reload |
| `SET_PENDING_RECURRING` | `PendingRecurringEntry[]` | Store recurring tasks with multiple period tags awaiting user resolution |
| `RESOLVE_RECURRING` | `{ entryId, selectedTag }` | Remove other period tags, advance actionDate by selectedTag's period, clear from pending |
| `SET_REMINDERS` | `Reminder[]` | Replace full reminders array |
| `ADD_REMINDER` | `Reminder` | Append a new reminder |
| `UPDATE_REMINDER` | `Reminder` | Replace reminder by id (used for toggle done) |
| `DELETE_REMINDER` | `number` (id) | Remove a reminder |

### localStorage sync

- On **mount**: reads `jp_entries`, `jp_view`, `jp_activeTimers`, `jp_currency`, and `jp_searchFilters` once via `useEffect` + `useRef` guard.
- On **state change**: `useEffect` watching `state.entries` → saves to `jp_entries`; same for `state.view`, `state.activeTimers`, `state.currency`, and `state.searchFilters`.
- **Seed data**: If localStorage is empty, `SEED_ENTRIES` is used as initial state.
- **Auto-reload**: `jp_lastReload` is checked on every mount. If 12+ hours have elapsed, `reloadPending` is set instead of immediately reloading — the app waits for recurring-task resolution first.
- **Recurring task check**: Runs once after hydration. Entries with `isTask && !isTaskDone && tags.includes('recurring') && past actionDate` are processed. If multiple period tags exist (`daily`/`weekdays`/`weekend`/`weekly`/`monthly`/`quarterly`), they're shown in `RecurringTagPicker`. Single/no-tag entries are auto-advanced (actionDate + period until >= today, or set to today).

### Consuming state in components

```ts
import { useAppState } from '@/context/AppContext'

const { state, dispatch } = useAppState()
const { entries, activeTimers, view } = state
```

---

## 6. Routing / View System

There is **no Next.js router involvement** in navigation. The active view is stored in `AppState.view`. `App.tsx` renders the matching view component:

```ts
// EntryDetail renders as an ABSOLUTE overlay on top of the current view
// (not replacing it), so the view's local state persists when navigating back.
if (view === 'home')      → <HomeView />
if (view === 'inbox')     → <InboxView />
if (view === 'search')    → <SearchView />
if (view === 'calendar')  → <CalendarView />
if (view === 'parallel')  → <ParallelView />
if (view === 'folders')   → <FoldersView />
if (view === 'settings')  → <SettingsView />
if (view === 'pgh')       → <PGHView />
if (view.startsWith('folder:')) → <FolderDetailView key={view} folderName={view.slice(7)} />  // key forces re-mount when navigating between folders
```

**To navigate:** dispatch `SET_VIEW`:

```ts
dispatch({ type: 'SET_VIEW', payload: 'inbox' })
dispatch({ type: 'SET_VIEW', payload: 'folder:Clients/Acme Corp' })
```

**To open entry detail:**

```ts
dispatch({ type: 'SELECT_ENTRY', payload: entry })
// Close:
dispatch({ type: 'SELECT_ENTRY', payload: null })
```

---

## 7. Styling System

**Tailwind v4** with design tokens defined in `src/app/globals.css` under `@theme inline`:

### Color tokens → Tailwind class

| CSS Variable | Tailwind Class | Usage |
|---|---|---|
| `--color-bg` (#FAFAF8) | `bg-bg` | Page backgrounds |
| `--color-bg2` (#F3F2EE) | `bg-bg2` | Sidebar, cards |
| `--color-bg3` (#ECEAE4) | `bg-bg3` | Chips, badges |
| `--color-border` (#E2DFD8) | `border-border` | All borders |
| `--color-text` (#1A1A18) | `text-text` | Primary text |
| `--color-text2` (#6B6860) | `text-text2` | Secondary text |
| `--color-text3` (#A8A59E) | `text-text3` | Muted/placeholder |
| `--color-accent` (oklch gold) | `text-accent`, `bg-accent` | Primary brand |
| `--color-accent-light` | `bg-accent-light` | Accent background |
| `--color-green` | `text-green` | Inflow amounts |
| `--color-green-light` | `bg-green-light` | Inflow chip bg |
| `--color-red` | `text-red` | Outflow, overdue |
| `--color-red-light` | `bg-red-light` | Overdue section bg |
| `--color-amber` | `text-amber` | Action dates |
| `--color-amber-light` | `bg-amber-light` | Action section bg |

### Important notes

- `oklch()` opacity modifiers (`bg-accent/50`) **do not work** — use `--accent-ring` variable for the one focus-ring case.
- Dynamic indentation (FolderTreeNode) uses `style={{ paddingLeft: ... }}` — Tailwind cannot generate runtime class strings.
- Most components use **inline styles** for color values. Tailwind classes are used primarily for layout (flex, grid, gap, overflow, position).
- Custom animation: `.animate-pulse-dot` defined in globals.css (used by FloatingTimer's red dot when running, stops pulsing and turns blue when paused).

### Layout constants (CSS variables, not Tailwind tokens)

```css
--radius: 10px      /* default border radius */
--radius-sm: 6px    /* small elements */
--sidebar-w: 220px  /* expanded sidebar width */
```

---

## 8. File Reference

### Config & Entry Points

#### `src/app/globals.css`
- Tailwind import + `@theme inline` design tokens
- CSS variables for radius, sidebar width, accent-ring
- Global resets: box-model, html/body height, font, antialiasing
- Custom scrollbar styles
- `@keyframes pulse-dot` + `.animate-pulse-dot` class

#### `src/app/layout.tsx`
- Root HTML shell; sets `height: 100%` on html/body
- Metadata: title "JournoPro", description

#### `src/app/page.tsx`
- `'use client'`
- Wraps `<App>` in `<AppProvider>`
- The single Next.js page — entire app is a SPA from here down

#### `src/App.tsx`
- View router — reads `state.view` and `state.selectedEntry`
- Layout: `display: flex; height: 100vh; overflow: hidden`
- Renders `<Sidebar>` + `<main>` + optional overlays

---

### lib/ — Types, Parsing, Utilities

#### `src/lib/types.ts`
All shared TypeScript types. **Import all types from here.**
- `AmountType`, `CurrencySymbol`, `ViewName`, `Entry`, `FolderNode`, `TimerState`, `SearchFilters`, `DEFAULT_SEARCH_FILTERS`, `AppState`, `Action`

#### `src/lib/parser.ts`
```ts
parseEntry(text: string): Partial<Entry>
```
Regex-based natural language parser. Extracts from raw text:
- `@Word` → `entity`
- `#word` → `tags[]` (all matches)
- `/word(/word)*` → `folder`
- `$123`, `₹123k` → `amount` + currency detection
- `received/inflow/got` → `amountType: 'inflow'`
- `paid/outflow/spent` → `amountType: 'outflow'`
- `tomorrow` → today+1 day
- `next week` → today+7 days
- `monday` → today+1, `friday` → today+5
- `MM/DD` or `MM-DD` → absolute date this year

#### `src/lib/formatters.ts`
```ts
fmtTime(iso: string): string           // "9:14 AM"
fmtDate(iso: string | null): string   // "Today" | "Tomorrow" | "Yesterday" | "Monday" | "Apr 21"
fmtAmt(amount, type, currency?): { label, color } | null  // "+$4,500" in green or "−€312" in red; defaults to '$'
```
Colors returned by `fmtAmt` are CSS variable strings (e.g., `'var(--color-green)'`).
Accepts an optional third `currency` parameter — all callers pass `state.currency`.

#### `src/lib/predicates.ts`
```ts
isToday(iso: string | null): boolean      // timestamp starts with today's date
isPast(dateStr: string | null): boolean   // dateStr < today
isOverdue(entry: Entry): boolean          // has actionDate && actionDate < today
```
All compute today's date string internally via `new Date().toISOString().split('T')[0]`.

#### `src/lib/folderUtils.ts`
```ts
folderMatches(entryFolder, filterFolder): boolean
  // true if entry.folder === filterFolder OR starts with filterFolder + "/"

getAllFolderPaths(entries): string[]
  // All unique paths including ancestors, sorted
  // e.g., "Clients/Acme" → adds "Clients" AND "Clients/Acme"

buildFolderTree(entries): FolderNode[]
  // Hierarchical tree, root nodes only
  // Used by FoldersView and Sidebar

folderLabel(path): string | null
  // Last segment: "Clients/Acme Corp" → "Acme Corp"
```

#### `src/lib/seedData.ts`
`SEED_ENTRIES: Entry[]` — 14 pre-built entries used on first load.
Covers: inflows, outflows, overdue entries, today/yesterday/past entries, multiple folder hierarchies.

---

### hooks/ & context/

#### `src/components/ScrollToTop.tsx`
- Renders a fixed `↑` button (bottom-right, white circle with shadow) when `<main>` is scrolled past 300px
- Listens for scroll on `<main>` via `document.querySelector`, not window
- Scrolls `<main>` to top on click
- Uses `state.activeTimers.length > 0 ? 140 : 28` for bottom offset so it clears the FloatingTimer bar
```ts
useLocalStorage<T>(key: string, initialValue: T): [T, (val: T) => void]
```
SSR-safe generic hook. Reads from localStorage in `useEffect` (avoids hydration mismatch). Not used directly in most components — AppContext handles persistence instead.

#### `src/context/AppContext.tsx`
- **`AppProvider`**: wraps app, provides state + dispatch via context
- **`useAppState()`**: consume context — throws if used outside provider
- Hydration guard via `useRef(false)` to prevent double-reads
- Two `useEffect`s for persistence (entries, view)

---

### components/ui/

#### `Icon.tsx`
```tsx
<Icon name="folder" size={16} color="var(--color-accent)" />
```
Available icon names: `home`, `inbox`, `folder`, `calendar`, `search`, `chevronLeft`, `chevronRight`, `chevronDown`, `x`, `plus`, `tag`, `entity`, `amount`, `clock`, `alert`, `edit`, `arrowLeft`, `settings`, `trash`, `check`, `stopwatch`, `pause`, `play`, `messageSquare`, `barChart`, `pin`, `square`, `checkSquare`, `bell`

#### `Chip.tsx`
```tsx
<Chip icon="tag" label="#meeting" color="..." bg="..." small onRemove={() => {}} />
```
Pill badge. `small` reduces padding and font size. `onRemove` adds a × button.

#### `FolderChip.tsx`
```tsx
<FolderChip path="Clients/Acme Corp" small />
// renders: 📁 Clients / Acme Corp
```
Always accent-colored. Returns `null` if `path` is null.

#### `SearchableSelect.tsx`
```tsx
<SearchableSelect multi value={selected} onChange={setSelected} options={items} placeholder="Search…" allLabel="All" formatOption={(s) => `#${s}`} />
```
Reusable dropdown with search input, keyboard navigation, and optional multi-select (`multi` prop). In multi mode: checkboxes, selection count trigger, stays open on select. Closes on outside click. Supports `formatOption` for option display formatting.
```tsx
<SectionHead title="Needs action" count={3} action={{ label: 'View all', fn: () => {} }} />
```
Uppercase title + optional count badge (red if >0) + optional right-side action link.

#### `FieldBlock.tsx`
```tsx
<FieldBlock label="Entity" icon="entity" value="Acme Corp" color="var(--color-text2)" />
<FieldBlock label="Folder" icon="folder">
  <input ... />   {/* edit mode */}
</FieldBlock>
```
Used in EntryDetail's 2-column metadata grid. Shows "—" if no value and no children.

---

### components/entry/

#### `EntryCard.tsx`
Props: `entry`, `onClick`, `compact?`, `overdue?`, `minimal?`, `timerActive?`, `onTimerToggle?`

| Mode | What's shown |
|---|---|
| Normal | Text, amount, timestamp, entity, folder chip, actionDate, tags |
| `minimal` | Text, actionDate chip, entity chip only |
| `overdue` | Red border |
| `compact` | Reduced padding |

Hover state managed locally (`useState(hovered)`).
Hover reveals a comment button (messageSquare icon with count) that opens EntryDetail.

Accepts optional `onSetActionDate` prop. When provided and the entry has a non-today `actionDate`, renders a "→ Today" button next to the date chip that dispatches `UPDATE_ENTRY` with `actionDate` set to today's date.

#### `JournalInput.tsx`
No props — reads `dispatch` from context.
- Calls `parseEntry()` on every keystroke
- Auto-grows textarea height via `el.style.height`
- Leading `-` stripped from text and sets `markTask = true` (task toggle)
- Submit: `Cmd/Ctrl+Enter` or button
- Creates entry with `id: Date.now()`, `timestamp: new Date().toISOString()`
- Dispatches `ADD_ENTRY`

#### `TodayTimeline.tsx`
Props: `entries`, `onClick`, `activeTimers?`, `onTimerToggle?`

Groups entries by hour. Renders a vertical line with dot markers and entry cards per hour. Sorted ascending within each hour.

#### `EntryDetail.tsx`
No props — reads `state.selectedEntry` from context.

Edit mode toggle changes:
- Text → editable `<textarea>`
- Folder → text `<input>` (accepts any string path)
- ActionDate → `<input type="date">`

Save dispatches `UPDATE_ENTRY`. Back button dispatches `SELECT_ENTRY(null)`.

PGH Mapping section: shows the linked Project/Goal/Habit with a dropdown to change or unmap; if unmapped, shows inline select dropdowns for each entity type. "Create one" link navigates to PGH view if no entities exist.

Comments section at bottom: comment input form at the top of the section, followed by the comment list. Comments are sorted with the pinned comment first (if any), then newest-first. Each comment has a pin button (toggle, only one pinned at a time) and an edit button (within 4 hours). Ctrl+Enter to submit, Enter for newline. Edit uses textarea instead of input. Comment text preserves newlines via `white-space: pre-wrap`. Comments dispatch `ADD_COMMENT` / `EDIT_COMMENT` / `PIN_COMMENT`.

---

### components/layout/

#### `Sidebar.tsx`
No props. Reads `state.view`, `state.entries`, `state.sidebarCollapsed`.

- Width: `220px` expanded → `52px` collapsed (CSS transition)
- Inbox badge = `entries.filter(e => !e.folder).length`
- Overdue badge = `entries.filter(e => isOverdue(e)).length`
- Folder list = root folder names only (first segment of all folder paths)
- PGH nav item added after Tasks, using `barChart` icon
- Settings at bottom always visible

#### `NavItem.tsx`
Props: `item`, `active`, `onClick`, `collapsed`, `overdueCount?`

- Active: white bg + accent icon + shadow
- Collapsed: shows only icon + optional red dot if overdueCount > 0
- Badge: red if `overdueCount > 0`, gray otherwise

#### `FolderTreeNode.tsx`
Props: `node`, `entries`, `depth?`

Recursive component. Auto-expands if `depth < 2`.

Hover reveals:
- Move button → opens `MoveFolderModal`
- Inflow/outflow totals hidden on hover (replaced by Move button)

Navigation: click folder name → `dispatch(SET_VIEW, 'folder:' + node.path)`

---

### components/modals/

#### `RecurringTagPicker.tsx`
No props. Reads `state.pendingRecurring`.

Renders a modal when entries with multiple period tags (`#daily`, `#weekdays`, `#weekend`, `#weekly`, `#monthly`, `#quarterly`) are detected among recurring tasks with past action dates. Each entry shows a `<select>` to pick one tag. Confirm dispatches `RESOLVE_RECURRING` for each, which removes the other period tags and advances the action date by the selected period.

#### `AddFolderModal.tsx`
No props. Reads `state.addFolderEntry`.

Closes when: backdrop clicked, Cancel, or confirm.
Dispatches `UPDATE_ENTRY` with new folder + `SET_ADD_FOLDER_ENTRY(null)`.

To open: `dispatch({ type: 'SET_ADD_FOLDER_ENTRY', payload: entry })`

#### `MoveFolderModal.tsx`
Props: `node`, `entries`, `onClose`

Computes new folder path: `selected ? "${selected}/${leafName}" : leafName`
Dispatches `MOVE_FOLDER` — renames all entries whose folder path starts with `node.path`.

#### `FloatingTimer.tsx`
No props. Reads `state.activeTimers` and `state.entries`.

Returns `null` if `activeTimers.length === 0`. Fixed full-width bar at top of content area. Renders each active timer as a horizontal card with elapsed time, description input per segment, pause/resume per timer, and log/stop buttons. Auto-stops after 2 hours with a long beep (1.2s 880Hz). Updates elapsed every 200ms via `setInterval` in `useEffect`.

---

### components/views/

#### `HomeView.tsx`
Sections (in order):
1. Date header + "What's happening?" title
2. `<JournalInput />` (centered, max-width 680px)
3. Today summary pills (entities/folders/tags used today)
4. **Quick nav** — centered pill buttons for "Action Today" (amber), "Needs Action" (red), and "Reminders" (accent), shown only when items exist; smooth-scroll to the respective section via `ref`
5. **Today timeline** — `<TodayTimeline>` (entries where `isToday(timestamp)`, max 6) with a toggle switch (accent/gray pill) to show/hide history changes
6. **Action today** — grid of minimal `<EntryCard>`s where `actionDate === today && !isToday(timestamp)`, amber panel
7. **Needs action** — horizontal scroll of overdue minimal cards, red panel
8. **Reminders** — standalone reminders section (bg2 background, border border). Shows non-done reminders grouped by Today / Older / Future. Each reminder row has an unchecked square icon (toggles done on click), the reminder title text, and for Older/Future the date in `Mon DD` format. A "+ Add" button in the header toggles an inline form (text input + date picker + Save button). Completed reminders disappear from the section. The quick-nav Reminders button shows count of overdue (past-date) reminders only.

#### `InboxView.tsx`
Sections (in order):
1. Header with overdue badge
2. **Needs action** — horizontal scroll (overdue entries)
3. **Upcoming** — entries with `folder && actionDate && !isOverdue`
4. **Unorganized** — entries with `!folder && !isOverdue`, each with inline "+ Folder" button

"+ Folder" button: `dispatch(SET_ADD_FOLDER_ENTRY, entry)`

#### `SearchView.tsx`
State: `filtersOpen` (local); all filter state lives in the global `state.searchFilters` (`SearchFilters`) and persists to `localStorage` under `jp_searchFilters`.

Filter logic: AND combination across filter types. Text search checks `entry.text` and `entry.entity` (case-insensitive). Entity/Folder use OR (entry matches any selected). **Tag filter uses scored sorting**: entries matching all selected tags appear first, then those matching a subset (scored by match count), then those matching at least 1. Date range checks `entry.timestamp.slice(0, 10)`. A "Tasks" toggle switch filters to entries where `isTask === true && isTaskDone === false`.

Search filters are stored in global `state.searchFilters` (persisted to `jp_searchFilters`). They are reset to `DEFAULT_SEARCH_FILTERS` whenever `SET_VIEW` is dispatched (sidebar/folder navigation). They survive EntryDetail open/close because EntryDetail overlays rather than replacing the view.

Filter UI uses `<SearchableSelect multi>` for Entity, Folder, Tag — each with searchable dropdown and checkboxes. Filter chips appear as `<Chip>` with `onRemove` when filter panel is closed (one chip per selected value). A pill toggle between the search input and Filters button toggles `tasksOnly`.

#### `CalendarView.tsx`
State: `weekOffset` (0 = current week)

Week = Monday to Sunday. Entries appear in a day cell if `timestamp` OR `actionDate` falls on that day. Each entry card truncated to 40 chars, shows amount chip and `● action` / `● overdue` indicators.

#### `FoldersView.tsx`
Renders `buildFolderTree(entries)` as a list of `<FolderTreeNode depth=0>`.

#### `FolderDetailView.tsx`
Props: `folderName: string`

Shows all entries where `folderMatches(entry.folder, folderName)` — includes sub-folder entries. Groups entries by date (descending) and renders each day as an hourly `TodayTimeline` with history items. Includes a Tasks toggle switch (filters to `isTask && !isTaskDone`) and a tag filter bar with typeahead suggestions and removable pill chips. Shows inflow/outflow totals and entry count for the folder.

Uses **local state** for Tasks/Changes/Time toggles and tag filters. Re-mounted with a `key={view}` from App.tsx so local state resets on folder navigation. Filters survive EntryDetail open/close because EntryDetail overlaps via CSS `position: absolute` instead of replacing the view.

#### `ParallelView.tsx`
State: `weekOffset` (0 = current week)

Week = Monday to Sunday. 24-hour rows in a 7-column grid. For each entry with `timeLogs` within the week, renders a color-coded block spanning the tracked hours/minutes. Block color is deterministic per entry (hash of entry.id). Clicking a block dispatches `SELECT_ENTRY` to open the entry detail overlay.

Overlapping blocks within the same day are laid out side-by-side using a greedy column-assignment algorithm (`assignColumns`): blocks sorted by start time are placed in the first free column, creating equally-sized columns per overlapping group. The `blockPositions` memoized map stores `{ col, totalCols }` per block key (`entryId-startedAt`) for use during rendering.

Week navigation: left/right chevron buttons and "Today" button (resets to offset 0).

#### `PGHView.tsx`
Dashboard for managing Projects, Goals, and Habits. Three-tab interface (Projects / Goals / Habits) with inline create/edit/delete modals for each entity type.

- **Projects**: statuses (idea, plan, active, on-hold, done, archived), title, description, start/end dates
- **Goals**: statuses (plan, in-progress, off-track, delayed, re-plan, achieved, archived), with optional S.M.A.R.T. toggle revealing Specific, Measurable, Achievable, Relevant, Time-bound text fields.
- **Habits**: statuses (schedule, started, small-misses, missing-but-consistent, frequent-misses, irregular, cultivated, archived), with a 7-day tracker grid for daily completion marking and analysis parameters (duration, specific timing, money, frequency).
- Each card shows mapped task count. Deletion unmaps all associated entries. Archived entities shown in a separate collapsed section.

#### `SettingsView.tsx`
Tabbed interface showing all entities, tags, and folders derived from entries — each with usage count, inline rename, and add-new capability.

Includes a **Data** section below the tabs with a currency selector and three data actions:
- **Currency** — `<select>` dropdown dispatching `SET_CURRENCY` with one of `$ € £ ₹ ¥ ₽ ₩`.
- **Backup** — Downloads all localStorage data (`jp_entries`, `jp_view`, `jp_activeTimers`) as a dated JSON file via `<a>` click + `URL.createObjectURL`.
- **Restore** — Hidden `<input type="file">` reads a JSON backup file, writes to localStorage, then reloads the page.
- **Reset** — Double `window.confirm`, then clears all `jp_*` localStorage keys and reloads to seed data.

A `statusMsg` state variable shows transient feedback (auto-clears after 3s).

---

## 9. Key Flows

### Adding an entry

```
User types in JournalInput
  → parseEntry() called on each keystroke
  → Chips update below textarea
User presses Cmd+Enter (or clicks button)
  → dispatch ADD_ENTRY with id=Date.now(), timestamp=now
  → Entry prepended to state.entries
  → localStorage updated
  → Entry appears immediately in HomeView timeline
```

### Opening an entry

```
User clicks EntryCard
  → dispatch SELECT_ENTRY(entry)
  → App.tsx overlays <EntryDetail> on top of current view (position: absolute, inset: 0)
  → Current view stays mounted, preserving all local state + scroll position
User clicks Back
  → dispatch SELECT_ENTRY(null)
  → EntryDetail overlay removed; previous view visible with state intact
```

### Moving a folder

```
User hovers FolderTreeNode → "Move" button appears
User clicks → MoveFolderModal renders
User selects destination → clicks "Move here"
  → dispatch MOVE_FOLDER({ oldPath, newPath })
  → Reducer renames all entries' folder paths:
      entry.folder === oldPath → newPath
      entry.folder.startsWith(oldPath + '/') → prefix replaced
```

### Timer (parallel)

```
User clicks timer button on EntryCard / EntryDetail
  → If any active timer for this entry already: do nothing (early return)
  → Otherwise: dispatch SET_TIMER({ entryId, segments: [{ startedAt: Date.now(), description: '' }] })
  → Timer appended to activeTimers array
  → FloatingTimer appears (fixed top bar), shows all timers as horizontal cards
  → setInterval updates elapsed every 200ms

User clicks Stop on FloatingTimer card
  → dispatch LOG_TIME with duration + description for that entry
  → Timer removed from activeTimers array

Timer button behavior:
  - Entry has timeLogs + no active timer: shows fmtDuration(total) in accent-colored button
  - Entry has active timer running: shows pause icon + "Running" in red
  - Entry has no timeLogs + no active timer: shows stopwatch icon
  - Clicking any of these triggers handleTimerToggle (starts new timer without stopping others)

Timer auto-stop:
  - Each timer checked every 200ms in FloatingTimer
  - If any timer elapsed >= 2 hours (7,200,000 ms), dispatches LOG_TIME and removes it
  - Plays a long 880Hz beep tone (1.2s) via Web Audio API before stopping
  - Uses a ref to prevent multiple beeps/stops, and descRef for latest description text
```

### Completing / undoing a task

```
User clicks checkbox on a task entry (or toggles Task switch in EntryDetail)
  → dispatch TOGGLE_TASK_DONE(entry.id)
  → Reducer checks: if completing → sets completedAt: new Date().toISOString()
  → If undoing on a different day → state.toast = message, state unchanged
    → Toast component shows message for 3s
  → If undoing same day → sets completedAt: null
```

### Navigation

```
Sidebar NavItem click → dispatch SET_VIEW('inbox')
Folder in sidebar    → dispatch SET_VIEW('folder:Clients/Acme Corp')
FolderTreeNode click → dispatch SET_VIEW('folder:' + node.path)
```

Sidebar navigation (`SET_VIEW`) also resets `searchFilters` to `DEFAULT_SEARCH_FILTERS` and unmounts the current view (resetting its local filter state). Entry overlay (`SELECT_ENTRY`) does NOT trigger SET_VIEW, so filters survive entry detail navigation.

---

## 10. Common Patterns

### Reading global state

```ts
const { state, dispatch } = useAppState()
const { entries, activeTimers } = state
```

### Filtering entries for a view

```ts
// Overdue entries
const overdue = entries.filter(e => isOverdue(e))

// Today's entries
const todayEntries = entries.filter(e => isToday(e.timestamp))

// Entries in a folder (including subfolders)
const folderEntries = entries.filter(e => folderMatches(e.folder, 'Clients/Acme'))
```

### Timer toggle handler (standard pattern used in all views)

```ts
const handleTimerToggle = (entry: Entry) => {
  if (activeTimers.some((t) => t.entryId === entry.id)) return
  dispatch({ type: 'SET_TIMER', payload: { entryId: entry.id, segments: [{ startedAt: Date.now(), description: '' }] } })
}
```

### Opening AddFolderModal

```ts
dispatch({ type: 'SET_ADD_FOLDER_ENTRY', payload: entry })
```

### Dynamic depth indentation (must use inline style, not Tailwind)

```tsx
style={{ paddingLeft: `${depth * 12 + 12}px` }}
```

### Using CSS color variables in inline styles

```tsx
style={{ color: 'var(--color-accent)', background: 'var(--color-accent-light)' }}
```

---

## 11. localStorage Keys

| Key | Type | Contents |
|---|---|---|
| `jp_lastReload` | `string` (numeric) | `Date.now()` timestamp of last reload; checked on mount, sets `reloadPending` if 12+ hours have elapsed; actual reload waits for recurring-task resolution |
| `jp_entries` | `Entry[]` JSON | All journal entries |
| `jp_view` | `string` | Last active view name |
| `jp_activeTimers` | `TimerState[]` JSON | Active parallel timers (persists across refresh) |
| `jp_currency` | `string` | Selected currency symbol (`$`, `€`, `£`, etc.) |
| `jp_searchFilters` | `SearchFilters` JSON | Search view filter state (query, entity/folder/tag selections, date range, tasksOnly toggle) |
| `jp_projects` | `Project[]` JSON | All projects |
| `jp_goals` | `Goal[]` JSON | All goals |
| `jp_habits` | `Habit[]` JSON | All habits |
| `jp_reminders` | `Reminder[]` JSON | All reminders |

Written by `AppContext.tsx` via `useEffect`. Read once on mount via hydration guard (`useRef`). On first visit (empty localStorage), `SEED_ENTRIES` from `src/lib/seedData.ts` is used.
