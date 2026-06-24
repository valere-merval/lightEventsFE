import { useEffect, useState } from 'react'
import type { FormEvent, CSSProperties } from 'react'
import { api, uploadMedia, go, date, money, eventPlace, addressOnly, mapEmbed, phone, eventOptions, platformFee, categories, emptyPreview, Header, SectionTitle, EventGrid, PhoneField, CountrySelect, Modal, PageHero, hasCategory } from '../shared'
import type { Account, AddressSuggestion, Attendee, EventItem, OrganizerEvent, TicketHistory, TicketType, Toast } from '../shared'

export function EventsPage({ events, category, country = "" }: { events: EventItem[]; category: string; country?: string }) { const filtered = events.filter(e => hasCategory(e, category) && (!country || e.country?.toLowerCase() === country.toLowerCase())); return <main><PageHero title={country ? `Événements: ${country}` : category ? `Catégorie: ${category}` : 'Tous les événements'} text="Recherche par catégorie, ville ou pays via le chatbot et la liste." /><section className="categoryRail page">{categories.map(c => <button className={category === c ? 'active' : ''} key={c} onClick={() => go(`/events?category=${encodeURIComponent(c)}`)}>{c}</button>)}</section><EventGrid events={filtered} /></main> }
