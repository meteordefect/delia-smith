# BJJ Tracker — Product Requirements Document

## Purpose

A global, mobile-first web application that visualizes Brazilian Jiu-Jitsu gyms worldwide on an interactive map.

Users select a country → see all gyms in that country rendered spatially, with logos floating above locations, animated smoothly.

### Priorities

- Zero/near-zero infra cost
- Static + edge-rendered delivery
- Deterministic data (JSON)
- Visual clarity and motion precision

---

## Target Users

- BJJ practitioners traveling internationally
- Gym owners discovering regional density
- Community builders / federations

**No accounts. No auth. No payments (v1).**

---

## Core User Flow

1. User lands on homepage
2. Selects or searches for a country
3. Map animates to country bounds
4. Gym markers + logos fade/float into view
5. User zooms/pans:
   - Mobile: pinch / drag
   - Desktop: scroll / mouse
6. User taps a gym to see:
   - Logo
   - Name
   - City
   - Google Maps link

---

## Functional Requirements

### Map & Data

- World map base
- Country-level bounding focus
- Gym points plotted via latitude/longitude
- Logos rendered as floating sprites/cards
- Click/tap → external Google Maps listing

### Animation

- Initial map load: smooth camera pan/zoom
- Gym appearance: staggered fade-in + subtle vertical float
- Zoom transitions eased (no snapping)

### Data Source Strategy (Cost-Controlled)

- Initial ingestion from Google Maps API (one-time or infrequent)
- Normalized + stored as static JSON
- Runtime app never queries Google Maps
- Manual or scheduled regeneration only

---

## Non-Functional Requirements

- Mobile-first
- Lighthouse score ≥ 90
- Cold load < 1.5s on mobile
- Zero server runtime dependencies
- Works fully on Vercel free tier

---

## Tech Stack

### Frontend

- Next.js (latest, App Router)
- React Server Components (default)
- Client Components only where required (map, animation)
- Tailwind CSS
- GSAP for animations

### Map Rendering

**Option A (recommended):** Mapbox GL JS (static token) + GSAP layered animations

**Option B (heavier):** Three.js world plane + custom projection, logos as sprites

→ Start with Option A, migrate later if needed.

### Data

- Static JSON files stored in `/data/gyms/{country}.json`
- Pre-generated at build time

### Hosting / CI

- GitHub repo
- Auto-deploy to Vercel
- No backend server

---

## Data Model

```json
{
  "country": "Japan",
  "country_code": "JP",
  "last_updated": "2026-01-15",
  "gyms": [
    {
      "id": "jp-tokyo-carpe-diem",
      "name": "Carpe Diem BJJ",
      "city": "Tokyo",
      "lat": 35.6895,
      "lng": 139.6917,
      "logo": "/logos/carpe-diem.png",
      "google_maps_url": "https://maps.google.com/?cid=..."
    }
  ]
}
```

---

## Design System

### Visual Tone

- Clinical, high-contrast
- Editorial spacing
- Security / precision aesthetic

### Colors

| Token           | Value     |
|-----------------|-----------|
| Background      | `#F7F7F7` |
| Primary Text    | `#0B0B0B` |
| Secondary Text  | `#6F6F6F` |
| Accent (Red)    | `#E53935` |
| Cards/Surfaces  | `#FFFFFF` |
| Borders         | `#EAEAEA` |

### Typography

**Primary:** Inter — Regular (400), Medium (500), SemiBold (600)

**Alternative:** Söhne or Neue Montreal (if licensed)

### Layout Rules

- Large negative space
- Soft card radius (12–16px)
- Subtle shadows only
- No gradients
- No noisy backgrounds

### Animation Guidelines

- GSAP easing: `power3.out`
- Durations: 400–700ms
- Never animate layout shift
- All motion supports meaning (focus, entry, hierarchy)

---

## Out of Scope (v1)

- User accounts
- Reviews
- Submissions
- Payments
- Real-time updates

---

## Design Decisions (Locked)

| Decision | Choice |
|----------|--------|
| Map library | Mapbox GL JS |
| Max gyms before clustering | Top 30 visible, more on zoom |
| Logo fallback | Custom martial artist icon (to be supplied) |
