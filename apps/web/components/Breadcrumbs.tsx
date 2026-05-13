import Link from 'next/link'

export type Crumb = {
  label: string
  href?: string
}

/**
 * Breadcrumbs. First item defaults to a link to "/".
 * The current page (last crumb) is rendered without a link.
 */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const full: Crumb[] = [{ label: 'Project architecture', href: '/' }, ...items]
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumbs">
      {full.map((c, i) => {
        const isLast = i === full.length - 1
        return (
          <span key={i} className="breadcrumbs__item">
            {c.href && !isLast ? (
              <Link href={c.href}>{c.label}</Link>
            ) : (
              <span className="breadcrumbs__current">{c.label}</span>
            )}
            {!isLast && <span className="breadcrumbs__sep">/</span>}
          </span>
        )
      })}
    </nav>
  )
}
