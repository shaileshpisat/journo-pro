'use client'

import { useEffect, useRef } from 'react'
import { useAppState } from '@/context/AppContext'
import Sidebar from '@/components/layout/Sidebar'
import HomeView from '@/components/views/HomeView'
import InboxView from '@/components/views/InboxView'
import SearchView from '@/components/views/SearchView'
import TasksView from '@/components/views/TasksView'
import CalendarView from '@/components/views/CalendarView'
import FoldersView from '@/components/views/FoldersView'
import FolderDetailView from '@/components/views/FolderDetailView'
import SettingsView from '@/components/views/SettingsView'
import ArchivesView from '@/components/views/ArchivesView'
import EntitiesView from '@/components/views/EntitiesView'
import TransactionsView from '@/components/views/TransactionsView'
import EntryDetail from '@/components/entry/EntryDetail'
import FloatingTimer from '@/components/FloatingTimer'
import ScrollToTop from '@/components/ScrollToTop'
import AddFolderModal from '@/components/modals/AddFolderModal'
import Toast from '@/components/ui/Toast'
import ParallelView from '@/components/views/ParallelView'

export default function App() {
  const { state } = useAppState()
  const { view, selectedEntry, activeTimers, addFolderEntry } = state
  const mainRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (selectedEntry) {
      mainRef.current?.scrollTo({ top: 0 })
    }
  }, [selectedEntry?.id])

  const renderView = () => {
    if (view === 'home') return <HomeView />
    if (view === 'inbox') return <InboxView />
    if (view === 'search') return <SearchView />
    if (view === 'tasks') return <TasksView />
    if (view === 'calendar') return <CalendarView />
    if (view === 'folders') return <FoldersView />
    if (view === 'settings') return <SettingsView />
    if (view === 'archive') return <ArchivesView />
    if (view === 'entities') return <EntitiesView />
    if (view === 'transactions') return <TransactionsView />
    if (view === 'parallel') return <ParallelView />
    if (view.startsWith('folder:')) return <FolderDetailView key={view} folderName={view.slice(7)} />
    return <HomeView />
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {activeTimers.length > 0 && <FloatingTimer />}
        <main ref={mainRef} style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
          {renderView()}
          {selectedEntry && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 50, overflow: 'auto', background: 'var(--color-bg)' }}>
              <EntryDetail />
            </div>
          )}
        </main>
      </div>
      <Toast />
      <ScrollToTop />
      {addFolderEntry && <AddFolderModal />}
    </div>
  )
}
