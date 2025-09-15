import React, { useState } from 'react'
import { Task, TaskState, TaskSchedule } from '../types'
import { formatDateString, stringToDate, parseDateStringToLocalDate, formatDateForInput } from '../utils/dateUtils'

export interface TaskCardProps {
  task: Task
  onStart: (taskId: string) => void
  onContinue: (taskId: string) => void
  onComplete: (taskId: string) => void
  onEdit: (taskId: string) => void
  onDelete: (taskId: string) => void
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onStart,
  onContinue,
  onComplete,
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
      const date = stringToDate(startDateString)
      if (!date) return 'Invalid date'
      return new Intl.DateTimeFormat('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      }).format(date)
    } catch (error) {
      return 'Invalid date'
    }
  }

  const formatDate = (dateString: string): string => {
    try {
      const date = stringToDate(dateString)
      if (!date) return 'Invalid date'
      
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date)
    } catch (error) {
      return 'Invalid date'
    }
  }


  return (
    <div className="task-card glass rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:transform hover:-translate-y-1">
      <div className="p-6">
        <div className="mb-4">
          <h3 className="text-xl font-semibold text-white !mt-0 break-words" style={{ marginBlockStart: 0 }}>
            {task.name}
          </h3>
        </div>
        
        {task.description && (
          <p className="text-sm text-white mb-4 line-clamp-2">
            {task.description}
          </p>
        )}
        
        {/* Only show recurrence if it's not NONE */}
        {task.schedule !== TaskSchedule.NONE && (
          <div className="mb-4 flex justify-start">
            <span className="py-1 bg-blue-500 bg-opacity-20 text-white text-sm rounded-full border border-blue-500 border-opacity-30">
              📅 {getScheduleText(task.schedule)}
            </span>
          </div>
        )}
        
        {task.websites.length > 0 && (
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              {task.websites.map((website, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-gray-500 bg-opacity-20 text-white text-sm rounded-full truncate max-w-[200px] border border-gray-500 border-opacity-30"
                  style={{
                    backgroundColor: 'rgba(107, 114, 128, 0.2)',
                    color: '#ffffff',
                    borderColor: 'rgba(107, 114, 128, 0.3)',
                    borderWidth: '1px',
                    borderStyle: 'solid'
                  }}
                  title={website}
                >
                  {new URL(website).hostname}
                </span>
              ))}
            </div>
          </div>
        )}
        <div className="flex gap-3">
          {task.state === TaskState.PENDING && (
            <>
              <button
                onClick={() => onStart(task.id)}
                className="flex-1 px-4 py-3 bg-blue-600 text-white text-sm rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium transition-all duration-200"
              >
                Start Task
              </button>
              <button
                onClick={() => onEdit(task.id)}
                className="px-4 py-3 text-white text-sm rounded-xl focus:outline-none focus:ring-2 transition-all duration-200"
                style={{
                  backgroundColor: 'var(--theme-accent, #3b82f6)',
                  border: '1px solid var(--theme-accent, #3b82f6)'
                }}
                title="Edit task"
              >
                ✏️
              </button>
              <button
                onClick={() => onDelete(task.id)}
                className="px-4 py-3 text-white text-sm rounded-xl focus:outline-none focus:ring-2 transition-all duration-200"
                style={{
                  backgroundColor: 'var(--theme-accent, #3b82f6)',
                  border: '1px solid var(--theme-accent, #3b82f6)'
                }}
                title="Delete task"
              >
                🗑️
              </button>
            </>
          )}
          
          {task.state === TaskState.IN_PROGRESS && (
            <>
              <button
                onClick={() => onContinue(task.id)}
                className="flex-1 px-4 py-3 text-white text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 font-medium transition-all duration-200"
                style={{
                  background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)',
                  boxShadow: '0 4px 15px rgba(234, 179, 8, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #ca8a04 0%, #a16207 100%)'
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(234, 179, 8, 0.4)'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)'
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(234, 179, 8, 0.3)'
                  e.currentTarget.style.transform = 'translateY(0px)'
                }}
              >
                Continue
              </button>
              <button
                onClick={() => onComplete(task.id)}
                className="flex-1 px-4 py-3 text-white text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 font-medium transition-all duration-200"
                style={{
                  background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                  boxShadow: '0 4px 15px rgba(22, 163, 74, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #15803d 0%, #166534 100%)'
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(22, 163, 74, 0.4)'
                  e.currentTarget.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)'
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(22, 163, 74, 0.3)'
                  e.currentTarget.style.transform = 'translateY(0px)'
                }}
              >
                Complete
              </button>
            </>
          )}
          
          {task.state === TaskState.COMPLETED && (
            <div className="flex-1 px-4 py-3 bg-green-500 bg-opacity-20 text-white text-sm rounded-xl text-center border border-green-500 border-opacity-30 font-medium">
              ✅ Task Completed
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TaskCard
