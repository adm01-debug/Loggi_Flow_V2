import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface GeocodingResult {
  coordinates: { lat: number; lng: number } | null;
  placeName?: string;
  confidence?: number;
}

interface GeocodingCache {
  [address: string]: GeocodingResult;
}

// In-memory cache to avoid repeated API calls
const geocodingCache: GeocodingCache = {};

export const useGeocoding = () => {
  const [isGeocoding, setIsGeocoding] = useState(false);

  const geocodeAddress = useCallback(async (address: string): Promise<GeocodingResult> => {
    // Check cache first
    const cacheKey = address.toLowerCase().trim();
    if (geocodingCache[cacheKey]) {
      return geocodingCache[cacheKey];
    }

    try {
      const { data, error } = await supabase.functions.invoke('geocode-address', {
        body: { address },
      });

      if (error) {
        return { coordinates: null };
      }

      const result: GeocodingResult = {
        coordinates: data.coordinates,
        placeName: data.placeName,
        confidence: data.confidence,
      };

      // Cache the result
      geocodingCache[cacheKey] = result;

      return result;
    } catch {
      return { coordinates: null };
    }
  }, []);

  const geocodeMultipleAddresses = useCallback(async (
    addresses: { id: string; address: string }[]
  ): Promise<Map<string, GeocodingResult>> => {
    setIsGeocoding(true);
    const results = new Map<string, GeocodingResult>();

    // Process in batches of 5 to avoid rate limiting
    const batchSize = 5;
    for (let i = 0; i < addresses.length; i += batchSize) {
      const batch = addresses.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async ({ id, address }) => {
        const result = await geocodeAddress(address);
        return { id, result };
      });

      const batchResults = await Promise.all(batchPromises);
      
      batchResults.forEach(({ id, result }) => {
        results.set(id, result);
      });

      // Small delay between batches to respect rate limits
      if (i + batchSize < addresses.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }

    setIsGeocoding(false);
    return results;
  }, [geocodeAddress]);

  const clearCache = useCallback(() => {
    Object.keys(geocodingCache).forEach(key => delete geocodingCache[key]);
  }, []);

  return {
    geocodeAddress,
    geocodeMultipleAddresses,
    isGeocoding,
    clearCache,
  };
};
