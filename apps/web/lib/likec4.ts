import { likec4model } from './likec4-model'

export { likec4model }

export type ViewMeta = {
  id: string
  title: string
  description: string | null
  tags: string[]
  bounds: { width: number; height: number }
}

export type ViewElement = {
  id: string
  title: string
  kind: string
  description: string | null
  tags: string[]
}

export function listViews(): ViewMeta[] {
  const out: ViewMeta[] = []
  for (const v of likec4model.views()) {
    out.push(viewToMeta(v))
  }
  return out
}

export function getViewMeta(viewId: string): ViewMeta | null {
  try {
    const v = likec4model.view(viewId as never)
    return viewToMeta(v)
  } catch {
    return null
  }
}

export function viewsByTag(tag: string): ViewMeta[] {
  return listViews().filter((v) => v.tags.includes(tag))
}

export function getViewElements(viewId: string): ViewElement[] {
  let view: ReturnType<typeof likec4model.view>
  try {
    view = likec4model.view(viewId as never)
  } catch {
    return []
  }
  const out: ViewElement[] = []
  for (const node of view.nodes()) {
    const desc = (node as { description?: { isEmpty?: boolean; md?: string | null } }).description
    out.push({
      id: node.id as string,
      title: node.title,
      kind: node.kind as string,
      description: desc && !desc.isEmpty ? (desc.md ?? null) : null,
      tags: [...(node.tags as readonly string[])],
    })
  }
  return out
}

function viewToMeta(v: ReturnType<typeof likec4model.view>): ViewMeta {
  const desc = (v as { description?: { isEmpty?: boolean; md?: string | null } }).description
  return {
    id: v.id as string,
    title: v.title ?? (v.id as string),
    description: desc && !desc.isEmpty ? (desc.md ?? null) : null,
    tags: [...(v.tags as readonly string[])],
    bounds: { width: v.bounds.width, height: v.bounds.height },
  }
}
