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
