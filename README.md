# JournoPro

A fast, local-first productivity journal. Capture notes, track entities, organize by folder, and schedule action dates — all stored in your browser with no account required.

## Features

- **Natural language entry parsing** — type `@Nike #meeting +$500 tomorrow /Projects/Alpha` and fields populate automatically as chips
- **Hourly timeline** — today's entries displayed in a Google Calendar-style schedule view
- **Folder organization** — hierarchical slash-delimited paths (`Clients/Acme Corp`) with nested tree navigation and Move support
- **Inbox** — zero-inbox workflow: overdue (horizontal scroll), upcoming, and unorganized sections
- **Calendar view** — weekly grid with color-coded entries and action date indicators
- **Full-text search** — live search with filters for entity, folder, tag, and date range
- **Entry timer** — track time spent on any entry; floating bar shows elapsed time
- **Financial tracking** — inflow/outflow amounts with green/red color coding
- **100% local** — all data lives in `localStorage`; nothing leaves your browser

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org/) — App Router |
| UI | [React 19](https://react.dev/) — client components, `useReducer` |
| Language | [TypeScript 5](https://www.typescriptlang.org/) — strict mode |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) — `@theme` design tokens |
| Persistence | `localStorage` — no backend |

## Getting Started

### Prerequisites

- Node.js 18.17+
- npm 9+

### Install

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Production build

```bash
npm run build
npm start
```

## Data

All data is stored in `localStorage` under two keys:

| Key | Contents |
|-----|----------|
| `jp_entries` | `Entry[]` JSON array |
| `jp_view` | Last active view name |

On first load, seed entries are used to demonstrate the UI. Subsequent loads restore your saved data.

## Entry Syntax

When typing an entry, special tokens are parsed live:

| Token | Field | Example |
|-------|-------|---------|
| `@Name` | Entity | `@Reuters` |
| `#tag` | Tags | `#interview #urgent` |
| `$amount` + keyword | Amount + type | `received $2500` |
| `/Folder/Sub` | Folder | `/Beats/Tech` |
| `tomorrow` / `next week` | Action date | `next Friday` |

Press **⌘↵** (or **Ctrl+↵**) to submit an entry.

## Project Structure

```
src/
  app/             # Next.js App Router (layout, page, globals.css)
  lib/             # types, parser, formatters, predicates, folderUtils, seedData
  hooks/           # useLocalStorage
  context/         # AppContext (useReducer + localStorage sync)
  components/
    ui/            # Icon, Chip, FolderChip, SectionHead, FieldBlock
    entry/         # EntryCard, JournalInput, TodayTimeline, EntryDetail
    layout/        # Sidebar, NavItem, FolderTreeNode
    views/         # HomeView, InboxView, SearchView, CalendarView, FoldersView, FolderDetailView, SettingsView
    modals/        # AddFolderModal, MoveFolderModal
    FloatingTimer.tsx
  App.tsx          # Root view router shell
```
