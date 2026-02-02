# Architecture

Technical overview of the BJJ Tracker system design, data pipeline, and available scripts.

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        BUILD TIME                                │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │ Google Maps  │───▶│  Ingestion   │───▶│  Normalize   │       │
│  │ Places API   │    │  Scripts     │    │  + Logos     │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
│                              │                   │               │
│                              ▼                   ▼               │
│                      data/raw/*.json     data/gyms/*.json       │
│                                          public/logos/*.webp     │
│                                                 │                │
│                                                 ▼                │
│                                    ┌──────────────────┐          │
│                                    │   Next.js Build  │          │
│                                    │ generateStatic   │          │
│                                    │    Params        │          │
│                                    └──────────────────┘          │
│                                                 │                │
└─────────────────────────────────────────────────┼────────────────┘
                                                  │
                                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                        RUNTIME (Static)                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │   Vercel     │    │  Static HTML │    │   Mapbox     │       │
│  │   CDN        │───▶│  + JSON      │───▶│   GL JS      │       │
│  └──────────────┘    └──────────────┘    └──────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

**Key Principle:** All data processing happens at build time. The deployed site is fully static with zero API calls or backend costs.

---

## Directory Structure

```
├── app/
│   ├── [country]/page.tsx    # Dynamic country pages
│   ├── components/           # React components
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Home page
├── data/
│   ├── raw/                  # Raw API responses (gitignored)
│   └── gyms/                 # Normalized gym data per country
│       ├── au.json
│       ├── vn.json
│       └── ...
├── public/
│   └── logos/                # Gym logos (webp, 200x200)
├── scripts/
│   ├── countries.json        # Country list for ingestion
│   ├── ingest.js             # Country-level data fetching
│   ├── ingest-city.js        # City-level gap filling
│   ├── normalize.js          # Data cleaning + logo download
│   └── add-gym.js            # Manual single-gym addition
└── RUNSHEET.md               # Execution checklist
```

---

## Data Pipeline

### Stage 1: Ingestion

Fetches gym data from Google Maps Places API.

**Country-level ingestion:**
```bash
# All countries defined in countries.json
npm run ingest

# Single country
npm run ingest -- --country=AU
```

Query format: `"Brazilian Jiu Jitsu gym in {country_name}"`

Output: `data/raw/{country_code}.json`

### Stage 2: Normalization

Processes raw data, deduplicates, validates, and downloads logos.

```bash
npm run normalize
```

- Removes duplicates by `place_id`
- Validates required fields (name, lat, lng)
- Downloads gym photos as 200x200 webp
- Output: `data/gyms/{country_code}.json`

### Stage 3: Build

Next.js reads from `data/gyms/` at build time via `generateStaticParams`.

```bash
npm run build
```

---

## Scripts Reference

### `npm run ingest`

Fetches BJJ gyms from Google Maps Places API for all countries.

| Flag | Description |
|------|-------------|
| `--country=XX` | Process single country by ISO code |

**Environment:** Requires `GOOGLE_MAPS_API_KEY` in `.env`

### `npm run ingest-city`

Fills coverage gaps by querying specific cities.

```bash
npm run ingest-city -- --city="Canberra" --country=AU
npm run ingest-city -- --city="Da Nang" --country=VN
```

- Merges directly into `data/gyms/{code}.json`
- Auto-deduplicates existing gyms
- Downloads logos automatically
- No separate normalize step needed

### `npm run normalize`

Processes raw ingestion data into production format.

- Run after `npm run ingest`
- Not needed after `ingest-city` (auto-normalizes)

### `npm run add-gym`

Manually adds a single gym by Google Maps place ID.

```bash
npm run add-gym ChIJSzbAeNMLxkcRZ-4wS5kPvBQ
npm run add-gym "https://www.google.com/maps/place/...?place_id=ChIJ..."
```

- Fetches gym details from Places API
- Downloads logo
- Adds to appropriate country file
- Marks with `manual_add: true`

---

## Adding a New Country

1. Add entry to `scripts/countries.json`:
   ```json
   { "name": "Vietnam", "code": "VN" }
   ```

2. Add to `COUNTRY_CODES` in `scripts/add-gym.js`:
   ```javascript
   'vietnam': 'VN',
   'vn': 'VN',
   ```

3. Run ingestion:
   ```bash
   npm run ingest -- --country=VN
   npm run normalize
   ```

4. Fill city gaps as needed:
   ```bash
   npm run ingest-city -- --city="Ho Chi Minh City" --country=VN
   ```

---

## Data Schema

Each `data/gyms/{code}.json` file:

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
      "address": "65 Hyde St, Adelaide SA 5000, Australia",
      "lat": -34.9263719,
      "lng": 138.6045336,
      "google_maps_url": "https://maps.google.com/?cid=...",
      "website": "https://example.com",
      "logo": "/logos/ChIJJ6Vz4YDPsGoRsVVHohLqDM8.webp"
    }
  ]
}
```

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `GOOGLE_MAPS_API_KEY` | Google Maps Places API key (ingestion only) |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox GL JS access token (frontend) |

Ingestion scripts require the Google API key. The frontend only needs Mapbox.
