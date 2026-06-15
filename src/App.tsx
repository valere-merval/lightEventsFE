import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { api, AppFooter, Header, parseQuery, ScrollTopButton } from './shared'
import type { Account, EventItem, Toast } from './shared'
import { HomePage } from './pages/HomePage'
import { EventsPage } from './pages/EventsPage'
import { EventDetails } from './pages/EventDetailsPage'
import { CreateEvent } from './pages/CreateEventPage'
import { AuthPage } from './pages/AuthPage'
import { TicketsPage } from './pages/TicketsPage'
import { OrganizerPage } from './pages/OrganizerPage'
import { AdminPage } from './pages/AdminPage'
import { HelpPage } from './pages/HelpPage'

function useRoute() { const [path, setPath] = useState(location.pathname + location.search); useEffect(() => { const on = () => setPath(location.pathname + location.search); addEventListener('popstate', on); return () => removeEventListener('popstate', on) }, []); return path }
export default function App() {
  const route = useRoute(); const q = parseQuery(route); const path = route.split('?')[0]
  const [account, setAccount] = useState<Account | null>(() => { const raw = localStorage.getItem('le_account'); return raw ? JSON.parse(raw) : null })
  const [events, setEvents] = useState<EventItem[]>([]); const [toast, setToast] = useState<Toast | null>(null); const [loading, setLoading] = useState(false)
  const notify = (kind: Toast['kind'], text: string) => { setToast({ kind, text }); setTimeout(() => setToast(null), 5200) }
  const loadEvents = async () => { setLoading(true); try { setEvents(await api<EventItem[]>('/events')) } catch (e: any) { notify('error', `Impossible de charger les événements: ${e.message}`) } finally { setLoading(false) } }
  useEffect(() => { loadEvents() }, [])
  useEffect(() => { if (account) localStorage.setItem('le_account', JSON.stringify(account)); else localStorage.removeItem('le_account') }, [account])
  let page: ReactNode = <HomePage events={events} loading={loading} reload={loadEvents} />
  if (path === '/events') page = <EventsPage events={events} category={q.get('category') ?? ''} country={q.get('country') ?? ''} />
  if (path.startsWith('/events/')) page = <EventDetails id={Number(path.split('/')[2])} events={events} notify={notify} />
  if (path === '/create') page = <CreateEvent account={account} setEvents={setEvents} notify={notify} />
  if (path === '/auth') page = <AuthPage account={account} setAccount={setAccount} notify={notify} />
  if (path === '/tickets') page = <TicketsPage notify={notify} />
  if (path === '/organizer') page = <OrganizerPage account={account} />
  if (path === '/admin' && account?.role === 'ADMIN') page = <AdminPage account={account} />
  if (path === '/help') page = <HelpPage events={events} notify={notify} />
  if (path.startsWith('/policy/')) page = <main><section className="pageHero page"><span className="eyebrow">Legal</span><h1>{path.split('/').pop()}</h1><p>Cette page légale sera complétée avec les textes officiels LightEvents.</p></section></main>
  return <><Header account={account} setAccount={setAccount} />{toast && <div className={`toast ${toast.kind}`}>{toast.text}</div>}{loading && <div className="loader">Chargement…</div>}{page}<AppFooter /><ScrollTopButton /></>
}
