import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { API_URL, api, platformModules, eventPlace, PageHero } from '../shared'
import type { Account, PlatformModule, ModuleField, OrganizerEvent } from '../shared'

const listFields = new Set(['permissions', 'options', 'events', 'publishChannels'])

function fieldValue(field: ModuleField, value: FormDataEntryValue | null) {
  const raw = String(value ?? '').trim()
  if (listFields.has(field.name)) {
    if (!raw) return []
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed.map(v => String(v).trim()).filter(Boolean)
    } catch { /* CSV fallback */ }
    return raw.split(',').map(v => v.trim()).filter(Boolean)
  }
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
    const payload = Object.fromEntries(module.fields.map(field => [field.name, fieldValue(field, fd.get(field.name))]))
    if (module.endpoint.includes(':eventId') || (eventId && !payload.eventId)) payload.eventId = Number(eventId || 0)
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
      setResult(`Action refusée ou incomplète: ${err.message}`)
    } finally {
      setBusy(false)
    }
  }
  return <article className="moduleCard panel"><div className="moduleCardHead"><span className={`moduleArea ${module.area}`}>{module.area}</span><code>{module.method} {resolvedEndpoint}</code></div><h3>{module.title}</h3><p>{module.description}</p>{listFields.size > 0 && module.fields.some(f => listFields.has(f.name)) && <small className="moduleHint">Astuce: les champs liste acceptent une valeur unique (`scan`) ou plusieurs séparées par virgules (`scan,sell`).</small>}<form className="form moduleForm" onSubmit={submit}>{module.fields.map(field => <ModuleFieldInput key={field.name} field={field} />)}<button className="primary" disabled={busy || (module.endpoint.includes(':eventId') && !eventId)}>{busy ? 'Envoi…' : 'Créer / enregistrer'}</button></form>{result && <pre className="moduleResult">{result}</pre>}</article>
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
  async function downloadParticipants(eventId: number) { const params = `email=${encodeURIComponent(account?.email || '')}&name=${encodeURIComponent(account?.fullName || '')}`; const res = await fetch(`${API_URL}/dashboard/organizer/events/${eventId}/participants.csv?${params}`, { headers: account?.apiToken ? { 'X-LightEvents-Token': account.apiToken } : undefined }); if (!res.ok) throw new Error(await res.text()); const blob = await res.blob(); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `lightevents-participants-${eventId}.csv`; a.click(); URL.revokeObjectURL(url) }
  return <main><PageHero title="Tableau de bord organisateur" text="Événements, participants, réservations, statuts, pays et modules avancés LightEvents." /><section className="warning page">{account ? `Connecté: ${account.fullName}` : 'Connectez-vous comme organisateur.'}</section><section className="dashboard page">{data.map(row => <article className="panel" key={row.event.id}><h2>{row.event.title}</h2><p>{eventPlace(row.event)}</p><strong>⏳ {Math.floor(row.countdownSeconds / 86400)}j {Math.floor((row.countdownSeconds % 86400) / 3600)}h</strong><div className="stats"><span>{row.participants.length} participants</span><span>{row.reservations.length} réservations</span><span>{row.participants.filter(p => p.status === 'PAID').length} payés</span></div><h3>Pays</h3><ul>{Object.entries(row.participantCountries).map(([country, count]) => <li key={country}>{country}: {count}</li>)}</ul><h3>Participants</h3><button type="button" onClick={() => downloadParticipants(row.event.id)}>Télécharger CSV participants</button><div className="tableLike">{row.participants.map(p => <span key={p.id}>{p.fullName} · {p.email} · {p.status}</span>)}</div></article>)}</section><section className="page moduleHub"><div className="sectionTitleInline"><div><span className="eyebrow">Mode d’emploi</span><h2>Comment utiliser les 10 modules</h2></div><p>Commencez par sélectionner l’événement cible. Les modules ci-dessous créent la configuration ou l’action côté backend; certains écrans avancés restent à enrichir visuellement, mais les APIs principales sont connectées.</p></div><div className="moduleGuide panel">{organizerModules.map((module, index) => <article key={module.key}><b>{index + 1}. {module.shortTitle}</b><span>{module.description}</span><small>{module.method} {module.endpoint}</small></article>)}</div></section><section className="page moduleHub"><div className="sectionTitleInline"><div><span className="eyebrow">Modules LightEvents</span><h2>Modules avancés organisateur</h2></div><p>Chaque module appelle directement son endpoint backend sous <code>/api</code>. Choisissez un événement, renseignez les champs, puis créez ou enregistrez la configuration.</p></div><div className="moduleToolbar panel"><label>Événement cible<select value={selectedEventId} onChange={e => setSelectedEventId(e.target.value)}><option value="">{data.length ? 'Sélectionner un événement' : 'Aucun événement trouvé pour ce compte'}</option>{data.map(row => <option key={row.event.id} value={row.event.id}>{row.event.title} · #{row.event.id}</option>)}</select></label><span>{organizerModules.length} modules exposés</span></div><div className="moduleGrid">{organizerModules.map(module => <ModuleCard key={module.key} module={module} eventId={selectedEventId} account={account} />)}</div></section></main>
}
