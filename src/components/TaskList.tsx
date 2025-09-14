import React, { useState, useRef } from 'react'
import { Task, TaskState, UpdateTaskData } from '../types'
import { useTasks } from '../hooks/useTasks'
import { TaskCard } from './TaskCard'
import { TaskForm } from './TaskForm'
import { CreateTaskData, TaskFormData } from '../types'
import { parseWebsitesString } from '../utils/validation'

export interface TaskListProps {
  className?: string
}

export const TaskList: React.FC<TaskListProps> = ({ className = '' }) => {
  const {
    tasks,
    currentPage,
    totalPages,
    isLoading,
    error,
    createTask,
    updateTask,
    deleteTask,
    startTask,
    completeTask,
    goToPage,
    refreshTasks
  } = useTasks()

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const formResetRef = useRef<(() => void) | null>(null)

  // Get tasks for current page
  const startIndex = (currentPage - 1) * 8 // VISIBLE_TASKS
  const endIndex = startIndex + 8
  const currentTasks = tasks.slice(startIndex, endIndex)

  const handleCreateTask = async (taskData: CreateTaskData): Promise<{ success: boolean; error?: string }> => {
    console.log('TaskList received task data:', taskData) // Debug log
    setActionError(null)
    const result = await createTask(taskData)
    console.log('TaskList createTask result:', result) // Debug log
    
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

  const handleEditTask = async (taskId: string, updates: { name: string; description: string; websites: string }): Promise<void> => {
    setActionError(null)
    
    const websites = parseWebsitesString(updates.websites)
    const updateData: UpdateTaskData = {
      name: updates.name,
      description: updates.description || undefined,
      websites
    }

    const result = await updateTask(taskId, updateData)
    
    if (result.success) {
      setEditingTaskId(null)
    } else {
      setActionError(result.error || 'Failed to update task')
    }
  }

  const handleDeleteTask = async (taskId: string): Promise<void> => {
    setActionError(null)
    
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return
    }

    const result = await deleteTask(taskId)
    
    if (!result.success) {
      setActionError(result.error || 'Failed to delete task')
    }
  }

  const handleStartTask = async (taskId: string): Promise<void> => {
    setActionError(null)
    const result = await startTask(taskId)
    
    if (!result.success) {
      setActionError(result.error || 'Failed to start task')
    }
  }

  const handleCompleteTask = async (taskId: string): Promise<void> => {
    setActionError(null)
    const result = await completeTask(taskId)
    
    if (!result.success) {
      setActionError(result.error || 'Failed to complete task')
    }
  }

  const handleEdit = (taskId: string): void => {
    setEditingTaskId(taskId)
  }

  const handleEditCancel = (): void => {
    setEditingTaskId(null)
    setActionError(null)
  }

  const getEmptyStateMessage = (): string => {
    if (showCreateForm) {
      return ''
    }
    
    if (tasks.length === 0) {
      return 'No tasks yet. Create your first task to get started!'
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">My Tasks</h1>
          <p className="text-gray-600">
            {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'} • Page {currentPage} of {totalPages}
          </p>
        </div>
        
        {!showCreateForm && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            + New Task
          </button>
        )}
      </div>

      {/* Action Error */}
      {actionError && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-red-400">⚠️</span>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm text-red-700">{actionError}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setActionError(null)}
                className="text-red-400 hover:text-red-600"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Task Form */}
      <div className={`mb-6 flex justify-center ${showCreateForm ? '' : 'hidden'}`}>
        <TaskForm
          onSubmit={handleCreateTask}
          onCancel={() => {
            setShowCreateForm(false)
            setActionError(null)
          }}
          onFormReady={(resetFn) => {
            formResetRef.current = resetFn
          }}
        />
      </div>

      {/* Tasks Grid */}
      {currentTasks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {currentTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onStart={handleStartTask}
              onComplete={handleCompleteTask}
              onEdit={handleEdit}
              onDelete={handleDeleteTask}
              isEditing={editingTaskId === task.id}
              onEditSubmit={handleEditTask}
              onEditCancel={handleEditCancel}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 text-6xl mb-4">📋</div>
          <h3 className="text-lg font-medium text-gray-600 mb-2">No tasks here</h3>
          <p className="text-gray-500 mb-4">{getEmptyStateMessage()}</p>
          {!showCreateForm && tasks.length === 0 && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Create Your First Task
            </button>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>
          
          <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => goToPage(page)}
                className={`px-3 py-2 rounded-md text-sm ${
                  page === currentPage
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
          
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}

export default TaskList
