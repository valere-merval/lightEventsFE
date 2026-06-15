import { useEffect, useState } from 'react'
import type { FormEvent, CSSProperties } from 'react'
import { api, uploadMedia, go, date, money, eventPlace, addressOnly, mapEmbed, phone, eventOptions, platformFee, categories, emptyPreview, Header, SectionTitle, EventGrid, PhoneField, CountrySelect, Modal, PageHero } from '../shared'
import type { Account, AddressSuggestion, Attendee, EventItem, OrganizerEvent, TicketHistory, TicketType, Toast } from '../shared'

export function AdminPage({ account }: { account: Account }) { const [data, setData] = useState<any>(null); useEffect(() => { api<any>('/admin/overview', { headers: { 'X-LightEvents-Token': account.apiToken } }).then(setData).catch(() => setData(null)) }, [account.apiToken]); return <main><PageHero title="Admin LightEvents" text="Page visible uniquement si connecté avec rôle ADMIN." /><section className="docs page">{['organizers','events','attendees','reservations','transactions','invoices'].map(k => <article className="code" key={k}><h3>{k}</h3><pre>{JSON.stringify(data?.[k] ?? [], null, 2)}</pre></article>)}</section></main> }
