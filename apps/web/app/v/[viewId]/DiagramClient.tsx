'use client'

import dynamic from 'next/dynamic'

const Diagram = dynamic(() => import('./Diagram'), {
  ssr: false,
  loading: () => <div className="skeleton">Loading diagram…</div>,
})

export default function DiagramClient({ viewId }: { viewId: string }) {
  return <Diagram viewId={viewId} />
}
