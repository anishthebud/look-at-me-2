/**
 * Date utility functions for handling date conversions between storage and calculations
 */

/**
 * Convert a date string to a Date object for calculations
 * @param dateString - ISO date string from storage
 * @returns Date object or null if invalid
 */
export const stringToDate = (dateString: string | undefined | null): Date | null => {
  if (!dateString) return null
  const date = new Date(dateString)
  return isNaN(date.getTime()) ? null : date
}

/**
 * Convert a Date object to ISO string for storage
 * @param date - Date object
 * @returns ISO string or undefined if null
 */
export const dateToString = (date: Date | null | undefined): string | undefined => {
  return date ? date.toISOString() : undefined
}

/**
 * Format a date string for display
 * @param dateString - ISO date string
 * @returns Formatted date string or 'Invalid date' if invalid
 */
export const formatDateString = (dateString: string): string => {
  const date = stringToDate(dateString)
  if (!date) return 'Invalid date'
  return date.toLocaleDateString()
}

/**
 * Check if a date string is today
 * @param dateString - ISO date string
 * @returns true if the date is today
 */
export const isToday = (dateString: string): boolean => {
  const date = stringToDate(dateString)
  if (!date) return false
  
  const today = new Date()
  return date.toDateString() === today.toDateString()
}

/**
 * Check if a date string is in the past
 * @param dateString - ISO date string
 * @returns true if the date is before today
 */
export const isPastDate = (dateString: string): boolean => {
  const date = stringToDate(dateString)
  if (!date) return false
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const compareDate = new Date(date)
  compareDate.setHours(0, 0, 0, 0)
  
  return compareDate < today
}

/**
 * Check if a date string is in the future
 * @param dateString - ISO date string
 * @returns true if the date is after today
 */
export const isFutureDate = (dateString: string): boolean => {
  const date = stringToDate(dateString)
  if (!date) return false
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const compareDate = new Date(date)
  compareDate.setHours(0, 0, 0, 0)
  
  return compareDate > today
}

/**
 * Get the number of days between two date strings
 * @param startDateString - Start date ISO string
 * @param endDateString - End date ISO string
 * @returns Number of days between dates
 */
export const getDaysBetween = (startDateString: string, endDateString: string): number => {
  const startDate = stringToDate(startDateString)
  const endDate = stringToDate(endDateString)
  
  if (!startDate || !endDate) return 0
  
  const timeDiff = endDate.getTime() - startDate.getTime()
  return Math.ceil(timeDiff / (1000 * 3600 * 24))
}
