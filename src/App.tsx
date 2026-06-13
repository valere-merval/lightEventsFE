
import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'

type EventItem = {
  id: number
  title: string
  description: string
  category: string
  city: string
  country: string
  venueName: string
  organizerName: string
  startsAt: string
  endsAt: string
  capacity: number
  brandColor: string
  tickets?: TicketType[]
}

type TicketType = { id: number; name: string; kind: string; price: number; currency: string; quantity: number; sold: number }
type Profile = { id: number; fullName: string; headline: string; company: string; city: string; country: string; lookingFor: string; offering: string; whatsappNumber: string }
type Summary = { events: number; attendees: number; checkedIn: number; profiles: number; transactions: number; markets: string[] }
type Match = { profileId: number; fullName: string; headline: string; company: string; score: number; reason: string; whatsappNumber: string }

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080/api'

const fallbackEvents: EventItem[] = [
  {
    id: 1,
    title: 'Abidjan Founder Night',
    description: 'Networking premium pour entrepreneurs, investisseurs et talents tech africains.',
    category: 'Business', city: 'Abidjan', country: 'Côte d’Ivoire', venueName: 'Plateau Innovation Hub', organizerName: 'LightEvents',
    startsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 21).toISOString(), endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 21 + 1000 * 60 * 60 * 4).toISOString(), capacity: 250, brandColor: '#ff7a1a',
    tickets: [{ id: 1, name: 'Early Founder', kind: 'PAID', price: 7500, currency: 'XOF', quantity: 120, sold: 38 }],
  },
  {
    id: 2, title: 'Kinshasa Creator Summit', description: 'Créateurs, marques et sponsors se rencontrent pour bâtir des collaborations.', category: 'Creator economy', city: 'Kinshasa', country: 'RDC', venueName: 'Gombe Business Center', organizerName: 'Mwemba Media', startsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 35).toISOString(), endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 35 + 1000 * 60 * 60 * 5).toISOString(), capacity: 400, brandColor: '#7c3aed', tickets: [{ id: 2, name: 'Standard', kind: 'PAID', price: 12, currency: 'USD', quantity: 300, sold: 91 }]
  }
]
const fallbackProfiles: Profile[] = [
  { id: 1, fullName: 'Awa Koné', headline: 'Founder fintech', company: 'NimbaPay', city: 'Abidjan', country: 'Côte d’Ivoire', lookingFor: 'investisseurs, partenaires bancaires', offering: 'mobile money, paiement, fintech', whatsappNumber: '+2250700000001' },
  { id: 2, fullName: 'Marc Diby', headline: 'CTO SaaS', company: 'CloudKite', city: 'Abidjan', country: 'Côte d’Ivoire', lookingFor: 'clients PME, commerciaux', offering: 'SaaS, IA, automatisation', whatsappNumber: '+2250700000002' },
  { id: 3, fullName: 'Nadia Sow', headline: 'Investisseuse seed', company: 'Baobab Capital', city: 'Dakar', country: 'Sénégal', lookingFor: 'startups B2B, fintech', offering: 'investissement, stratégie, réseau', whatsappNumber: '+221770000003' },
]

