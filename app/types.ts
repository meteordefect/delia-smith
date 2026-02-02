export interface Gym {
  place_id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  google_maps_url: string;
  website: string | null;
  logo: string | null;
}

export interface CountryData {
  country: string;
  country_code: string;
  normalized_at: string;
  gym_count: number;
  gyms: Gym[];
}
