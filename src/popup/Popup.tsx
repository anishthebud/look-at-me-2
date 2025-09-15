import React, { useState, useEffect } from 'react'
import { Task, TaskState } from '../types'
import { useTasks } from '../hooks/useTasks'
import { useCurrentTask } from '../hooks/useCurrentTask'
import { useTheme } from '../hooks/useTheme'
import { useToast } from '../hooks/useToast'
import { Toast } from '../components/Toast'
import './Popup.css'

const hexToRgb = (hex: string): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result 
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : '59, 130, 246' // fallback
}

export const Popup = () => {
  const {
    tasks,
    currentPage,
    totalPages,
    isLoading,
    error,
    deleteTask,
    startTask,
    continueTask,
    completeTask,
    goToPage,
    refreshTasks
  } = useTasks()

  const { modal, removeModal, showSuccessModal, showErrorModal } = useToast()
  const { currentTask } = useCurrentTask(tasks)
  const { theme, preferences, isThemeLoaded } = useTheme() // initialize theme variables for popup

  const [actionError, setActionError] = useState<string | null>(null)

  // Load tasks on mount
  useEffect(() => {
    refreshTasks()
  }, [refreshTasks])

  // Log theme information for popup
  useEffect(() => {
  }, [theme, preferences, isThemeLoaded])


  const handleStartTask = async (taskId: string): Promise<void> => {
    setActionError(null)
    const result = await startTask(taskId)
    
    if (!result.success) {
      showErrorModal('Task', `failed to start: ${result.error}`)
      setActionError(result.error || 'Failed to start task')
    }
  }

  const handleContinueTask = async (taskId: string): Promise<void> => {
    setActionError(null)
    const result = await continueTask(taskId)
    
    if (!result.success) {
      showErrorModal('Task', `failed to continue: ${result.error}`)
      setActionError(result.error || 'Failed to continue task')
    }
  }

  const handleCompleteTask = async (taskId: string): Promise<void> => {
    setActionError(null)
    const task = tasks.find(t => t.id === taskId)
    const taskName = task?.name || 'Task'
    const result = await completeTask(taskId)
    
    if (result.success) {
      // Open New Tab page to show the completion modal
      chrome.tabs.create({ 
        url: chrome.runtime.getURL('newtab.html'),
        active: true
      })
      
      // Store completion info for the New Tab page to display
      chrome.storage.local.set({
        'showCompletionModal': {
          taskName: taskName,
          message: 'completed successfully! 🎉',
          type: 'success',
          timestamp: Date.now()
        }
      })
    } else {
      showErrorModal(taskName, `failed to complete: ${result.error}`)
      setActionError(result.error || 'Failed to complete task')
    }
  }

  const handleDeleteTask = async (taskId: string): Promise<void> => {
    setActionError(null)
    const result = await deleteTask(taskId)
    
    if (result.success) {
      showSuccessModal('Task', 'deleted successfully!')
    } else {
      showErrorModal('Task', `failed to delete: ${result.error}`)
      setActionError(result.error || 'Failed to delete task')
    }
  }

  const getStateText = (state: TaskState): string => {
    switch (state) {
      case TaskState.PENDING:
        return 'Pending'
      case TaskState.IN_PROGRESS:
        return 'In Progress'
      case TaskState.COMPLETED:
        return 'Completed'
      case TaskState.RECURRING:
        return 'Recurring'
      default:
        return 'Unknown'
    }
  }

  const getStateColor = (state: TaskState): string => {
    switch (state) {
      case TaskState.PENDING:
        return 'bg-gray-200 text-gray-700'
      case TaskState.IN_PROGRESS:
        return 'bg-blue-200 text-blue-700'
      case TaskState.COMPLETED:
        return 'bg-green-200 text-green-700'
      case TaskState.RECURRING:
        return 'bg-purple-200 text-purple-700'
      default:
        return 'bg-gray-200 text-gray-700'
    }
  }

  return (
    <main 
      className={`popup-container theme-${theme.id}`}
      style={{
        background: theme.backgroundGradient || theme.surface,
        color: theme.text
      }}
    >
      <div className="popup-header">
        <h3 style={{ color: theme.text }}>Look At Me</h3>
        <button
          onClick={() => chrome.tabs.create({ url: chrome.runtime.getURL('newtab.html') })}
          className="create-task-btn"
          style={{
            background: `rgba(${hexToRgb(theme.accent)}, 0.2)`,
            borderColor: `rgba(${hexToRgb(theme.accent)}, 0.3)`,
            color: theme.accent
          }}
        >
          Manage Tasks
        </button>
      </div>

      {actionError && (
        <div className="error-message">
          {actionError}
        </div>
      )}

      {isLoading && (
        <div className="loading" style={{ color: theme.textSecondary }}>Loading tasks...</div>
      )}

      {error && (
        <div className="error-message">{error}</div>
      )}

      {(() => {
        // Filter to show in-progress tasks first, then unstarted tasks if no in-progress
        const inProgressTasks = tasks.filter(task => task.state === TaskState.IN_PROGRESS)
        const unstartedTasks = tasks.filter(task => task.state === TaskState.PENDING)
        
        // Use in-progress tasks if available, otherwise use unstarted tasks
        const displayTasks = inProgressTasks.length > 0 ? inProgressTasks : unstartedTasks
        
        if (displayTasks.length === 0 && !isLoading) {
          return (
            <div className="no-tasks">
              <div className="no-tasks-icon">🚀</div>
              <p style={{ color: theme.textSecondary }}>No tasks available. Create a task to get started!</p>
            </div>
          )
        }
        
        return (
        <div className="tasks-container">
          {displayTasks
            .sort((a, b) => {
              // Put current task first
              if (currentTask) {
                if (a.id === currentTask.id) return -1
                if (b.id === currentTask.id) return 1
              }
              return 0
            })
            .slice(0, 5)
            .map((task) => {
              const isCurrentTask = currentTask && currentTask.id === task.id
              return (
            <div 
              key={task.id} 
              className={`task-card ${isCurrentTask ? 'current-task' : ''}`}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                borderColor: isCurrentTask ? theme.accent : 'rgba(255, 255, 255, 0.1)',
                color: theme.text
              }}
            >
              <div className="task-header">
                <h4 className="task-name" style={{ color: theme.text }}>{task.name}</h4>
                <span className={`task-state ${getStateColor(task.state)}`}>
                  {isCurrentTask ? 'Current Task' : getStateText(task.state)}
                </span>
              </div>
              
              {task.description && (
                <p 
                  className={`task-description ${isCurrentTask ? 'current-task-description' : ''}`}
                  style={{ color: theme.textSecondary }}
                >
                  {task.description}
                </p>
              )}
              
              <div className="task-actions">
                {task.state === TaskState.PENDING && (
                  <>
                    <button
                      onClick={() => handleStartTask(task.id)}
                      className="action-btn start-btn"
                      style={{
                        background: `rgba(${hexToRgb('#10b981')}, 1)`,
                        color: 'white'
                      }}
                    >
                      Start
                    </button>
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="action-btn delete-btn"
                      style={{
                        background: `rgba(${hexToRgb('#ef4444')}, 0.2)`,
                        borderColor: `rgba(${hexToRgb('#ef4444')}, 0.3)`,
                        color: '#fca5a5'
                      }}
                    >
                      Delete
                    </button>
                  </>
                )}
                
                {task.state === TaskState.IN_PROGRESS && (
                  <>
                    {!isCurrentTask && (
                      <button
                        onClick={() => handleContinueTask(task.id)}
                        className="action-btn continue-btn"
                        style={{
                          background: `rgba(${hexToRgb('#eab308')}, 1)`,
                          color: 'white'
                        }}
                      >
                        Continue
                      </button>
                    )}
                    <button
                      onClick={() => handleCompleteTask(task.id)}
                      className={`action-btn complete-btn ${isCurrentTask ? 'full-width' : ''}`}
                      style={{
                        background: `rgba(${hexToRgb('#16a34a')}, 1)`,
                        color: 'white'
                      }}
                    >
                      Complete
                    </button>
                  </>
                )}
                
                {task.state === TaskState.COMPLETED && (
                  <div className="completed-indicator">✅ Completed</div>
                )}
              </div>
            </div>
            )
            })}
            
            {displayTasks.length > 5 && (
              <div className="more-tasks">
                <p style={{ color: theme.textSecondary }}>+{displayTasks.length - 5} more {inProgressTasks.length > 0 ? 'tasks in progress' : 'unstarted tasks'}</p>
                <button
                  onClick={() => chrome.tabs.create({ url: chrome.runtime.getURL('newtab.html') })}
                  className="view-all-btn"
                  style={{
                    background: `rgba(${hexToRgb(theme.accent)}, 1)`,
                    color: 'white'
                  }}
                >
                  View All in New Tab
                </button>
              </div>
            )}
          </div>
        )
      })()}


      {/* Completion Modal */}
      {modal && (
        <Toast
          key={modal.id}
          message={modal.message}
          taskName={modal.taskName}
          type={modal.type}
          duration={modal.duration}
          onClose={removeModal}
        />
      )}
    </main>
  )
}

export default Popup
