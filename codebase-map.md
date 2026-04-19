# JournoPro — Codebase Map

> Reference document for feature development and bug fixes.
> Last updated: 2026-04-19

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
│              └─ <ActiveView>   ← one of 7 views     │
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
│   ├── FloatingTimer.tsx     # Fixed bottom timer bar
│   └── views/
│       ├── HomeView.tsx
│       ├── InboxView.tsx
│       ├── SearchView.tsx
│       ├── CalendarView.tsx
│       ├── FoldersView.tsx
│       ├── FolderDetailView.tsx
│       └── SettingsView.tsx
└── App.tsx                   # View router shell
```

---

## 4. Data Model

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
  entity: string | null // Parsed from @entity
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

### `TimerState` — active timer

```ts
interface TimerState {
  entryId: number
  startedAt: number  // Date.now()
  baseElapsed: number
}
```

### `ViewName` — all valid views

```ts
type ViewName =
  | 'home' | 'inbox' | 'search' | 'calendar'
  | 'folders' | 'settings'
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
  activeTimer: TimerState | null
  addFolderEntry: Entry | null  // Opens AddFolderModal
}
```

### Actions

| Action type | Payload | Effect |
|---|---|---|
| `ADD_ENTRY` | `Entry` | Prepend to entries array |
| `UPDATE_ENTRY` | `Entry` | Replace by id; updates selectedEntry if open |
| `DELETE_ENTRY` | `number` (id) | Remove from entries; clear selectedEntry |
| `SET_ENTRIES` | `Entry[]` | Replace full array (used for hydration) |
| `SET_VIEW` | `ViewName` | Change active view; clears selectedEntry |
| `SELECT_ENTRY` | `Entry \| null` | Open/close EntryDetail overlay |
| `TOGGLE_SIDEBAR` | — | Toggle sidebarCollapsed |
| `SET_TIMER` | `TimerState \| null` | Start/stop timer |
| `SET_ADD_FOLDER_ENTRY` | `Entry \| null` | Open/close AddFolderModal |
| `MOVE_FOLDER` | `{ oldPath, newPath }` | Rename folder path on all matching entries |

### localStorage sync

- On **mount**: reads `jp_entries` and `jp_view` once via `useEffect` + `useRef` guard.
- On **state change**: `useEffect` watching `state.entries` → saves to `jp_entries`; same for `state.view`.
- **Seed data**: If localStorage is empty, `SEED_ENTRIES` is used as initial state.

### Consuming state in components

```ts
import { useAppState } from '@/context/AppContext'

