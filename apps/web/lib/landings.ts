import data from './landings-data.generated.json'

export type LandingSection = {
  title: string
  /** Explicit list of view ids to render as cards. */
  views?: readonly string[]
  /** Explicit list of landing ids to render as cards inside the section. */
  landings?: readonly string[]
  /** Filter views by tag. */
  filterByTag?: string
}

export type Landing = {
  id: string
  /** Name of the first subdirectory (`billing` for `billing/checkout`); null for top-level. */
  group: string | null
  title: string
  description: string
  sections: readonly LandingSection[]
}

const landings = data as unknown as Record<string, Landing>

export function getLanding(id: string): Landing | null {
  return landings[id] ?? null
}

export function listLandings(): Landing[] {
  return Object.values(landings)
}

/**
 * Direct child landings under `parentId`.
 * Example: parentId="billing" returns everything with id "billing/X" (excluding "billing/X/Y").
 */
export function listChildren(parentId: string): Landing[] {
  const prefix = parentId + '/'
  return Object.values(landings)
    .filter((l) => l.id.startsWith(prefix) && !l.id.slice(prefix.length).includes('/'))
    .sort((a, b) => a.title.localeCompare(b.title))
}

/**
 * Intermediate "folders" under parentId that have no landing of their own
 * but contain landings deeper in the tree.
 * Example: parentId="" returns ["billing"] if only "billing/checkout" exists.
 */
export function listChildFolders(parentId: string): string[] {
  const prefix = parentId ? parentId + '/' : ''
  const folders = new Set<string>()
  for (const l of Object.values(landings)) {
    if (!l.id.startsWith(prefix)) continue
    const rest = l.id.slice(prefix.length)
    const slash = rest.indexOf('/')
    if (slash <= 0) continue
    const segment = rest.slice(0, slash)
    const folderId = prefix + segment
    if (!landings[folderId]) folders.add(folderId)
  }
  return Array.from(folders).sort()
}

/** Whether any landing has an id starting with `parentId/`. */
export function hasDescendants(parentId: string): boolean {
  const prefix = parentId + '/'
  return Object.values(landings).some((l) => l.id.startsWith(prefix))
}
