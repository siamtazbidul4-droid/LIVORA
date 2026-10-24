import { useEffect, useState } from 'react';
import {
  BangladeshLocationData,
  hasBangladeshLocationData,
  setBangladeshLocationData,
} from '../lib/bangladeshLocations';

function isLocationData(value: unknown): value is BangladeshLocationData {
  if (!Array.isArray(value) || value.length === 0) return false;

  return value.every(
    (division) =>
      Number.isSafeInteger(division?.id) &&
      typeof division?.name === 'string' &&
      typeof division?.nameBn === 'string' &&
      Array.isArray(division?.districts) &&
      division.districts.every(
        (district: unknown) =>
          Number.isSafeInteger((district as { id?: number })?.id) &&
          typeof (district as { name?: string })?.name === 'string' &&
          typeof (district as { nameBn?: string })?.nameBn === 'string' &&
          Array.isArray((district as { upazilas?: unknown })?.upazilas) &&
          (district as { upazilas: unknown[] }).upazilas.every(
            (upazila: unknown) =>
              Number.isSafeInteger((upazila as { id?: number })?.id) &&
              typeof (upazila as { name?: string })?.name === 'string' &&
              typeof (upazila as { nameBn?: string })?.nameBn === 'string' &&
              Array.isArray((upazila as { unions?: unknown })?.unions)
          )
      )
  );
}

export function useBangladeshLocations() {
  const [isLoading, setIsLoading] = useState(!hasBangladeshLocationData());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (hasBangladeshLocationData()) {
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    fetch('/api/locations/bangladesh', {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Address data request failed with status ${response.status}.`);
        }
        const payload: unknown = await response.json();
        if (
          !payload ||
          typeof payload !== 'object' ||
          !isLocationData((payload as { locations?: unknown }).locations)
        ) {
          throw new Error('Address data response was incomplete or invalid.');
        }
        setBangladeshLocationData((payload as { locations: BangladeshLocationData }).locations);
        setIsLoading(false);
      })
      .catch((requestError: unknown) => {
        if (controller.signal.aborted) return;
        console.error('Bangladesh address data could not be loaded:', requestError);
        setError('Address options could not be loaded. Refresh the page or contact support.');
        setIsLoading(false);
      });

    return () => controller.abort();
  }, []);

  return { isLoading, error };
}
