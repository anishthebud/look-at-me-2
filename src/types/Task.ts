export enum TaskState {
  PENDING = 'pending',
  IN_PROGRESS = 'in-progress',
  COMPLETED = 'completed',
  RECURRING = 'recurring'
}

export interface Task {
  id: string
  name: string
  description?: string
  websites: string[]
  state: TaskState
  createdAt: Date | string
  updatedAt: Date | string
  completedAt?: Date | string
  order: number
}

export interface CreateTaskData {
  name: string
  description?: string
  websites: string[]
}

export interface UpdateTaskData {
  name?: string
  description?: string
  websites?: string[]
  state?: TaskState
  order?: number
}

export interface TaskFormData {
  name: string
  description: string
  websites: string
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
