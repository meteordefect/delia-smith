# BJJ Tracker — Run Sheet

Execution plan split by model type. Swap models cleanly between stages.

---

## Backend Stages

> **Model:** Backend-focused  
> **Scope:** Data ingestion, normalization, build logic. No runtime backend — everything is build-time or offline tooling.

### B1 — Data Ingestion Script

- [ ] Node.js script using Google Maps Places API
- [ ] Query: `"Brazilian Jiu Jitsu gym in {country}"`
- [ ] Extract per gym:
  - Name
  - Lat/Lng
  - Place ID
  - Website / Maps URL
  - Photo/logo (if available)
- [ ] Output: Raw JSON dump per country

### B2 — Data Normalization

- [ ] Deduplicate gyms
- [ ] Normalize naming conventions
- [ ] Enforce schema validation
- [ ] Download logos → `/public/logos/`
- [ ] Generate final `/data/gyms/{country}.json`

### B3 — Build Integration

- [ ] Next.js `generateStaticParams` for country pages
- [ ] Country list generated from `/data/gyms`
- [ ] Build produces fully static pages
- [ ] No API routes required

---

## Frontend Stages

> **Model:** Frontend-focused  
> **Scope:** UX, components, rendering, animation.

### F1 — App Skeleton

- [ ] Next.js App Router setup
- [ ] `layout.tsx` with global styles
- [ ] Font loading (Inter)
- [ ] Tailwind config aligned to design system

### F2 — Country Selector

- [ ] Searchable dropdown component
- [ ] Keyboard + touch friendly
- [ ] Animates map transition on country change

### F3 — Map Component

- [ ] Client Component with Mapbox GL JS
- [ ] Camera controls:
  - Mobile: pinch / drag
  - Desktop: scroll / mouse
- [ ] Country bounding box zoom

### F4 — Gym Marker System

- [ ] Logos as floating cards/sprites
- [ ] Z-index management
- [ ] Collision avoidance (simple offset stacking)
- [ ] Tap/click opens detail panel

### F5 — Motion Layer

- [ ] GSAP timelines for:
  - Country change
  - Zoom events
  - Marker entry
- [ ] Respect `prefers-reduced-motion`

### F6 — Performance Hardening

- [ ] Dynamic import for map libraries
- [ ] Image optimization
- [ ] Memoized renders
- [ ] Avoid re-instantiating scenes
