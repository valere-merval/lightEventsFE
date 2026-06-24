import { useEffect, useState } from 'react'
import { api, platformModules, PageHero } from '../shared'
import type { Account } from '../shared'

const adminCollections = ['organizers', 'events', 'attendees', 'reservations', 'transactions', 'invoices', 'promotions', 'waitlists', 'refunds', 'teamRoles', 'webhooks']

export function AdminPage({ account }: { account: Account }) {
  const [data, setData] = useState<any>(null)
  useEffect(() => { api<any>('/admin/overview', { headers: { 'X-LightEvents-Token': account.apiToken } }).then(setData).catch(() => setData(null)) }, [account.apiToken])
  return <main><PageHero title="Admin LightEvents" text="Page visible uniquement si connecté avec rôle ADMIN. Vue d’ensemble et supervision des modules avancés." /><section className="page adminModuleStrip"><span className="eyebrow">Modules à superviser</span><h2>Couverture Modules LightEvents</h2><div className="moduleChips">{platformModules.map(module => <span key={module.key}>{module.shortTitle}</span>)}</div></section><section className="docs page">{adminCollections.map(k => <article className="code" key={k}><h3>{k}</h3><pre>{JSON.stringify(data?.[k] ?? [], null, 2)}</pre></article>)}</section><section className="page moduleHub"><div className="sectionTitleInline"><div><span className="eyebrow">API admin</span><h2>Endpoints attendus par le frontend</h2></div><p>Référence rapide pour raccorder le backend: endpoints organisateur, développeur et objets visibles dans l’overview admin.</p></div><div className="moduleGrid adminModules">{platformModules.map(module => <article className="moduleCard panel" key={module.key}><div className="moduleCardHead"><span className={`moduleArea ${module.area}`}>{module.area}</span><code>{module.method} {module.endpoint}</code></div><h3>{module.title}</h3><p>{module.description}</p><ul>{module.fields.map(field => <li key={field.name}><b>{field.name}</b> · {field.type || (field.options ? 'select' : 'text')}</li>)}</ul></article>)}</div></section></main>
}
