import React, { useState, useRef, useEffect } from 'react'
import { Task, TaskState, UpdateTaskData, TaskSchedule } from '../types'
import { useTasks } from '../hooks/useTasks'
import { useCurrentTask } from '../hooks/useCurrentTask'
import { TaskCard } from './TaskCard'
import { TaskForm } from './TaskForm'
import { FutureTasksModal } from './FutureTasksModal'
import { DeleteConfirmationModal } from './DeleteConfirmationModal'
import { CreateTaskData, TaskFormData } from '../types'
import { parseWebsitesString } from '../utils/validation'
import { useToast } from '../hooks/useToast'
import { stringToDate } from '../utils/dateUtils'
import Toast from './Toast'
import { getNextAfterBaseDate } from '../utils/recurrence'

interface CompletionModalData {
  taskName: string
  message: string
  type: 'success' | 'error' | 'info'
  timestamp: number
}

interface TaskListProps {
  className?: string
  initialCompletionModal?: CompletionModalData | null
  onCreateFormToggle?: (isOpen: boolean) => void
}

export const TaskList: React.FC<TaskListProps> = ({ className = '', initialCompletionModal = null, onCreateFormToggle }) => {
  const {
    tasks,
    futureTasks,
    currentPage,
    totalPages,
    isLoading,
    error,
    createTask,
    updateTask,
    deleteTask,
    startTask,
    continueTask,
    completeTask,
    goToPage,
    refreshTasks
  } = useTasks()

  const { currentTask } = useCurrentTask(tasks)

  const { modal, removeModal, showSuccessModal, showErrorModal } = useToast()

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [showFutureTasksModal, setShowFutureTasksModal] = useState(false)
  const [editingFromFutureModal, setEditingFromFutureModal] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null)
  const formResetRef = useRef<(() => void) | null>(null)

  // Show initial completion modal if provided from popup
  useEffect(() => {
    if (initialCompletionModal) {
      showSuccessModal(initialCompletionModal.taskName, initialCompletionModal.message)
    }
  }, [initialCompletionModal, showSuccessModal])

  // Notify parent when create form state changes
  useEffect(() => {
    if (onCreateFormToggle) {
      onCreateFormToggle(showCreateForm || showEditForm)
    }
  }, [showCreateForm, showEditForm, onCreateFormToggle])

  // Get tasks for current page, sorted with in-progress tasks first
  const sortedTasks = tasks.sort((a, b) => {
    // Put current task first (highest priority)
    if (currentTask) {
      if (a.id === currentTask.id) return -1
      if (b.id === currentTask.id) return 1
    }

    // Then prioritize in-progress tasks over pending tasks
    if (a.state === TaskState.IN_PROGRESS && b.state === TaskState.PENDING) return -1
    if (a.state === TaskState.PENDING && b.state === TaskState.IN_PROGRESS) return 1

    // For tasks of the same state, maintain original order (by creation time or order field)
    if (a.createdAt && b.createdAt) {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    }

    return 0
  })
  
  const startIndex = (currentPage - 1) * 8 // VISIBLE_TASKS
  const endIndex = startIndex + 8
  const currentTasks = sortedTasks.slice(startIndex, endIndex)

  const handleCreateTask = async (taskData: CreateTaskData): Promise<{ success: boolean; error?: string }> => {
    setActionError(null)
    const result = await createTask(taskData)
    
    if (result.success) {
      setShowCreateForm(false)
      // Reset the form data after successful creation
      if (formResetRef.current) {
        formResetRef.current()
      }
    } else {
      setActionError(result.error || 'Failed to create task')
    }
    
    return result
  }

  const handleEditTask = async (taskData: CreateTaskData): Promise<{ success: boolean; error?: string }> => {
    if (!editingTask) {
      return { success: false, error: 'No task selected for editing' }
    }

    setActionError(null)
    
    const updateData: UpdateTaskData = {
      name: taskData.name,
      description: taskData.description || undefined,
      websites: taskData.websites,
      schedule: taskData.schedule,
      startDate: taskData.startDate || undefined
    }

    const result = await updateTask(editingTask.id, updateData)
    
    if (result.success) {
      setShowEditForm(false)
      setEditingTask(null)
      // Reset the form data after successful update
      if (formResetRef.current) {
        formResetRef.current()
      }
      // If we were editing from future modal, return to it
      if (editingFromFutureModal) {
        setShowFutureTasksModal(true)
        setEditingFromFutureModal(false)
      }
    } else {
      setActionError(result.error || 'Failed to update task')
    }
    
    return result
  }

  const handleDeleteTask = async (taskId: string): Promise<void> => {
    setActionError(null)

    // Find task in current or future tasks
    const allTasks: Task[] = [...tasks, ...futureTasks]
    const located = allTasks.find(t => t.id === taskId) || null

    // Prevent deleting generated occurrences via main grid (ignore silently)
    if (located && /(_next_after_base|_next_occurrence|_occurrence_)/.test(located.id)) {
      return
    }

    // If not found, create a placeholder task for the modal
    const taskForModal = located || { id: taskId, name: 'Unknown Task', schedule: TaskSchedule.NONE } as Task
    
    // Show the delete confirmation modal
    setTaskToDelete(taskForModal)
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async (deleteEntire?: boolean): Promise<void> => {
    if (!taskToDelete) return

    setShowDeleteModal(false)
    setActionError(null)

    const taskId = taskToDelete.id
    const located = taskToDelete

    // If task wasn't found in our lists, do simple delete
    if (located.name === 'Unknown Task') {
      const result = await deleteTask(taskId)
      if (!result.success) setActionError(result.error || 'Failed to delete task')
      setTaskToDelete(null)
      return
    }

    // Determine if this is a generated occurrence (not persisted) by ID pattern
    const isGeneratedOccurrence = /(_next_after_base|_next_occurrence|_occurrence_)/.test(located.id)
    const parentId = isGeneratedOccurrence ? located.id.split('_')[0] : located.id

    // Non-recurring: normal delete
    if (!located.schedule || located.schedule === TaskSchedule.NONE) {
      const result = await deleteTask(located.id)
      if (!result.success) setActionError(result.error || 'Failed to delete task')
      setTaskToDelete(null)
      return
    }

    // Recurring task handling
    if (deleteEntire) {
      const result = await deleteTask(parentId)
      if (!result.success) setActionError(result.error || 'Failed to delete task')
      setTaskToDelete(null)
      return
    }

    // Delete only this occurrence
    if (isGeneratedOccurrence) {
      // For a future generated occurrence, do NOT change parent startDate.
      // Instead, set an anchor so the next occurrence skips the deleted date.
      if (located.startDate) {
        const nextAfter = getNextAfterBaseDate(located.startDate, located.schedule as TaskSchedule)
        const result = await updateTask(parentId, { nextOccurrenceAnchor: located.startDate })
        if (!result.success) setActionError(result.error || 'Failed to update task')
      }
    } else {
      // Deleting the base future occurrence: advance base to the next base date
      if (located.startDate) {
        const nextBaseIso = getNextAfterBaseDate(located.startDate, located.schedule as TaskSchedule)
        if (nextBaseIso) {
          const result = await updateTask(located.id, { startDate: nextBaseIso })
          if (!result.success) setActionError(result.error || 'Failed to update task date')
        }
      }
      // Fallback: if cannot compute next, do nothing
    }
    
    setTaskToDelete(null)
  }

  const handleDeleteCancel = (): void => {
    setShowDeleteModal(false)
    setTaskToDelete(null)
  }

  const handleStartTask = async (taskId: string): Promise<void> => {
    setActionError(null)
    const result = await startTask(taskId)
    
    if (!result.success) {
      setActionError(result.error || 'Failed to start task')
    }
  }

  const handleContinueTask = async (taskId: string): Promise<void> => {
    setActionError(null)
    const result = await continueTask(taskId)
    
    if (!result.success) {
      setActionError(result.error || 'Failed to continue task')
    }
    // Note: No modal for continue task as it's a silent operation
  }

  const handleCompleteTask = async (taskId: string): Promise<void> => {
    setActionError(null)
    
    // Find the task to get its name for the toast
    const task = tasks.find(t => t.id === taskId)
    const taskName = task?.name || 'Task'
    
    const result = await completeTask(taskId)
    
    if (result.success) {
      // Show success modal
      showSuccessModal(taskName, 'has been completed successfully!')
    } else {
      // Show error modal and set action error
      showErrorModal(taskName, `failed to complete: ${result.error}`)
      setActionError(result.error || 'Failed to complete task')
    }
  }

  const handleEdit = (taskId: string): void => {
    // Look for task in both regular tasks and future tasks
    const task = tasks.find(t => t.id === taskId) || futureTasks.find(t => t.id === taskId)
    if (task) {
      // Prevent editing generated occurrences
      if (/_next_after_base|_next_occurrence|_occurrence_/.test(task.id)) {
        return
      }
      // If it's a future task, close the future tasks modal and set flag
      if (futureTasks.find(t => t.id === taskId)) {
        setShowFutureTasksModal(false)
        setEditingFromFutureModal(true)
      } else {
        setEditingFromFutureModal(false)
      }
      setEditingTask(task)
      setShowEditForm(true)
    }
  }

  const getEmptyStateMessage = (): string => {
    if (showCreateForm) {
      return ''
    }
    
    if (tasks.length === 0) {
      return 'Create a task to get started!'
    }
    
    return 'No tasks on this page.'
  }

  if (isLoading) {
    return (
      <div className={`task-list ${className}`}>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading tasks...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`task-list ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-red-400">⚠️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading tasks</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
              <button
                onClick={refreshTasks}
                className="mt-2 px-3 py-1 bg-red-100 text-red-800 text-sm rounded-md hover:bg-red-200"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`task-list ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2" style={{ textShadow: '2px 2px 4px rgba(0, 0, 0, 0.7)' }}>My Tasks</h1>
          <p className="text-white text-lg" style={{ textShadow: '1px 1px 2px rgba(0, 0, 0, 0.7)' }}>
            {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'} • Page {currentPage} of {totalPages}
          </p>
        </div>
        
        <div className="flex gap-3">
          {futureTasks.length > 0 && !showCreateForm && (
            <button
              onClick={() => setShowFutureTasksModal(true)}
              className="px-6 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium transition-all duration-200"
            >
              📅 Future Tasks
            </button>
          )}
          
          {!showCreateForm && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium transition-all duration-200"
            >
              + New Task
            </button>
          )}
        </div>
      </div>

      {/* Action Error */}
      {actionError && (
        <div className="mb-6 bg-red-500 bg-opacity-20 border border-red-500 rounded-xl p-4 backdrop-blur-sm">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-red-400 text-lg">⚠️</span>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm text-red-300 font-medium">{actionError}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setActionError(null)}
                className="text-red-400 hover:text-red-300 p-1 rounded-lg hover:bg-red-500 hover:bg-opacity-20 transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Task Form */}
             {showCreateForm && (
               <TaskForm
                 onSubmit={handleCreateTask}
                 onCancel={() => {
                   setShowCreateForm(false)
                   setActionError(null)
                 }}
                 onFormReady={(resetFn) => {
                   formResetRef.current = resetFn
                 }}
                 isOpen={showCreateForm}
               />
             )}

      {/* Edit Task Form */}
      {showEditForm && editingTask && (
        <TaskForm
          onSubmit={handleEditTask}
          onCancel={() => {
            setShowEditForm(false)
            setEditingTask(null)
            setActionError(null)
            // If we were editing from future modal, return to it
            if (editingFromFutureModal) {
              setShowFutureTasksModal(true)
              setEditingFromFutureModal(false)
            }
          }}
          onFormReady={(resetFn) => {
            formResetRef.current = resetFn
          }}
          isOpen={showEditForm}
          title="Edit Task"
          submitText="Update Task"
          initialData={{
            name: editingTask.name,
            description: editingTask.description || '',
            websites: editingTask.websites.join('\n'),
            schedule: editingTask.schedule,
            startDate: editingTask.startDate ? stringToDate(editingTask.startDate) : null
          }}
        />
      )}

      {/* Tasks Grid - Hide when creating or editing task */}
      {!showCreateForm && !showEditForm && (
        <>
          {currentTasks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {currentTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onStart={handleStartTask}
                  onContinue={handleContinueTask}
                  onComplete={handleCompleteTask}
                  onEdit={handleEdit}
                  onDelete={handleDeleteTask}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-gray-400 mb-6" style={{ fontSize: '10rem' }}>📋</div>
              <h3 className="text-xl font-medium text-white mb-3">No tasks here!</h3>
              <p className="text-white-400 text-lg mb-6">{getEmptyStateMessage()}</p>
              {tasks.length === 0 && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium transition-all duration-200"
                >
                  Create a Task
                </button>
              )}
            </div>
          )}

          {/* Pagination - Hide when creating new task */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <button
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-gray-500 bg-opacity-20 text-gray-300 rounded-xl hover:bg-gray-500 hover:bg-opacity-30 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-500 border-opacity-30 transition-all duration-200 font-medium"
              >
                ← Previous
              </button>
              
              <div className="flex gap-2">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => goToPage(page)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      page === currentPage
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-gray-500 bg-opacity-20 text-gray-300 hover:bg-gray-500 hover:bg-opacity-30 border border-gray-500 border-opacity-30'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-gray-500 bg-opacity-20 text-gray-300 rounded-xl hover:bg-gray-500 hover:bg-opacity-30 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-500 border-opacity-30 transition-all duration-200 font-medium"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
      
      {/* Completion modal */}
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

      {/* Future Tasks Modal */}
      <FutureTasksModal
        isOpen={showFutureTasksModal}
        onClose={() => setShowFutureTasksModal(false)}
        tasks={futureTasks}
        onStart={handleStartTask}
        onEdit={handleEdit}
        onDelete={handleDeleteTask}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        task={taskToDelete}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  )
}

export default TaskList
