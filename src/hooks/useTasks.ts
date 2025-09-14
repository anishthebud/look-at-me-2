import { useState, useEffect, useCallback } from 'react'
import { Task, TaskState, CreateTaskData, UpdateTaskData, TaskListState } from '../types'
import { taskStorage, chromeTabs, chromeTabGroups } from '../utils/chrome-apis'
import { MAX_TASKS_PER_DAY, VISIBLE_TASKS } from '../utils/constants'
import { validateTask } from '../utils/validation'

export interface UseTasksReturn {
  tasks: Task[]
  currentPage: number
  totalPages: number
  isLoading: boolean
  error: string | null
  createTask: (taskData: CreateTaskData) => Promise<{ success: boolean; error?: string }>
  updateTask: (taskId: string, updates: UpdateTaskData) => Promise<{ success: boolean; error?: string }>
  deleteTask: (taskId: string) => Promise<{ success: boolean; error?: string }>
  startTask: (taskId: string) => Promise<{ success: boolean; error?: string }>
  continueTask: (taskId: string) => Promise<{ success: boolean; error?: string }>
  completeTask: (taskId: string) => Promise<{ success: boolean; error?: string }>
  goToPage: (page: number) => void
  refreshTasks: () => Promise<void>
}

/**
 * Custom hook for managing tasks
 */
