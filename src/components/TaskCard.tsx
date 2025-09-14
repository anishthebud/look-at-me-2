import React, { useState } from 'react'
import { Task, TaskState } from '../types'

export interface TaskCardProps {
  task: Task
  onStart: (taskId: string) => void
  onComplete: (taskId: string) => void
  onEdit: (taskId: string) => void
  onDelete: (taskId: string) => void
  isEditing?: boolean
  onEditSubmit?: (taskId: string, updates: { name: string; description: string; websites: string }) => void
  onEditCancel?: () => void
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onStart,
  onComplete,
  onEdit,
  onDelete,
  isEditing = false,
  onEditSubmit,
  onEditCancel
}) => {
  const [editData, setEditData] = useState({
    name: task.name,
    description: task.description || '',
    websites: task.websites.join('\n')
  })

  const handleEditSubmit = (): void => {
    if (onEditSubmit) {
      onEditSubmit(task.id, editData)
    }
  }

  const handleEditCancel = (): void => {
    setEditData({
      name: task.name,
      description: task.description || '',
      websites: task.websites.join('\n')
    })
    if (onEditCancel) {
      onEditCancel()
    }
  }

  // Reset edit data when task changes or editing starts
  React.useEffect(() => {
    if (isEditing) {
      setEditData({
        name: task.name,
        description: task.description || '',
        websites: task.websites.join('\n')
      })
    }
  }, [isEditing, task.id])

  const getStateColor = (state: TaskState): string => {
    switch (state) {
      case TaskState.PENDING:
        return 'bg-gray-100 border-gray-300'
      case TaskState.IN_PROGRESS:
        return 'bg-blue-50 border-blue-300'
      case TaskState.COMPLETED:
        return 'bg-green-50 border-green-300'
      case TaskState.RECURRING:
        return 'bg-purple-50 border-purple-300'
      default:
        return 'bg-gray-100 border-gray-300'
    }
  }

  const getStateText = (state: TaskState): string => {
    switch (state) {
      case TaskState.PENDING:
        return 'Ready'
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

  const formatDate = (date: Date | string): string => {
    try {
      // Convert string to Date if needed
      const dateObj = typeof date === 'string' ? new Date(date) : date
      
      // Check if date is valid
      if (isNaN(dateObj.getTime())) {
        return 'Invalid date'
      }
      
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(dateObj)
    } catch (error) {
      console.error('Error formatting date:', error, 'Date value:', date)
      return 'Invalid date'
    }
  }

  if (isEditing && onEditSubmit && onEditCancel) {
    return (
      <div className={`task-card editing border-2 border-blue-400 ${getStateColor(task.state)}`}>
        <div className="p-4">
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Task Name
            </label>
            <input
              type="text"
              value={editData.name}
              onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter task name"
            />
          </div>
          
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={editData.description}
              onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter task description (optional)"
              rows={2}
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Websites (one per line)
            </label>
            <textarea
              value={editData.websites}
              onChange={(e) => setEditData(prev => ({ ...prev, websites: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com"
              rows={3}
            />
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={handleEditSubmit}
              className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Save
            </button>
            <button
              onClick={handleEditCancel}
              className="flex-1 px-3 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`task-card border-2 rounded-lg shadow-sm hover:shadow-md transition-shadow ${getStateColor(task.state)}`}>
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-800 truncate pr-2">
            {task.name}
          </h3>
          <span className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
            task.state === TaskState.PENDING ? 'bg-gray-200 text-gray-700' :
            task.state === TaskState.IN_PROGRESS ? 'bg-blue-200 text-blue-700' :
            task.state === TaskState.COMPLETED ? 'bg-green-200 text-green-700' :
            'bg-purple-200 text-purple-700'
          }`}>
            {getStateText(task.state)}
          </span>
        </div>
        
        {task.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {task.description}
          </p>
        )}
        
        <div className="mb-3">
          <p className="text-xs text-gray-500 mb-1">Websites ({task.websites.length}):</p>
          <div className="flex flex-wrap gap-1">
            {task.websites.slice(0, 3).map((website, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded truncate max-w-[120px]"
                title={website}
              >
                {new URL(website).hostname}
              </span>
            ))}
            {task.websites.length > 3 && (
              <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded">
                +{task.websites.length - 3} more
              </span>
            )}
          </div>
        </div>
        
        <div className="text-xs text-gray-500 mb-3">
          Created: {formatDate(task.createdAt)}
          {task.completedAt && (
            <span className="block">Completed: {formatDate(task.completedAt)}</span>
          )}
        </div>
        
        <div className="flex gap-2">
          {task.state === TaskState.PENDING && (
            <>
              <button
                onClick={() => onStart(task.id)}
                className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Start Task
              </button>
              <button
                onClick={() => onEdit(task.id)}
                className="px-3 py-2 bg-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                title="Edit task"
              >
                ✏️
              </button>
              <button
                onClick={() => onDelete(task.id)}
                className="px-3 py-2 bg-red-300 text-red-700 text-sm rounded-md hover:bg-red-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                title="Delete task"
              >
                🗑️
              </button>
            </>
          )}
          
          {task.state === TaskState.IN_PROGRESS && (
            <button
              onClick={() => onComplete(task.id)}
              className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Complete Task
            </button>
          )}
          
          {task.state === TaskState.COMPLETED && (
            <div className="flex-1 px-3 py-2 bg-green-100 text-green-700 text-sm rounded-md text-center">
              ✅ Task Completed
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TaskCard
