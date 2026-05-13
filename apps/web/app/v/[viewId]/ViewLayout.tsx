'use client'

import { useState, type ReactNode } from 'react'
import DiagramClient from './DiagramClient'

export default function ViewLayout({
  viewId,
  children,
}: {
  viewId: string
  children: ReactNode
}) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className={collapsed ? 'view-layout view-layout--collapsed' : 'view-layout'}>
      <aside className="view-aside">
        <button
          type="button"
          className="view-aside__toggle"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? 'Expand panel' : 'Collapse panel'}
          title={collapsed ? 'Expand' : 'Collapse'}
        >
          {collapsed ? '›' : '‹'}
        </button>
        <div className="view-aside__content">{children}</div>
      </aside>
      <main className="view-canvas">
        <DiagramClient viewId={viewId} />
      </main>
    </div>
  )
}
