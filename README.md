# BJJ Tracker

Interactive map showing Brazilian Jiu-Jitsu gyms worldwide. Select a country, see gyms plotted with logos, tap for details and Google Maps links.

Built with Next.js, Mapbox GL JS, and GSAP. Fully static, zero runtime cost, deploys to Vercel free tier.

## Docs

- [PRD.md](./PRD.md) — Full product requirements
- [RUNSHEET.md](./RUNSHEET.md) — Execution checklist (backend/frontend stages)
- [BUILD_LOG.md](./BUILD_LOG.md) — Metrics: prompts, model switches, phase completion

## Quick Start

```bash
npm install
npm run dev
```

## Data

Gym data lives in `/data/gyms/{country}.json`. Generated offline via ingestion scripts, never fetched at runtime.

## Scripts

```bash
# Ingest all countries from Google Places
npm run ingest

# Ingest a single country
npm run ingest -- --country=NL

# Normalize raw data + download logos
npm run normalize

# Manually add a single gym (favorites, one-offs)
npm run add-gym <place_id_or_url>
```

### Adding a Gym Manually

To add a favorite gym or one-off:

1. Find the gym on Google Maps
2. Copy the place ID from the URL (starts with `ChIJ`) or copy the full URL
3. Run:

```bash
npm run add-gym ChIJSzbAeNMLxkcRZ-4wS5kPvBQ
# or
npm run add-gym "https://www.google.com/maps/place/...?place_id=ChIJ..."
```

This fetches the gym details, downloads the logo, and adds it to the appropriate country file. Marked with `manual_add: true` so you can identify hand-picked gyms.
