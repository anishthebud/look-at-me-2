// Simple ad-hoc test harness for next-occurrence calculation

const TaskSchedule = {
  NONE: 'none',
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly'
}

const formatDateForInput = (date) => {
  if (!date) return ''
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const stringToDate = (dateString) => {
  if (!dateString) return null
  const d = new Date(dateString)
  return isNaN(d.getTime()) ? null : d
}

const parseDateString = (dateString) => {
  if (!dateString || typeof dateString !== 'string') return null
  const m = dateString.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) return null
  const [, ys, ms, ds] = m
  const y = parseInt(ys, 10)
  const mo = parseInt(ms, 10)
  const d = parseInt(ds, 10)
  if (isNaN(y) || isNaN(mo) || isNaN(d)) return null
  const max = new Date(y, mo, 0).getDate()
  if (d < 1 || d > max) return null
  return { y, mo, d }
}

const parseDateStringToLocalDate = (dateString) => {
  const p = parseDateString(dateString)
  if (!p) return null
  return new Date(p.y, p.mo - 1, p.d, 0, 0, 0, 0)
}

const getNextOccurrenceDate = (startDateString, schedule) => {
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

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const next = new Date(base)

  while (next <= today) {
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
  }

  return next.toISOString()
}

// Test cases
const today = new Date()
today.setHours(0, 0, 0, 0)
const todayStr = formatDateForInput(today)

const mkDate = (d) => formatDateForInput(d)

const yesterday = new Date(today)
yesterday.setDate(today.getDate() - 1)

const lastWeek = new Date(today)
lastWeek.setDate(today.getDate() - 7)

const lastMonth = new Date(today)
lastMonth.setMonth(today.getMonth() - 1)

const nextWeek = new Date(today)
nextWeek.setDate(today.getDate() + 7)

const cases = [
  { name: 'Daily from yesterday', start: mkDate(yesterday), schedule: TaskSchedule.DAILY },
  { name: 'Weekly from last week', start: mkDate(lastWeek), schedule: TaskSchedule.WEEKLY },
  { name: 'Monthly from last month', start: mkDate(lastMonth), schedule: TaskSchedule.MONTHLY },
  { name: 'Weekly future (next week)', start: mkDate(nextWeek), schedule: TaskSchedule.WEEKLY },
  { name: 'Daily from today', start: mkDate(today), schedule: TaskSchedule.DAILY },
  { name: 'Monthly 31st edge (simulate Jan 31)', start: '2025-01-31', schedule: TaskSchedule.MONTHLY },
]

console.log(`Today (local): ${todayStr}`)
console.log('---')
for (const c of cases) {
  const nextIso = getNextOccurrenceDate(c.start, c.schedule)
  const nextLocal = nextIso ? new Date(nextIso) : null
  console.log(`${c.name}`)
  console.log(`  start: ${c.start}, schedule: ${c.schedule}`)
  console.log(`  next:  ${nextIso} (${nextLocal ? formatDateForInput(nextLocal) : 'null'})`)
}


