'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  useMap,
  useMapsLibrary,
} from '@vis.gl/react-google-maps';
import { Card, CardContent, Badge, LeadScoreRing } from '@clientos/ui';
import { api } from '@/lib/api-client';
import { useAuthStore } from '@/lib/auth-store';
import { Search, MapPin, X, Navigation, Users } from 'lucide-react';

interface Prospect {
  id: string;
  companyName: string;
  website: string | null;
  city: string | null;
  country: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  status: string;
  leadScore: number | null;
  industry?: { name: string } | null;
}

const statusColors: Record<string, 'default' | 'secondary' | 'warning' | 'error' | 'outline' | 'neutral'> = {
  NEW: 'neutral',
  CONTACTED: 'default',
  REPLIED: 'secondary',
  QUALIFIED: 'secondary',
  AUDITED: 'default',
  WON: 'secondary',
  LOST: 'error',
};

const DEFAULT_CENTER = { lat: 5.6037, lng: -0.187 }; // Accra, Ghana

function ProspectMarker({
  prospect,
  onClick,
  isSelected,
}: {
  prospect: Prospect;
  onClick: () => void;
  isSelected: boolean;
}) {
  if (prospect.latitude == null || prospect.longitude == null) return null;

  const score = prospect.leadScore ?? 0;
  const color =
    score >= 80 ? '#16a34a' : score >= 60 ? '#eab308' : score >= 40 ? '#f97316' : '#94a3b8';

  return (
    <AdvancedMarker
      position={{ lat: prospect.latitude, lng: prospect.longitude }}
      onClick={onClick}
      title={prospect.companyName}
    >
      <div
        className={`flex items-center justify-center rounded-full border-2 transition-all ${
          isSelected ? 'scale-125 border-primary shadow-lg' : 'border-white shadow-md'
        }`}
        style={{ backgroundColor: color, width: 28, height: 28 }}
      >
        <span className="text-[10px] font-bold text-white">{score || '?'}</span>
      </div>
    </AdvancedMarker>
  );
}

function MapSearchBar({
  onPlaceSelect,
}: {
  onPlaceSelect: (place: google.maps.places.PlaceResult | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const places = useMapsLibrary('places');

  useEffect(() => {
    if (!places || !inputRef.current) return;

    const autocomplete = new places.Autocomplete(inputRef.current, {
      fields: ['geometry', 'name', 'formatted_address'],
    });

    const listener = autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      onPlaceSelect(place);
    });

    return () => {
      google.maps.event.removeListener(listener);
    };
  }, [places, onPlaceSelect]);

  return (
    <div className="relative flex items-center">
      <Search className="absolute left-3 h-4 w-4 text-on-surface-variant" />
      <input
        ref={inputRef}
        type="text"
        placeholder="Search a location..."
        className="w-full rounded-lg border border-outline-variant bg-surface-high py-2.5 pl-10 pr-4 text-sm text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
      />
    </div>
  );
}

function MapController({
  center,
  zoom,
  onIdle,
}: {
  center: { lat: number; lng: number } | null;
  zoom: number;
  onIdle: (center: { lat: number; lng: number }, zoom: number) => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map || !center) return;
    map.panTo(center);
    if (zoom) map.setZoom(zoom);
  }, [map, center, zoom]);

  useEffect(() => {
    if (!map) return;
    const listener = map.addListener('idle', () => {
      onIdle(
        { lat: map.getCenter()?.lat() ?? 0, lng: map.getCenter()?.lng() ?? 0 },
        map.getZoom() ?? 10
      );
    });
    return () => google.maps.event.removeListener(listener);
  }, [map, onIdle]);

  return null;
}

