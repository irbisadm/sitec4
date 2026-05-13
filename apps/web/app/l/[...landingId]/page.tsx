import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import {
  getLanding,
  hasDescendants,
  listChildFolders,
  listChildren,
} from '@/lib/landings'
import { LandingView } from '@/components/LandingView'
import { Markdown } from '@/components/Markdown'
import { Breadcrumbs, type Crumb } from '@/components/Breadcrumbs'

function buildCrumbs(segments: string[], currentLabel: string): Crumb[] {
  const crumbs: Crumb[] = []
  for (let i = 0; i < segments.length - 1; i++) {
    const parentId = segments.slice(0, i + 1).join('/')
    const parent = getLanding(parentId)
    if (parent) {
      crumbs.push({ label: parent.title, href: `/l/${parent.id}` })
    } else if (hasDescendants(parentId)) {
      crumbs.push({ label: segments[i], href: `/l/${parentId}` })
    } else {
      crumbs.push({ label: segments[i] })
    }
  }
  crumbs.push({ label: currentLabel })
  return crumbs
}

export default async function LandingPage({
  params,
}: {
  params: Promise<{ landingId: string[] }>
}) {
  const { landingId } = await params
  const id = landingId.join('/')
  if (id === 'index') redirect('/')

  const landing = getLanding(id)
  if (landing) {
    const crumbs = buildCrumbs(landingId, landing.title)
    return (
      <main className="page">
        <Breadcrumbs items={crumbs} />
        <LandingView landing={landing} />
      </main>
    )
  }

  // No landing exists at this path — render an auto-generated folder page
  // if there are descendants.
  if (!hasDescendants(id)) notFound()

  const children = listChildren(id)
  const subfolders = listChildFolders(id)
  const folderName = landingId[landingId.length - 1]
  const crumbs = buildCrumbs(landingId, folderName)

  return (
    <main className="page">
      <Breadcrumbs items={crumbs} />
      <h1>{folderName}</h1>
      <p className="lead">
        Auto-generated index for folder <code>{id}</code>. Add{' '}
        <code>src/landings/{id}/index.yml</code> to customize this page.
      </p>

      {children.length > 0 && (
        <section className="section">
          <h2>Landings</h2>
          <div className="cards">
            {children.map((l) => (
              <article key={l.id} className="card">
                <div className="card-kicker">landing</div>
                <h3>
                  <Link href={`/l/${l.id}`} className="card-link">{l.title}</Link>
                </h3>
                <Markdown source={l.description} className="card-md" />
              </article>
            ))}
          </div>
        </section>
      )}

      {subfolders.length > 0 && (
        <section className="section">
          <h2>Subfolders</h2>
          <div className="cards">
            {subfolders.map((folderId) => {
              const name = folderId.split('/').pop() ?? folderId
              return (
                <article key={folderId} className="card">
                  <div className="card-kicker">folder</div>
                  <h3>
                    <Link href={`/l/${folderId}`} className="card-link">{name}</Link>
                  </h3>
                </article>
              )
            })}
          </div>
        </section>
      )}
    </main>
  )
}
