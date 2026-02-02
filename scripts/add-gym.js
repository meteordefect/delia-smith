import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const GYMS_DIR = path.join(ROOT, 'data', 'gyms');
const LOGOS_DIR = path.join(ROOT, 'public', 'logos');

const API_KEY = process.env.GOOGLE_MAPS_API_KEY;

if (!API_KEY) {
  console.error('Error: GOOGLE_MAPS_API_KEY not set in .env');
  process.exit(1);
}

const COUNTRY_CODES = {
  'australia': 'AU',
  'brazil': 'BR',
  'canada': 'CA',
  'germany': 'DE',
  'france': 'FR',
  'japan': 'JP',
  'mexico': 'MX',
  'netherlands': 'NL',
  'portugal': 'PT',
  'spain': 'ES',
  'sweden': 'SE',
  'thailand': 'TH',
  'united arab emirates': 'AE',
  'united kingdom': 'GB',
  'united states': 'US',
  'usa': 'US',
  'uk': 'GB',
  'uae': 'AE',
};

function extractPlaceId(input) {
  if (input.startsWith('ChIJ')) {
    return input;
  }

  const match = input.match(/place_id[=:]([^&\s]+)/i);
  if (match) return match[1];

  const cid = input.match(/[?&]cid=(\d+)/);
  if (cid) {
    console.error('Error: CID URLs not supported. Use a place_id or a share URL.');
    process.exit(1);
  }

  console.error('Error: Could not extract place_id from input.');
  console.error('Provide a place_id (starts with ChIJ) or a Google Maps URL with place_id.');
  process.exit(1);
}

async function fetchPlaceDetails(placeId) {
  const url = `https://places.googleapis.com/v1/places/${placeId}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'X-Goog-Api-Key': API_KEY,
      'X-Goog-FieldMask': [
        'id',
        'displayName',
        'formattedAddress',
        'addressComponents',
        'location',
        'googleMapsUri',
        'websiteUri',
        'photos',
      ].join(','),
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('API error:', errorText);
    process.exit(1);
  }

  return response.json();
}

function getCountryFromAddress(place) {
  const components = place.addressComponents || [];
  const countryComponent = components.find((c) =>
    c.types?.includes('country')
  );

  if (countryComponent) {
    const countryName = countryComponent.longText?.toLowerCase();
    return COUNTRY_CODES[countryName] || null;
  }

  const address = place.formattedAddress?.toLowerCase() || '';
  for (const [name, code] of Object.entries(COUNTRY_CODES)) {
    if (address.includes(name)) {
      return code;
    }
  }

  return null;
}

async function downloadLogo(photoReference, placeId) {
  if (!photoReference) return null;

  fs.mkdirSync(LOGOS_DIR, { recursive: true });

  const logoPath = path.join(LOGOS_DIR, `${placeId}.webp`);
  const logoUrl = `/logos/${placeId}.webp`;

  if (fs.existsSync(logoPath)) {
    console.log('  Logo already exists');
    return logoUrl;
  }

  try {
    const photoUrl = `https://places.googleapis.com/v1/${photoReference}/media?maxHeightPx=200&maxWidthPx=200&key=${API_KEY}`;
    const response = await fetch(photoUrl);

    if (!response.ok) {
      console.warn(`  Failed to download logo: ${response.status}`);
      return null;
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(logoPath, buffer);
    console.log('  Downloaded logo');

    return logoUrl;
  } catch (err) {
    console.warn('  Error downloading logo:', err.message);
    return null;
  }
}

async function addGymToCountry(gym, countryCode) {
  fs.mkdirSync(GYMS_DIR, { recursive: true });

  const filePath = path.join(GYMS_DIR, `${countryCode.toLowerCase()}.json`);
  let data;

  if (fs.existsSync(filePath)) {
    data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } else {
    const countryName = Object.entries(COUNTRY_CODES).find(
      ([, code]) => code === countryCode
    )?.[0] || countryCode;

    data = {
      country: countryName.charAt(0).toUpperCase() + countryName.slice(1),
      country_code: countryCode,
      normalized_at: new Date().toISOString(),
      gym_count: 0,
      gyms: [],
    };
  }

  const exists = data.gyms.some((g) => g.place_id === gym.place_id);
  if (exists) {
    console.log('  Gym already exists in dataset, skipping');
    return false;
  }

  data.gyms.push(gym);
  data.gym_count = data.gyms.length;
  data.normalized_at = new Date().toISOString();

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  return true;
}

async function main() {
  const input = process.argv[2];

  if (!input) {
    console.log(`
Usage: npm run add-gym <place_id_or_url>

Examples:
  npm run add-gym ChIJSzbAeNMLxkcRZ-4wS5kPvBQ
  npm run add-gym "https://www.google.com/maps/place/...?place_id=ChIJ..."

Adds a single gym to the dataset by fetching its details from Google Places.
`);
    process.exit(0);
  }

  console.log('\nBJJ Tracker — Add Gym');
  console.log('=====================\n');

  const placeId = extractPlaceId(input);
  console.log(`Place ID: ${placeId}`);

  console.log('Fetching place details...');
  const place = await fetchPlaceDetails(placeId);

  const name = place.displayName?.text || 'Unknown';
  console.log(`  Name: ${name}`);
  console.log(`  Address: ${place.formattedAddress}`);

  const countryCode = getCountryFromAddress(place);
  if (!countryCode) {
    console.error('\nError: Could not determine country. Add this country to the script.');
    process.exit(1);
  }
  console.log(`  Country: ${countryCode}`);

  const photoRef = place.photos?.[0]?.name || null;
  const logo = await downloadLogo(photoRef, placeId);

  const gym = {
    place_id: placeId,
    name,
    address: place.formattedAddress || '',
    lat: place.location?.latitude || null,
    lng: place.location?.longitude || null,
    google_maps_url: place.googleMapsUri || null,
    website: place.websiteUri || null,
    logo,
    manual_add: true,
  };

  const added = await addGymToCountry(gym, countryCode);

  if (added) {
    console.log(`\nDone. Added "${name}" to ${countryCode.toLowerCase()}.json`);
  } else {
    console.log('\nNo changes made.');
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
