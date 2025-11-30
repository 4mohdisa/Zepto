import { addDays, addWeeks, addMonths, addYears } from 'date-fns'
import { FrequencyType } from '@/app/types/transaction'

/** Frequency interval in days (approximate for month-based) */
const FREQUENCY_DAYS: Record<string, number> = {
  Daily: 1,
  Weekly: 7,
  'Bi-Weekly': 14,
  'Tri-Weekly': 21,
  Monthly: 30,
  'Bi-Monthly': 60,
  Quarterly: 90,
  'Semi-Annually': 180,
  Annually: 365,
}

/**
 * Normalizes a date to the start of day (midnight)
 */
export function normalizeDate(date: Date): Date {
  const normalized = new Date(date)
  normalized.setHours(0, 0, 0, 0)
  return normalized
}

/**
 * Formats a date to ISO date string (YYYY-MM-DD)
 */
export function formatDateToISO(date: string | Date | number): string {
  if (typeof date === 'string') {
    return new Date(date).toISOString().split('T')[0]
  }
  if (typeof date === 'number') {
    return new Date(date).toISOString().split('T')[0]
  }
  return date.toISOString().split('T')[0]
}

/**
 * Advances a date by the specified frequency
 */
export function advanceDateByFrequency(date: Date, frequency: string): Date {
  const result = new Date(date)
  
  switch (frequency) {
    case 'Daily':
    case 'daily':
      return addDays(result, 1)
    case 'Weekly':
    case 'weekly':
      return addWeeks(result, 1)
    case 'Bi-Weekly':
      return addDays(result, 14)
    case 'Tri-Weekly':
      return addDays(result, 21)
    case 'Monthly':
    case 'monthly':
      return addMonths(result, 1)
    case 'Bi-Monthly':
      return addMonths(result, 2)
    case 'Quarterly':
      return addMonths(result, 3)
    case 'Semi-Annually':
      return addMonths(result, 6)
    case 'Annually':
    case 'yearly':
      return addYears(result, 1)
    default:
      console.warn(`Unsupported frequency: ${frequency}, defaulting to Monthly`)
      return addMonths(result, 1)
  }
}

/**
 * Calculates the most recent due date for a recurring transaction
 * @param startDate - The start date of the recurring transaction
 * @param frequency - The frequency type
 * @param targetDate - The target date to compare against (usually today)
 * @returns The most recent due date that should have occurred by the target date, or null if not due yet
 */
export function getMostRecentDueDate(
  startDate: Date,
  frequency: string,
  targetDate: Date
): Date | null {
  const start = normalizeDate(startDate)
  const target = normalizeDate(targetDate)
  
  if (start > target) return null
  if (start.getTime() === target.getTime()) return start
  
  const diffTime = target.getTime() - start.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  
  let dueDate = new Date(start)
  
  switch (frequency) {
    case 'Daily':
    case 'daily':
      return target
      
    case 'Weekly':
    case 'weekly': {
      const periods = Math.floor(diffDays / 7)
      dueDate.setDate(start.getDate() + periods * 7)
      break
    }
    
    case 'Bi-Weekly': {
      const periods = Math.floor(diffDays / 14)
      dueDate.setDate(start.getDate() + periods * 14)
      break
    }
    
    case 'Tri-Weekly': {
      const periods = Math.floor(diffDays / 21)
      dueDate.setDate(start.getDate() + periods * 21)
      break
    }
    
    case 'Monthly':
    case 'monthly':
      dueDate = findLastOccurrenceByMonth(start, target, 1)
      break
      
    case 'Bi-Monthly':
      dueDate = findLastOccurrenceByMonth(start, target, 2)
      break
      
    case 'Quarterly':
      dueDate = findLastOccurrenceByMonth(start, target, 3)
      break
      
    case 'Semi-Annually':
      dueDate = findLastOccurrenceByMonth(start, target, 6)
      break
      
    case 'Annually':
    case 'yearly':
      dueDate = findLastOccurrenceByYear(start, target)
      break
      
    default:
      console.warn(`Unsupported frequency: ${frequency}, defaulting to Monthly`)
      dueDate = findLastOccurrenceByMonth(start, target, 1)
  }
  
  return dueDate > target ? null : dueDate
}

/**
 * Generates the next N future dates based on frequency
 * @param startDate - The starting date
 * @param frequency - The frequency type
 * @param count - Number of future dates to generate
 * @param endDate - Optional end date limit
 * @returns Array of future dates
 */
export function getNextDates(
  startDate: Date,
  frequency: string,
  count: number,
  endDate?: Date
): Date[] {
  const dates: Date[] = []
  let current = normalizeDate(startDate)
  const today = normalizeDate(new Date())
  
  const maxIterations = count * 20
  let iterations = 0
  
  while (dates.length < count && iterations < maxIterations) {
    iterations++
    
    if (current >= today && (!endDate || current <= endDate)) {
      dates.push(new Date(current))
    }
    
    current = advanceDateByFrequency(current, frequency)
    
    if (endDate && current > endDate) break
  }
  
  return dates
}

/**
 * Helper to find the last occurrence for month-based frequencies
 */
function findLastOccurrenceByMonth(start: Date, target: Date, monthInterval: number): Date {
  let periods = 0
  let dueDate = new Date(start)
  
  while (true) {
    const nextDate = new Date(start)
    nextDate.setMonth(start.getMonth() + (periods + 1) * monthInterval)
    
    if (nextDate > target) {
      dueDate = new Date(start)
      dueDate.setMonth(start.getMonth() + periods * monthInterval)
      break
    }
    periods++
  }
  
  return dueDate
}

/**
 * Helper to find the last occurrence for yearly frequency
 */
function findLastOccurrenceByYear(start: Date, target: Date): Date {
  let years = 0
  let dueDate = new Date(start)
  
  while (true) {
    const nextDate = new Date(start)
    nextDate.setFullYear(start.getFullYear() + years + 1)
    
    if (nextDate > target) {
      dueDate = new Date(start)
      dueDate.setFullYear(start.getFullYear() + years)
      break
    }
    years++
  }
  
  return dueDate
}

/**
 * Gets approximate days for a frequency (useful for sorting/comparison)
 */
export function getFrequencyDays(frequency: string): number {
  return FREQUENCY_DAYS[frequency] || 30
}
