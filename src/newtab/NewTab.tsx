import { useState, useEffect } from 'react'
import { TaskList } from '../components/TaskList'
import ThemeSelectorModal from '../components/ThemeSelectorModal'
import { useTheme } from '../hooks/useTheme'
import { useTasks } from '../hooks/useTasks'
import { useCurrentTask } from '../hooks/useCurrentTask'
import './NewTab.css'

interface CompletionModalData {
  taskName: string
  message: string
  type: 'success' | 'error' | 'info'
  timestamp: number
}

export const NewTab = () => {
  const { tasks } = useTasks()
  const { currentTask } = useCurrentTask(tasks)
  const { themes, preferences, setThemeId, theme, isThemeLoaded } = useTheme()
  
  // Log theme information when it changes
  useEffect(() => {
  }, [theme, preferences, isThemeLoaded])

  const getTime = () => {
    const date = new Date()
    const hour = String(date.getHours()).padStart(2, '0')
    const minute = String(date.getMinutes()).padStart(2, '0')
    return `${hour}:${minute}`
  }

  const getDate = () => {
    const date = new Date()
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(date)
  }

  const [time, setTime] = useState(getTime())
  const [date, setDate] = useState(getDate())
  const [completionModalData, setCompletionModalData] = useState<CompletionModalData | null>(null)
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false)
  const [isThemeOpen, setIsThemeOpen] = useState(false)
  const [localTheme, setLocalTheme] = useState<string>(preferences.themeId || 'dark')

  // Update local state when preferences change
  useEffect(() => {
    setLocalTheme(preferences.themeId || 'dark')
  }, [preferences])

  // Track localTheme state changes
  useEffect(() => {
  }, [localTheme])

  useEffect(() => {
    let intervalId = setInterval(() => {
      setTime(getTime())
      setDate(getDate())
    }, 1000)

    return () => {
      clearInterval(intervalId)
    }
  }, [])

  // Check for completion modal data from popup
  useEffect(() => {
    chrome.storage.local.get(['showCompletionModal'], (result) => {
      if (result.showCompletionModal) {
        setCompletionModalData(result.showCompletionModal)
        // Clear the data after reading it
        chrome.storage.local.remove(['showCompletionModal'])
      }
    })
  }, [])


  const applyThemeChanges = async () => {
    
    // Validate the theme ID before saving
    if (!localTheme || !Object.keys(themes).includes(localTheme)) {
      return
    }
    
    
    try {
      
      const themePromise = setThemeId(localTheme as any)
      const themeResult = await Promise.race([
        themePromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('setThemeId timeout')), 5000))
      ])
      
    } catch (error: any) {
    }
    
    setIsThemeOpen(false)
  }

  const backgroundStyle: React.CSSProperties = {
    background: theme.backgroundGradient || 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)'
  }

  return (
    <div className="new-tab" style={backgroundStyle}>
      {/* Header with time and date */}
      <header className="new-tab-header" style={{ position: 'relative' }}>
        <div className="time-section">
          <h1 className="current-time">{time}</h1>
          <p className="current-date">{date}</p>
        </div>
        <button
          onClick={() => {
            setLocalTheme(preferences.themeId)
            setIsThemeOpen(true)
          }}
          className="px-3 py-2 rounded-lg transition-all duration-200 hover:scale-105"
          style={{
            position: 'absolute',
            top: '2rem',
            right: '2rem',
            background: 'rgba(255,255,255,0.1)',
            color: 'var(--theme-text, #ffffff)',
            border: '1px solid var(--theme-border, rgba(255,255,255,0.2))',
            backdropFilter: 'blur(10px)'
          }}
          title="Customize Theme"
        >
          🎨 Customize Theme
        </button>
      </header>

      {/* Main content area */}
      <main className="new-tab-main">
        <TaskList 
          className="task-list-container" 
          initialCompletionModal={completionModalData}
          onCreateFormToggle={setIsCreateFormOpen}
        />
      </main>

      {/* Footer - Hide when create form is open */}
      {!isCreateFormOpen && (
        <footer className="new-tab-footer">
          <p className="footer-text">
            Look At Me (Chrome Extension) - Created by <a 
              href="https://www.linkedin.com/in/anish-budida-57994723a/" 
              target="_blank" 
              rel="noopener"
              style={{
                color: 'var(--theme-accent, #003057)',
                textDecoration: 'underline',
                fontWeight: '600'
              }}
            >Anish Budida</a>
          </p>
        </footer>
      )}

      {/* Theme selector modal rendered in a portal; TaskList stays primary */}
      <ThemeSelectorModal isOpen={isThemeOpen} onClose={() => setIsThemeOpen(false)}>
        <section className="mb-4">
          <h3 className="text-white font-semibold mb-3">Choose a theme</h3>
          <div className="grid grid-cols-2 gap-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            {Object.values(themes).map((t: any) => (
              <button
                key={t.id}
                onClick={() => {
                  const themeId = String(t.id)
                  setLocalTheme(themeId)
                }}
                className={`rounded-lg p-4 border transition-all duration-300 ${
                  localTheme === t.id ? 'border-blue-400 ring-2 ring-blue-400/30' : 'border-gray-600 hover:border-gray-500'
                }`}
                style={{
                  background: t.backgroundGradient || t.surface,
                  color: t.id === 'light' ? '#111827' : '#ffffff'
                }}
              >
                <div className="text-center">
                  <div className="font-medium text-sm">{t.name}</div>
                </div>
              </button>
            ))}
          </div>
        </section>


        <div className="flex justify-end gap-3 pt-2 border-t border-gray-700">
          <button
            className="px-4 py-2 rounded border border-gray-600 text-gray-200 hover:bg-gray-700/40"
            onClick={() => setIsThemeOpen(false)}
          >
            Cancel
          </button>
          <button className="px-4 py-2 rounded bg-blue-600 text-white hover:opacity-90" onClick={applyThemeChanges}>
            Apply
          </button>
        </div>
      </ThemeSelectorModal>
    </div>
  )
}

export default NewTab
