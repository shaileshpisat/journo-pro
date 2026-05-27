import { Entry } from './types'

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

function daysAhead(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

function parseCaretDate(raw: string): string | null {
  const cleaned = raw.trim().toLowerCase()
  if (cleaned === 'today') return todayStr()
  if (cleaned === 'tomorrow') return daysAhead(1)
  if (cleaned === 'yesterday') return daysAhead(-1)
  if (/^[+-]\d+$/.test(cleaned)) return daysAhead(parseInt(cleaned))
  const dayMap: Record<string, number> = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 }
  const prefix = cleaned.slice(0, 3)
  if (prefix in dayMap) {
    const target = dayMap[prefix]
    const today = new Date().getDay()
    let diff = target - today
    if (diff <= 0) diff += 7
    return daysAhead(diff)
  }
  if (/^\d{1,2}\/\d{1,2}$/.test(cleaned)) {
    const [m, d] = cleaned.split('/').map(Number)
    const date = new Date(new Date().getFullYear(), m - 1, d)
    return date.toISOString().split('T')[0]
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) return cleaned
  return null
}

export function parseEntry(text: string): Partial<Entry> {
  const result: Partial<Entry> = { tags: [] }

  const entityMatch = text.match(/@([\w]+)/)
  if (entityMatch) result.entity = entityMatch[1]

  const tagMatches = [...text.matchAll(/#([\w]+)/g)]
  result.tags = tagMatches.map((m) => m[1])

  const folderMatch = text.match(/\/([\w]+(?:\/[\w]+)*)/)
  if (folderMatch) result.folder = folderMatch[1]

  const caretMatch = text.match(/\^(\w[\w/+\-]*)/)
  if (caretMatch) {
    const parsedDate = parseCaretDate(caretMatch[1])
    if (parsedDate) result.actionDate = parsedDate
  }

  const amtMatch = text.match(/[\$₹€£]\s?(\d[\d,]*(?:\.\d+)?)\s?[kK]?/)
  if (amtMatch) {
    let val = parseFloat(amtMatch[1].replace(/,/g, ''))
    if (amtMatch[0].toLowerCase().includes('k')) val *= 1000
    result.amount = val
  }

  if (/\b(received|inflow|income|credit|got)\b/i.test(text)) result.amountType = 'inflow'
  else if (/\b(paid|outflow|expense|debit|spent|cost)\b/i.test(text)) result.amountType = 'outflow'

  if (/\btomorrow\b/i.test(text)) result.actionDate = daysAhead(1)
  else if (/\bnext week\b/i.test(text)) result.actionDate = daysAhead(7)
  else if (/\bmonday\b/i.test(text)) result.actionDate = daysAhead(1)
  else if (/\bfriday\b/i.test(text)) result.actionDate = daysAhead(5)
  else {
    const dateMatch = text.match(/\b(\d{1,2})[\/\-](\d{1,2})\b/)
    if (dateMatch) {
      const d = new Date(
        new Date().getFullYear(),
        parseInt(dateMatch[1]) - 1,
        parseInt(dateMatch[2])
      )
      result.actionDate = d.toISOString().split('T')[0]
    }
  }

  return result
}
