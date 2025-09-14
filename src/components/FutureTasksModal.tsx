import React from 'react'
import { Task, TaskState, TaskSchedule } from '../types'
import { formatDateString } from '../utils/dateUtils'

export interface FutureTasksModalProps {
  isOpen: boolean
  onClose: () => void
  tasks: Task[]
  onStart: (taskId: string) => void
  onEdit: (taskId: string) => void
  onDelete: (taskId: string) => void
}

export const FutureTasksModal: React.FC<FutureTasksModalProps> = ({
  isOpen,
  onClose,
  tasks,
  onStart,
  onEdit,
  onDelete
}) => {
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

  const getScheduleText = (schedule: TaskSchedule): string => {
    switch (schedule) {
      case TaskSchedule.NONE:
        return 'None'
      case TaskSchedule.DAILY:
        return 'Daily'
      case TaskSchedule.WEEKLY:
        return 'Weekly'
      case TaskSchedule.MONTHLY:
        return 'Monthly'
      default:
        return 'Unknown'
    }
  }

  const formatStartDate = (startDateString: string): string => {
    try {
      return formatDateString(startDateString)
    } catch (error) {
      return 'Invalid date'
    }
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4" 
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0,
        backdropFilter: 'blur(2px)'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div 
        className="bg-white rounded-lg shadow-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto relative z-[10000]" 
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 id="modal-title" className="text-2xl font-bold text-gray-900">
            Future Scheduled Tasks
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <p className="text-gray-600 mb-6">
          Tasks scheduled for future dates. These tasks will appear in your main task list on their scheduled start date.
        </p>

        {tasks.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400 text-6xl mb-4">📅</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Future Tasks</h3>
            <p className="text-gray-500">You don't have any tasks scheduled for future dates.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tasks.map((task) => (
              <div 
                key={task.id} 
                className={`border-2 rounded-lg shadow-sm hover:shadow-md transition-shadow ${getStateColor(task.state)}`}
              >
                <div className="p-4">
                  <div className="mb-2">
                    <h3 className="text-lg font-semibold text-gray-800 truncate">
                      {task.name}
                    </h3>
                  </div>
                  
                  {task.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {task.description}
                    </p>
                  )}
                  
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-1">Scheduled for:</p>
                    <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded">
                      {formatStartDate(task.startDate!)}
                    </span>
                  </div>
                  
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-1">Recurrence:</p>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                      {getScheduleText(task.schedule)}
                    </span>
                  </div>
                  
                  <div className="mb-3">
                    <p className="text-xs text-gray-500 mb-1">Websites ({task.websites.length}):</p>
                    <div className="flex flex-wrap gap-1">
                      {task.websites.slice(0, 2).map((website, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded truncate max-w-[120px]"
                          title={website}
                        >
                          {new URL(website).hostname}
                        </span>
                      ))}
                      {task.websites.length > 2 && (
                        <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded">
                          +{task.websites.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {task.state === TaskState.PENDING && (
                      <>
                        <button
                          onClick={() => onStart(task.id)}
                          className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          Start Now
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
                      <div className="flex-1 px-3 py-2 bg-blue-100 text-blue-700 text-sm rounded-md text-center">
                        In Progress
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default FutureTasksModal