const { state, dispatch } = useAppState()
```

---

## 6. Routing / View System

There is **no Next.js router involvement** in navigation. The active view is stored in `AppState.view`. `App.tsx` renders the matching view component:

```ts
if (selectedEntry)        → <EntryDetail />   // always takes priority
if (view === 'home')      → <HomeView />
if (view === 'inbox')     → <InboxView />
if (view === 'search')    → <SearchView />
if (view === 'calendar')  → <CalendarView />
if (view === 'folders')   → <FoldersView />
if (view === 'settings')  → <SettingsView />
if (view.startsWith('folder:')) → <FolderDetailView folderName={view.slice(7)} />
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
- Custom animation: `.animate-pulse-dot` defined in globals.css (used by FloatingTimer's red dot).

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
- `AmountType`, `ViewName`, `Entry`, `FolderNode`, `TimerState`, `AppState`, `Action`

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
fmtAmt(amount, type): { label, color } | null  // "+$4,500" in green or "−$312" in red
```
Colors returned by `fmtAmt` are CSS variable strings (e.g., `'var(--color-green)'`).

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

#### `src/hooks/useLocalStorage.ts`
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
Available icon names: `home`, `inbox`, `folder`, `calendar`, `search`, `chevronLeft`, `chevronRight`, `chevronDown`, `x`, `plus`, `tag`, `entity`, `amount`, `clock`, `alert`, `edit`, `arrowLeft`, `settings`, `trash`, `check`, `stopwatch`, `pause`, `play`

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

#### `SectionHead.tsx`
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

#### `JournalInput.tsx`
No props — reads `dispatch` from context.
- Calls `parseEntry()` on every keystroke
- Auto-grows textarea height via `el.style.height`
- Submit: `Cmd/Ctrl+Enter` or button
- Creates entry with `id: Date.now()`, `timestamp: new Date().toISOString()`
- Dispatches `ADD_ENTRY`

#### `TodayTimeline.tsx`
Props: `entries`, `onClick`, `activeTimer?`, `onTimerToggle?`

Groups entries by hour. Renders a vertical line with dot markers and entry cards per hour. Sorted ascending within each hour.

#### `EntryDetail.tsx`
No props — reads `state.selectedEntry` from context.

Edit mode toggle changes:
- Text → editable `<textarea>`
- Folder → text `<input>` (accepts any string path)
- ActionDate → `<input type="date">`

Save dispatches `UPDATE_ENTRY`. Back button dispatches `SELECT_ENTRY(null)`.

---

### components/layout/

#### `Sidebar.tsx`
No props. Reads `state.view`, `state.entries`, `state.sidebarCollapsed`.

- Width: `220px` expanded → `52px` collapsed (CSS transition)
- Inbox badge = `entries.filter(e => !e.folder).length`
- Overdue badge = `entries.filter(e => isOverdue(e)).length`
- Folder list = root folder names only (first segment of all folder paths)
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
No props. Reads `state.activeTimer` and `state.entries`.

Returns `null` if no active timer. Updates elapsed every 200ms via `setInterval` in `useEffect`. Stop button dispatches `SET_TIMER(null)`.

---

### components/views/

#### `HomeView.tsx`
Sections (in order):
1. Date header + "What's happening?" title
2. `<JournalInput />` (centered, max-width 680px)
3. Today summary pills (entities/folders/tags used today)
4. **Added today** — `<TodayTimeline>` (entries where `isToday(timestamp)`, max 6)
5. **Action today** — grid of minimal `<EntryCard>`s where `actionDate === today && !isToday(timestamp)`, amber panel
6. **Needs action** — horizontal scroll of overdue minimal cards, red panel

#### `InboxView.tsx`
Sections (in order):
1. Header with overdue badge
2. **Needs action** — horizontal scroll (overdue entries)
3. **Upcoming** — entries with `folder && actionDate && !isOverdue`
4. **Unorganized** — entries with `!folder && !isOverdue`, each with inline "+ Folder" button

"+ Folder" button: `dispatch(SET_ADD_FOLDER_ENTRY, entry)`

#### `SearchView.tsx`
State: `query`, `filterEntity`, `filterFolder`, `filterTag`, `filterFrom`, `filterTo`, `filtersOpen`

Filter logic: AND combination. Text search checks `entry.text` and `entry.entity` (case-insensitive). Date range checks `entry.timestamp.slice(0, 10)`.

Filter chips appear as `<Chip>` with `onRemove` when filter panel is closed.

#### `CalendarView.tsx`
State: `weekOffset` (0 = current week)

Week = Monday to Sunday. Entries appear in a day cell if `timestamp` OR `actionDate` falls on that day. Each entry card truncated to 40 chars, shows amount chip and `● action` / `● overdue` indicators.

#### `FoldersView.tsx`
Renders `buildFolderTree(entries)` as a list of `<FolderTreeNode depth=0>`.

#### `FolderDetailView.tsx`
Props: `folderName: string`

Shows all entries where `folderMatches(entry.folder, folderName)` — includes sub-folder entries. Shows inflow/outflow totals for the folder.

#### `SettingsView.tsx`
Read-only view of all entities, tags, and folders derived from entries. Tabbed interface. Each item shows usage count. (Edit/delete not wired — state vars present for future expansion.)

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
  → App.tsx renders <EntryDetail> instead of active view
User clicks Back
  → dispatch SELECT_ENTRY(null)
  → Previous view resumes
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

### Timer

```
User clicks stopwatch on EntryCard / EntryDetail
  → dispatch SET_TIMER({ entryId, startedAt: Date.now(), baseElapsed: 0 })
  → FloatingTimer appears (fixed bottom center)
  → setInterval updates elapsed every 200ms
User clicks Stop
  → dispatch SET_TIMER(null)
  → FloatingTimer disappears
```

### Navigation

```
Sidebar NavItem click → dispatch SET_VIEW('inbox')
Folder in sidebar    → dispatch SET_VIEW('folder:Clients/Acme Corp')
FolderTreeNode click → dispatch SET_VIEW('folder:' + node.path)
```

---

## 10. Common Patterns

### Reading global state

```ts
const { state, dispatch } = useAppState()
const { entries, activeTimer } = state
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
  if (activeTimer?.entryId === entry.id) {
    dispatch({ type: 'SET_TIMER', payload: null })
  } else {
    dispatch({ type: 'SET_TIMER', payload: { entryId: entry.id, startedAt: Date.now(), baseElapsed: 0 } })
  }
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
| `jp_entries` | `Entry[]` JSON | All journal entries |
| `jp_view` | `string` | Last active view name |

Both are written by `AppContext.tsx` via `useEffect`. Read once on mount via the hydration guard (`useRef`). On first visit (empty localStorage), `SEED_ENTRIES` from `src/lib/seedData.ts` is used.
