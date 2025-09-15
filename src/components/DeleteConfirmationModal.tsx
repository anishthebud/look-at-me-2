import React from 'react'
import { Task, TaskSchedule } from '../types'

export interface DeleteConfirmationModalProps {
  isOpen: boolean
  task: Task | null
  onConfirm: (deleteEntire?: boolean) => void
  onCancel: () => void
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  task,
  onConfirm,
  onCancel
}) => {
  if (!isOpen || !task) return null

  const isRecurring = task.schedule && task.schedule !== TaskSchedule.NONE

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[9999] p-4 backdrop-blur-lg"
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onCancel()
        }
      }}
    >
      <div 
        className="rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto relative z-[10000]"
        style={{
          backgroundColor: '#1e293b',
          borderColor: '#374151'
        }}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-modal-title"
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 pt-6 border-b border-gray-600">
          <h2 id="delete-modal-title" className="text-xl font-bold text-white">Delete Task</h2>
          <button
            type="button"
            onClick={onCancel}
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
        <div className="px-6 py-4">
          <div className="mb-4">
            <p className="text-base text-white mb-2">
              Are you sure you want to delete <span className="font-semibold text-red-300">"{task.name}"</span>?
            </p>
            
            {isRecurring && (
              <div className="bg-yellow-500 bg-opacity-20 border border-yellow-500 border-opacity-30 rounded-lg p-3 mb-2">
                <p className="text-yellow-200 text-sm mb-0">
                  ⚠️ This is a recurring task. Choose what to delete:
                </p>
              </div>
            )}
          </div>
          
          <div className="flex flex-col gap-2">
            {isRecurring ? (
              <>
                <button
                  type="button"
                  className="w-full px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 font-medium transition-all duration-200"
                  onClick={() => onConfirm(true)}
                >
                  Delete Entire Task (All Occurrences)
                </button>
                <button
                  type="button"
                  className="w-full px-4 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium transition-all duration-200"
                  onClick={() => onConfirm(false)}
                >
                  Delete Only This Occurrence
                </button>
              </>
            ) : (
              <button
                type="button"
                className="w-full px-4 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 font-medium transition-all duration-200"
                onClick={() => onConfirm()}
              >
                Yes, Delete Task
              </button>
            )}
            
            <button
              type="button"
              className="w-full px-4 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 font-medium transition-all duration-200"
              onClick={onCancel}
            >
              Cancel - Keep Task
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DeleteConfirmationModal
