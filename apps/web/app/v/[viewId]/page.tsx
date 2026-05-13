import { notFound } from 'next/navigation'
import { getViewElements, getViewMeta } from '@/lib/likec4'
import { Markdown } from '@/components/Markdown'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import ViewLayout from './ViewLayout'

export default async function ViewPage({
  params,
}: {
  params: Promise<{ viewId: string }>
}) {
  const { viewId } = await params
  const meta = getViewMeta(viewId)
  if (!meta) notFound()
  const elements = getViewElements(viewId).filter((e) => e.description)

  return (
    <ViewLayout viewId={viewId}>
      <Breadcrumbs items={[{ label: meta.title }]} />
      <h1>{meta.title}</h1>
      {meta.description && <Markdown source={meta.description} className="lead" />}

      {elements.length > 0 && (
        <section className="section" style={{ marginTop: 24 }}>
          <h2>Elements in this view</h2>
          <div className="element-list element-list--stacked">
            {elements.map((el) => (
              <article key={el.id} className="element">
                <header>
                  <span className="element-kind">{el.kind}</span>
                  <h3>{el.title}</h3>
                </header>
                {el.description && (
                  <Markdown source={el.description} className="element-md" />
                )}
                {el.tags.length > 0 && (
                  <div className="tags">
                    {el.tags.map((t) => (
                      <span key={t} className="tag">#{t}</span>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      )}
    </ViewLayout>
  )
}
