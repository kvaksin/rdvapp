import React, { createContext, useState, useContext } from 'react'
import { IntlProvider } from 'react-intl'
import fr from './translations/fr'
import nl from './translations/nl'
import en from './translations/en'

type Locale = 'fr' | 'nl' | 'en'

interface Language {
  code: Locale
  nativeName: string
  flag: string
  direction: 'ltr' | 'rtl'
}

const languages: Language[] = [
  { code: 'fr', nativeName: 'Français', flag: '🇫🇷', direction: 'ltr' },
  { code: 'nl', nativeName: 'Nederlands', flag: '🇳🇱', direction: 'ltr' },
  { code: 'en', nativeName: 'English', flag: '🇬🇧', direction: 'ltr' }
]

interface LanguageContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  languages: Language[]
  currentLanguage: Language
}

const translations = { fr, nl, en }

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const LANGUAGE_KEY = 'rdvapp_language'

function getSavedLanguage(): Locale {
  if (typeof window === 'undefined') return 'fr'
  return (localStorage.getItem(LANGUAGE_KEY) as Locale) || 'fr'
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getSavedLanguage())

  const setLocale = (newLocale: Locale) => {
    localStorage.setItem(LANGUAGE_KEY, newLocale)
    setLocaleState(newLocale)
  }

  const messages = translations[locale]

  const currentLanguage = languages.find(lang => lang.code === locale) || languages[0]

  return (
    <LanguageContext.Provider value={{ locale, setLocale, languages, currentLanguage }}>
      <IntlProvider messages={messages} locale={locale} defaultLocale="fr">
        {children}
      </IntlProvider>
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

export function LanguageSelector() {
  const { currentLanguage, languages, setLocale } = useLanguage()
  const [isOpen, setIsOpen] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsOpen(false)
      return
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!isOpen) {
        setIsOpen(true)
        return
      }

      const currentIndex = languages.findIndex(lang => lang.code === currentLanguage.code)
      const nextIndex = event.key === 'ArrowDown'
        ? (currentIndex + 1) % languages.length
        : (currentIndex - 1 + languages.length) % languages.length
      setLocale(languages[nextIndex].code)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-3 py-2 rounded-md text-sm transition-colors w-full md:w-auto justify-between md:justify-start"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2">
          <span>{currentLanguage.flag}</span>
          <span className="hidden md:inline">{currentLanguage.nativeName}</span>
        </div>
        <span className="text-gray-400">
          {isOpen ? '▲' : '▼'}
        </span>
      </button>

      {isOpen && (
        <div 
          className="absolute right-0 left-0 md:left-auto mt-2 py-2 w-full md:w-48 bg-gray-800 rounded-md shadow-xl z-20"
          role="menu"
          aria-orientation="vertical"
        >
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => {
                setLocale(language.code)
                setIsOpen(false)
              }}
              className={`flex items-center gap-3 w-full px-4 py-3 md:py-2 text-base md:text-sm text-left transition-colors
                ${language.code === currentLanguage.code 
                  ? 'bg-gray-700 text-white' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
              role="menuitem"
            >
              <span>{language.flag}</span>
              <span>{language.nativeName}</span>
              {language.code === currentLanguage.code && (
                <span className="ml-auto text-blue-400">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}