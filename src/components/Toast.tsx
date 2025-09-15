import React, { useEffect, useState } from 'react'

export interface CompletionModalProps {
  message: string
  taskName: string
  type?: 'success' | 'error' | 'info'
  duration?: number
  onClose?: () => void
}

export const CompletionModal: React.FC<CompletionModalProps> = ({ 
  message, 
  taskName, 
  type = 'success', 
  duration = 4000,
  onClose 
}) => {
  const [isVisible, setIsVisible] = useState(true)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        handleClose()
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [duration])

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(() => {
      setIsVisible(false)
      if (onClose) {
        onClose()
      }
    }, 300) // Animation duration
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  if (!isVisible) {
    return null
  }

  const getModalStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-green-600 border-green-500 text-white'
      case 'error':
        return 'bg-red-600 border-red-500 text-white'
      case 'info':
        return 'bg-blue-600 border-blue-500 text-white'
      default:
        return 'bg-green-600 border-green-500 text-white'
    }
  }

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-500 bg-opacity-20 border border-green-500 border-opacity-30">
            <svg className="h-8 w-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )
      case 'error':
        return (
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-500 bg-opacity-20 border border-red-500 border-opacity-30">
            <svg className="h-8 w-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        )
      case 'info':
        return (
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-500 bg-opacity-20 border border-blue-500 border-opacity-30">
            <svg className="h-8 w-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )
      default:
        return null
    }
  }

  const getTitle = () => {
    switch (type) {
      case 'success':
        return 'Task Completed! 🎉'
      case 'error':
        return 'Task Completion Failed'
      case 'info':
        return 'Notification'
      default:
        return 'Task Completed! 🎉'
    }
  }

  return (
    <div 
      className="fixed inset-0 z-[10000] backdrop-blur-lg"
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      onClick={handleBackdropClick}
    >
      <div 
        className={`relative transform overflow-hidden rounded-2xl px-6 pb-6 pt-6 text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg ${getModalStyles()} ${
          isExiting ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="sm:flex sm:items-start">
          <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left w-full">
            <div className="flex justify-center mb-6">
              {getIcon()}
            </div>
            
            <h3 className="text-xl font-bold leading-6 text-white mb-3" id="modal-title">
              {getTitle()}
            </h3>
            
            <div className="mt-2">
              <p className="text-base text-white">
                <span className="font-semibold">"{taskName}"</span> {message}
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-6 sm:mt-6 mb-6 sm:mb-6 sm:flex sm:flex-row-reverse gap-3">
          <button
            type="button"
            className="inline-flex w-full justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:bg-blue-700 sm:ml-3 sm:w-auto transition-all duration-200"
            onClick={handleClose}
          >
            Great!
          </button>
        </div>
      </div>
    </div>
  )
}

// Keep the old Toast export for backward compatibility
export const Toast = CompletionModal

export default Toast
