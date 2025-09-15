import { useState, useEffect } from 'react'
import { Task } from '../types'
import { chromeTabGroups } from '../utils/chrome-apis'

export interface UseCurrentTaskReturn {
  currentTask: Task | null
  isLoading: boolean
  error: string | null
}

/**
 * Hook to detect the current task based on the active tab group
 */
export const useCurrentTask = (tasks: Task[]): UseCurrentTaskReturn => {
  const [currentTask, setCurrentTask] = useState<Task | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const detectCurrentTask = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Get the current tab group
        const currentGroup = await chromeTabGroups.getCurrentTabGroup()
        
        if (!currentGroup) {
          setCurrentTask(null)
          setIsLoading(false)
          return
        }

        // Find the task that matches the group title
        const matchingTask = tasks.find(task => task.name === currentGroup.title)
        
        if (matchingTask) {
          setCurrentTask(matchingTask)
        } else {
          setCurrentTask(null)
        }
        
        setIsLoading(false)
      } catch (err) {
        console.error('Error detecting current task:', err)
        setError(err instanceof Error ? err.message : 'Failed to detect current task')
        setCurrentTask(null)
        setIsLoading(false)
      }
    }

    detectCurrentTask()

    // Set up interval to check for tab group changes
    const interval = setInterval(detectCurrentTask, 2000) // Check every 2 seconds

    return () => clearInterval(interval)
  }, [tasks])

  return {
    currentTask,
    isLoading,
    error
  }
}
