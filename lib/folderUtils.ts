import { Entry, FolderNode } from './types'

export function folderMatches(entryFolder: string | null, filterFolder: string): boolean {
  if (!entryFolder) return false
  return entryFolder === filterFolder || entryFolder.startsWith(filterFolder + '/')
}

export function getAllFolderPaths(entries: Entry[]): string[] {
  const paths = new Set<string>()
  entries.forEach((e) => {
    if (!e.folder) return
    const parts = e.folder.split('/')
    parts.forEach((_, i) => paths.add(parts.slice(0, i + 1).join('/')))
  })
  return [...paths].sort()
}

export function buildFolderTree(entries: Entry[]): FolderNode[] {
  const allPaths = getAllFolderPaths(entries)
  const roots: FolderNode[] = []
  const map: Record<string, FolderNode> = {}

  allPaths.forEach((path) => {
    const parts = path.split('/')
    let current = roots
    let built = ''
    parts.forEach((part) => {
      built = built ? `${built}/${part}` : part
      if (!map[built]) {
        const node: FolderNode = { name: part, path: built, children: [] }
        map[built] = node
        current.push(node)
      }
      current = map[built].children
    })
  })

  return roots
}

export function folderLabel(path: string | null): string | null {
  if (!path) return null
  const parts = path.split('/')
  return parts[parts.length - 1]
}
