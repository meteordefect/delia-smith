import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const RAW_OUTPUT_DIR = path.join(ROOT, 'data', 'raw');

const API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const PLACES_API_URL = 'https://places.googleapis.com/v1/places:searchText';

if (!API_KEY) {
  console.error('Error: GOOGLE_MAPS_API_KEY not set in .env');
  process.exit(1);
}

const countries = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'countries.json'), 'utf-8')
);

async function searchGyms(country) {
  const query = `Brazilian Jiu Jitsu gym in ${country.name}`;
  console.log(`Searching: "${query}"`);

  const allResults = [];
  let pageToken = null;

  do {
    const body = {
      textQuery: query,
      languageCode: 'en',
      maxResultCount: 20,
    };

    if (pageToken) {
      body.pageToken = pageToken;
    }

    const response = await fetch(PLACES_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': API_KEY,
        'X-Goog-FieldMask': [
          'places.id',
          'places.displayName',
          'places.formattedAddress',
          'places.location',
          'places.googleMapsUri',
          'places.websiteUri',
          'places.photos',
          'nextPageToken',
        ].join(','),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error for ${country.name}:`, errorText);
      break;
    }

    const data = await response.json();
    const places = data.places || [];
    allResults.push(...places);

    console.log(`  Found ${places.length} results (total: ${allResults.length})`);

    pageToken = data.nextPageToken || null;

    if (pageToken) {
      await delay(200);
    }
  } while (pageToken);

  return allResults;
}

function transformResults(places, country) {
  return places.map((place) => {
    const photoRef = place.photos?.[0]?.name || null;

    return {
      place_id: place.id,
      name: place.displayName?.text || 'Unknown',
      address: place.formattedAddress || '',
      lat: place.location?.latitude || null,
      lng: place.location?.longitude || null,
      google_maps_url: place.googleMapsUri || null,
      website: place.websiteUri || null,
      photo_reference: photoRef,
    };
  });
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function ingestCountry(country) {
  const rawPlaces = await searchGyms(country);
  const gyms = transformResults(rawPlaces, country);

  const output = {
    country: country.name,
    country_code: country.code,
    fetched_at: new Date().toISOString(),
    gym_count: gyms.length,
    gyms,
  };

  fs.mkdirSync(RAW_OUTPUT_DIR, { recursive: true });
  const outPath = path.join(RAW_OUTPUT_DIR, `${country.code.toLowerCase()}.json`);
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`Wrote ${gyms.length} gyms to ${outPath}\n`);

  return gyms.length;
}

async function main() {
  const args = process.argv.slice(2);
  const countryArg = args.find((a) => a.startsWith('--country='));

  let targetCountries = countries;

  if (countryArg) {
    const code = countryArg.split('=')[1].toUpperCase();
    const found = countries.find((c) => c.code === code);
    if (!found) {
      console.error(`Country code "${code}" not found in countries.json`);
      process.exit(1);
    }
    targetCountries = [found];
  }

  console.log(`\nBJJ Tracker — Data Ingestion`);
  console.log(`============================\n`);
  console.log(`Processing ${targetCountries.length} country(ies)...\n`);

  let totalGyms = 0;

  for (const country of targetCountries) {
    const count = await ingestCountry(country);
    totalGyms += count;
    await delay(500);
  }

  console.log(`\nDone. Total gyms ingested: ${totalGyms}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
