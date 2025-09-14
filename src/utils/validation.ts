import { INVALID_PROTOCOLS, ALLOWED_PROTOCOLS, MIN_TASK_NAME_LENGTH, MAX_TASK_NAME_LENGTH, MAX_TASK_DESCRIPTION_LENGTH, MIN_WEBSITES_COUNT, MAX_WEBSITES_COUNT } from './constants'

export interface ValidationError {
  field: string
  message: string
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

/**
 * Validates if a URL is safe and allowed for tasks
 */
export const isValidUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') {
    return false
  }

  const trimmedUrl = url.trim()
  
  // Check if URL is empty
  if (trimmedUrl.length === 0) {
    return false
  }

  // Check for invalid protocols
  const hasInvalidProtocol = INVALID_PROTOCOLS.some(protocol => 
    trimmedUrl.toLowerCase().startsWith(protocol)
  )
  
  if (hasInvalidProtocol) {
    return false
  }

  // Check if URL has a valid protocol
  const hasValidProtocol = ALLOWED_PROTOCOLS.some(protocol => 
    trimmedUrl.toLowerCase().startsWith(protocol)
  )

  let urlToValidate = trimmedUrl

  // If no protocol, assume HTTPS
  if (!hasValidProtocol && !trimmedUrl.includes('://')) {
    urlToValidate = `https://${trimmedUrl}`
  }

  // Validate URL format
  try {
    const urlObj = new URL(urlToValidate)
    
    // Additional checks for valid website URLs
    // Must have a valid hostname
    if (!urlObj.hostname || urlObj.hostname.length === 0) {
      return false
    }
    
    // Hostname must contain at least one dot (for domain names)
    if (!urlObj.hostname.includes('.')) {
      return false
    }
    
    // Hostname cannot be just numbers or special characters
    if (!/^[a-zA-Z0-9.-]+$/.test(urlObj.hostname)) {
      return false
    }
    
    // Must be a valid website domain (not localhost, IP addresses, etc.)
    // Allow common domains but be more strict
    if (urlObj.hostname === 'localhost' || 
        urlObj.hostname === '127.0.0.1' ||
        /^\d+\.\d+\.\d+\.\d+$/.test(urlObj.hostname)) {
      return false
    }
    
    return true
  } catch {
    return false
  }
}

/**
 * Normalizes a URL by adding https:// if no protocol is specified
 */
export const normalizeUrl = (url: string): string => {
  const trimmedUrl = url.trim()
  
  if (trimmedUrl.includes('://')) {
    return trimmedUrl
  }
  
  return `https://${trimmedUrl}`
}

/**
 * Validates task name
 */
export const validateTaskName = (name: string): ValidationError[] => {
  const errors: ValidationError[] = []
  
  if (!name || typeof name !== 'string') {
    errors.push({
      field: 'name',
      message: 'Task name is required'
    })
    return errors
  }

  const trimmedName = name.trim()
  
  if (trimmedName.length < MIN_TASK_NAME_LENGTH) {
    errors.push({
      field: 'name',
      message: `Task name must be at least ${MIN_TASK_NAME_LENGTH} character long`
    })
  }
  
  if (trimmedName.length > MAX_TASK_NAME_LENGTH) {
    errors.push({
      field: 'name',
      message: `Task name must be no more than ${MAX_TASK_NAME_LENGTH} characters long`
    })
  }
  
  return errors
}

/**
 * Validates task description
 */
export const validateTaskDescription = (description: string): ValidationError[] => {
  const errors: ValidationError[] = []
  
  if (description && description.length > MAX_TASK_DESCRIPTION_LENGTH) {
    errors.push({
      field: 'description',
      message: `Description must be no more than ${MAX_TASK_DESCRIPTION_LENGTH} characters long`
    })
  }
  
  return errors
}

/**
 * Validates task websites
 */
export const validateTaskWebsites = (websites: string[]): ValidationError[] => {
  const errors: ValidationError[] = []
  
  if (!Array.isArray(websites)) {
    errors.push({
      field: 'websites',
      message: 'Websites must be an array'
    })
    return errors
  }
  
  if (websites.length < MIN_WEBSITES_COUNT) {
    errors.push({
      field: 'websites',
      message: `At least ${MIN_WEBSITES_COUNT} website is required`
    })
  }
  
  if (websites.length > MAX_WEBSITES_COUNT) {
    errors.push({
      field: 'websites',
      message: `Maximum ${MAX_WEBSITES_COUNT} websites allowed`
    })
  }
  
  // Validate each URL
  websites.forEach((website, index) => {
    if (!isValidUrl(website)) {
      errors.push({
        field: 'websites',
        message: `Invalid URL at position ${index + 1}: ${website}`
      })
    }
  })
  
  return errors
}

/**
 * Validates task start date
 */
export const validateTaskStartDate = (startDate: Date, schedule: string): ValidationError[] => {
  const errors: ValidationError[] = []
  
  // Start date is required for recurring tasks (not 'none')
  if (schedule !== 'none' && !startDate) {
    errors.push({
      field: 'startDate',
      message: 'Start date is required for recurring tasks'
    })
    return errors
  }
  
  // If start date is provided, validate it
  if (startDate) {
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Reset time to start of day
    
    if (startDate < today) {
      errors.push({
        field: 'startDate',
        message: 'Start date cannot be in the past'
      })
    }
  }
  
  return errors
}

/**
 * Validates a complete task
 */
export const validateTask = (taskData: {
  name: string
  description?: string
  websites: string[]
  schedule?: string
  startDate?: Date
}): ValidationResult => {
  const errors: ValidationError[] = []
  
  errors.push(...validateTaskName(taskData.name))
  
  if (taskData.description) {
    errors.push(...validateTaskDescription(taskData.description))
  }
  
  errors.push(...validateTaskWebsites(taskData.websites))
  
  if (taskData.startDate) {
    errors.push(...validateTaskStartDate(taskData.startDate, taskData.schedule || 'none'))
  } else if (taskData.schedule && taskData.schedule !== 'none') {
    // For recurring tasks without start date, add validation error
    errors.push(...validateTaskStartDate(new Date(), taskData.schedule))
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Parses websites string into array of URLs
 */
export const parseWebsitesString = (websitesString: string): string[] => {
  if (!websitesString || typeof websitesString !== 'string') {
    return []
  }
  
  return websitesString
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .filter(line => isValidUrl(line)) // Only keep valid URLs
    .map(normalizeUrl)
}
