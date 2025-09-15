import { useState, useEffect } from 'react'
import { TaskList } from '../components/TaskList'
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

  return (
    <div className="new-tab">
      {/* Header with time and date */}
      <header className="new-tab-header">
        <div className="time-section">
          <h1 className="current-time">{time}</h1>
          <p className="current-date">{date}</p>
        </div>
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
            Task Manager Chrome Extension - Stay organized and productive
          </p>
        </footer>
      )}
    </div>
  )
}

export default NewTab
