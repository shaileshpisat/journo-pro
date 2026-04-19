'use client'

import { useAppState } from '@/context/AppContext'
import Sidebar from '@/components/layout/Sidebar'
import HomeView from '@/components/views/HomeView'
import InboxView from '@/components/views/InboxView'
import SearchView from '@/components/views/SearchView'
import CalendarView from '@/components/views/CalendarView'
import FoldersView from '@/components/views/FoldersView'
import FolderDetailView from '@/components/views/FolderDetailView'
import SettingsView from '@/components/views/SettingsView'
import EntryDetail from '@/components/entry/EntryDetail'
import FloatingTimer from '@/components/FloatingTimer'
import AddFolderModal from '@/components/modals/AddFolderModal'

export default function App() {
  const { state } = useAppState()
  const { view, selectedEntry, activeTimer, addFolderEntry } = state

  const renderView = () => {
    if (selectedEntry) return <EntryDetail />
    if (view === 'home') return <HomeView />
    if (view === 'inbox') return <InboxView />
    if (view === 'search') return <SearchView />
    if (view === 'calendar') return <CalendarView />
    if (view === 'folders') return <FoldersView />
    if (view === 'settings') return <SettingsView />
    if (view.startsWith('folder:')) return <FolderDetailView folderName={view.slice(7)} />
    return <HomeView />
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      <Sidebar />
      <main style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
        {renderView()}
      </main>
      {activeTimer && <FloatingTimer />}
      {addFolderEntry && <AddFolderModal />}
    </div>
  )
}
