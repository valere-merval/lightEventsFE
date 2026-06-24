import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { api, platformModules, eventPlace, PageHero } from '../shared'
import type { Account, PlatformModule, ModuleField, OrganizerEvent } from '../shared'

function fieldValue(value: FormDataEntryValue | null) {
  const raw = String(value ?? '').trim()
  if (raw === 'true') return true
  if (raw === 'false') return false
  if (raw !== '' && !Number.isNaN(Number(raw))) return Number(raw)
  if (raw.includes(',') && !raw.startsWith('http')) return raw.split(',').map(v => v.trim()).filter(Boolean)
  return raw
}

function ModuleFieldInput({ field }: { field: ModuleField }) {
  if (field.options) return <label>{field.label}<select name={field.name} required={field.required}>{field.options.map(o => <option key={o} value={o}>{o}</option>)}</select></label>
  return <label>{field.label}<input name={field.name} type={field.type || 'text'} placeholder={field.placeholder} required={field.required} /></label>
}

function ModuleCard({ module, eventId, account }: { module: PlatformModule; eventId: string; account: Account | null }) {
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState('')
  const resolvedEndpoint = module.endpoint.replace(':eventId', eventId || '0')
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const payload = Object.fromEntries(module.fields.map(field => [field.name, fieldValue(fd.get(field.name))]))
    if (module.endpoint.includes(':eventId')) payload.eventId = Number(eventId || 0)
    setBusy(true)
    setResult('')
    try {
      const response = await api<any>(resolvedEndpoint, {
        method: module.method,
        headers: account?.apiToken ? { 'X-LightEvents-Token': account.apiToken } : undefined,
        body: module.method === 'GET' ? undefined : JSON.stringify(payload),
      })
      setResult(JSON.stringify(response, null, 2))
    } catch (err: any) {
      setResult(`Endpoint prêt côté UI, réponse backend attendue: ${err.message}`)
    } finally {
      setBusy(false)
    }
  }
  return <article className="moduleCard panel"><div className="moduleCardHead"><span className={`moduleArea ${module.area}`}>{module.area}</span><code>{module.method} {resolvedEndpoint}</code></div><h3>{module.title}</h3><p>{module.description}</p><form className="form moduleForm" onSubmit={submit}>{module.fields.map(field => <ModuleFieldInput key={field.name} field={field} />)}<button className="primary" disabled={busy || (module.endpoint.includes(':eventId') && !eventId)}>{busy ? 'Envoi…' : 'Tester / préparer'}</button></form>{result && <pre className="moduleResult">{result}</pre>}</article>
}

export function OrganizerPage({ account }: { account: Account | null }) {
  const [data, setData] = useState<OrganizerEvent[]>([])
  const [selectedEventId, setSelectedEventId] = useState('')
  useEffect(() => {
    if (!account) return
    const headers = account.apiToken ? { 'X-LightEvents-Token': account.apiToken } : undefined
    api<{ events: OrganizerEvent[] }>(`/dashboard/organizer?email=${encodeURIComponent(account.email)}&name=${encodeURIComponent(account.fullName)}`, { headers })
      .then(r => { setData(r.events); setSelectedEventId(String(r.events[0]?.event.id ?? '')) })
      .catch(() => setData([]))
  }, [account?.email, account?.apiToken])
  const organizerModules = useMemo(() => platformModules, [])
  return <main><PageHero title="Tableau de bord organisateur" text="Événements, participants, réservations, statuts, pays et modules avancés LightEvents." /><section className="warning page">{account ? `Connecté: ${account.fullName}` : 'Connectez-vous comme organisateur.'}</section><section className="dashboard page">{data.map(row => <article className="panel" key={row.event.id}><h2>{row.event.title}</h2><p>{eventPlace(row.event)}</p><strong>⏳ {Math.floor(row.countdownSeconds / 86400)}j {Math.floor((row.countdownSeconds % 86400) / 3600)}h</strong><div className="stats"><span>{row.participants.length} participants</span><span>{row.reservations.length} réservations</span><span>{row.participants.filter(p => p.status === 'PAID').length} payés</span></div><h3>Pays</h3><ul>{Object.entries(row.participantCountries).map(([country, count]) => <li key={country}>{country}: {count}</li>)}</ul><h3>Participants</h3><div className="tableLike">{row.participants.map(p => <span key={p.id}>{p.fullName} · {p.email} · {p.status}</span>)}</div></article>)}</section><section className="page moduleHub"><div className="sectionTitleInline"><div><span className="eyebrow">Modules LightEvents</span><h2>Modules avancés organisateur</h2></div><p>Ces cartes préparent le front pour les prochains endpoints backend sous <code>/api</code>. Choisissez un événement, puis envoyez un payload minimal de test.</p></div><div className="moduleToolbar panel"><label>Événement cible<select value={selectedEventId} onChange={e => setSelectedEventId(e.target.value)}><option value="">{data.length ? 'Sélectionner un événement' : 'Aucun événement trouvé pour ce compte'}</option>{data.map(row => <option key={row.event.id} value={row.event.id}>{row.event.title} · #{row.event.id}</option>)}</select></label><span>{organizerModules.length} modules exposés</span></div><div className="moduleGrid">{organizerModules.map(module => <ModuleCard key={module.key} module={module} eventId={selectedEventId} account={account} />)}</div></section></main>
}
