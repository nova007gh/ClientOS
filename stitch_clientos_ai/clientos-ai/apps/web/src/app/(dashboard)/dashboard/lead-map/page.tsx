'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Rectangle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Card, CardContent, Badge, LeadScoreRing, Button } from '@clientos/ui';
import { api } from '@/lib/api-client';
import { useAuthStore } from '@/lib/auth-store';
import { Search, MapPin, X, Navigation, Users, Radar, Plus, Loader2, Store, Layers, Phone, Globe, Mail, Clock, Building2, Tag, Info, Accessibility, Utensils, Wifi, DollarSign, Star, BedDouble, DoorOpen } from 'lucide-react';

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

interface DiscoveredLead {
  id: string;
  name: string;
  category: string;
  lat: number;
  lon: number;
  address?: string;
  phone?: string;
  website?: string;
  email?: string;
  saved: boolean;
  openingHours?: string;
  brand?: string;
  operator?: string;
  cuisine?: string;
  wheelchair?: string;
  takeaway?: string;
  delivery?: string;
  outdoorSeating?: string;
  internetAccess?: string;
  fee?: string;
  description?: string;
  denomination?: string;
  rooms?: string;
  beds?: string;
  stars?: string;
  shopType?: string;
  amenityType?: string;
  tourismType?: string;
  officeType?: string;
}

interface ContextBusiness {
  id: string;
  name: string;
  lat: number;
  lon: number;
  type: string;
  phone?: string;
  website?: string;
  address?: string;
  openingHours?: string;
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

const DEFAULT_CENTER: [number, number] = [5.6037, -0.187];

const SERVICE_CATEGORIES: { label: string; value: string; tags: { key: string; values?: string[] }[] }[] = [
  { label: 'Dental Clinics', value: 'dental', tags: [{ key: 'amenity', values: ['dentist'] }] },
  { label: 'Doctors / Medical', value: 'medical', tags: [{ key: 'amenity', values: ['doctors', 'clinic', 'hospital'] }] },
  { label: 'Restaurants', value: 'restaurants', tags: [{ key: 'amenity', values: ['restaurant', 'fast_food', 'cafe', 'bar', 'pub'] }] },
  { label: 'Hotels / Hospitality', value: 'hotels', tags: [{ key: 'tourism', values: ['hotel', 'guest_house', 'hostel'] }] },
  { label: 'Law Firms', value: 'law', tags: [{ key: 'office', values: ['lawyer', 'notary'] }, { key: 'amenity', values: ['courthouse'] }] },
  { label: 'Real Estate', value: 'realestate', tags: [{ key: 'office', values: ['estate_agent'] }] },
  { label: 'Beauty / Spa / Salon', value: 'beauty', tags: [{ key: 'shop', values: ['hairdresser', 'beauty', 'nail'] }, { key: 'leisure', values: ['spa'] }] },
  { label: 'Gyms / Fitness', value: 'fitness', tags: [{ key: 'leisure', values: ['fitness_centre', 'sports_centre'] }] },
  { label: 'Auto Repair', value: 'auto', tags: [{ key: 'shop', values: ['car_repair', 'car'] }] },
  { label: 'Retail Shops', value: 'retail', tags: [{ key: 'shop', values: ['clothes', 'shoes', 'jewelry', 'electronics', 'furniture', 'books', 'gift', 'sports'] }] },
  { label: 'Accounting / Finance', value: 'accounting', tags: [{ key: 'office', values: ['accountant', 'financial_advisor'] }] },
  { label: 'Architecture / Engineering', value: 'architecture', tags: [{ key: 'office', values: ['architect', 'engineer'] }] },
  { label: 'Advertising / Marketing', value: 'marketing', tags: [{ key: 'office', values: ['advertising_agency', 'marketing'] }] },
  { label: 'IT / Tech Companies', value: 'tech', tags: [{ key: 'office', values: ['it', 'software', 'telecommunication'] }, { key: 'shop', values: ['computer', 'mobile_phone'] }] },
  { label: 'Education / Training', value: 'education', tags: [{ key: 'amenity', values: ['school', 'college', 'university', 'training', 'language_school'] }] },
  { label: 'Pharmacies', value: 'pharmacy', tags: [{ key: 'amenity', values: ['pharmacy'] }, { key: 'healthcare', values: ['pharmacy'] }] },
  { label: 'Veterinary', value: 'vet', tags: [{ key: 'amenity', values: ['veterinary'] }] },
  { label: 'Photography', value: 'photography', tags: [{ key: 'shop', values: ['photo'] }, { key: 'craft', values: ['photographer'] }] },
  { label: 'Florists', value: 'florist', tags: [{ key: 'shop', values: ['florist'] }] },
  { label: 'Bakeries', value: 'bakery', tags: [{ key: 'shop', values: ['bakery'] }] },
];

const RADII = [
  { label: '1 km', value: 1000 },
  { label: '2 km', value: 2000 },
  { label: '5 km', value: 5000 },
  { label: '10 km', value: 10000 },
  { label: '25 km', value: 25000 },
];

function createScoreIcon(score: number) {
  const color = score >= 80 ? '#16a34a' : score >= 60 ? '#eab308' : score >= 40 ? '#f97316' : '#94a3b8';
  const html = `<div style="display:flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;border:2px solid white;background-color:${color};box-shadow:0 2px 6px rgba(0,0,0,0.3);"><span style="font-size:10px;font-weight:bold;color:white;">${score || '?'}</span></div>`;
  return L.divIcon({ html, className: 'lead-score-marker', iconSize: [28, 28], iconAnchor: [14, 14], popupAnchor: [0, -14] });
}

function createDiscoveredIcon(saved: boolean) {
  const color = saved ? '#6366f1' : '#f59e0b';
  const html = `<div style="display:flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:6px;border:2px solid white;background-color:${color};box-shadow:0 2px 6px rgba(0,0,0,0.3);"><span style="font-size:11px;">${saved ? '★' : '◆'}</span></div>`;
  return L.divIcon({ html, className: 'discovered-marker', iconSize: [24, 24], iconAnchor: [12, 12], popupAnchor: [0, -12] });
}

function createContextIcon() {
  const html = `<div style="display:flex;align-items:center;justify-content:center;width:14px;height:14px;border-radius:50%;border:1px solid rgba(218,226,253,0.4);background-color:rgba(173,198,255,0.25);box-shadow:0 1px 3px rgba(0,0,0,0.2);"></div>`;
  return L.divIcon({ html, className: 'context-marker', iconSize: [14, 14], iconAnchor: [7, 7], popupAnchor: [0, -7] });
}

function FlyTo({ center, zoom }: { center: [number, number] | null; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, zoom, { duration: 1.2 });
  }, [map, center, zoom]);
  return null;
}

function ClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
  boundingbox?: [string, string, string, string]; // [south, north, west, east]
}

function DetailRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 py-1">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-on-surface-variant" />
      <div className="min-w-0 flex-1">
        <span className="text-[10px] uppercase tracking-wide text-on-surface-variant/60">{label}</span>
        <p className="text-xs text-on-surface break-words">{value}</p>
      </div>
    </div>
  );
}

function buildScanQuery(
  category: { key: string; values?: string[] }[],
  area: { type: 'radius'; lat: number; lon: number; radius: number } | { type: 'bbox'; south: number; west: number; north: number; east: number },
): string {
  let areaFilter: string;
  let timeout: number;
  let ctxRadius = 3000;

  if (area.type === 'bbox') {
    areaFilter = `(${area.south},${area.west},${area.north},${area.east})`;
    timeout = 60;
  } else {
    const { lat, lon, radius } = area;
    areaFilter = `(around:${radius},${lat},${lon})`;
    timeout = radius >= 25000 ? 60 : radius >= 10000 ? 40 : 25;
    ctxRadius = Math.min(radius, 3000);
  }

  // Targeted: one node filter per value
  const targetedFilters: string[] = [];
  for (const tag of category) {
    if (tag.values) {
      for (const v of tag.values) {
        targetedFilters.push(`node["${tag.key}"="${v}"]["name"]${areaFilter};`);
      }
    } else {
      targetedFilters.push(`node["${tag.key}"]["name"]${areaFilter};`);
    }
  }

  // Context: for radius use smaller radius, for bbox use same bbox
  let contextFilters: string;
  if (area.type === 'bbox') {
    contextFilters = `
    node["shop"]["name"]${areaFilter};
    node["amenity"]["name"]${areaFilter};
    node["office"]["name"]${areaFilter};`;
  } else {
    contextFilters = `
    node["shop"]["name"](around:${ctxRadius},${area.lat},${area.lon});
    node["amenity"]["name"](around:${ctxRadius},${area.lat},${area.lon});
    node["office"]["name"](around:${ctxRadius},${area.lat},${area.lon});`;
  }

  return `[out:json][timeout:${timeout}];(${targetedFilters.join('')}${contextFilters});out body 300;`;
}

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.openstreetmap.fr/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

