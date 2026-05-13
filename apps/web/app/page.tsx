import { notFound } from 'next/navigation'
import { getLanding } from '@/lib/landings'
import { LandingView } from '@/components/LandingView'

export default function HomePage() {
  const landing = getLanding('index')
  if (!landing) notFound()
  return (
    <main className="page">
      <LandingView landing={landing} />
    </main>
  )
}
