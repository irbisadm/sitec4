import { marked } from 'marked'

marked.setOptions({ gfm: true, breaks: true })

type Props = {
  source: string
  /** Inline mode: no <p> wrapper, suitable for short labels. */
  inline?: boolean
  className?: string
}

/**
 * Server-side Markdown → HTML rendering.
 * Content comes from controlled YAML files in the repository, so no sanitizer
 * is applied. If we ever accept user-submitted markdown, hook in DOMPurify here.
 */
export function Markdown({ source, inline, className }: Props) {
  const html = (inline ? marked.parseInline(source) : marked.parse(source)) as string
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />
}
