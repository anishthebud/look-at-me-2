// Task management constants
export const MAX_TASKS_PER_DAY = 12
export const VISIBLE_TASKS = 8
export const MAX_TASKS_PER_PAGE = 8

// Storage keys
export const STORAGE_KEYS = {
  TASKS: 'tasks',
  USER_PREFERENCES: 'userPreferences',
  LAST_RESET: 'lastReset'
} as const

// Chrome API constants
export const TAB_GROUP_COLORS = [
  'grey',
  'blue', 
  'red',
  'yellow',
  'green',
  'pink',
  'purple',
  'cyan'
] as const

// UI constants
export const TOAST_DURATION = 3000
export const ANIMATION_DURATION = 200
export const DEBOUNCE_DELAY = 300

// URL validation
export const INVALID_PROTOCOLS = [
  'chrome://',
  'chrome-extension://',
  'file://',
  'data:',
  'javascript:',
  'about:'
] as const

export const ALLOWED_PROTOCOLS = [
  'http://',
  'https://'
] as const

// Task form validation
export const MIN_TASK_NAME_LENGTH = 1
export const MAX_TASK_NAME_LENGTH = 50
export const MAX_TASK_DESCRIPTION_LENGTH = 200
export const MIN_WEBSITES_COUNT = 1
export const MAX_WEBSITES_COUNT = 10
