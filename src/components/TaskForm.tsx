import React, { useState, useEffect } from 'react'
import { CreateTaskData, TaskFormData, TaskSchedule } from '../types'
import { parseWebsitesString, validateTask, isValidUrl } from '../utils/validation'
import { stringToDate, dateToString } from '../utils/dateUtils'

export interface TaskFormProps {
  onSubmit: (taskData: CreateTaskData) => Promise<{ success: boolean; error?: string }>
  onCancel: () => void
  isLoading?: boolean
  initialData?: Partial<TaskFormData>
  title?: string
  submitText?: string
  onFormReady?: (resetFn: () => void) => void
  isOpen?: boolean
}

export const TaskForm: React.FC<TaskFormProps> = ({
  onSubmit,
  onCancel,
  isLoading = false,
  initialData = {},
  title = 'Create New Task',
  submitText = 'Create Task',
  onFormReady,
  isOpen = true
}) => {
  const [formData, setFormData] = useState<TaskFormData>({
    name: initialData.name || '',
    description: initialData.description || '',
    websites: initialData.websites || '',
    schedule: initialData.schedule || TaskSchedule.NONE,
    startDate: initialData.startDate || null
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Add debugging for component lifecycle
  useEffect(() => {
    console.log('TaskForm mounted or re-rendered')
  })

  // Create reset function
  const resetForm = () => {
    console.log('Resetting form data')
    setFormData({
      name: '',
      description: '',
      websites: '',
      schedule: TaskSchedule.NONE,
      startDate: null
    })
    setErrors({})
  }

  // Provide reset function to parent
  useEffect(() => {
    if (onFormReady) {
      onFormReady(resetForm)
    }
  }, [onFormReady])

  // Focus the modal when it opens
  useEffect(() => {
    if (isOpen) {
      // Focus the modal container
      const modalElement = document.querySelector('.task-form')
      if (modalElement) {
        (modalElement as HTMLElement).focus()
      }
    }
  }, [isOpen])

  // Only reset form data when the component first mounts with initial data
  useEffect(() => {
    console.log('TaskForm initialData useEffect triggered', initialData)
    if (initialData && (initialData.name || initialData.description || initialData.websites || initialData.schedule || initialData.startDate)) {
      console.log('Resetting form data due to initialData')
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        websites: initialData.websites || '',
        schedule: initialData.schedule || TaskSchedule.NONE,
        startDate: initialData.startDate || null
      })
    }
  }, []) // Empty dependency array - only run on mount

  const validateForm = (): boolean => {
    const websites = parseWebsitesString(formData.websites)
    const validation = validateTask({
      name: formData.name,
      description: formData.description,
      websites,
      schedule: formData.schedule,
      startDate: formData.startDate || undefined
    })

    const newErrors: Record<string, string> = {}
    
    if (!validation.isValid) {
      validation.errors.forEach(error => {
        if (error.field === 'websites') {
          newErrors.websites = error.message
        } else {
          newErrors[error.field] = error.message
        }
      })
    }

    setErrors(newErrors)
    return validation.isValid
  }

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    
    try {
      const websites = parseWebsitesString(formData.websites)
      console.log('Parsed websites:', websites) // Debug log
      console.log('Original websites string:', formData.websites) // Debug log
      
      const taskData: CreateTaskData = {
        name: formData.name,
        description: formData.description || undefined,
        websites,
        schedule: formData.schedule,
        startDate: formData.startDate || undefined
      }

      console.log('Submitting task data:', taskData) // Debug log
      const result = await onSubmit(taskData)
      console.log('Submit result:', result) // Debug log
      
      if (result.success) {
        // Don't reset form data here - let the parent component handle it
        setErrors({})
      } else {
        setErrors({ general: result.error || 'Failed to create task' })
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      setErrors({ general: 'An unexpected error occurred' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof TaskFormData, value: string | Date | TaskSchedule | null): void => {
    console.log(`Form input change - ${field}:`, value) // Debug log
    setFormData(prev => {
      let processedValue: any = value
      
      // Handle startDate conversion from string to Date
      if (field === 'startDate' && typeof value === 'string') {
        processedValue = value ? new Date(value) : null
      }
      
      const newData = { ...prev, [field]: processedValue }
      console.log('Updated form data:', newData) // Debug log
      return newData
    })
    
    // Clear field-specific error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSubmit(e)
    }
  }

  if (!isOpen) {
    return null
  }

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
          onCancel()
        }
      }}
    >
      <div 
        className="task-form bg-white rounded-lg shadow-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto relative z-[10000]" 
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 id="modal-title" className="text-2xl font-bold text-gray-900">{title}</h2>
          <button
            type="button"
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isSubmitting}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <p className="text-gray-600 mb-6">
          {title.includes('Edit') 
            ? 'Update the task details below.'
            : 'Fill out the form below to create a new task.'
          }
        </p>
        
        {errors.general && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-md">
            <p className="text-red-700 text-sm">{errors.general}</p>
          </div>
        )}


      <form onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
        <div className="mb-4">
          <label htmlFor="task-name" className="block text-sm font-medium text-gray-700 mb-2">
            Task Name *
          </label>
          <input
            id="task-name"
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.name ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Enter task name"
            disabled={isSubmitting}
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name}</p>
          )}
        </div>

        <div className="mb-4">
          <label htmlFor="task-description" className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            id="task-description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.description ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Enter task description (optional)"
            rows={3}
            disabled={isSubmitting}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description}</p>
          )}
        </div>

        <div className="mb-4">
          <label htmlFor="task-schedule" className="block text-sm font-medium text-gray-700 mb-2">
            Recurrence *
          </label>
          <select
            id="task-schedule"
            value={formData.schedule}
            onChange={(e) => handleInputChange('schedule', e.target.value as TaskSchedule)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.schedule ? 'border-red-300' : 'border-gray-300'
            }`}
            disabled={isSubmitting}
          >
            <option value={TaskSchedule.NONE}>None</option>
            <option value={TaskSchedule.DAILY}>Daily</option>
            <option value={TaskSchedule.WEEKLY}>Weekly</option>
            <option value={TaskSchedule.MONTHLY}>Monthly</option>
          </select>
          {errors.schedule && (
            <p className="mt-1 text-sm text-red-600">{errors.schedule}</p>
          )}
        </div>

        <div className="mb-4">
          <label htmlFor="task-start-date" className="block text-sm font-medium text-gray-700 mb-2">
            Start Date {formData.schedule !== TaskSchedule.NONE ? '*' : ''}
          </label>
          <input
            type="date"
            id="task-start-date"
            value={formData.startDate ? formData.startDate.toISOString().split('T')[0] : ''}
            onChange={(e) => handleInputChange('startDate', e.target.value)}
            onClick={(e) => {
              if (!isSubmitting && 'showPicker' in e.target) {
                (e.target as any).showPicker()
              }
            }}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.startDate ? 'border-red-300' : 'border-gray-300'
            }`}
            disabled={isSubmitting}
            min={new Date().toISOString().split('T')[0]}
            placeholder={formData.schedule !== TaskSchedule.NONE ? "Required for recurring tasks" : "Optional"}
          />
          {errors.startDate && (
            <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            {formData.schedule !== TaskSchedule.NONE 
              ? "When should this recurring task first be available to start?"
              : "When should this task first be available to start? (optional)"
            }
          </p>
        </div>

        <div className="mb-6">
          <label htmlFor="task-websites" className="block text-sm font-medium text-gray-700 mb-2">
            Websites *
          </label>
          <textarea
            id="task-websites"
            value={formData.websites}
            onChange={(e) => handleInputChange('websites', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.websites ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="Enter URLs, one per line:&#10;https://example.com&#10;https://another-site.com"
            rows={4}
            disabled={isSubmitting}
          />
          {errors.websites && (
            <p className="mt-1 text-sm text-red-600">{errors.websites}</p>
          )}
          
          {/* Real-time URL validation feedback */}
          {formData.websites && (
            <div className="mt-2 text-xs">
              <div className="text-gray-600 mb-1">URL Validation:</div>
              {formData.websites.split('\n').map((line, index) => {
                const trimmedLine = line.trim()
                if (trimmedLine.length === 0) return null
                
                const isValid = isValidUrl(trimmedLine)
                
                return (
                  <div key={index} className={`flex items-center gap-2 mb-1 ${isValid ? 'text-green-600' : 'text-red-600'}`}>
                    <span>{isValid ? '✓' : '✗'}</span>
                    <span className="truncate">{trimmedLine}</span>
                    {!isValid && (
                      <span className="text-red-500">(Invalid URL)</span>
                    )}
                  </div>
                )
              })}
            </div>
          )}
          
          <p className="mt-1 text-xs text-gray-500">
            Enter one URL per line. Only valid website URLs will be accepted.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            disabled={isSubmitting || isLoading}
          >
            {isSubmitting ? 'Creating...' : submitText}
          </button>
        </div>
      </form>
      </div>
    </div>
  )
}

export default TaskForm
