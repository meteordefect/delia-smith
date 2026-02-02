import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const RAW_DIR = path.join(ROOT, 'data', 'raw');
const OUTPUT_DIR = path.join(ROOT, 'data', 'gyms');
const LOGOS_DIR = path.join(ROOT, 'public', 'logos');

const API_KEY = process.env.GOOGLE_MAPS_API_KEY;

if (!API_KEY) {
  console.error('Error: GOOGLE_MAPS_API_KEY not set in .env');
  process.exit(1);
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

function validateGym(gym) {
  const errors = [];

  if (!gym.place_id) errors.push('missing place_id');
  if (!gym.name) errors.push('missing name');
  if (gym.lat === null || gym.lat === undefined) errors.push('missing lat');
  if (gym.lng === null || gym.lng === undefined) errors.push('missing lng');
  if (typeof gym.lat !== 'number') errors.push('lat is not a number');
  if (typeof gym.lng !== 'number') errors.push('lng is not a number');

  return errors;
}

function deduplicateGyms(gyms) {
  const seen = new Map();

  for (const gym of gyms) {
    if (!seen.has(gym.place_id)) {
      seen.set(gym.place_id, gym);
    }
  }

  return Array.from(seen.values());
}

async function downloadLogo(photoReference, placeId) {
  if (!photoReference) return null;

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

async function normalizeCountry(rawFile) {
  const rawPath = path.join(RAW_DIR, rawFile);
  const rawData = JSON.parse(fs.readFileSync(rawPath, 'utf-8'));

  console.log(`\nProcessing ${rawData.country} (${rawData.country_code})`);
  console.log(`  Raw gym count: ${rawData.gyms.length}`);

  const deduplicated = deduplicateGyms(rawData.gyms);
  console.log(`  After deduplication: ${deduplicated.length}`);

  const normalized = [];
  let invalidCount = 0;
  let logoCount = 0;

  for (const gym of deduplicated) {
    const errors = validateGym(gym);

    if (errors.length > 0) {
      console.warn(`  Skipping invalid gym "${gym.name}": ${errors.join(', ')}`);
      invalidCount++;
      continue;
    }

    const logo = await downloadLogo(gym.photo_reference, gym.place_id);
    if (logo) logoCount++;

    await delay(50);

    normalized.push({
      place_id: gym.place_id,
      name: normalizeName(gym.name),
      address: gym.address || '',
      lat: gym.lat,
      lng: gym.lng,
      google_maps_url: gym.google_maps_url || null,
      website: gym.website || null,
      logo,
    });
  }

  if (invalidCount > 0) {
    console.log(`  Skipped ${invalidCount} invalid entries`);
  }
  console.log(`  Downloaded ${logoCount} logos`);
  console.log(`  Final count: ${normalized.length}`);

  const output = {
    country: rawData.country,
    country_code: rawData.country_code,
    normalized_at: new Date().toISOString(),
    gym_count: normalized.length,
    gyms: normalized,
  };

  const outPath = path.join(OUTPUT_DIR, `${rawData.country_code.toLowerCase()}.json`);
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`  Wrote to ${outPath}`);

  return normalized.length;
}

async function main() {
  console.log(`\nBJJ Tracker — Data Normalization`);
  console.log(`=================================`);

  if (!fs.existsSync(RAW_DIR)) {
    console.error(`\nError: Raw data directory not found at ${RAW_DIR}`);
    console.error('Run the ingest script first: npm run ingest');
    process.exit(1);
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.mkdirSync(LOGOS_DIR, { recursive: true });

  const rawFiles = fs.readdirSync(RAW_DIR).filter((f) => f.endsWith('.json'));

  if (rawFiles.length === 0) {
    console.error('\nNo raw data files found. Run the ingest script first.');
    process.exit(1);
  }

  console.log(`Found ${rawFiles.length} raw data file(s)`);

  let totalGyms = 0;

  for (const file of rawFiles) {
    const count = await normalizeCountry(file);
    totalGyms += count;
  }

  console.log(`\nDone. Total normalized gyms: ${totalGyms}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
