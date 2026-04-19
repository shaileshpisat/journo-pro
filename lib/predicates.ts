import { Entry } from './types'

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

export function isToday(iso: string | null): boolean {
  if (!iso) return false
  return iso.startsWith(todayStr())
}

export function isPast(dateStr: string | null): boolean {
  if (!dateStr) return false
  return dateStr < todayStr()
}

export function isOverdue(entry: Entry): boolean {
  return !!entry.actionDate && entry.actionDate < todayStr()
}
