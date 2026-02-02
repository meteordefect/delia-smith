# BJJ Tracker — AI Context

Single-file context for LLMs making changes to this codebase.

---

## What This Is

A global, mobile-first web app that visualizes Brazilian Jiu-Jitsu gyms worldwide on an interactive map. Users select a country → see all gyms plotted with logos → tap for details and Google Maps links.

**Key Constraints:**
- Zero runtime cost — fully static, no backend, no API calls at runtime
- All gym data fetched at build time from Google Maps Places API
- Deployed to Vercel free tier

---

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Map | Mapbox GL JS |
| Animation | GSAP, Framer Motion |
| Icons | Lucide React |
| Utilities | clsx, tailwind-merge |
| Data | Static JSON (build-time only) |
| Deploy | Vercel (static export) |

---

## Architecture

```
BUILD TIME:
  Google Maps API → scripts/ingest.js → data/raw/*.json
                                            ↓
                    scripts/normalize.js → data/gyms/*.json + public/logos/*.webp
                                            ↓
                    Next.js build (generateStaticParams) → static HTML

RUNTIME:
  Vercel CDN → Static HTML + JSON → Mapbox GL JS renders map
```

**No API routes. No database. No server functions.**

---

## Key Directories

```
app/
├── [country]/page.tsx    # Country pages (statically generated)
├── components/
│   ├── CountrySelector.tsx
│   ├── Footer.tsx
│   ├── Map.tsx
│   └── Navbar.tsx
├── globals.css           # Tailwind global styles
├── layout.tsx            # Root layout
├── page.tsx              # Home page
└── types.ts              # Gym and CountryData interfaces

data/
├── raw/                  # Raw API responses (gitignored)
└── gyms/                 # Production data: {country_code}.json

public/logos/             # Gym logos (webp, 200x200)

scripts/
├── countries.json        # Country list for ingestion
├── ingest.js             # Country-level data fetching
├── ingest-city.js        # City-level gap filling
├── normalize.js          # Data cleaning + logo download
└── add-gym.js            # Manual single-gym addition
```

---

## Data Schema

Each `data/gyms/{code}.json`:

```json
{
  "country": "Australia",
  "country_code": "AU",
  "normalized_at": "2026-02-02T04:59:59.263Z",
  "gym_count": 60,
  "gyms": [
    {
      "place_id": "ChIJJ6Vz4YDPsGoRsVVHohLqDM8",
      "name": "Team Balboa",
      "address": "65 Hyde St, Adelaide SA 5000",
      "lat": -34.9263719,
      "lng": 138.6045336,
      "google_maps_url": "https://maps.google.com/?cid=...",
      "website": "https://example.com",   // string | null
      "logo": "/logos/ChIJJ6Vz4YDPsGoRsVVHohLqDM8.webp"  // string | null
    }
  ]
}
```

---

## Common Tasks

### Add a new country

```bash
# 1. Add to scripts/countries.json
# 2. Add to COUNTRY_CODES in scripts/add-gym.js
npm run ingest -- --country=XX
npm run normalize
```

### Fill city coverage gaps

```bash
npm run ingest-city -- --city="City Name" --country=XX
```

### Add a single gym manually

```bash
npm run add-gym ChIJxxxxxxxxxxxxxx
```

### Run locally

```bash
npm install
npm run dev
```

---

## Design System

| Token | Value |
|-------|-------|
| Background | `#F7F7F7` |
| Primary Text | `#0B0B0B` |
| Secondary Text | `#6F6F6F` |
| Accent (Red) | `#E53935` |
| Cards/Surfaces | `#FFFFFF` |
| Borders | `#EAEAEA` |

- Font: Inter (400, 500, 600)
- Animation: GSAP with `power3.out`, 400–700ms
- Style: Clinical, high-contrast, large negative space

---

## Rules for Changes

1. **No runtime API calls** — all data must be static JSON at build time
2. **No backend/database** — stays on Vercel free tier
3. **Logos must be webp** — downloaded at build, stored in `/public/logos/`
4. **Country pages are statically generated** — use `generateStaticParams`
5. **Map is client-side only** — Mapbox requires `'use client'`

---

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `GOOGLE_MAPS_API_KEY` | Ingestion scripts only (not runtime) |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Frontend map rendering |

---

## Detailed Documentation

For deeper context, see:
- [PRD.md](./PRD.md) — Full product requirements, user flows, future plans
- [ARCHITECTURE.md](./ARCHITECTURE.md) — Complete system design, all scripts
- [RUNSHEET.md](./RUNSHEET.md) — Build execution checklist
- [BUILD_LOG.md](./BUILD_LOG.md) — Build history and notes
