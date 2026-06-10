import { Entry } from './types'

export function todayLocalStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function toLocalDateStr(iso: string | number | Date): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function isToday(iso: string | null): boolean {
  if (!iso) return false
  return toLocalDateStr(iso) === todayLocalStr()
}

export function isPast(dateStr: string | null): boolean {
  if (!dateStr) return false
  return dateStr < todayLocalStr()
}

export function isOverdue(entry: Entry): boolean {
  return !!entry.actionDate && entry.actionDate < todayLocalStr()
}
