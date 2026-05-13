'use client'

import { LikeC4ModelProvider, ReactLikeC4 } from '@likec4/diagram'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { likec4model } from '@/lib/likec4'

type LinkLike = { url: string }

/** Picks the first DSL link that points to an internal route (/...). */
function pickInternalLink(links: ReadonlyArray<LinkLike> | null | undefined): string | null {
  for (const l of links ?? []) {
    if (l.url.startsWith('/')) return l.url
  }
  return null
}

export default function Diagram({ viewId }: { viewId: string }) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const onNavigateTo = useCallback(
    (to: string) => {
      router.push(`/v/${to}`)
    },
    [router],
  )

  const onNodeClick = useCallback(
    (node: { links?: ReadonlyArray<LinkLike> | null; navigateTo?: string | null }) => {
      const url = pickInternalLink(node.links)
      if (url) {
        router.push(url)
        return
      }
      if (node.navigateTo) router.push(`/v/${node.navigateTo}`)
    },
    [router],
  )

  const onEdgeClick = useCallback(
    (edge: { relations?: ReadonlyArray<string> | null }) => {
      const relId = edge.relations?.[0]
      if (!relId) return
      const rel = likec4model.relationship(relId as never)
      const url = pickInternalLink(rel.links as ReadonlyArray<LinkLike>)
      if (url) {
        router.push(url)
        return
      }
      if (rel.navigateTo) router.push(`/v/${rel.navigateTo.id}`)
    },
    [router],
  )

  if (!mounted) return <div className="skeleton">Loading diagram…</div>

  return (
    <LikeC4ModelProvider likec4model={likec4model}>
      <ReactLikeC4
        viewId={viewId as never}
        pannable
        zoomable
        fitView
        showNavigationButtons
        enableElementDetails
        enableRelationshipDetails
        onNavigateTo={onNavigateTo as never}
        onNodeClick={onNodeClick as never}
        onEdgeClick={onEdgeClick as never}
      />
    </LikeC4ModelProvider>
  )
}
