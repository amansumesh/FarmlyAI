import { useState, useCallback } from 'react';
import { geocodingService } from '../services/geocoding.service';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  city: string | null;
  state: string | null;
  district: string | null;
  error: string | null;
  loading: boolean;
}

interface GeolocationReturn extends GeolocationState {
  getCurrentLocation: () => Promise<void>;
}

export const useGeolocation = (): GeolocationReturn => {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    address: null,
    city: null,
    state: null,
    district: null,
    error: null,
    loading: false
  });

  const getCurrentLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setState(prev => ({
        ...prev,
        error: 'Geolocation is not supported by your browser',
        loading: false
      }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;

        setState(prev => ({
          ...prev,
          latitude: lat,
          longitude: lon,
          loading: true
        }));

        const geocodeResult = await geocodingService.reverseGeocode(lat, lon);

        setState({
          latitude: lat,
          longitude: lon,
          address: geocodeResult?.address || null,
          city: geocodeResult?.city || null,
          state: geocodeResult?.state || null,
          district: geocodeResult?.district || null,
          error: null,
          loading: false
        });
      },
      (error) => {
        let errorMessage = 'Failed to get your location';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }

        setState({
          latitude: null,
          longitude: null,
          address: null,
          city: null,
          state: null,
          district: null,
          error: errorMessage,
          loading: false
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }, []);

  return {
    ...state,
    getCurrentLocation
  };
};
