import React, { useState, useEffect } from 'react'
import { CreateTaskData, TaskFormData, TaskSchedule } from '../types'
import { parseWebsitesString, validateTask, isValidUrl } from '../utils/validation'
import { stringToDate, dateToString, parseDateStringToLocalDate, formatDateForInput } from '../utils/dateUtils'

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

  const [websiteFields, setWebsiteFields] = useState<string[]>([''])

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Add debugging for component lifecycle
  useEffect(() => {
  })

  // Initialize website fields from initial data
  useEffect(() => {
    if (initialData.websites) {
      const websites = initialData.websites.split('\n').filter(website => website.trim() !== '')
      setWebsiteFields(websites.length > 0 ? websites : [''])
    }
  }, [initialData.websites])

  // Create reset function
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      websites: '',
      schedule: TaskSchedule.NONE,
      startDate: null
    })
    setWebsiteFields([''])
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
    if (initialData && (initialData.name || initialData.description || initialData.websites || initialData.schedule || initialData.startDate)) {
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
      startDate: formData.startDate
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
      
      const taskData: CreateTaskData = {
        name: formData.name,
        description: formData.description || undefined,
        websites,
        schedule: formData.schedule,
        startDate: formData.startDate || undefined
      }

      const result = await onSubmit(taskData)
      
      if (result.success) {
        // Don't reset form data here - let the parent component handle it
        setErrors({})
      } else {
        setErrors({ general: result.error || 'Failed to create task' })
      }
    } catch (error) {
      setErrors({ general: 'An unexpected error occurred' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof TaskFormData, value: string | Date | TaskSchedule | null): void => {
    setFormData(prev => {
      let processedValue: any = value
      
      // Handle startDate conversion from string to Date
      if (field === 'startDate' && typeof value === 'string') {
        processedValue = value ? parseDateStringToLocalDate(value) : null
      }

      
      const newData = { ...prev, [field]: processedValue }
      
      // If schedule changed to a recurring type and startDate is null, set it to today
      if (field === 'schedule' && value !== TaskSchedule.NONE && !newData.startDate) {
        const today = new Date()
        today.setHours(0, 0, 0, 0) // Reset time to start of day
        newData.startDate = today
      }
      
      return newData
    })
    
    // Clear field-specific error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleWebsiteChange = (index: number, value: string) => {
    const newWebsiteFields = [...websiteFields]
    newWebsiteFields[index] = value
    setWebsiteFields(newWebsiteFields)
    
    // Update the formData.websites with the combined values
    const validWebsites = newWebsiteFields.filter(website => website.trim() !== '')
    setFormData(prev => ({ ...prev, websites: validWebsites.join('\n') }))
    
    // Clear website error when user starts typing
    if (errors.websites) {
      setErrors(prev => ({ ...prev, websites: '' }))
    }
  }

  const addWebsiteField = () => {
    setWebsiteFields(prev => [...prev, ''])
  }

  const removeWebsiteField = (index: number) => {
    if (websiteFields.length > 1) {
      const newWebsiteFields = websiteFields.filter((_, i) => i !== index)
      setWebsiteFields(newWebsiteFields)
      
      // Update the formData.websites with the remaining values
      const validWebsites = newWebsiteFields.filter(website => website.trim() !== '')
      setFormData(prev => ({ ...prev, websites: validWebsites.join('\n') }))
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
        className="task-form rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto relative z-[10000]" 
        style={{
          backgroundColor: '#1e293b',
          borderColor: '#374151'
        }}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="flex justify-between items-center px-6 border-b border-gray-600">
          <h2 id="modal-title" className="text-xl font-bold text-white">{title}</h2>
          <button
            type="button"
            onClick={onCancel}
            className="w-8 h-8 bg-black border-2 border-black rounded-full flex items-center justify-center hover:bg-gray-800 transition-colors group"
            disabled={isSubmitting}
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
          {errors.general && (
            <div style={{ 
              marginBottom: '16px', 
              padding: '12px', 
              backgroundColor: 'rgba(127, 29, 29, 0.5)', 
              border: '1px solid #ef4444', 
              borderRadius: '6px', 
              color: '#fecaca', 
              fontSize: '14px' 
            }}>
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
        <div className="mb-4">
          <label htmlFor="task-name" className="block text-sm font-medium text-gray-300 mb-2">
            Task Name *
          </label>
          <input
            id="task-name"
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className={`w-full px-3 py-2 bg-gray-700 border rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
              errors.name ? 'border-red-500' : 'border-gray-600'
            }`}
            placeholder="Enter task name"
            disabled={isSubmitting}
          />
          {errors.name && (
            <p style={{ marginTop: '4px', fontSize: '14px', color: '#f87171' }}>{errors.name}</p>
          )}
        </div>

        <div className="mb-4">
          <label htmlFor="task-description" className="block text-sm font-medium text-gray-300 mb-2">
            Description
          </label>
          <textarea
            id="task-description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            className={`w-full px-3 py-2 bg-gray-700 border rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
              errors.description ? 'border-red-500' : 'border-gray-600'
            }`}
            placeholder="Describe what needs to be done"
            rows={3}
            disabled={isSubmitting}
          />
          {errors.description && (
            <p style={{ marginTop: '4px', fontSize: '14px', color: '#f87171' }}>{errors.description}</p>
          )}
        </div>

        <div className="mb-4">
          <label htmlFor="task-schedule" className="block text-sm font-medium text-gray-300 mb-2">
            Recurring Task
          </label>
          <select
            id="task-schedule"
            value={formData.schedule}
            onChange={(e) => handleInputChange('schedule', e.target.value as TaskSchedule)}
            className={`w-full px-3 py-2 bg-gray-700 border rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500 ${
              errors.schedule ? 'border-red-500' : 'border-gray-600'
            }`}
            style={{
              backgroundColor: '#374151',
              color: 'white'
            }}
            disabled={isSubmitting}
          >
            <option value={TaskSchedule.NONE} style={{ backgroundColor: '#1f2937', color: 'white' }}>None</option>
            <option value={TaskSchedule.DAILY} style={{ backgroundColor: '#1f2937', color: 'white' }}>Daily</option>
            <option value={TaskSchedule.WEEKLY} style={{ backgroundColor: '#1f2937', color: 'white' }}>Weekly</option>
            <option value={TaskSchedule.MONTHLY} style={{ backgroundColor: '#1f2937', color: 'white' }}>Monthly</option>
          </select>
          {errors.schedule && (
            <p style={{ marginTop: '4px', fontSize: '14px', color: '#f87171' }}>{errors.schedule}</p>
          )}
        </div>

        <div className="mb-4">
          <label htmlFor="task-start-date" className="block text-sm font-medium text-gray-300 mb-2">
            Scheduled Date {formData.schedule !== TaskSchedule.NONE ? '*' : ''}
          </label>
          <input
            type="date"
            id="task-start-date"
            value={formatDateForInput(formData.startDate)}
            onChange={(e) => handleInputChange('startDate', e.target.value)}
            onClick={(e) => {
              if (!isSubmitting && 'showPicker' in e.target) {
                (e.target as any).showPicker()
              }
            }}
            className={`w-full px-3 py-2 bg-gray-700 border rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500 ${
              errors.startDate ? 'border-red-500' : 'border-gray-600'
            }`}
            disabled={isSubmitting}
            min={formatDateForInput(new Date())}
            required={formData.schedule !== TaskSchedule.NONE}
            placeholder={formData.schedule !== TaskSchedule.NONE ? "Required for recurring tasks" : "Optional"}
          />
          {errors.startDate && (
            <p style={{ marginTop: '4px', fontSize: '14px', color: '#f87171' }}>{errors.startDate}</p>
          )}
          {formData.schedule !== TaskSchedule.NONE && !formData.startDate && (
            <p style={{ marginTop: '4px', fontSize: '14px', color: '#f87171' }}>
              Please select a date for this recurring task
            </p>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Websites *
          </label>
          
          {/* Dynamic Website Fields */}
          {websiteFields.map((website, index) => (
            <div key={index} className="flex gap-2 mb-2">
              <input
                type="text"
                value={website}
                onChange={(e) => handleWebsiteChange(index, e.target.value)}
                className={`flex-1 px-3 py-2 bg-gray-700 border rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                  errors.websites ? 'border-red-500' : 'border-gray-600'
                }`}
                placeholder="https://example.com"
                disabled={isSubmitting}
              />
              {websiteFields.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeWebsiteField(index)}
                  className="px-3 py-2 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                  disabled={isSubmitting}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          
          {errors.websites && (
            <p style={{ marginTop: '4px', fontSize: '14px', color: '#f87171' }}>{errors.websites}</p>
          )}
          
          {/* Add Website Button */}
          <button
            type="button"
            className="mt-2 px-3 py-1 bg-gray-600 text-gray-300 text-sm rounded hover:bg-gray-500 transition-colors"
            onClick={addWebsiteField}
            disabled={isSubmitting}
          >
            + Add Website
          </button>
        </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 bg-gray-600 text-gray-300 rounded hover:bg-gray-500 focus:outline-none disabled:opacity-50 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none disabled:opacity-50 transition-colors"
                disabled={isSubmitting || isLoading || (formData.schedule !== TaskSchedule.NONE && !formData.startDate)}
              >
                {isSubmitting ? 'Creating...' : submitText}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default TaskForm
