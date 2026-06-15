import { useEffect, useMemo, useState } from 'react'
import { api, date, eventPlace, go, money, SectionTitle, EventGrid } from '../shared'
import type { EventItem } from '../shared'

type DestinationSpot = { id?: number; title: string; city: string; country: string; countryCode?: string; imageUrl: string }
type PlaceSuggestion = { label: string; city: string; country: string; countryCode: string; latitude?: number; longitude?: number }
const fallbackSpots: DestinationSpot[] = [
  { title: 'Lagune Ébrié', city: 'Abidjan', country: 'Côte d’Ivoire', countryCode: 'CI', imageUrl: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=1000&q=80' },
  { title: 'Soirée Seine', city: 'Paris', country: 'France', countryCode: 'FR', imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1000&q=80' },
  { title: 'Skyline Marina', city: 'Dubai', country: 'UAE', countryCode: 'AE', imageUrl: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1000&q=80' },
  { title: 'Retraite tropicale', city: 'Bali', country: 'Indonesia', countryCode: 'ID', imageUrl: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1000&q=80' },
]
function localeCountry(){ return Intl.DateTimeFormat().resolvedOptions().locale.split('-')[1] ?? '' }
function distanceKm(aLat:number,aLon:number,bLat:number,bLon:number){ const R=6371; const dLat=(bLat-aLat)*Math.PI/180; const dLon=(bLon-aLon)*Math.PI/180; const x=Math.sin(dLat/2)**2+Math.cos(aLat*Math.PI/180)*Math.cos(bLat*Math.PI/180)*Math.sin(dLon/2)**2; return 2*R*Math.asin(Math.sqrt(x)) }

export function HomePage({ events, loading, reload }: { events: EventItem[]; loading: boolean; reload: () => void }) {
  const [spots, setSpots] = useState<DestinationSpot[]>(fallbackSpots)
  const [query, setQuery] = useState('')
  const [selectedPlace, setSelectedPlace] = useState<PlaceSuggestion | null>(null)
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([])
  const [scopeLabel, setScopeLabel] = useState(localeCountry() ? `Pays détecté: ${localeCountry()}` : 'Tous les pays')
  const [coords, setCoords] = useState<{lat:number; lon:number} | null>(null)
  const wideRadiusKm = 500
  useEffect(() => { api<DestinationSpot[]>('/destinations').then(v => setSpots(v.length ? v : fallbackSpots)).catch(() => setSpots(fallbackSpots)) }, [])
  async function suggest(value: string){ setQuery(value); setSelectedPlace(null); if(value.trim().length < 2) return setSuggestions([]); setSuggestions(await api<PlaceSuggestion[]>(`/geo/place-suggest?q=${encodeURIComponent(value)}`).catch(() => [])) }
  function useCurrentLocation(){ navigator.geolocation?.getCurrentPosition(pos => { const next={lat:pos.coords.latitude, lon:pos.coords.longitude}; setCoords(next); setScopeLabel(`Autour de vous · rayon large ${wideRadiusKm} km (${next.lat.toFixed(2)}, ${next.lon.toFixed(2)})`); setSelectedPlace(null); setQuery(''); setSuggestions([]) }, () => setScopeLabel(localeCountry() ? `Pays détecté: ${localeCountry()} · géolocalisation refusée` : 'Géolocalisation refusée')) }
  const initialCountry = localeCountry()
  const visibleEvents = useMemo(() => {
    if (coords) return events.filter(e => (e.latitude && e.longitude && distanceKm(coords.lat, coords.lon, e.latitude, e.longitude) <= wideRadiusKm) || (!e.latitude && !e.longitude && initialCountry && (e.countryCode?.toUpperCase() === initialCountry.toUpperCase() || e.country?.toUpperCase().includes(initialCountry.toUpperCase()))))
    if (selectedPlace) return events.filter(e => (selectedPlace.city && e.city?.toLowerCase().includes(selectedPlace.city.toLowerCase())) || (selectedPlace.country && e.country?.toLowerCase() === selectedPlace.country.toLowerCase()))
    if (query.trim()) { const q=query.toLowerCase(); return events.filter(e => e.city?.toLowerCase().includes(q) || e.country?.toLowerCase().includes(q)) }
    if (initialCountry) return events.filter(e => e.countryCode?.toUpperCase() === initialCountry.toUpperCase() || e.country?.toUpperCase().includes(initialCountry.toUpperCase()))
    return events
  }, [events, coords, selectedPlace, query, initialCountry])
  const physical = visibleEvents.filter(e => !e.online)
  const online = visibleEvents.filter(e => e.online)
  const highlights = visibleEvents.slice(0, 4)
  return <main id="top">
    <section className="homeHero page"><div><div className="eyebrow">LightEvents</div><h1>Trouvez l’événement parfait, en ligne ou près de vous.</h1><p>Par défaut, nous affichons les événements de votre pays ou zone. Vous pouvez aussi chercher une ville ou un pays.</p></div></section>
    <section className="locationSearch page"><form className="search" onSubmit={e => e.preventDefault()}><input value={query} onChange={e => suggest(e.currentTarget.value)} placeholder="Chercher une ville ou un pays: Paris, Abidjan, Allemagne..." /><button type="button" onClick={() => setSelectedPlace(suggestions[0] ?? null)}>Rechercher</button><button type="button" onClick={useCurrentLocation}>Ma position</button><button type="button" onClick={reload}>{loading ? 'Chargement…' : 'Rafraîchir'}</button></form>{suggestions.length > 0 && <div className="placeSuggestions">{suggestions.map(s => <button key={`${s.label}-${s.latitude}`} onClick={() => { setCoords(null); setSelectedPlace(s); setQuery(s.label); setSuggestions([]); setScopeLabel(`Recherche: ${s.label}`) }}>{s.label}</button>)}</div>}<span className="locationTag">{scopeLabel} · {visibleEvents.length} événement(s)</span></section>
    <SectionTitle eyebrow="Highlight" title="À la une" text="Un format éditorial large pour présenter les événements importants." />
    <section className="highlightList page">{highlights.length ? highlights.map(e => <HighlightEvent key={e.id} event={e} />) : <article className="panel emptyState">Aucun événement publié dans cette zone pour le moment.</article>}</section>
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
