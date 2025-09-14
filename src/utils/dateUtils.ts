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

/**
 * Parse a date string (YYYY-MM-DD) into year, month, and day components
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Object with year, month, and day numbers, or null if invalid
 */
export const parseDateString = (dateString: string): { year: number; month: number; day: number } | null => {
  if (!dateString || typeof dateString !== 'string') return null
  
  // Match YYYY-MM-DD format
  const dateMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!dateMatch) return null
  
  const [, yearStr, monthStr, dayStr] = dateMatch
  const year = parseInt(yearStr, 10)
  const month = parseInt(monthStr, 10)
  const day = parseInt(dayStr, 10)
  
  // Validate the date components
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null
  if (year < 1000 || year > 9999) return null
  if (month < 1 || month > 12) return null
  if (day < 1 || day > 31) return null
  
  // Additional validation for day based on month
  const daysInMonth = new Date(year, month, 0).getDate()
  if (day > daysInMonth) return null
  
  return { year, month, day }
}

/**
 * Create a Date object from year, month, and day components at 12:00 AM local time
 * @param year - Year (e.g., 2024)
 * @param month - Month (1-12)
 * @param day - Day (1-31)
 * @returns Date object at 12:00 AM local time, or null if invalid
 */
export const createLocalDate = (year: number, month: number, day: number): Date | null => {
  // Validate inputs
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null
  if (year < 1000 || year > 9999) return null
  if (month < 1 || month > 12) return null
  if (day < 1 || day > 31) return null
  
  // Additional validation for day based on month
  const daysInMonth = new Date(year, month, 0).getDate()
  if (day > daysInMonth) return null
  
  // Create date at 12:00 AM local time
  const date = new Date(year, month - 1, day, 0, 0, 0, 0)
  return isNaN(date.getTime()) ? null : date
}

/**
 * Parse a date string and create a local Date object at 12:00 AM
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Date object at 12:00 AM local time, or null if invalid
 */
export const parseDateStringToLocalDate = (dateString: string): Date | null => {
  const parsed = parseDateString(dateString)
  if (!parsed) return null
  
  return createLocalDate(parsed.year, parsed.month, parsed.day)
}

/**
 * Format a Date object to YYYY-MM-DD string for HTML date inputs
 * @param date - Date object
 * @returns Date string in YYYY-MM-DD format, or empty string if null
 */
export const formatDateForInput = (date: Date | null | undefined): string => {
  if (!date) return ''
  
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  
  return `${year}-${month}-${day}`
}

/**
 * Check if a date string represents today
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
 * Check if a date string is in the future (after today)
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
 * Check if a date string is in the past (before today)
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