import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { reverseGeocodeCity, type StoredLocation } from '../utils/geocode.js';

/**
 * GPS + city-search location picker for prayer-time calculations. Shared
 * between the first-run prompt on the Prayer Times page and the "Change
 * location" section of Prayer Time settings — one copy of the GPS/search
 * flow instead of two.
 */
export default function LocationPicker({
  onLocationChange,
}: {
  onLocationChange: (loc: StoredLocation) => void;
}) {
  const { t } = useTranslation();
  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError] = useState('');
  const [cityInput, setCityInput] = useState('');
  const [citySearching, setCitySearching] = useState(false);
  const [cityError, setCityError] = useState('');
  const [citySuggestions, setCitySuggestions] = useState<
    Array<{ lat: string; lon: string; display_name: string }>
  >([]);

  const requestLocation = useCallback(() => {
    setLocLoading(true);
    setLocError('');
    if (!('geolocation' in navigator)) {
      setLocError(
        t('prayerTimes.geoNotSupported', 'Geolocation not supported — use city search instead.')
      );
      setLocLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const city = await reverseGeocodeCity(latitude, longitude);
        const name = city ?? `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`;
        onLocationChange({ latitude, longitude, name });
        setLocLoading(false);
      },
      () => {
        // GPS denied — nudge city search
        setLocError(t('prayerTimes.gpsDenied', 'GPS denied. Type your city below.'));
        setLocLoading(false);
      },
      { timeout: 10000 }
    );
  }, [onLocationChange, t]);

  const searchByCity = useCallback(async () => {
    if (!cityInput.trim()) return;
    setCitySearching(true);
    setCityError('');
    setCitySuggestions([]);
    try {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityInput)}&format=json&limit=5`
      );
      const results = (await r.json()) as Array<{ lat: string; lon: string; display_name: string }>;
      if (!results.length) {
        setCityError(t('prayerTimes.cityNotFound', 'City not found. Try a different name.'));
        setCitySearching(false);
        return;
      }
      if (results.length === 1) {
        const { lat, lon, display_name } = results[0];
        const shortName = display_name.split(',').slice(0, 2).join(',').trim();
        onLocationChange({
          latitude: parseFloat(lat),
          longitude: parseFloat(lon),
          name: shortName,
        });
      } else {
        setCitySuggestions(results);
      }
    } catch {
      setCityError(t('prayerTimes.searchFailed', 'Search failed. Check your internet connection.'));
    }
    setCitySearching(false);
  }, [cityInput, onLocationChange, t]);

  const pickSuggestion = useCallback(
    (s: { lat: string; lon: string; display_name: string }) => {
      const shortName = s.display_name.split(',').slice(0, 2).join(',').trim();
      onLocationChange({
        latitude: parseFloat(s.lat),
        longitude: parseFloat(s.lon),
        name: shortName,
      });
      setCitySuggestions([]);
    },
    [onLocationChange]
  );

  return (
    <div className="space-y-3">
      {/* Option 1: GPS */}
      <button
        onClick={requestLocation}
        disabled={locLoading}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-brand-emerald/10 border border-brand-emerald/30 hover:border-brand-emerald/60 text-left transition-all"
      >
        {locLoading ? (
          <span className="loading loading-spinner loading-xs text-brand-emerald" />
        ) : (
          <span className="text-lg">📡</span>
        )}
        <div>
          <p className="text-brand-emerald font-semibold text-sm">
            {t('prayerTimes.useGps', 'Use GPS (recommended)')}
          </p>
          <p className="text-white/30 text-xs">
            {t('prayerTimes.gpsDesc', 'Most accurate. Requires browser location permission.')}
          </p>
        </div>
      </button>
      {locError && <p className="text-red-400 text-xs">{locError}</p>}

      {/* Divider */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-px bg-brand-border" />
        <span className="text-white/20 text-xs">{t('prayerTimes.or', 'or')}</span>
        <div className="flex-1 h-px bg-brand-border" />
      </div>

      {/* Option 2: City search */}
      <div>
        <p className="text-white/40 text-xs mb-2">
          {t(
            'prayerTimes.citySearchDesc',
            'Search by city — no GPS needed, times are still accurate'
          )}
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={cityInput}
            onChange={(e) => setCityInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void searchByCity();
            }}
            placeholder={t('prayerTimes.cityPlaceholder', 'e.g. Dhaka, London, Karachi...')}
            className="input input-sm flex-1 bg-brand-deep border border-brand-border text-white placeholder-white/20 focus:border-brand-emerald/40 focus:outline-none"
          />
          <button
            onClick={() => void searchByCity()}
            disabled={citySearching || !cityInput.trim()}
            className="btn btn-sm bg-brand-emerald hover:bg-brand-emerald-dim text-white border-none"
          >
            {citySearching ? (
              <span className="loading loading-spinner loading-xs" />
            ) : (
              t('prayerTimes.search', 'Search')
            )}
          </button>
        </div>
        {cityError && <p className="text-red-400 text-xs mt-1">{cityError}</p>}
        {citySuggestions.length > 0 && (
          <div className="mt-2 space-y-1">
            <p className="text-white/40 text-[11px]">
              {t('prayerTimes.pickCity', 'Pick your city:')}
            </p>
            {citySuggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => pickSuggestion(s)}
                className="w-full text-left px-3 py-2 rounded-lg bg-white/5 border border-brand-border hover:border-brand-emerald/40 text-white/70 hover:text-white text-xs transition-all"
              >
                {s.display_name}
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="text-white/15 text-xs">
        {t(
          'prayerTimes.locationPrivacy',
          'Your location is stored only in this browser and never sent to our servers.'
        )}
      </p>
    </div>
  );
}