async function api<T>(path: string): Promise<T> {
  const res = await fetch(`${API_URL}${path}`)
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function App() {
  const [events, setEvents] = useState<EventItem[]>(fallbackEvents)
  const [profiles, setProfiles] = useState<Profile[]>(fallbackProfiles)
  const [summary, setSummary] = useState<Summary>({ events: 2, attendees: 129, checkedIn: 0, profiles: 3, transactions: 19, markets: ['Côte d’Ivoire', 'Sénégal', 'Cameroun', 'RDC'] })
  const [selectedProfile, setSelectedProfile] = useState(1)
  const [matches, setMatches] = useState<Match[]>([])
  const [backendOnline, setBackendOnline] = useState(false)
  const [createdMessage, setCreatedMessage] = useState('')

  useEffect(() => {
    Promise.allSettled([api<EventItem[]>('/events'), api<Profile[]>('/profiles'), api<Summary>('/dashboard/summary')]).then(([e, p, s]) => {
      if (e.status === 'fulfilled') { setEvents(e.value); setBackendOnline(true) }
      if (p.status === 'fulfilled') setProfiles(p.value)
      if (s.status === 'fulfilled') setSummary(s.value)
    })
  }, [])

  useEffect(() => {
    api<Match[]>(`/networking/business-match?profileId=${selectedProfile}`).then(setMatches).catch(() => {
      const me = profiles.find(p => p.id === selectedProfile)
      setMatches(profiles.filter(p => p.id !== selectedProfile).map((p, i) => ({ profileId: p.id, fullName: p.fullName, headline: p.headline, company: p.company, score: 93 - i * 14, reason: me ? `Peut aider sur: ${me.lookingFor}` : 'Contact pertinent', whatsappNumber: p.whatsappNumber })))
    })
  }, [selectedProfile, profiles])

  const featured = events[0]
  const countries = useMemo(() => [...new Set(events.map(e => e.country).filter(Boolean))], [events])

  async function createEvent(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const payload = {
      title: data.get('title'), description: data.get('description'), category: data.get('category'), city: data.get('city'), country: data.get('country'), venueName: data.get('venueName'), organizerName: 'Demo Organizer', organizerEmail: 'organizer@lightevents.africa', startsAt: data.get('startsAt'), endsAt: data.get('endsAt'), capacity: Number(data.get('capacity')), brandColor: '#ff7a1a', online: false,
    }
    try {
      const created = await fetch(`${API_URL}/events`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).then(r => r.json())
      setEvents([created, ...events])
      setCreatedMessage('Événement publié avec succès.')
      e.currentTarget.reset()
    } catch {
      setCreatedMessage('Mode démo: connecte le backend pour publier réellement.')
    }
  }

  return <main>
    <nav className="nav">
      <a className="brand" href="#top" aria-label="LightEvents"><span className="bolt">✦</span><span>LightEvents</span></a>
      <div className="links"><a href="#events">Événements</a><a href="#organizer">Organisateurs</a><a href="#networking">Networking IA</a><a href="#plugin">Plugin</a></div>
      <span className={`status ${backendOnline ? 'ok' : ''}`}>{backendOnline ? 'API connectée' : 'Mode preview'}</span>
    </nav>

    <section id="top" className="hero section">
      <div className="heroText">
        <div className="eyebrow">Eventbrite + LinkedIn + WhatsApp + Mobile Money</div>
        <h1>La plateforme événementielle pensée pour créer du business en Afrique.</h1>
        <p>Créez des événements premium, vendez des billets Mobile Money, construisez une communauté et déclenchez des rencontres professionnelles pertinentes avant, pendant et après l’événement.</p>
        <div className="actions"><a className="button primary" href="#organizer">Créer un événement</a><a className="button ghost" href="#networking">Voir le matching IA</a></div>
        <div className="trust"><span>Orange Money</span><span>MTN MoMo</span><span>Wave</span><span>WhatsApp</span><span>QR offline ready</span></div>
      </div>
      <div className="heroCard">
        <div className="glassHeader"><span>{featured?.category ?? 'Business'}</span><strong>{featured ? formatDate(featured.startsAt) : 'Bientôt'}</strong></div>
        <h2>{featured?.title}</h2>
        <p>{featured?.description}</p>
        <div className="venue">📍 {featured?.venueName}, {featured?.city}</div>
        <div className="ticketStrip"><div><strong>{featured?.tickets?.[0]?.price ?? 7500}</strong><span>{featured?.tickets?.[0]?.currency ?? 'XOF'}</span></div><button>Acheter</button></div>
        <div className="qr"><span></span><span></span><span></span><small>QR Ticket</small></div>
      </div>
    </section>

    <section className="metrics section">
      {[['Événements', summary.events], ['Participants', summary.attendees], ['Profils business', summary.profiles], ['Transactions', summary.transactions]].map(([label, value]) => <div className="metric" key={label}><strong>{value}</strong><span>{label}</span></div>)}
    </section>

    <section id="events" className="section splitTitle">
      <div><div className="eyebrow">Marketplace</div><h2>Des pages d’événements belles, rapides et orientées conversion.</h2></div>
      <p>Pensé SEO, partage social, WhatsApp-first, et assez flexible pour concerts, conférences, formations, mariages, clubs et communautés.</p>
    </section>
    <section className="eventGrid section compact">
      {events.map(event => <article className="eventCard" key={event.id} style={{ '--accent': event.brandColor || '#7c3aed' } as React.CSSProperties}>
        <div className="eventGlow" />
        <div className="pill">{event.category}</div>
        <h3>{event.title}</h3>
        <p>{event.description}</p>
        <div className="meta"><span>📍 {event.city}, {event.country}</span><span>🗓️ {formatDate(event.startsAt)}</span><span>👥 {event.capacity} places</span></div>
        <div className="cardFooter"><strong>{event.tickets?.[0] ? `${event.tickets[0].price} ${event.tickets[0].currency}` : 'Gratuit'}</strong><button>Réserver</button></div>
      </article>)}
    </section>

    <section id="organizer" className="section organizer">
      <div className="panel dark">
        <div className="eyebrow">CRM Organisateur</div>
        <h2>Tout pour vendre, scanner, suivre et relancer.</h2>
        <ul className="featureList"><li>Billets gratuits, payants, VIP et sponsors</li><li>QR Code + check-in compatible mode offline</li><li>Segments CRM: prospects, acheteurs, VIP, absents</li><li>Campagnes email, SMS et WhatsApp après l’événement</li><li>Templates marque blanche et domaines personnalisés</li></ul>
      </div>
      <form className="panel form" onSubmit={createEvent}>
        <h3>Créer un événement</h3>
        <input name="title" placeholder="Nom de l’événement" required />
        <textarea name="description" placeholder="Description" required />
        <div className="two"><input name="category" placeholder="Catégorie" /><input name="capacity" type="number" min="1" placeholder="Places" required /></div>
        <div className="two"><input name="city" placeholder="Ville" /><input name="country" placeholder="Pays" /></div>
        <input name="venueName" placeholder="Lieu" />
        <div className="two"><input name="startsAt" type="datetime-local" required /><input name="endsAt" type="datetime-local" required /></div>
        <button className="button primary" type="submit">Publier</button>
        {createdMessage && <small className="message">{createdMessage}</small>}
      </form>
    </section>

    <section id="networking" className="section networking">
      <div className="splitTitle"><div><div className="eyebrow">Business Match</div><h2>Le networking ne doit plus être laissé au hasard.</h2></div><p>Les participants indiquent ce qu’ils cherchent et proposent. LightEvents recommande les bons contacts et facilite le rendez-vous ou le message WhatsApp.</p></div>
      <div className="matchBoard">
        <div className="profileRail">{profiles.map(p => <button className={selectedProfile === p.id ? 'selected' : ''} onClick={() => setSelectedProfile(p.id)} key={p.id}><strong>{p.fullName}</strong><span>{p.headline}</span></button>)}</div>
        <div className="matchList">{matches.map(m => <article className="match" key={m.profileId}><div className="score">{m.score}%</div><div><h3>{m.fullName}</h3><p>{m.headline} · {m.company}</p><small>{m.reason}</small></div><a className="whatsapp" href={`https://wa.me/${m.whatsappNumber?.replace(/[^0-9]/g, '')}`} target="_blank">WhatsApp</a></article>)}</div>
      </div>
    </section>

    <section className="section payments">
      <div className="phoneMock"><div className="phoneTop"/><h3>Paiement Mobile Money</h3><p>Envoyez une demande de paiement, confirmez la transaction, générez le billet QR.</p><div className="moneyRow"><span>Wave</span><strong>7 500 XOF</strong></div><button>Confirmer le paiement</button></div>
      <div><div className="eyebrow">Afrique First</div><h2>Pas seulement Stripe. Mobile Money, SMS et WhatsApp sont au cœur du produit.</h2><p>Architecture prête pour Orange Money, MTN MoMo, Wave, Airtel Money, Moov Money, CinetPay, Flutterwave, Stripe et PayPal.</p><div className="countries">{countries.concat(summary.markets ?? []).slice(0, 8).map(c => <span key={c}>{c}</span>)}</div></div>
    </section>

    <section id="plugin" className="section plugin">
      <div><div className="eyebrow">Plateforme ouverte</div><h2>Plugin WordPress, widgets et API pour entrepreneurs.</h2><p>LightEvents peut s’intégrer dans les sites d’écoles, églises, clubs, médias, entrepreneurs et communautés sans déplacer leur audience.</p></div>
      <div className="codeCard"><code>[lightevents-calendar country="CI"]</code><code>[lightevents-ticket event="123"]</code><code>{`<script src="https://cdn.lightevents.africa/widget.js"></script>`}</code></div>
    </section>

    <footer className="footer">LightEvents · Built for communities, entrepreneurs and African payments.</footer>
  </main>
}

export default App
