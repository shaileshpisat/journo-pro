import { Entry } from './types'

function todayStr(): string {
  return new Date().toISOString().split('T')[0]
}

function daysAhead(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d.toISOString().split('T')[0]
}

export function parseEntry(text: string): Partial<Entry> {
  const result: Partial<Entry> = { tags: [] }

  const entityMatch = text.match(/@([\w]+(?:\s[\w]+)?)/)
  if (entityMatch) result.entity = entityMatch[1]

  const tagMatches = [...text.matchAll(/#([\w]+)/g)]
  result.tags = tagMatches.map((m) => m[1])

  const folderMatch = text.match(/\/([\w]+(?:\/[\w]+)*)/)
  if (folderMatch) result.folder = folderMatch[1]

  const amtMatch = text.match(/[\$₹€£]?\s?(\d[\d,]*(?:\.\d+)?)\s?[kK]?/)
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
