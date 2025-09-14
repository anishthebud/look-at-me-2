export enum TaskState {
  PENDING = 'pending',
  IN_PROGRESS = 'in-progress',
  COMPLETED = 'completed',
  RECURRING = 'recurring'
}

export enum TaskSchedule {
  NONE = 'none',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly'
}

export interface Task {
  id: string
  name: string
  description?: string
  websites: string[]
  state: TaskState
  schedule: TaskSchedule
  startDate?: string  // Always stored as ISO string
  createdAt: string   // Always stored as ISO string
  updatedAt: string   // Always stored as ISO string
  completedAt?: string // Always stored as ISO string
  order: number
}

export interface CreateTaskData {
  name: string
  description?: string
  websites: string[]
  schedule: TaskSchedule
  startDate?: Date  // Accept Date for input, will be converted to string
}

export interface UpdateTaskData {
  name?: string
  description?: string
  websites?: string[]
  state?: TaskState
  schedule?: TaskSchedule
  startDate?: Date | string  // Accept both for flexibility
  order?: number
}

export interface TaskFormData {
  name: string
  description: string
  websites: string
  schedule: TaskSchedule
  startDate: Date | null
}

export interface TaskListState {
  tasks: Task[]
  currentPage: number
  totalPages: number
  isLoading: boolean
  error: string | null
}

export interface TaskStorage {
  tasks: Task[]
  lastReset: string
  userPreferences: {
    tasksPerPage: number
    showCompletedTasks: boolean
  }
}
