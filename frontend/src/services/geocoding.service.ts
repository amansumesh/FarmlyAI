interface NominatimResponse {
  display_name: string;
  address: {
    village?: string;
    town?: string;
    city?: string;
    municipality?: string;
    county?: string;
    state_district?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
}

interface ReverseGeocodeResult {
  address: string;
  city: string;
  state: string;
  district: string;
  country: string;
}

class GeocodingService {
  private readonly NOMINATIM_URL = 'https://nominatim.openstreetmap.org/reverse';

  async reverseGeocode(latitude: number, longitude: number): Promise<ReverseGeocodeResult | null> {
    try {
      const params = new URLSearchParams({
        lat: latitude.toString(),
        lon: longitude.toString(),
        format: 'json',
        addressdetails: '1',
        'accept-language': 'en'
      });

      const response = await fetch(`${this.NOMINATIM_URL}?${params}`, {
        headers: {
          'User-Agent': 'Farmly-AI/1.0'
        }
      });

      if (!response.ok) {
        throw new Error('Geocoding request failed');
      }

      const data: NominatimResponse = await response.json();

      const city = data.address.city || 
                   data.address.town || 
                   data.address.village || 
                   data.address.municipality || 
                   data.address.county || 
                   '';

      const district = data.address.county || 
                      data.address.state_district || 
                      '';

      const state = data.address.state || '';
      const country = data.address.country || '';

      const addressParts = [city, state, country].filter(Boolean);
      const address = addressParts.join(', ');

      return {
        address,
        city,
        state,
        district,
        country
      };
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
      return null;
    }
  }
}

export const geocodingService = new GeocodingService();
