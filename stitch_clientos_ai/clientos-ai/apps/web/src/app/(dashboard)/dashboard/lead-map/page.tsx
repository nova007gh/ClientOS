'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
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

const DEFAULT_CENTER: [number, number] = [5.6037, -0.187]; // Accra, Ghana

function createScoreIcon(score: number) {
  const color =
    score >= 80 ? '#16a34a' : score >= 60 ? '#eab308' : score >= 40 ? '#f97316' : '#94a3b8';
  const html = `<div style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;border:2px solid white;background-color:${color};box-shadow:0 2px 6px rgba(0,0,0,0.3);"><span style="font-size:10px;font-weight:bold;color:white;">${score || '?'}</span></div>`;
  return L.divIcon({
    html,
    className: 'lead-score-marker',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
}

function FlyTo({ center, zoom }: { center: [number, number] | null; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom, { duration: 1.2 });
    }
  }, [map, center, zoom]);
  return null;
}

interface SearchResult {
  lat: string;
  lon: string;
  display_name: string;
}

export default function LeadMapPage() {
  const { accessToken } = useAuthStore();
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);
  const [flyZoom, setFlyZoom] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    api
      .get<{ data: Prospect[] }>('/prospects?pageSize=200', accessToken)
      .then((res) => {
        setProspects(res.data ?? []);
      })
      .catch((err) => setError(err.message || 'Failed to load prospects'))
      .finally(() => setLoading(false));
  }, [accessToken]);

  const geoProspects = useMemo(
    () => prospects.filter((p) => p.latitude != null && p.longitude != null),
    [prospects]
  );

  const mapCenter = useMemo<[number, number]>(() => {
    if (geoProspects.length > 0) {
      const avgLat = geoProspects.reduce((s, p) => s + (p.latitude ?? 0), 0) / geoProspects.length;
      const avgLng = geoProspects.reduce((s, p) => s + (p.longitude ?? 0), 0) / geoProspects.length;
      return [avgLat, avgLng];
    }
    return DEFAULT_CENTER;
  }, [geoProspects]);

  const selectedProspect = useMemo(
    () => prospects.find((p) => p.id === selectedId) ?? null,
    [prospects, selectedId]
  );

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!value.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&limit=5`,
          { headers: { 'Accept-Language': 'en' } }
        );
        const data = await res.json();
        setSearchResults(data);
        setShowResults(true);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 500);
  }, []);

  const handleSelectResult = (result: SearchResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    setFlyTarget([lat, lng]);
    setFlyZoom(13);
    setSearchQuery(result.display_name.split(',')[0]);
    setShowResults(false);
  };

  const handleProspectClick = (prospect: Prospect) => {
    setSelectedId(prospect.id);
    if (prospect.latitude && prospect.longitude) {
      setFlyTarget([prospect.latitude, prospect.longitude]);
      setFlyZoom(14);
    }
  };

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
          {/* Search overlay */}
          <div className="absolute left-4 top-4 z-[1000] w-80 max-w-[calc(100%-2rem)]">
            <div className="relative">
              <div className="flex items-center rounded-lg bg-white shadow-lg">
                <Search className="ml-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => searchResults.length > 0 && setShowResults(true)}
                  placeholder="Search a location..."
                  className="w-full bg-transparent py-2.5 pl-2 pr-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
                />
                {searching && (
                  <span className="mr-3 text-xs text-gray-400">...</span>
                )}
              </div>
              {showResults && searchResults.length > 0 && (
                <div className="absolute mt-1 w-full rounded-lg bg-white shadow-lg max-h-64 overflow-y-auto">
                  {searchResults.map((r, i) => (
                    <button
                      key={i}
                      onClick={() => handleSelectResult(r)}
                      className="flex w-full items-start gap-2 border-b border-gray-100 p-3 text-left text-sm text-gray-700 hover:bg-gray-50 last:border-0"
                    >
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
                      <span className="line-clamp-2">{r.display_name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <MapContainer
            center={mapCenter}
            zoom={10}
            scrollWheelZoom
            className="h-full w-full"
            style={{ background: '#e5e7eb' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <FlyTo center={flyTarget} zoom={flyZoom} />
            {geoProspects.map((p) => (
              <Marker
                key={p.id}
                position={[p.latitude!, p.longitude!]}
                icon={createScoreIcon(p.leadScore ?? 0)}
                eventHandlers={{ click: () => handleProspectClick(p) }}
              >
                <Popup>
                  <div className="text-sm">
                    <p className="font-semibold">{p.companyName}</p>
                    <p className="text-gray-500">
                      {[p.city, p.country].filter(Boolean).join(', ') || 'No location'}
                    </p>
                    <p className="mt-1 text-xs">
                      Score: <strong>{p.leadScore ?? 'N/A'}</strong> · Status: {p.status}
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm">
              <p className="text-sm text-gray-500">Loading leads...</p>
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
                    onClick={() => handleProspectClick(p)}
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
        <Card className="fixed bottom-6 left-1/2 z-[1000] w-96 max-w-[calc(100%-2rem)] -translate-x-1/2 lg:left-[calc(50%+10rem)]">
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
