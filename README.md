# LightEvents Frontend

React + TypeScript frontend for LightEvents V2.

## Implemented pages

- `/` home with country/geo/city discovery and category shortcuts
- `/events` event listing and category filters
- `/events/:id` detail page with reservation and multi-ticket holder forms
- `/create` verified-organizer event creation with preview, AI image placeholder, media URLs, payment methods and promotion channels
- `/auth` account creation, verification and payout preference setup
- `/tickets` email-code ticket lookup
- `/organizer` CRM/networking/campaign overview
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
