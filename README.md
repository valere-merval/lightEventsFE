# LightEvents Frontend

React + TypeScript frontend for LightEvents V2.

## Documentation

Voir la documentation fonctionnelle centrale dans le backend : `lightEventsBA/docs/LIGHTEVENTS_GUIDE_FR.md`.

## Implemented pages

- `/` home with country/geo/city discovery and category shortcuts
- `/events` event listing and category filters, including events attached to multiple categories
- `/events/:id` detail page with all ticket option prices, reservation, payment and multi-ticket holder forms
- `/create` verified-organizer event creation with multi-category selection, preview, AI image placeholder, media URLs, payment methods and promotion channels
- `/auth` account creation, verification and payout preference setup
- `/tickets` email-code ticket lookup
- `/organizer` organizer dashboard with EventOps modules: box-office, seating, promos, waitlist, refunds, team, custom forms, marketing and webhooks
- `/help` FAQ and chatbot UI
- `/docs` API/CMS integration docs
- `/plugin` WordPress/Joomla plugin overview

## Run

```bash
npm install
cp .env.example .env
npm run dev
```

The app gracefully falls back to demo data if the backend is offline.
