import { Task, TaskSchedule, TaskState } from '../types'
import { stringToDate, parseDateStringToLocalDate } from './dateUtils'

/**
 * Compute the next occurrence date for a recurring task.
 * - Anchored to local midnight for all calculations
 * - Returns ISO string (UTC) representing the local-midnight instant of the next date
 * - Returns null if schedule is NONE or inputs are invalid
 */
export const getNextOccurrenceDate = (
  startDateString: string,
  schedule: TaskSchedule
): string | null => {
  if (!startDateString || schedule === TaskSchedule.NONE) return null

  // Resolve base date at local midnight
  const isYMD = /^\d{4}-\d{2}-\d{2}$/.test(startDateString)
  const base = isYMD
    ? parseDateStringToLocalDate(startDateString)
    : (() => {
        const d = stringToDate(startDateString)
        if (!d) return null
        return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)
      })()

  if (!base) return null

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const next = new Date(base)

  // Ensure the returned occurrence is strictly after today
  while (next <= today) {
    switch (schedule) {
      case TaskSchedule.DAILY: {
        next.setDate(next.getDate() + 1)
        break
      }
      case TaskSchedule.WEEKLY: {
        next.setDate(next.getDate() + 7)
        break
      }
      case TaskSchedule.MONTHLY: {
        const day = next.getDate()
        next.setHours(0, 0, 0, 0)
        next.setDate(1)
        next.setMonth(next.getMonth() + 1)
        const daysInMonth = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()
        next.setDate(Math.min(day, daysInMonth))
        break
      }
      default:
        return null
    }
    next.setHours(0, 0, 0, 0)
  }

  return next.toISOString()
}

/**
 * Compute the occurrence immediately after the given base date (one step forward).
 * Returns ISO string at local midnight, or null if invalid/schedule NONE.
 */
export const getNextAfterBaseDate = (
  startDateString: string,
  schedule: TaskSchedule
): string | null => {
  if (!startDateString || schedule === TaskSchedule.NONE) return null

  const isYMD = /^\d{4}-\d{2}-\d{2}$/.test(startDateString)
  const base = isYMD
    ? parseDateStringToLocalDate(startDateString)
    : (() => {
        const d = stringToDate(startDateString)
        if (!d) return null
        return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)
      })()

  if (!base) return null

  const next = new Date(base)
  switch (schedule) {
    case TaskSchedule.DAILY:
      next.setDate(next.getDate() + 1)
      break
    case TaskSchedule.WEEKLY:
      next.setDate(next.getDate() + 7)
      break
    case TaskSchedule.MONTHLY: {
      const day = next.getDate()
      next.setHours(0, 0, 0, 0)
      next.setDate(1)
      next.setMonth(next.getMonth() + 1)
      const daysInMonth = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()
      next.setDate(Math.min(day, daysInMonth))
      break
    }
    default:
      return null
  }
  next.setHours(0, 0, 0, 0)
  return next.toISOString()
}

export const buildNextAfterBaseTask = (task: Task): Task | null => {
  if (!task.startDate || task.schedule === TaskSchedule.NONE) return null
  const nextIso = getNextAfterBaseDate(task.startDate, task.schedule)
  if (!nextIso) return null
  return {
    ...task,
    id: `${task.id}_next_after_base`,
    startDate: nextIso,
    state: TaskState.PENDING,
    updatedAt: new Date().toISOString()
  }
}

/**
 * Build a Task object representing the next occurrence of the given recurring task.
 * - Returns null if no valid next occurrence can be computed
 * - Does not persist; caller decides whether to save or display
 */
export const buildNextOccurrenceTask = (task: Task): Task | null => {
  if (!task.startDate || task.schedule === TaskSchedule.NONE) return null

  const nextIso = getNextOccurrenceDate(task.startDate, task.schedule)
  if (!nextIso) return null

  return {
    ...task,
    id: `${task.id}_next_occurrence`,
    startDate: nextIso,
    state: TaskState.PENDING,
    updatedAt: new Date().toISOString()
  }
}


