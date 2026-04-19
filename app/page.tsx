'use client'

import { AppProvider } from '@/context/AppContext'
import App from '@/App'

export default function Page() {
  return (
    <AppProvider>
      <App />
    </AppProvider>
  )
}
