import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const GYMS_DIR = path.join(ROOT, 'data', 'gyms');
const LOGOS_DIR = path.join(ROOT, 'public', 'logos');

const API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const PLACES_API_URL = 'https://places.googleapis.com/v1/places:searchText';

if (!API_KEY) {
  console.error('Error: GOOGLE_MAPS_API_KEY not set in .env');
  process.exit(1);
}

const countries = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'countries.json'), 'utf-8')
);

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseArgs() {
  const args = process.argv.slice(2);
  let city = null;
  let countryCode = null;

  for (const arg of args) {
    if (arg.startsWith('--city=')) {
      city = arg.split('=')[1];
    } else if (arg.startsWith('--country=')) {
      countryCode = arg.split('=')[1].toUpperCase();
    }
  }

  return { city, countryCode };
}

async function searchGymsInCity(city, countryName) {
  const query = `Brazilian Jiu Jitsu gym in ${city}, ${countryName}`;
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
      console.error(`API error:`, errorText);
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

async function downloadLogo(photoReference, placeId) {
  if (!photoReference) return null;

  fs.mkdirSync(LOGOS_DIR, { recursive: true });

  const logoPath = path.join(LOGOS_DIR, `${placeId}.webp`);
  const logoUrl = `/logos/${placeId}.webp`;

  if (fs.existsSync(logoPath)) {
    return logoUrl;
  }

  try {
    const photoUrl = `https://places.googleapis.com/v1/${photoReference}/media?maxHeightPx=200&maxWidthPx=200&key=${API_KEY}`;
    const response = await fetch(photoUrl);

    if (!response.ok) {
      console.warn(`  Failed to download logo for ${placeId}: ${response.status}`);
      return null;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(logoPath, buffer);

    return logoUrl;
  } catch (err) {
    console.warn(`  Error downloading logo for ${placeId}:`, err.message);
    return null;
  }
}

function normalizeName(name) {
  if (!name) return 'Unknown';
  return name
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/^brazilian jiu[- ]?jitsu\s*/i, '')
    .replace(/\s*brazilian jiu[- ]?jitsu$/i, '')
    .replace(/^bjj\s*/i, '')
    .replace(/\s*bjj$/i, '')
    .trim() || name.trim();
}

async function main() {
  const { city, countryCode } = parseArgs();

  if (!city || !countryCode) {
    console.log(`
Usage: npm run ingest-city -- --city="City Name" --country=XX

Examples:
  npm run ingest-city -- --city="Canberra" --country=AU
  npm run ingest-city -- --city="Da Nang" --country=VN

Searches for BJJ gyms in a specific city and merges them into the country dataset.
`);
    process.exit(0);
  }

  const country = countries.find((c) => c.code === countryCode);
  if (!country) {
    console.error(`Country code "${countryCode}" not found in countries.json`);
    process.exit(1);
  }

  console.log(`\nBJJ Tracker — City Ingestion`);
  console.log(`============================\n`);
  console.log(`City: ${city}`);
  console.log(`Country: ${country.name} (${country.code})\n`);

  const places = await searchGymsInCity(city, country.name);

  if (places.length === 0) {
    console.log('\nNo gyms found.');
    process.exit(0);
  }

  fs.mkdirSync(GYMS_DIR, { recursive: true });
  const filePath = path.join(GYMS_DIR, `${countryCode.toLowerCase()}.json`);

  let data;
  if (fs.existsSync(filePath)) {
    data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    console.log(`\nExisting dataset: ${data.gym_count} gyms`);
  } else {
    data = {
      country: country.name,
      country_code: country.code,
      normalized_at: new Date().toISOString(),
      gym_count: 0,
      gyms: [],
    };
    console.log(`\nCreating new dataset for ${country.name}`);
  }

  const existingIds = new Set(data.gyms.map((g) => g.place_id));
  let addedCount = 0;
  let skippedCount = 0;

  console.log(`\nProcessing ${places.length} results...`);

  for (const place of places) {
    const placeId = place.id;

    if (existingIds.has(placeId)) {
      skippedCount++;
      continue;
    }

    const photoRef = place.photos?.[0]?.name || null;
    const logo = await downloadLogo(photoRef, placeId);

    const gym = {
      place_id: placeId,
      name: normalizeName(place.displayName?.text),
      address: place.formattedAddress || '',
      lat: place.location?.latitude || null,
      lng: place.location?.longitude || null,
      google_maps_url: place.googleMapsUri || null,
      website: place.websiteUri || null,
      logo,
    };

    data.gyms.push(gym);
    existingIds.add(placeId);
    addedCount++;

    await delay(50);
  }

  data.gym_count = data.gyms.length;
  data.normalized_at = new Date().toISOString();

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

  console.log(`\nResults:`);
  console.log(`  Added: ${addedCount} new gyms`);
  console.log(`  Skipped: ${skippedCount} duplicates`);
  console.log(`  Total in dataset: ${data.gym_count}`);
  console.log(`\nWrote to ${filePath}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
