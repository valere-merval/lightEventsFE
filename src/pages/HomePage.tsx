import { useEffect, useState } from 'react'
import { api, date, eventPlace, go, money, SectionTitle, EventGrid } from '../shared'
import type { EventItem } from '../shared'

type DestinationSpot = { id?: number; title: string; city: string; country: string; countryCode?: string; imageUrl: string }
const fallbackSpots: DestinationSpot[] = [
  { title: 'Lagune Ébrié', city: 'Abidjan', country: 'Côte d’Ivoire', countryCode: 'CI', imageUrl: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=1000&q=80' },
  { title: 'Soirée Seine', city: 'Paris', country: 'France', countryCode: 'FR', imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1000&q=80' },
  { title: 'Skyline Marina', city: 'Dubai', country: 'UAE', countryCode: 'AE', imageUrl: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1000&q=80' },
  { title: 'Retraite tropicale', city: 'Bali', country: 'Indonesia', countryCode: 'ID', imageUrl: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1000&q=80' },
]

export function HomePage({ events, loading, reload }: { events: EventItem[]; loading: boolean; reload: () => void }) {
  const [spots, setSpots] = useState<DestinationSpot[]>(fallbackSpots)
  useEffect(() => { api<DestinationSpot[]>('/destinations').then(v => setSpots(v.length ? v : fallbackSpots)).catch(() => setSpots(fallbackSpots)) }, [])
  const physical = events.filter(e => !e.online)
  const online = events.filter(e => e.online)
  const highlights = events.slice(0, 4)
  return <main id="top">
    <section className="homeHero page">
      <div><div className="eyebrow">LightEvents</div><h1>Trouvez l’événement parfait, en ligne ou près de vous.</h1><p>Découvrez les événements publiés par les organisateurs, filtrez par pays et réservez vos tickets en quelques clics.</p><div className="search"><button onClick={() => go('/events')}>Explorer</button><button onClick={() => go('/create')}>Publier</button><button type="button" onClick={reload}>{loading ? 'Chargement…' : 'Rafraîchir'}</button></div></div>
    </section>
    <SectionTitle eyebrow="Highlight" title="À la une" text="Un format éditorial large pour présenter les événements importants." />
    <section className="highlightList page">{highlights.length ? highlights.map(e => <HighlightEvent key={e.id} event={e} />) : <article className="panel emptyState">Aucun événement publié pour le moment.</article>}</section>
    <SectionTitle eyebrow="Présentiel" title="Événements avec adresse physique" text="Cartes classiques avec lieux, villes et détails pratiques." />
    <EventGrid events={physical} />
    <SectionTitle eyebrow="En ligne" title="Événements online" text="Webinars, conférences à distance et expériences numériques." />
    <EventGrid events={online} />
    <SectionTitle eyebrow="Destinations" title="Explorer par pays" text="Cliquez sur un lieu magnifique pour voir les événements de ce pays." />
    <section className="destinationRail page">{spots.map(s => <article key={`${s.country}-${s.city}-${s.title}`} onClick={() => go(`/events?country=${encodeURIComponent(s.country)}`)}><img src={s.imageUrl} /><div><b>{s.title}</b><span>{s.city}, {s.country}</span></div></article>)}</section>
  </main>
}
function HighlightEvent({ event }: { event: EventItem }) {
  const d = new Date(event.startsAt)
  return <article className="highlightCard"><div className="highlightImage"><img src={event.coverImageUrl || event.generatedImageUrl || '/favicon.svg'} /><div className="dateBadge"><b>{d.getDate()}</b><span>{d.toLocaleString('fr-FR', { month: 'short' })}</span></div></div><div className="highlightBody"><span className="highlightLabel">Highlight</span><h2>{event.title}</h2><p>{event.description}</p><div className="highlightMeta"><small>DATUM</small><b>{date(event.startsAt)}</b><span>{eventPlace(event)}</span></div><div className="highlightActions"><strong>{money(event.tickets?.[0])}</strong><button onClick={() => go(`/events/${event.id}`)}>Tickets sichern →</button></div></div></article>
}
