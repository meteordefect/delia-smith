# BJJ Tracker — Run Sheet

Execution plan split by model type. Swap models cleanly between stages.

---

## Backend Stages

> **Model:** Backend-focused  
> **Scope:** Data ingestion, normalization, build logic. No runtime backend — everything is build-time or offline tooling.

### B1 — Data Ingestion Script

ok - [x] Node.js script using Google Maps Places API
- [x] Query: `"Brazilian Jiu Jitsu gym in {country}"`
- [x] Extract per gym:
  - Name
  - Lat/Lng
  - Place ID
  - Website / Maps URL
  - Photo/logo (if available)
- [x] Output: Raw JSON dump per country

### B2 — Data Normalization

- [x] Deduplicate gyms
- [x] Normalize naming conventions
- [x] Enforce schema validation
- [x] Download logos → `/public/logos/`
- [x] Generate final `/data/gyms/{country}.json`

### B3 — Build Integration

- [x] Next.js `generateStaticParams` for country pages
- [x] Country list generated from `/data/gyms`
- [x] Build produces fully static pages
- [x] No API routes required

---

## Frontend Stages

> **Model:** Frontend-focused  
> **Scope:** UX, components, rendering, animation.

### F1 — App Skeleton

- [x] Next.js App Router setup
- [x] `layout.tsx` with global styles
- [x] Font loading (Inter)
- [x] Tailwind config aligned to design system

### F2 — Country Selector

- [x] Searchable dropdown component
- [x] Keyboard + touch friendly
- [x] Animates map transition on country change

### F3 — Map Component

- [x] Client Component with Mapbox GL JS
- [x] Camera controls:
  - Mobile: pinch / drag
  - Desktop: scroll / mouse
- [x] Country bounding box zoom

### F4 — Gym Marker System

- [x] Logos as floating cards/sprites
- [x] Z-index management
- [x] Collision avoidance (simple offset stacking)
- [x] Tap/click opens detail panel

### F5 — Motion Layer

- [x] GSAP timelines for:
  - Country change
  - Zoom events
  - Marker entry
- [x] Respect `prefers-reduced-motion`

### F6 — Performance Hardening

- [x] Dynamic import for map libraries
- [x] Image optimization
- [x] Memoized renders
- [x] Avoid re-instantiating scenes
