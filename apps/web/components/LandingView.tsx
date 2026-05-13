import Link from 'next/link'
import { getLanding, type Landing } from '@/lib/landings'
import { getViewMeta, viewsByTag, type ViewMeta } from '@/lib/likec4'
import { Markdown } from '@/components/Markdown'

function LandingCard({ landing }: { landing: Landing }) {
  return (
    <article className="card">
      <div className="card-kicker">landing</div>
      <h3>
        <Link href={`/l/${landing.id}`} className="card-link">{landing.title}</Link>
      </h3>
      <Markdown source={landing.description} className="card-md" />
    </article>
  )
}

function ViewCard({ view }: { view: ViewMeta }) {
  return (
    <article className="card">
      <div className="card-kicker">view</div>
      <h3>
        <Link href={`/v/${view.id}`} className="card-link">{view.title}</Link>
      </h3>
      {view.description && <Markdown source={view.description} className="card-md" />}
    </article>
  )
}

export function LandingView({ landing }: { landing: Landing }) {
  return (
    <>
      <h1>{landing.title}</h1>
      <Markdown source={landing.description} className="lead" />

      {landing.sections.map((section, idx) => {
        const views: ViewMeta[] = section.views
          ? (section.views.map(getViewMeta).filter(Boolean) as ViewMeta[])
          : section.filterByTag
            ? viewsByTag(section.filterByTag)
            : []
        const subLandings: Landing[] = section.landings
          ? (section.landings.map(getLanding).filter(Boolean) as Landing[])
          : []
        if (views.length === 0 && subLandings.length === 0) return null
        return (
          <section key={idx} className="section">
            <h2>{section.title}</h2>
            {subLandings.length > 0 && (
              <div className="cards" style={{ marginBottom: views.length > 0 ? 16 : 0 }}>
                {subLandings.map((l) => <LandingCard key={l.id} landing={l} />)}
              </div>
            )}
            {views.length > 0 && (
              <div className="cards">
                {views.map((v) => <ViewCard key={v.id} view={v} />)}
              </div>
            )}
          </section>
        )
      })}
    </>
  )
}
