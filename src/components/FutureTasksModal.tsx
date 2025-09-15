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
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[9999] p-4 backdrop-blur-md" 
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0,
        background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.8) 0%, rgba(20, 20, 20, 0.9) 100%)'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div 
        className="bg-gray-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative z-[10000] border border-gray-700" 
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        style={{
          background: 'linear-gradient(135deg, rgba(31, 41, 55, 0.95) 0%, rgba(17, 24, 39, 0.98) 100%)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)'
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-600">
          <h2 id="modal-title" className="text-xl font-bold text-white">
            Future Scheduled Tasks
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 bg-black border-2 border-black rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors group"
            title="Close"
          >
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 40 40"
            >
              <path 
                d="M 10,10 L 30,30 M 30,10 L 10,30" 
                stroke="white" 
                strokeWidth="4" 
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">

          {tasks.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-8xl mb-6">📅</div>
              <h3 className="text-xl font-medium text-white mb-3">No Future Tasks</h3>
              <p className="text-gray-400 text-lg">You don't have any tasks scheduled for future dates.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-600">
                    <th className="pb-3 px-4 text-center text-gray-300 font-semibold text-sm border-r border-gray-600">Task Name</th>
                    <th className="pb-3 px-4 text-center text-gray-300 font-semibold text-sm border-r border-gray-600">Description</th>
                    <th className="pb-3 px-4 text-center text-gray-300 font-semibold text-sm border-r border-gray-600">Scheduled Date</th>
                    <th className="pb-3 px-4 text-center text-gray-300 font-semibold text-sm border-r border-gray-600">Recurrence</th>
                    <th className="pb-3 px-4 text-center text-gray-300 font-semibold text-sm border-r border-gray-600">Websites</th>
                    <th className="pb-3 px-4 text-center text-gray-300 font-semibold text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => (
                    <tr key={task.id} className="border-b border-gray-700 hover:bg-gray-700 hover:bg-opacity-30 transition-colors">
                      <td className="py-3 px-4 text-center border-r border-gray-600">
                        <div className="font-medium text-white text-sm">
                          {task.name}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center border-r border-gray-600">
                        <div className="text-gray-300 text-sm line-clamp-2 max-w-[200px] mx-auto">
                          {task.description || 'No description'}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center border-r border-gray-600">
                        <span className="px-2 py-1 bg-orange-500 bg-opacity-20 text-orange-300 text-xs rounded border border-orange-500 border-opacity-30">
                          {formatStartDate(task.startDate!)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center border-r border-gray-600">
                        <span className="px-2 py-1 bg-blue-500 bg-opacity-20 text-blue-300 text-xs rounded border border-blue-500 border-opacity-30">
                          {getScheduleText(task.schedule)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center border-r border-gray-600">
                        <div className="flex flex-wrap gap-1 max-w-[150px] justify-center mx-auto">
                          {task.websites.slice(0, 1).map((website, index) => (
                            <span 
                              key={index}
                              className="px-2 py-1 bg-gray-500 bg-opacity-20 text-gray-300 text-xs rounded truncate border border-gray-500 border-opacity-30"
                              style={{
                                backgroundColor: 'rgba(107, 114, 128, 0.2)',
                                color: '#d1d5db',
                                borderColor: 'rgba(107, 114, 128, 0.3)',
                                borderWidth: '1px',
                                borderStyle: 'solid'
                              }}
                              title={website}
                            >
                              {new URL(website).hostname}
                            </span>
                          ))}
                          {task.websites.length > 1 && (
                            <span className="px-2 py-1 bg-gray-500 bg-opacity-20 text-gray-300 text-xs rounded border border-gray-500 border-opacity-30">
                              +{task.websites.length - 1}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex gap-1 justify-center">
                          <button
                            onClick={() => onEdit(task.id)}
                            className="px-2 py-1 bg-gray-600 text-gray-300 text-xs rounded hover:bg-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-400 transition-colors"
                            title="Edit task"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => onDelete(task.id)}
                            className="px-2 py-1 bg-red-600 text-red-300 text-xs rounded hover:bg-red-500 focus:outline-none focus:ring-1 focus:ring-red-400 transition-colors"
                            title="Delete task"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default FutureTasksModal