export const useTasks = (): UseTasksReturn => {
  const [state, setState] = useState<TaskListState>({
    tasks: [],
    currentPage: 1,
    totalPages: 1,
    isLoading: true,
    error: null
  })

  /**
   * Load tasks from storage
   */
  const loadTasks = useCallback(async (): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))
      
      const tasks = await taskStorage.getTasks()
      console.log('Loaded tasks from storage:', tasks) // Debug log
      
      // Filter out completed tasks for display (keep them for history)
      const visibleTasks = tasks.filter(task => task.state !== TaskState.COMPLETED)
      
      // Calculate pagination
      const totalPages = Math.max(1, Math.ceil(visibleTasks.length / VISIBLE_TASKS))
      const currentPage = Math.min(state.currentPage, totalPages)
      
      setState(prev => ({
        ...prev,
        tasks: visibleTasks,
        currentPage,
        totalPages,
        isLoading: false
      }))
    } catch (error) {
      console.error('Error loading tasks:', error)
      setState(prev => ({
        ...prev,
        error: 'Failed to load tasks',
        isLoading: false
      }))
    }
  }, [state.currentPage])

  /**
   * Create a new task
   */
  const createTask = useCallback(async (taskData: CreateTaskData): Promise<{ success: boolean; error?: string }> => {
    console.log('useTasks createTask called with:', taskData) // Debug log
    try {
      // Validate task data
      const validation = validateTask(taskData)
      console.log('Task validation result:', validation) // Debug log
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.errors.map(e => e.message).join(', ')
        }
      }

      // Check task limit
      const currentTasks = await taskStorage.getTasks()
      const pendingTasks = currentTasks.filter(task => task.state === TaskState.PENDING)
      
      if (pendingTasks.length >= MAX_TASKS_PER_DAY) {
        return {
          success: false,
          error: `Maximum ${MAX_TASKS_PER_DAY} tasks per day allowed`
        }
      }

      // Create new task
      const newTask: Task = {
        id: crypto.randomUUID(),
        name: taskData.name.trim(),
        description: taskData.description?.trim() || undefined,
        websites: taskData.websites.map(url => url.trim()),
        state: TaskState.PENDING,
        schedule: taskData.schedule,
        startDate: taskData.startDate?.toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        order: currentTasks.length
      }

      console.log('Created new task:', newTask) // Debug log
      
      const success = await taskStorage.addTask(newTask)
      if (!success) {
        return {
          success: false,
          error: 'Failed to save task'
        }
      }

      await loadTasks()
      return { success: true }
    } catch (error) {
      console.error('Error creating task:', error)
      return {
        success: false,
        error: 'Failed to create task'
      }
    }
  }, [loadTasks])

  /**
   * Update an existing task
   */
  const updateTask = useCallback(async (taskId: string, updates: UpdateTaskData): Promise<{ success: boolean; error?: string }> => {
    try {
      const currentTasks = await taskStorage.getTasks()
      const task = currentTasks.find(t => t.id === taskId)
      
      if (!task) {
        return {
          success: false,
          error: 'Task not found'
        }
      }

      // Don't allow editing tasks that are in progress or completed
      if (task.state === TaskState.IN_PROGRESS || task.state === TaskState.COMPLETED) {
        return {
          success: false,
          error: 'Cannot edit tasks that are in progress or completed'
        }
      }

      // Validate updates if they include task data
      if (updates.name || updates.websites) {
        const validation = validateTask({
          name: updates.name || task.name,
          description: updates.description !== undefined ? updates.description : task.description,
          websites: updates.websites || task.websites
        })
        
        if (!validation.isValid) {
          return {
            success: false,
            error: validation.errors.map(e => e.message).join(', ')
          }
        }
      }

      // Convert Date objects to strings for storage
      const storageUpdates: Partial<Task> = {
        ...updates,
        startDate: updates.startDate ? 
          (typeof updates.startDate === 'string' ? updates.startDate : updates.startDate.toISOString()) : 
          updates.startDate
      }

      const success = await taskStorage.updateTask(taskId, storageUpdates)
      if (!success) {
        return {
          success: false,
          error: 'Failed to update task'
        }
      }

      await loadTasks()
      return { success: true }
    } catch (error) {
      console.error('Error updating task:', error)
      return {
        success: false,
        error: 'Failed to update task'
      }
    }
  }, [loadTasks])

  /**
   * Delete a task
   */
  const deleteTask = useCallback(async (taskId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const currentTasks = await taskStorage.getTasks()
      const task = currentTasks.find(t => t.id === taskId)
      
      if (!task) {
        return {
          success: false,
          error: 'Task not found'
        }
      }

      // Don't allow deleting tasks that are in progress
      if (task.state === TaskState.IN_PROGRESS) {
        return {
          success: false,
          error: 'Cannot delete tasks that are in progress'
        }
      }

      const success = await taskStorage.deleteTask(taskId)
      if (!success) {
        return {
          success: false,
          error: 'Failed to delete task'
        }
      }

      await loadTasks()
      return { success: true }
    } catch (error) {
      console.error('Error deleting task:', error)
      return {
        success: false,
        error: 'Failed to delete task'
      }
    }
  }, [loadTasks])

  /**
   * Start a task (create tab group and open websites)
   */
  const startTask = useCallback(async (taskId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const currentTasks = await taskStorage.getTasks()
      const task = currentTasks.find(t => t.id === taskId)
      
      if (!task) {
        return {
          success: false,
          error: 'Task not found'
        }
      }

      if (task.state !== TaskState.PENDING) {
        return {
          success: false,
          error: 'Task is not in pending state'
        }
      }

      // Create tabs for all websites
      const tabs = await chromeTabs.createMultiple(task.websites)
      
      if (tabs.length === 0) {
        return {
          success: false,
          error: 'Failed to create tabs'
        }
      }
      
      console.log('Successfully created tabs for task:', task.name, 'Tabs:', tabs.length)

      // Try to create tab group using chrome.tabs.group (more stable approach)
      const tabIds = tabs.map(tab => tab.id).filter((id): id is number => id !== undefined)
      let groupId: number | null = null
      
      try {
        // Step 1: Group the tabs using chrome.tabs.group
        groupId = await new Promise<number>((resolve, reject) => {
          chrome.tabs.group({ tabIds }, (groupId) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message))
            } else {
              resolve(groupId)
            }
          })
        })
        
        console.log('Tab group created with ID:', groupId)
        
        // Step 2: Update the group properties using chrome.tabGroups.update
        await new Promise<void>((resolve, reject) => {
          chrome.tabGroups.update(groupId!, {
            title: task.name,
            color: chromeTabGroups.getRandomColor() as any
          }, () => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message))
            } else {
              resolve()
            }
          })
        })
        
        console.log('Tab group updated with title and color')
        
      } catch (error) {
        console.log('Tab group creation failed, continuing without grouping:', error)
        // Continue without tab group - this is not a critical failure
      }

      // Update task state
      const success = await taskStorage.updateTask(taskId, {
        state: TaskState.IN_PROGRESS
      })

      if (!success) {
        return {
          success: false,
          error: 'Failed to update task state'
        }
      }

      // Reload tasks to get updated state
      await loadTasks()
      
      // Get the updated task and log it
      const updatedTasks = await taskStorage.getTasks()
      const updatedTask = updatedTasks.find(t => t.id === taskId)
      console.log('Task after start operation completed:', updatedTask)
      console.log('Tabs created:', tabs)
      console.log('Tab group ID:', groupId)
      
      return { success: true }
    } catch (error) {
      console.error('Error starting task:', error)
      return {
        success: false,
        error: 'Failed to start task'
      }
    }
  }, [loadTasks])

  /**
   * Continue a task (focus on existing tab group if it exists)
   */
  const continueTask = useCallback(async (taskId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const currentTasks = await taskStorage.getTasks()
      const task = currentTasks.find(t => t.id === taskId)
      
      if (!task) {
        return {
          success: false,
          error: 'Task not found'
        }
      }

      if (task.state !== TaskState.IN_PROGRESS) {
        return {
          success: false,
          error: 'Task is not in progress'
        }
      }

      console.log('Continuing task:', task.name)

      // Try to find and focus on the existing tab group, or create a new one
      let tabGroupFocused = false
      try {
        const existingTabGroup = await chromeTabGroups.findByTitle(task.name)
        if (existingTabGroup) {
          console.log('Found existing tab group for task:', existingTabGroup.id)
          const focused = await chromeTabGroups.focusGroup(existingTabGroup.id)
          if (focused) {
            console.log('Successfully focused on existing tab group:', existingTabGroup.id)
            tabGroupFocused = true
          } else {
            console.log('Failed to focus on existing tab group:', existingTabGroup.id)
          }
        } else {
          console.log('No existing tab group found for task:', task.name)
          console.log('Creating new tab group for continue task...')
          
          // Create new tabs for the task websites
          const tabs = await chromeTabs.createMultiple(task.websites)
          if (tabs && tabs.length > 0) {
            console.log('Created tabs for continue task:', tabs.length)
            
            // Create tab group with the new tabs
            const tabIds = tabs.map(tab => tab.id).filter((id): id is number => id !== undefined)
            let groupId: number | null = null

            try {
              // Step 1: Group the tabs using chrome.tabs.group
              groupId = await new Promise<number>((resolve, reject) => {
                chrome.tabs.group({ tabIds }, (groupId) => {
                  if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message))
                  } else {
                    resolve(groupId)
                  }
                })
              })

              console.log('Tab group created for continue task with ID:', groupId)

              // Step 2: Update the group properties using chrome.tabGroups.update
              await new Promise<void>((resolve, reject) => {
                chrome.tabGroups.update(groupId!, {
                  title: task.name,
                  color: chromeTabGroups.getRandomColor() as any
                }, () => {
                  if (chrome.runtime.lastError) {
                    reject(new Error(chrome.runtime.lastError.message))
                  } else {
                    resolve()
                  }
                })
              })

              console.log('Tab group updated for continue task with title and color')
              tabGroupFocused = true
              
            } catch (error) {
              console.log('Tab group creation failed for continue task, continuing without grouping:', error)
              // Continue without tab group - this is not a critical failure
            }
          } else {
            console.log('Failed to create tabs for continue task')
          }
        }
      } catch (error) {
        console.log('Error with tab group operations for continue task:', error)
        // Continue without focusing - this is not a critical failure
      }

      // Log continuation details
      console.log('Task continuation completed:', {
        taskId: task.id,
        taskName: task.name,
        tabGroupFocused
      })

      return { success: true }
    } catch (error) {
      console.error('Error continuing task:', error)
      return {
        success: false,
        error: 'Failed to continue task'
      }
    }
  }, [])

  /**
   * Complete a task (close tab group and mark as completed)
   */
  const completeTask = useCallback(async (taskId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const currentTasks = await taskStorage.getTasks()
      const task = currentTasks.find(t => t.id === taskId)
      
      if (!task) {
        return {
          success: false,
          error: 'Task not found'
        }
      }

      if (task.state !== TaskState.IN_PROGRESS) {
        return {
          success: false,
          error: 'Task is not in progress'
        }
      }

      console.log('Starting task completion for:', task.name)

      // Try to find and close the associated tab group
      let tabGroupClosed = false
      try {
        const tabGroup = await chromeTabGroups.findByTitle(task.name)
        if (tabGroup) {
          console.log('Found tab group for task:', tabGroup.id)
          const closed = await chromeTabGroups.remove(tabGroup.id)
          if (closed) {
            console.log('Tab group closed successfully:', tabGroup.id)
            tabGroupClosed = true
          } else {
            console.log('Failed to close tab group:', tabGroup.id)
          }
        } else {
          console.log('No tab group found for task:', task.name)
        }
      } catch (error) {
        console.log('Error closing tab group:', error)
        // Continue with task completion even if tab group closure fails
      }

      // Update task state to completed
      const success = await taskStorage.updateTask(taskId, {
        state: TaskState.COMPLETED,
        completedAt: new Date().toISOString()
      })

      if (!success) {
        return {
          success: false,
          error: 'Failed to update task state'
        }
      }

      // Log completion details
      console.log('Task completed successfully:', {
        taskId: task.id,
        taskName: task.name,
        completedAt: new Date().toISOString(),
        tabGroupClosed
      })

      await loadTasks()
      return { success: true }
    } catch (error) {
      console.error('Error completing task:', error)
      return {
        success: false,
        error: 'Failed to complete task'
      }
    }
  }, [loadTasks])

  /**
   * Navigate to a specific page
   */
  const goToPage = useCallback((page: number): void => {
    setState(prev => ({
      ...prev,
      currentPage: Math.max(1, Math.min(page, prev.totalPages))
    }))
  }, [])

  /**
   * Refresh tasks from storage
   */
  const refreshTasks = useCallback(async (): Promise<void> => {
    await loadTasks()
  }, [loadTasks])

  // Load tasks on mount
  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  return {
    tasks: state.tasks,
    currentPage: state.currentPage,
    totalPages: state.totalPages,
    isLoading: state.isLoading,
    error: state.error,
    createTask,
    updateTask,
    deleteTask,
    startTask,
    continueTask,
    completeTask,
    goToPage,
    refreshTasks
  }
}