async function fetchOverpass(
  query: string,
  onProgress?: (msg: string) => void,
  externalSignal?: AbortSignal,
): Promise<any> {
  let lastError: Error | null = null;
  for (let i = 0; i < OVERPASS_ENDPOINTS.length; i++) {
    if (externalSignal?.aborted) throw new DOMException('Aborted', 'AbortError');
    const endpoint = OVERPASS_ENDPOINTS[i];
    try {
      onProgress?.(`Querying server ${i + 1} of ${OVERPASS_ENDPOINTS.length}...`);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      const onExternalAbort = () => controller.abort();
      if (externalSignal) externalSignal.addEventListener('abort', onExternalAbort);
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
          },
          body: 'data=' + encodeURIComponent(query),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (externalSignal) externalSignal.removeEventListener('abort', onExternalAbort);
        if (res.ok) {
          onProgress?.('Processing results...');
          const contentType = res.headers.get('content-type') || '';
          const text = await res.text();
          if (!contentType.includes('json') && !text.startsWith('{')) {
            throw new Error('Overpass returned an HTML error page. Server may be busy.');
          }
          try {
            return JSON.parse(text);
          } catch {
            throw new Error('Overpass response was not valid JSON. Try again shortly.');
          }
        }
        if (res.status === 429) {
          lastError = new Error('Server busy, trying another endpoint...');
          continue;
        }
        if (res.status === 504) {
          lastError = new Error('Query timed out on server. Try a smaller radius.');
          continue;
        }
        lastError = new Error(`Scan failed (${res.status}).`);
        continue;
      } finally {
        clearTimeout(timeoutId);
        if (externalSignal) externalSignal.removeEventListener('abort', onExternalAbort);
      }
    } catch (e: any) {
      if (e.name === 'AbortError') {
        if (externalSignal?.aborted) throw e;
        lastError = new Error('Request timed out. Try a smaller radius or simpler category.');
        continue;
      }
      lastError = e;
      continue;
    }
  }
  throw lastError || new Error('All Overpass servers are unavailable. Please try again later.');
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
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [scanLocation, setScanLocation] = useState('');
  const [scanService, setScanService] = useState('');
  const [scanRadius, setScanRadius] = useState(5000);
  const [scanCenter, setScanCenter] = useState<[number, number] | null>(null);
  const [scanBbox, setScanBbox] = useState<[number, number, number, number] | null>(null);
  const [discoveredLeads, setDiscoveredLeads] = useState<DiscoveredLead[]>([]);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState('');
  const [scanProgress, setScanProgress] = useState('');
  const scanAbortController = useRef<AbortController | null>(null);
  const [contextBusinesses, setContextBusinesses] = useState<ContextBusiness[]>([]);
  const [selectedContextId, setSelectedContextId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [sidebarTab, setSidebarTab] = useState<'prospects' | 'discovered'>('prospects');
  const [selectedDiscoveredId, setSelectedDiscoveredId] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    api
      .get<{ data: Prospect[] }>('/prospects?pageSize=200', accessToken)
      .then((res) => setProspects(res.data ?? []))
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

  const selectedDiscovered = useMemo(
    () => discoveredLeads.find((d) => d.id === selectedDiscoveredId) ?? null,
    [discoveredLeads, selectedDiscoveredId]
  );

  const selectedContext = useMemo(
    () => contextBusinesses.find((c) => c.id === selectedContextId) ?? null,
    [contextBusinesses, selectedContextId]
  );

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!value.trim()) { setSearchResults([]); setShowResults(false); return; }
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&limit=5`,
          { headers: { 'Accept-Language': 'en', 'User-Agent': 'ClientOS-Map/1.0' } }
        );
        const data = await res.json();
        setSearchResults(data);
        setShowResults(true);
      } catch { setSearchResults([]); }
      finally { setSearching(false); }
    }, 500);
  }, []);

  const handleSelectResult = (result: NominatimResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    setFlyTarget([lat, lng]);
    setFlyZoom(13);
    setSearchQuery(result.display_name.split(',')[0]);
    setShowResults(false);
  };

  const handleProspectClick = (prospect: Prospect) => {
    setSelectedId(prospect.id);
    setSelectedDiscoveredId(null);
    if (prospect.latitude && prospect.longitude) {
      setFlyTarget([prospect.latitude, prospect.longitude]);
      setFlyZoom(14);
    }
  };

  const handleDiscoveredClick = (lead: DiscoveredLead) => {
    setSelectedDiscoveredId(lead.id);
    setSelectedId(null);
    setFlyTarget([lead.lat, lead.lon]);
    setFlyZoom(15);
  };

  const handleMapClick = (lat: number, lng: number) => {
    setScanCenter([lat, lng]);
    setScanBbox(null);
    setScanLocation('Loading location...');
    fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&accept-language=en`,
      { headers: { 'User-Agent': 'ClientOS-Map/1.0' } }
    )
      .then((r) => r.json())
      .then((data) => {
        const name = data.display_name?.split(',')?.[0] || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        setScanLocation(name);
      })
      .catch(() => setScanLocation(`${lat.toFixed(4)}, ${lng.toFixed(4)}`));
  };

  const handleScanLocationSearch = useCallback((value: string) => {
    setScanLocation(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!value.trim()) { setSearchResults([]); setShowResults(false); return; }
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&limit=5`,
          { headers: { 'Accept-Language': 'en', 'User-Agent': 'ClientOS-Map/1.0' } }
        );
        const data = await res.json();
        setSearchResults(data);
        setShowResults(true);
      } catch { setSearchResults([]); }
      finally { setSearching(false); }
    }, 500);
  }, []);

  const handleScanLocationSelect = (result: NominatimResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    setScanCenter([lat, lng]);
    setScanLocation(result.display_name.split(',')[0]);
    setShowResults(false);

    if (result.boundingbox) {
      const [s, n, w, e] = result.boundingbox.map(parseFloat);
      if ([s, n, w, e].some((v) => Number.isNaN(v))) {
        setScanBbox(null);
      } else {
        setScanBbox([s, w, n, e]);
      }
      setFlyTarget([lat, lng]);
      setFlyZoom(12);
    } else {
      setScanBbox(null);
      setFlyTarget([lat, lng]);
      setFlyZoom(12);
    }
  };

  const handleScan = async (autoRadius?: number) => {
    if (!scanCenter || !scanService) return;
    const radius = autoRadius ?? scanRadius;
    const isAuto = autoRadius != null;

    setScanning(true);
    setScanError('');
    setScanProgress('Scanning for businesses...');
    if (!isAuto) {
      setDiscoveredLeads([]);
      setContextBusinesses([]);
    }
    setSidebarTab('discovered');
    const abortCtrl = new AbortController();
    scanAbortController.current = abortCtrl;

    const category = SERVICE_CATEGORIES.find((c) => c.value === scanService);
    if (!category) { setScanning(false); return; }

    try {
      const query = scanBbox
        ? buildScanQuery(category.tags, { type: 'bbox', south: scanBbox[0], west: scanBbox[1], north: scanBbox[2], east: scanBbox[3] })
        : buildScanQuery(category.tags, { type: 'radius', lat: scanCenter[0], lon: scanCenter[1], radius });
      const data = await fetchOverpass(query, (msg) => {
        if (!abortCtrl.signal.aborted) setScanProgress(msg);
      }, abortCtrl.signal);

      if (abortCtrl.signal.aborted) {
        setScanProgress('');
        return;
      }

      setScanProgress('Processing business data...');

      const seen = new Set<string>();
      const leads: DiscoveredLead[] = [];
      const ctxBusinesses: ContextBusiness[] = [];

      for (const el of data.elements || []) {
        const tags = el.tags || {};
        const lat = el.lat ?? el.center?.lat;
        const lon = el.lon ?? el.center?.lon;
        if (lat == null || lon == null) continue;

        const name = tags.name || tags['name:en'] || tags.brand;
        if (!name) continue;

        const dedupeKey = `${name.toLowerCase()}|${lat.toFixed(4)}|${lon.toFixed(4)}`;
        if (seen.has(dedupeKey)) continue;
        seen.add(dedupeKey);

        // Determine if this element matches the targeted tags
        let isTargeted = false;
        for (const tag of category.tags) {
          const tagVal = tags[tag.key];
          if (tagVal && (!tag.values || tag.values.includes(tagVal))) {
            isTargeted = true;
            break;
          }
        }

        const addrParts = [
          tags['addr:housenumber'],
          tags['addr:street'],
          tags['addr:city'],
          tags['addr:postcode'],
        ].filter(Boolean);

        if (isTargeted) {
          leads.push({
            id: `disc-${el.id ?? leads.length}`,
            name,
            category: category.label,
            lat,
            lon,
            address: addrParts.length > 0 ? addrParts.join(' ') : undefined,
            phone: tags.phone || tags['contact:phone'] || undefined,
            website: tags.website || tags['contact:website'] || undefined,
            email: tags.email || tags['contact:email'] || undefined,
            saved: false,
            openingHours: tags.opening_hours || undefined,
            brand: tags.brand || undefined,
            operator: tags.operator || undefined,
            cuisine: tags.cuisine || undefined,
            wheelchair: tags.wheelchair || undefined,
            takeaway: tags.takeaway || undefined,
            delivery: tags.delivery || undefined,
            outdoorSeating: tags.outdoor_seating || undefined,
            internetAccess: tags.internet_access || tags['internet_access:wlan'] || undefined,
            fee: tags.fee || undefined,
            description: tags.description || tags['description:en'] || undefined,
            denomination: tags.denomination || undefined,
            rooms: tags.rooms || undefined,
            beds: tags.beds || undefined,
            stars: tags.stars || undefined,
            shopType: tags.shop || undefined,
            amenityType: tags.amenity || undefined,
            tourismType: tags.tourism || undefined,
            officeType: tags.office || undefined,
          });
        } else {
          const businessType = tags.amenity || tags.shop || tags.office || tags.tourism || tags.leisure || 'business';
          ctxBusinesses.push({
            id: `ctx-${el.id ?? ctxBusinesses.length}`,
            name,
            lat,
            lon,
            type: businessType.replace(/_/g, ' '),
            phone: tags.phone || tags['contact:phone'] || undefined,
            website: tags.website || tags['contact:website'] || undefined,
            address: addrParts.length > 0 ? addrParts.join(' ') : undefined,
            openingHours: tags.opening_hours || undefined,
          });
        }
      }

      setDiscoveredLeads(leads);
      setContextBusinesses(ctxBusinesses);
      setScanProgress('');

      if (leads.length === 0) {
        const nextRadius = scanBbox ? null : RADII.find((r) => r.value > radius);
        if (nextRadius && !isAuto) {
          setScanProgress(`No ${category.label.toLowerCase()} in ${radius / 1000}km. Expanding to ${nextRadius.label}...`);
          // Short delay so the user sees the message
          await new Promise((resolve) => setTimeout(resolve, 800));
          setScanProgress('');
          return handleScan(nextRadius.value);
        }
        setScanError(`No ${category.label.toLowerCase()} found in this area. Try a larger radius or different location.`);
      }
    } catch (e: any) {
      if (e.name === 'AbortError') {
        // Cancelled by user
      } else if (!abortCtrl.signal.aborted) {
        setScanError(e.message || 'Failed to scan. Please try again.');
      }
    } finally {
      setScanning(false);
      setScanProgress('');
      scanAbortController.current = null;
    }
  };

  const handleCancelScan = () => {
    scanAbortController.current?.abort();
    setScanning(false);
    setScanProgress('');
  };

  const handleSaveLead = async (lead: DiscoveredLead) => {
    if (!accessToken) return;
    setSavingId(lead.id);
    try {
      const cityMatch = lead.address?.match(/,\s*([^,]+)$/);
      const city = cityMatch ? cityMatch[1] : undefined;

      await api.post<Prospect>('/prospects', {
        companyName: lead.name,
        phone: lead.phone,
        website: lead.website,
        email: lead.email,
        address: lead.address,
        city,
        latitude: lead.lat,
        longitude: lead.lon,
        status: 'NEW',
      }, accessToken);

      setDiscoveredLeads((prev) =>
        prev.map((d) => (d.id === lead.id ? { ...d, saved: true } : d))
      );

      const res = await api.get<{ data: Prospect[] }>('/prospects?pageSize=200', accessToken);
      setProspects(res.data ?? []);
    } catch (e: any) {
      setScanError(e.message || 'Failed to save prospect');
    } finally {
      setSavingId(null);
    }
  };

  const handleSaveAll = async () => {
    if (!accessToken) return;
    const unsaved = discoveredLeads.filter((d) => !d.saved);
    if (unsaved.length === 0) return;
    setSavingId('all');
    try {
      await api.post('/prospects/bulk', {
        prospects: unsaved.map((d) => ({
          companyName: d.name,
          phone: d.phone,
          website: d.website,
          email: d.email,
          address: d.address,
          latitude: d.lat,
          longitude: d.lon,
          status: 'NEW',
        })),
      }, accessToken);

      setDiscoveredLeads((prev) => prev.map((d) => ({ ...d, saved: true })));
      const res = await api.get<{ data: Prospect[] }>('/prospects?pageSize=200', accessToken);
      setProspects(res.data ?? []);
    } catch (e: any) {
      setScanError(e.message || 'Failed to save prospects');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Lead Map</h1>
          <p className="text-sm text-on-surface-variant">
            Scan any location for businesses needing your services
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2">
            <Users className="h-4 w-4 text-on-surface-variant" />
            <span className="text-sm font-medium text-on-surface">{geoProspects.length} prospects</span>
          </div>
          {discoveredLeads.length > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2">
              <Radar className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium text-on-surface">{discoveredLeads.length} discovered</span>
            </div>
          )}
          {contextBusinesses.length > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2">
              <Store className="h-4 w-4 text-primary/60" />
              <span className="text-sm font-medium text-on-surface">{contextBusinesses.length} nearby</span>
            </div>
          )}
        </div>
      </div>

      {/* Map + Sidebar Layout */}
      <div className="flex gap-4 h-[calc(100vh-18rem)] overflow-hidden rounded-xl border border-outline-variant/60">
        {/* Map */}
        <div className="relative flex-1 overflow-hidden rounded-xl">
          {/* Top-left: Location search + Lead Scanner panel */}
          <div className="absolute left-4 top-4 z-[1000] w-96 max-w-[calc(100%-2rem)] space-y-3">
            {/* Location search */}
            <div className="relative">
              <div className="flex items-center rounded-xl border border-outline-variant bg-surface-container-low/95 backdrop-blur-sm transition-colors focus-within:border-primary/60">
                <Search className="ml-3 h-4 w-4 text-on-surface-variant" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => searchResults.length > 0 && setShowResults(true)}
                  placeholder="Search a location..."
                  className="w-full bg-transparent py-2.5 pl-2 pr-4 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none"
                />
                {searching && <Loader2 className="mr-3 h-3.5 w-3.5 animate-spin text-on-surface-variant" />}
              </div>
              {showResults && searchResults.length > 0 && (
                <div className="absolute mt-1 w-full overflow-hidden rounded-xl border border-outline-variant bg-surface-container-low/95 backdrop-blur-sm max-h-48 overflow-y-auto shadow-2xl">
                  {searchResults.map((r, i) => (
                    <button
                      key={i}
                      onClick={() => handleSelectResult(r)}
                      className="flex w-full items-start gap-2 border-b border-outline-variant/40 p-3 text-left text-sm text-on-surface-variant transition-colors hover:bg-surface-container last:border-0"
                    >
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/60" />
                      <span className="line-clamp-2">{r.display_name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Lead Scanner Panel */}
            <div className="rounded-xl border border-outline-variant bg-surface-container-low/95 p-4 backdrop-blur-sm shadow-2xl">
              <div className="mb-3 flex items-center gap-2">
                <Radar className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold text-on-surface">Lead Scanner</h3>
              </div>

              {/* Scan location input */}
              <div className="relative mb-2">
                <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant/60" />
                <input
                  type="text"
                  value={scanLocation}
                  onChange={(e) => handleScanLocationSearch(e.target.value)}
                  onFocus={() => searchResults.length > 0 && setShowResults(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchResults.length > 0) {
                      e.preventDefault();
                      handleScanLocationSelect(searchResults[0]);
                    }
                  }}
                  placeholder="Enter location to scan (or click map)"
                  className="w-full rounded-lg border border-outline-variant bg-surface-container py-2 pl-9 pr-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 transition-colors focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/30"
                />
                {showResults && searchResults.length > 0 && (
                  <div className="absolute mt-1 w-full overflow-hidden rounded-lg border border-outline-variant bg-surface-container-low/95 backdrop-blur-sm max-h-40 overflow-y-auto z-10 shadow-2xl">
                    {searchResults.map((r, i) => (
                      <button
                        key={i}
                        onClick={() => handleScanLocationSelect(r)}
                        className="flex w-full items-start gap-2 border-b border-outline-variant/40 p-2 text-left text-xs text-on-surface-variant transition-colors hover:bg-surface-container last:border-0"
                      >
                        <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-primary/60" />
                        <span className="line-clamp-2">{r.display_name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Service select + Radius */}
              <div className="mb-3 flex gap-2">
                <select
                  value={scanService}
                  onChange={(e) => setScanService(e.target.value)}
                  className="flex-1 rounded-lg border border-outline-variant bg-surface-container px-3 py-2 text-sm text-on-surface transition-colors focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/30"
                >
                  <option value="">Select business type...</option>
                  {SERVICE_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
                <select
                  value={scanRadius}
                  onChange={(e) => setScanRadius(Number(e.target.value))}
                  className="w-24 rounded-lg border border-outline-variant bg-surface-container px-2 py-2 text-sm text-on-surface transition-colors focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/30"
                >
                  {RADII.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              {/* Scan button */}
              <button
                onClick={() => handleScan()}
                disabled={!scanCenter || !scanService || scanning}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-on-primary transition-colors hover:bg-primary-fixed-dim disabled:cursor-not-allowed disabled:bg-surface-high disabled:text-on-surface-variant/50"
              >
                {scanning ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Scanning...</>
                ) : (
                  <><Radar className="h-4 w-4" /> Scan for Leads</>
                )}
              </button>

              {scanError && (
                <p className="mt-2 text-xs text-error">{scanError}</p>
              )}
              {scanCenter && !scanning && discoveredLeads.length > 0 && (
                <p className="mt-2 text-xs text-secondary">
                  Found {discoveredLeads.length} businesses. Click markers to view details.
                </p>
              )}
            </div>
          </div>

          {/* Scanning overlay */}
          {scanning && (
            <div className="absolute inset-0 z-[999] flex items-center justify-center bg-surface/40 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-3 rounded-xl border border-outline-variant bg-surface-container-low p-6 shadow-2xl">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm font-medium text-on-surface">Scanning for businesses...</p>
                {scanProgress && (
                  <p className="text-xs text-on-surface-variant">{scanProgress}</p>
                )}
                <p className="text-xs text-on-surface-variant/60">Trying 3 Overpass servers — each has a 15-second timeout</p>
                <button
                  onClick={handleCancelScan}
                  className="mt-1 rounded-lg border border-outline-variant px-3 py-1.5 text-xs font-medium text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
                >
                  Cancel Scan
                </button>
              </div>
            </div>
          )}

          <MapContainer
            center={mapCenter}
            zoom={10}
            scrollWheelZoom
            preferCanvas
            className="h-full w-full"
            style={{ background: '#0b1326' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              subdomains="abcd"
              maxZoom={19}
              keepBuffer={2}
            />
            <FlyTo center={flyTarget} zoom={flyZoom} />
            <ClickHandler onClick={handleMapClick} />

            {/* Scan area (circle for radius, rectangle for bbox) */}
            {scanBbox ? (
              <Rectangle
                bounds={[[scanBbox[0], scanBbox[1]], [scanBbox[2], scanBbox[3]]]}
                pathOptions={{ color: '#adc6ff', fillColor: '#adc6ff', fillOpacity: 0.06, weight: 1.5, dashArray: '5,5' }}
              />
            ) : scanCenter && (
              <Circle
                center={scanCenter}
                radius={scanRadius}
                pathOptions={{ color: '#adc6ff', fillColor: '#adc6ff', fillOpacity: 0.06, weight: 1.5, dashArray: '5,5' }}
              />
            )}

            {/* Existing prospect markers */}
            {geoProspects.map((p) => (
              <Marker
                key={p.id}
                position={[p.latitude!, p.longitude!]}
                icon={createScoreIcon(p.leadScore ?? 0)}
                eventHandlers={{ click: () => handleProspectClick(p) }}
              >
                <Popup>
                  <div className="text-sm">
                    <p className="font-semibold text-on-surface">{p.companyName}</p>
                    <p className="text-on-surface-variant">{[p.city, p.country].filter(Boolean).join(', ') || 'No location'}</p>
                    <p className="mt-1 text-xs text-on-surface-variant">Score: <strong className="text-on-surface">{p.leadScore ?? 'N/A'}</strong> · Status: {p.status}</p>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Discovered lead markers */}
            {discoveredLeads.map((d) => (
              <Marker
                key={d.id}
                position={[d.lat, d.lon]}
                icon={createDiscoveredIcon(d.saved)}
                eventHandlers={{ click: () => handleDiscoveredClick(d) }}
              >
                <Popup>
                  <div className="text-sm" style={{ minWidth: 220, maxHeight: 320, overflowY: 'auto' }}>
                    <p className="font-semibold text-on-surface">{d.name}</p>
                    <p className="text-xs text-on-surface-variant">{d.category}</p>
                    {d.address && <p className="mt-1 text-xs text-on-surface-variant">{d.address}</p>}
                    <div className="mt-2 space-y-0.5">
                      {d.phone && <p className="text-xs text-on-surface-variant">📞 {d.phone}</p>}
                      {d.website && <p className="text-xs text-on-surface-variant break-words">🌐 {d.website}</p>}
                      {d.email && <p className="text-xs text-on-surface-variant break-words">✉️ {d.email}</p>}
                      {d.openingHours && <p className="text-xs text-on-surface-variant">🕒 {d.openingHours}</p>}
                      {d.brand && <p className="text-xs text-on-surface-variant">🏷️ Brand: {d.brand}</p>}
                      {d.operator && <p className="text-xs text-on-surface-variant">👤 Operator: {d.operator}</p>}
                      {d.cuisine && <p className="text-xs text-on-surface-variant">🍽️ Cuisine: {d.cuisine}</p>}
                      {d.wheelchair && <p className="text-xs text-on-surface-variant">♿ Wheelchair: {d.wheelchair}</p>}
                      {d.takeaway && <p className="text-xs text-on-surface-variant">🥡 Takeaway: {d.takeaway}</p>}
                      {d.delivery && <p className="text-xs text-on-surface-variant">🚚 Delivery: {d.delivery}</p>}
                      {d.outdoorSeating && <p className="text-xs text-on-surface-variant">🪑 Outdoor seating: {d.outdoorSeating}</p>}
                      {d.internetAccess && <p className="text-xs text-on-surface-variant">📶 WiFi: {d.internetAccess}</p>}
                      {d.fee && <p className="text-xs text-on-surface-variant">💰 Fee: {d.fee}</p>}
                      {d.description && <p className="text-xs text-on-surface-variant italic">{d.description}</p>}
                      {d.shopType && <p className="text-xs text-on-surface-variant">Shop type: {d.shopType}</p>}
                      {d.amenityType && <p className="text-xs text-on-surface-variant">Amenity: {d.amenityType}</p>}
                      {d.tourismType && <p className="text-xs text-on-surface-variant">Tourism: {d.tourismType}</p>}
                      {d.officeType && <p className="text-xs text-on-surface-variant">Office: {d.officeType}</p>}
                      {d.stars && <p className="text-xs text-on-surface-variant">⭐ Stars: {d.stars}</p>}
                      {d.rooms && <p className="text-xs text-on-surface-variant">🚪 Rooms: {d.rooms}</p>}
                      {d.beds && <p className="text-xs text-on-surface-variant">🛏️ Beds: {d.beds}</p>}
                    </div>
                    {!d.saved && (
                      <button
                        onClick={() => handleSaveLead(d)}
                        className="mt-2 flex items-center gap-1 rounded-lg bg-primary px-2 py-1 text-xs font-medium text-on-primary transition-colors hover:bg-primary-fixed-dim"
                      >
                        <Plus className="h-3 w-3" /> Save as Prospect
                      </button>
                    )}
                    {d.saved && <p className="mt-2 text-xs font-medium text-secondary">✓ Saved to Prospects</p>}
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Context (other nearby) business markers */}
            {contextBusinesses.map((c) => (
              <Marker
                key={c.id}
                position={[c.lat, c.lon]}
                icon={createContextIcon()}
                eventHandlers={{ click: () => {
                  setSelectedContextId(c.id);
                  setSelectedDiscoveredId(null);
                  setSelectedId(null);
                  setFlyTarget([c.lat, c.lon]);
                  setFlyZoom(16);
                }}}
              >
                <Popup>
                  <div className="text-sm" style={{ minWidth: 180 }}>
                    <p className="font-medium text-on-surface">{c.name}</p>
                    <p className="text-xs text-on-surface-variant capitalize">{c.type}</p>
                    {c.address && <p className="mt-1 text-xs text-on-surface-variant">{c.address}</p>}
                    {c.phone && <p className="text-xs text-on-surface-variant">📞 {c.phone}</p>}
                    {c.website && <p className="text-xs text-on-surface-variant break-words">🌐 {c.website}</p>}
                    {c.openingHours && <p className="text-xs text-on-surface-variant">🕒 {c.openingHours}</p>}
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-surface/50 backdrop-blur-sm">
              <p className="text-sm text-on-surface-variant">Loading leads...</p>
            </div>
          )}
        </div>

        {/* Sidebar with tabs */}
        <aside className="hidden w-80 shrink-0 flex-col overflow-hidden border-l border-outline-variant bg-surface-container-low lg:flex">
          {/* Tab header */}
          <div className="flex border-b border-outline-variant">
            <button
              onClick={() => setSidebarTab('prospects')}
              className={`flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                sidebarTab === 'prospects'
                  ? 'border-b-2 border-primary text-on-surface'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Users className="h-4 w-4" />
              My Prospects
            </button>
            <button
              onClick={() => setSidebarTab('discovered')}
              className={`flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                sidebarTab === 'discovered'
                  ? 'border-b-2 border-primary text-on-surface'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Radar className="h-4 w-4" />
              Discovered
              {discoveredLeads.length > 0 && (
                <span className="ml-1 rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {discoveredLeads.length}
                </span>
              )}
            </button>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto">
            {sidebarTab === 'prospects' && (
              <>
                {geoProspects.length === 0 && !loading ? (
                  <div className="p-4 text-center">
                    <MapPin className="mx-auto mb-2 h-8 w-8 text-on-surface-variant" />
                    <p className="text-sm text-on-surface-variant">
                      No prospects with location data yet. Use the scanner to discover new leads!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1 p-2">
                    {geoProspects.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => handleProspectClick(p)}
                        className={`flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors ${
                          selectedId === p.id ? 'bg-surface-container ring-1 ring-primary' : 'hover:bg-surface-container'
                        }`}
                      >
                        <div className="shrink-0">
                          <LeadScoreRing score={p.leadScore ?? 0} size={36} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-on-surface">{p.companyName}</p>
                          <p className="truncate text-xs text-on-surface-variant">
                            {[p.city, p.country].filter(Boolean).join(', ') || 'No location'}
                          </p>
                          <div className="mt-1">
                            <Badge variant={statusColors[p.status] ?? 'neutral'}>{p.status}</Badge>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            {sidebarTab === 'discovered' && (
              <>
                {discoveredLeads.length === 0 && !scanning ? (
                  <div className="p-4 text-center">
                    <Radar className="mx-auto mb-2 h-8 w-8 text-on-surface-variant" />
                    <p className="text-sm text-on-surface-variant">
                      Use the Lead Scanner to discover businesses in any location worldwide.
                    </p>
                    <p className="mt-2 text-xs text-on-surface-variant">
                      1. Enter a location or click the map<br />
                      2. Select a business type<br />
                      3. Click "Scan for Leads"
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Save all bar */}
                    {discoveredLeads.some((d) => !d.saved) && !scanning && (
                      <div className="border-b border-outline-variant p-3">
                        <button
                          onClick={handleSaveAll}
                          disabled={savingId === 'all'}
                          className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-on-primary transition-colors hover:bg-primary-fixed-dim disabled:bg-surface-high disabled:text-on-surface-variant/50"
                        >
                          {savingId === 'all' ? (
                            <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
                          ) : (
                            <><Plus className="h-4 w-4" /> Save All as Prospects</>
                          )}
                        </button>
                      </div>
                    )}
                    <div className="space-y-1 p-2">
                      {discoveredLeads.map((d) => (
                        <div
                          key={d.id}
                          onClick={() => handleDiscoveredClick(d)}
                          className={`flex cursor-pointer items-center gap-3 rounded-lg p-3 transition-colors ${
                            selectedDiscoveredId === d.id ? 'bg-surface-container ring-1 ring-amber-500' : 'hover:bg-surface-container'
                          }`}
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/15">
                            <Store className="h-4 w-4 text-amber-400" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-on-surface">{d.name}</p>
                            <p className="truncate text-xs text-on-surface-variant">{d.category}</p>
                            {d.address && (
                              <p className="truncate text-xs text-on-surface-variant/70">{d.address}</p>
                            )}
                          </div>
                          {d.saved ? (
                            <span className="shrink-0 text-xs font-medium text-secondary">✓ Saved</span>
                          ) : (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleSaveLead(d); }}
                              disabled={savingId === d.id}
                              className="shrink-0 rounded-lg bg-primary px-2 py-1 text-xs font-medium text-on-primary transition-colors hover:bg-primary-fixed-dim disabled:bg-surface-high disabled:text-on-surface-variant/50"
                            >
                              {savingId === d.id ? '...' : 'Save'}
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
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
                  <p className="text-xs text-on-surface-variant">{selectedProspect.industry?.name ?? 'Unknown industry'}</p>
                </div>
              </div>
              <button onClick={() => setSelectedId(null)} className="text-on-surface-variant hover:text-on-surface">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-on-surface-variant">
              {selectedProspect.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {selectedProspect.city}{selectedProspect.country ? `, ${selectedProspect.country}` : ''}
                </span>
              )}
              {selectedProspect.website && (
                <span className="flex items-center gap-1">
                  <Navigation className="h-3 w-3" />
                  {selectedProspect.website}
                </span>
              )}
              <Badge variant={statusColors[selectedProspect.status] ?? 'neutral'}>{selectedProspect.status}</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected Discovered Lead Detail Card */}
      {selectedDiscovered && (
        <Card className="fixed bottom-6 left-1/2 z-[1000] w-[28rem] max-w-[calc(100%-2rem)] -translate-x-1/2 lg:left-[calc(50%+10rem)]">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/15">
                  <Store className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-on-surface">{selectedDiscovered.name}</h3>
                  <p className="text-xs text-on-surface-variant">{selectedDiscovered.category}</p>
                </div>
              </div>
              <button onClick={() => setSelectedDiscoveredId(null)} className="text-on-surface-variant transition-colors hover:text-on-surface">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Coordinates */}
            <div className="mt-2 flex items-center gap-2 text-[10px] text-on-surface-variant/50">
              <MapPin className="h-3 w-3" />
              {selectedDiscovered.lat.toFixed(5)}, {selectedDiscovered.lon.toFixed(5)}
            </div>

            {/* All business details */}
            <div className="mt-3 max-h-48 overflow-y-auto border-t border-outline-variant/40 pt-2">
              {selectedDiscovered.address && (
                <DetailRow icon={MapPin} label="Address" value={selectedDiscovered.address} />
              )}
              {selectedDiscovered.phone && (
                <DetailRow icon={Phone} label="Phone" value={selectedDiscovered.phone} />
              )}
              {selectedDiscovered.website && (
                <DetailRow icon={Globe} label="Website" value={selectedDiscovered.website} />
              )}
              {selectedDiscovered.email && (
                <DetailRow icon={Mail} label="Email" value={selectedDiscovered.email} />
              )}
              {selectedDiscovered.openingHours && (
                <DetailRow icon={Clock} label="Opening Hours" value={selectedDiscovered.openingHours} />
              )}
              {selectedDiscovered.brand && (
                <DetailRow icon={Tag} label="Brand" value={selectedDiscovered.brand} />
              )}
              {selectedDiscovered.operator && (
                <DetailRow icon={Building2} label="Operator" value={selectedDiscovered.operator} />
              )}
              {selectedDiscovered.cuisine && (
                <DetailRow icon={Utensils} label="Cuisine" value={selectedDiscovered.cuisine} />
              )}
              {selectedDiscovered.wheelchair && (
                <DetailRow icon={Accessibility} label="Wheelchair Access" value={selectedDiscovered.wheelchair} />
              )}
              {selectedDiscovered.takeaway && (
                <DetailRow icon={Store} label="Takeaway" value={selectedDiscovered.takeaway} />
              )}
              {selectedDiscovered.delivery && (
                <DetailRow icon={Store} label="Delivery" value={selectedDiscovered.delivery} />
              )}
              {selectedDiscovered.outdoorSeating && (
                <DetailRow icon={Store} label="Outdoor Seating" value={selectedDiscovered.outdoorSeating} />
              )}
              {selectedDiscovered.internetAccess && (
                <DetailRow icon={Wifi} label="Internet / WiFi" value={selectedDiscovered.internetAccess} />
              )}
              {selectedDiscovered.fee && (
                <DetailRow icon={DollarSign} label="Fee" value={selectedDiscovered.fee} />
              )}
              {selectedDiscovered.description && (
                <DetailRow icon={Info} label="Description" value={selectedDiscovered.description} />
              )}
              {selectedDiscovered.stars && (
                <DetailRow icon={Star} label="Hotel Stars" value={selectedDiscovered.stars} />
              )}
              {selectedDiscovered.rooms && (
                <DetailRow icon={DoorOpen} label="Rooms" value={selectedDiscovered.rooms} />
              )}
              {selectedDiscovered.beds && (
                <DetailRow icon={BedDouble} label="Beds" value={selectedDiscovered.beds} />
              )}
              {selectedDiscovered.shopType && (
                <DetailRow icon={Tag} label="Shop Type" value={selectedDiscovered.shopType} />
              )}
              {selectedDiscovered.amenityType && (
                <DetailRow icon={Tag} label="Amenity Type" value={selectedDiscovered.amenityType} />
              )}
              {selectedDiscovered.tourismType && (
                <DetailRow icon={Tag} label="Tourism Type" value={selectedDiscovered.tourismType} />
              )}
              {selectedDiscovered.officeType && (
                <DetailRow icon={Building2} label="Office Type" value={selectedDiscovered.officeType} />
              )}
            </div>

            <div className="mt-3">
              {selectedDiscovered.saved ? (
                <p className="text-sm font-medium text-secondary">✓ Already saved to your prospects</p>
              ) : (
                <Button
                  onClick={() => handleSaveLead(selectedDiscovered)}
                  disabled={savingId === selectedDiscovered.id}
                  className="w-full"
                >
                  {savingId === selectedDiscovered.id ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
                  ) : (
                    <><Plus className="h-4 w-4" /> Save as Prospect</>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected Context Business Detail Card */}
      {selectedContext && (
        <Card className="fixed bottom-6 left-1/2 z-[1000] w-96 max-w-[calc(100%-2rem)] -translate-x-1/2 lg:left-[calc(50%+10rem)]">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Store className="h-5 w-5 text-primary/70" />
                </div>
                <div>
                  <h3 className="font-semibold text-on-surface">{selectedContext.name}</h3>
                  <p className="text-xs text-on-surface-variant capitalize">{selectedContext.type}</p>
                </div>
              </div>
              <button onClick={() => setSelectedContextId(null)} className="text-on-surface-variant transition-colors hover:text-on-surface">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 space-y-1 border-t border-outline-variant/40 pt-2">
              {selectedContext.address && (
                <DetailRow icon={MapPin} label="Address" value={selectedContext.address} />
              )}
              {selectedContext.phone && (
                <DetailRow icon={Phone} label="Phone" value={selectedContext.phone} />
              )}
              {selectedContext.website && (
                <DetailRow icon={Globe} label="Website" value={selectedContext.website} />
              )}
              {selectedContext.openingHours && (
                <DetailRow icon={Clock} label="Opening Hours" value={selectedContext.openingHours} />
              )}
              <div className="flex items-center gap-2 pt-1 text-[10px] text-on-surface-variant/50">
                <MapPin className="h-3 w-3" />
                {selectedContext.lat.toFixed(5)}, {selectedContext.lon.toFixed(5)}
              </div>
            </div>
            <div className="mt-3">
              <Button
                onClick={() => {
                  handleSaveLead({
                    id: selectedContext.id,
                    name: selectedContext.name,
                    category: selectedContext.type,
                    lat: selectedContext.lat,
                    lon: selectedContext.lon,
                    address: selectedContext.address,
                    phone: selectedContext.phone,
                    website: selectedContext.website,
                    saved: false,
                  });
                }}
                disabled={savingId === selectedContext.id}
                className="w-full"
              >
                {savingId === selectedContext.id ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
                ) : (
                  <><Plus className="h-4 w-4" /> Save as Prospect</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
