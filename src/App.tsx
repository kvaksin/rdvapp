import { useState } from 'react'
import { FormattedMessage } from 'react-intl'
import LeftNav from './components/LeftNav'
import Feed from './components/Feed'
import RightPanel from './components/RightPanel'
import BookRdv from './pages/BookRdv'
import Admin from './pages/Admin'
import { LanguageProvider, LanguageSelector } from './i18n'

function AppContent() {
  const [view, setView] = useState('home')

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <header className="border-b border-gray-800 py-4 px-4 md:px-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center font-bold">RD</div>
            <h1 className="text-xl font-semibold">
              <FormattedMessage id="app.title" defaultMessage="rdvapp" />
            </h1>
          </div>
          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
            <nav className="flex flex-wrap items-center gap-2 md:gap-3">
              <button 
                onClick={() => setView('home')} 
                className={`px-3 py-2 rounded-md text-sm md:text-base w-full md:w-auto
                  ${view==='home' ? 'bg-gray-800' : 'bg-transparent hover:bg-gray-800/50'}`}
              >
                <FormattedMessage id="nav.home" defaultMessage="Home" />
              </button>
              <button 
                onClick={() => setView('book')} 
                className={`px-3 py-2 rounded-md text-sm md:text-base w-full md:w-auto
                  ${view==='book' ? 'bg-gray-800' : 'bg-transparent hover:bg-gray-800/50'}`}
              >
                <FormattedMessage id="nav.book" defaultMessage="Book RDV" />
              </button>
              <button 
                onClick={() => setView('admin')} 
                className={`px-3 py-2 rounded-md text-sm md:text-base w-full md:w-auto
                  ${view==='admin' ? 'bg-gray-800' : 'bg-transparent hover:bg-gray-800/50'}`}
              >
                <FormattedMessage id="nav.admin" defaultMessage="Admin" />
              </button>
            </nav>
            <LanguageSelector />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 md:px-6 py-6 md:py-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <aside className="hidden md:block md:col-span-3">
            <LeftNav />
          </aside>
          <main className="col-span-1 md:col-span-6">
            {view === 'home' && <Feed />}
            {view === 'book' && <BookRdv />}
            {view === 'admin' && <Admin />}
          </main>
          <aside className="hidden md:block md:col-span-3">
            <RightPanel />
          </aside>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  )
}
