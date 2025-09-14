import React, { useState, useEffect } from 'react'
import { CreateTaskData, TaskFormData } from '../types'
import { parseWebsitesString, validateTask, isValidUrl } from '../utils/validation'

export interface TaskFormProps {
  onSubmit: (taskData: CreateTaskData) => Promise<{ success: boolean; error?: string }>
  onCancel: () => void
  isLoading?: boolean
  initialData?: Partial<TaskFormData>
  title?: string
  submitText?: string
  onFormReady?: (resetFn: () => void) => void
}

export const TaskForm: React.FC<TaskFormProps> = ({
  onSubmit,
  onCancel,
  isLoading = false,
  initialData = {},
  title = 'Create New Task',
  submitText = 'Create Task',
  onFormReady
}) => {
  const [formData, setFormData] = useState<TaskFormData>({
    name: initialData.name || '',
    description: initialData.description || '',
    websites: initialData.websites || ''
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
      websites: ''
    })
    setErrors({})
  }

  // Provide reset function to parent
  useEffect(() => {
    if (onFormReady) {
      onFormReady(resetForm)
    }
  }, [onFormReady])

  // Only reset form data when the component first mounts with initial data
  useEffect(() => {
    console.log('TaskForm initialData useEffect triggered', initialData)
    if (initialData && (initialData.name || initialData.description || initialData.websites)) {
      console.log('Resetting form data due to initialData')
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        websites: initialData.websites || ''
      })
    }
  }, []) // Empty dependency array - only run on mount

  const validateForm = (): boolean => {
    const websites = parseWebsitesString(formData.websites)
    const validation = validateTask({
      name: formData.name,
      description: formData.description,
      websites
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
        websites
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

  const handleInputChange = (field: keyof TaskFormData, value: string): void => {
    console.log(`Form input change - ${field}:`, value) // Debug log
    setFormData(prev => {
      const newData = { ...prev, [field]: value }
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

  return (
    <div className="task-form bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-auto">
      <h2 className="text-xl font-semibold text-gray-800 mb-6">{title}</h2>
      
      {errors.general && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-md">
          <p className="text-red-700 text-sm">{errors.general}</p>
        </div>
      )}

      {/* Form State Preview - Debug */}
      <div className="mb-4 p-3 bg-gray-100 rounded-md text-xs">
        <strong>Form State Preview:</strong>
        <pre className="mt-1">
          Name: "{formData.name}"<br/>
          Description: "{formData.description}"<br/>
          Websites: "{formData.websites}"
        </pre>
      </div>

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
  )
}

export default TaskForm
