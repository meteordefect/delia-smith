# BJJ Tracker

Interactive map showing Brazilian Jiu-Jitsu gyms worldwide. Select a country, see gyms plotted with logos, tap for details and Google Maps links.

## Stack

- **Frontend:** Next.js 14, React, Tailwind CSS
- **Map:** Mapbox GL JS
- **Animation:** GSAP
- **Data:** Google Maps Places API (build-time only)
- **Deploy:** Vercel (static, zero runtime cost)

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## How It Works

All gym data is fetched at build time from Google Maps Places API. The deployed site is fully static — no API calls, no backend, no runtime costs.

```
Google Maps API → Ingestion Scripts → Static JSON → Next.js Build → Vercel CDN
```

Gym logos are downloaded and converted to webp. Country pages are statically generated from `/data/gyms/*.json`.

## Documentation

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System design, data pipeline, scripts reference |
| [PRD.md](./PRD.md) | Product requirements |
| [RUNSHEET.md](./RUNSHEET.md) | Execution checklist |
| [BUILD_LOG.md](./BUILD_LOG.md) | Build metrics and logs |

## Common Tasks

```bash
# Add a new country
npm run ingest -- --country=VN && npm run normalize

# Fill city coverage gaps
npm run ingest-city -- --city="Canberra" --country=AU

# Add a single gym manually
npm run add-gym ChIJxxxxxxxxxxxxxx
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for full scripts reference and data pipeline details.