export default function LeadMapPage() {
  const { accessToken } = useAuthStore();
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [mapZoom, setMapZoom] = useState(10);
  const [pendingCenter, setPendingCenter] = useState<{ lat: number; lng: number } | null>(null);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    api
      .get<{ data: Prospect[] }>('/prospects?pageSize=200', accessToken)
      .then((res) => {
        setProspects(res.data ?? []);
        const withCoords = (res.data ?? []).filter((p) => p.latitude != null && p.longitude != null);
        if (withCoords.length > 0) {
          const avgLat = withCoords.reduce((s, p) => s + (p.latitude ?? 0), 0) / withCoords.length;
          const avgLng = withCoords.reduce((s, p) => s + (p.longitude ?? 0), 0) / withCoords.length;
          setMapCenter({ lat: avgLat, lng: avgLng });
        } else {
          setMapCenter(DEFAULT_CENTER);
        }
      })
      .catch((err) => setError(err.message || 'Failed to load prospects'))
      .finally(() => setLoading(false));
  }, [accessToken]);

  const geoProspects = useMemo(
    () => prospects.filter((p) => p.latitude != null && p.longitude != null),
    [prospects]
  );

  const selectedProspect = useMemo(
    () => prospects.find((p) => p.id === selectedId) ?? null,
    [prospects, selectedId]
  );

  const handlePlaceSelect = useCallback(
    (place: google.maps.places.PlaceResult | null) => {
      if (!place?.geometry?.location) return;
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      setPendingCenter({ lat, lng });
      setMapZoom(12);
    },
    []
  );

  const handleMapIdle = useCallback((center: { lat: number; lng: number }, zoom: number) => {
    setMapCenter(center);
    setMapZoom(zoom);
  }, []);

  if (!apiKey) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <MapPin className="mx-auto mb-4 h-12 w-12 text-on-surface-variant" />
            <h2 className="mb-2 text-lg font-semibold text-on-surface">Google Maps API Key Required</h2>
            <p className="text-sm text-on-surface-variant">
              Add <code className="rounded bg-surface-container px-1.5 py-0.5 text-xs">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to your{' '}
              <code className="rounded bg-surface-container px-1.5 py-0.5 text-xs">.env.local</code> file to enable the lead map.
            </p>
            <p className="mt-3 text-xs text-on-surface-variant">
              Get a free API key from the{' '}
              <a
                href="https://console.cloud.google.com/google/maps-apis/credentials"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                Google Cloud Console
              </a>
              . Enable the Maps JavaScript API and Places API.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Lead Map</h1>
          <p className="text-sm text-on-surface-variant">
            Scan and visualize your prospects by location
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2">
          <Users className="h-4 w-4 text-on-surface-variant" />
          <span className="text-sm font-medium text-on-surface">
            {geoProspects.length} mapped leads
          </span>
        </div>
      </div>

      {/* Map + Sidebar Layout */}
      <div className="flex gap-4 h-[calc(100vh-16rem)] overflow-hidden rounded-xl border border-outline-variant/60">
        {/* Map */}
        <div className="relative flex-1 overflow-hidden rounded-xl">
          <APIProvider apiKey={apiKey}>
            {/* Search overlay */}
            <div className="absolute left-4 top-4 z-10 w-72 max-w-[calc(100%-2rem)]">
              <div className="rounded-lg bg-surface-high/95 p-3 shadow-lg backdrop-blur-sm">
                <MapSearchBar onPlaceSelect={handlePlaceSelect} />
              </div>
            </div>

            <Map
              defaultCenter={mapCenter ?? DEFAULT_CENTER}
              defaultZoom={mapZoom}
              gestureHandling="greedy"
              disableDefaultUI
              mapId="lead-map"
              className="h-full w-full"
            >
              <MapController center={pendingCenter} zoom={mapZoom} onIdle={handleMapIdle} />
              {geoProspects.map((p) => (
                <ProspectMarker
                  key={p.id}
                  prospect={p}
                  onClick={() => setSelectedId(p.id)}
                  isSelected={selectedId === p.id}
                />
              ))}
            </Map>
          </APIProvider>

          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-surface-high/50 backdrop-blur-sm">
              <p className="text-sm text-on-surface-variant">Loading leads...</p>
            </div>
          )}
        </div>

        {/* Prospect List Sidebar */}
        <aside className="hidden w-80 shrink-0 flex-col overflow-hidden border-l border-outline-variant bg-surface-container-low lg:flex">
          <div className="border-b border-outline-variant p-4">
            <h2 className="font-label-caps text-label-caps text-on-surface">Prospects</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {geoProspects.length === 0 && !loading ? (
              <div className="p-4 text-center">
                <MapPin className="mx-auto mb-2 h-8 w-8 text-on-surface-variant" />
                <p className="text-sm text-on-surface-variant">
                  No prospects with location data yet. Add prospects with city/country or
                  coordinates to see them on the map.
                </p>
              </div>
            ) : (
              <div className="space-y-1 p-2">
                {geoProspects.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedId(p.id);
                      if (p.latitude && p.longitude) {
                        setPendingCenter({ lat: p.latitude, lng: p.longitude });
                        setMapZoom(14);
                      }
                    }}
                    className={`flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors ${
                      selectedId === p.id
                        ? 'bg-surface-container ring-1 ring-primary'
                        : 'hover:bg-surface-container'
                    }`}
                  >
                    <div className="shrink-0">
                      <LeadScoreRing score={p.leadScore ?? 0} size={36} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-on-surface">
                        {p.companyName}
                      </p>
                      <p className="truncate text-xs text-on-surface-variant">
                        {[p.city, p.country].filter(Boolean).join(', ') || 'No location'}
                      </p>
                      <div className="mt-1">
                        <Badge variant={statusColors[p.status] ?? 'neutral'}>
                          {p.status}
                        </Badge>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Selected Prospect Detail Card */}
      {selectedProspect && (
        <Card className="fixed bottom-6 left-1/2 z-20 w-96 max-w-[calc(100%-2rem)] -translate-x-1/2 lg:left-[calc(50%+10rem)]">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <LeadScoreRing score={selectedProspect.leadScore ?? 0} size={36} />
                <div>
                  <h3 className="font-semibold text-on-surface">{selectedProspect.companyName}</h3>
                  <p className="text-xs text-on-surface-variant">
                    {selectedProspect.industry?.name ?? 'Unknown industry'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedId(null)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-on-surface-variant">
              {selectedProspect.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {selectedProspect.city}
                  {selectedProspect.country ? `, ${selectedProspect.country}` : ''}
                </span>
              )}
              {selectedProspect.website && (
                <span className="flex items-center gap-1">
                  <Navigation className="h-3 w-3" />
                  {selectedProspect.website}
                </span>
              )}
              <Badge variant={statusColors[selectedProspect.status] ?? 'neutral'}>
                {selectedProspect.status}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
