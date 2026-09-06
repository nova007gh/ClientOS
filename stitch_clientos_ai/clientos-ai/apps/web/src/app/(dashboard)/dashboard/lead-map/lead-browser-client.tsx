'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Card, CardContent, Badge, LeadScoreRing, Button } from '@clientos/ui';
import { api } from '@/lib/api-client';
import { useAuthStore } from '@/lib/auth-store';
import {
  Search, MapPin, X, Users, Radar, Plus, Loader2, Store,
  Phone, Globe, Mail, Clock, Info, Globe2, Facebook, Twitter,
  Instagram, Linkedin, Youtube, MessageCircle, ExternalLink, RefreshCw,
  Plus as PlusIcon, Sparkles, Zap, Camera,
} from 'lucide-react';
import CesiumGlobe, { type BusinessMarker, type ProspectMarker, type CCTVMarker } from './cesium-globe';

// ── Types ──────────────────────────────────────

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

interface ScrapedBusiness {
  name: string;
  category?: string | null;
  address?: string | null;
  phone?: string | null;
  website?: string | null;
  email?: string | null;
  lat?: number | null;
  lon?: number | null;
  rating?: number | null;
  review_count?: number | null;
  opening_hours?: string | null;
  social_links?: string[] | null;
  description?: string | null;
  source?: string | null;
  extra?: Record<string, unknown> | null;
}

interface BrowserTab {
  id: string;
  title: string;
  query: string;
  location: string;
  source: 'maps' | 'web' | 'social' | 'local' | 'deep' | 'yellowpages' | 'yelp' | 'directories' | 'enrich' | 'area';
  results: ScrapedBusiness[];
  loading: boolean;
  error: string;
  createdAt: number;
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
  boundingbox?: [string, string, string, string];
}

// ── Constants ──────────────────────────────────

const DEFAULT_CENTER: [number, number] = [5.6037, -0.187];

const SCRAPER_URL = process.env.NEXT_PUBLIC_SCRAPER_URL || 'http://127.0.0.1:8000';

const SOURCE_OPTIONS = [
  { label: 'Map Discovery', value: 'maps', icon: Radar, desc: 'Find businesses on the 3D globe via OSM' },
  { label: 'Area Search', value: 'area', icon: MapPin, desc: 'Scrape all businesses in visible map area' },
  { label: 'Google Search', value: 'yellowpages', icon: Store, desc: 'Search Google for business contacts' },
  { label: 'Bing Search', value: 'yelp', icon: Store, desc: 'Search Bing for business contacts' },
  { label: 'All Sources', value: 'directories', icon: Globe2, desc: 'OSM + Google + Bing + website enrichment' },
  { label: 'Deep Scan', value: 'deep', icon: Zap, desc: 'Map results + website contact extraction' },
  { label: 'Contact Enrichment', value: 'enrich', icon: Sparkles, desc: 'Scrape business websites for emails & phones' },
  { label: 'Web Search', value: 'web', icon: Globe2, desc: 'Scrape websites for info' },
  { label: 'Social Media', value: 'social', icon: MessageCircle, desc: 'Find social profiles' },
  { label: 'Local Search', value: 'local', icon: Store, desc: 'Combined local search' },
];

const QUICK_QUERIES = [
  'restaurants', 'dental clinics', 'hotels', 'law firms', 'real estate',
  'beauty salons', 'gyms', 'auto repair', 'pharmacies', 'tech companies',
  'healthcare', 'schools', 'construction', 'plumbers', 'electricians',
  'churches', 'banks', 'insurance', 'marketing agencies', 'accountants',
];

const statusColors: Record<string, 'default' | 'secondary' | 'warning' | 'error' | 'outline' | 'neutral'> = {
  NEW: 'neutral', CONTACTED: 'default', REPLIED: 'secondary',
  QUALIFIED: 'secondary', AUDITED: 'default', WON: 'secondary', LOST: 'error',
};

// ── UI Components ──────────────────────────────

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

function SocialIcon({ url }: { url: string }) {
  const lower = url.toLowerCase();
  if (lower.includes('facebook')) return <Facebook className="h-3.5 w-3.5 text-blue-400" />;
  if (lower.includes('twitter') || lower.includes('x.com')) return <Twitter className="h-3.5 w-3.5 text-sky-400" />;
  if (lower.includes('instagram')) return <Instagram className="h-3.5 w-3.5 text-pink-400" />;
  if (lower.includes('linkedin')) return <Linkedin className="h-3.5 w-3.5 text-blue-600" />;
  if (lower.includes('youtube')) return <Youtube className="h-3.5 w-3.5 text-red-500" />;
  if (lower.includes('wa.me') || lower.includes('whatsapp')) return <MessageCircle className="h-3.5 w-3.5 text-green-400" />;
  return <ExternalLink className="h-3.5 w-3.5 text-on-surface-variant" />;
}

function SourceBadge({ source }: { source: string }) {
  const colors: Record<string, string> = {
    maps: 'bg-blue-500/15 text-blue-400',
    web: 'bg-violet-500/15 text-violet-400',
    social: 'bg-pink-500/15 text-pink-400',
    local: 'bg-amber-500/15 text-amber-400',
    deep: 'bg-emerald-500/15 text-emerald-400',
    overpass: 'bg-blue-500/15 text-blue-400',
  };
  const labels: Record<string, string> = {
    maps: 'Map', web: 'Web', social: 'Social', local: 'Local', deep: 'Deep', overpass: 'OSM',
  };
  return (
    <span className={`rounded px-1.5 py-0.5 text-[9px] font-medium ${colors[source] || 'bg-gray-500/15 text-gray-400'}`}>
      {labels[source] || source}
    </span>
  );
}

// ── Main Component ─────────────────────────────

export default function LeadMapPage() {
  const { accessToken } = useAuthStore();
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [flyTarget, setFlyTarget] = useState<[number, number] | null>(null);
  const [flyZoom, setFlyZoom] = useState(10);

  // Browser tabs
  const [tabs, setTabs] = useState<BrowserTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [tabCounter, setTabCounter] = useState(0);

  // Search bar
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [searchSource, setSearchSource] = useState<string>('maps');
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Map state
  const [scanCenter, setScanCenter] = useState<[number, number] | null>(null);
  const [scanRadius, setScanRadius] = useState(5000);
  const [selectedBusiness, setSelectedBusiness] = useState<ScrapedBusiness | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [sidebarTab, setSidebarTab] = useState<'prospects' | 'results'>('results');
  const [showSaved, setShowSaved] = useState(false);

  // CCTV state
  const [showCCTV, setShowCCTV] = useState(false);
  const [cctvMarkers, setCctvMarkers] = useState<CCTVMarker[]>([]);
  const [cctvLoading, setCctvLoading] = useState(false);

  // Notification state
  const [notifications, setNotifications] = useState<{ id: number; message: string; type: 'info' | 'success' | 'error' }[]>([]);
  const notifIdRef = useRef(0);

  const notify = useCallback((message: string, type: 'info' | 'success' | 'error' = 'info') => {
    const id = ++notifIdRef.current;
    setNotifications((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 4000);
  }, []);

  // Load prospects
  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    api
      .get<{ data: Prospect[] }>('/prospects?pageSize=200', accessToken)
      .then((res) => setProspects(res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [accessToken]);

  const geoProspects = useMemo(
    () => prospects.filter((p) => p.latitude != null && p.longitude != null),
    [prospects],
  );

  const mapCenter = useMemo<[number, number]>(() => {
    if (geoProspects.length > 0) {
      const avgLat = geoProspects.reduce((s, p) => s + (p.latitude ?? 0), 0) / geoProspects.length;
      const avgLng = geoProspects.reduce((s, p) => s + (p.longitude ?? 0), 0) / geoProspects.length;
      return [avgLat, avgLng];
    }
    return DEFAULT_CENTER;
  }, [geoProspects]);

  // All scraped results from active tab
  const activeTab = tabs.find((t) => t.id === activeTabId) ?? null;
  const allScrapedResults = useMemo(() => {
    return activeTab?.results ?? [];
  }, [activeTab]);

  const geoScrapedResults = useMemo(
    () => allScrapedResults.filter((r) => r.lat != null && r.lon != null),
    [allScrapedResults],
  );

  // Convert scraped results to Cesium markers
  const cesiumMarkers = useMemo<BusinessMarker[]>(
    () =>
      geoScrapedResults.map((b, i) => ({
        id: `${b.name}-${i}`,
        name: b.name,
        lat: b.lat!,
        lon: b.lon!,
        category: b.category,
        source: b.source || activeTab?.source || 'maps',
        phone: b.phone,
        website: b.website,
        email: b.email,
        address: b.address,
        description: b.description,
      })),
    [geoScrapedResults, activeTab],
  );

  // Convert prospects to Cesium markers
  const cesiumProspects = useMemo<ProspectMarker[]>(
    () =>
      geoProspects.map((p) => ({
        id: p.id,
        name: p.companyName,
        lat: p.latitude!,
        lon: p.longitude!,
        score: p.leadScore,
        status: p.status,
      })),
    [geoProspects],
  );

  // ── Location search ───────────────────────────

  const handleLocationSearch = useCallback((value: string) => {
    setSearchLocation(value);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!value.trim()) { setSearchResults([]); setShowResults(false); return; }
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&limit=5`,
          { headers: { 'Accept-Language': 'en', 'User-Agent': 'ClientOS-Map/1.0' } },
        );
        const data = await res.json();
        setSearchResults(data);
        setShowResults(true);
      } catch { setSearchResults([]); }
      finally { setSearching(false); }
    }, 500);
  }, []);

  const handleLocationSelect = (result: NominatimResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    setScanCenter([lat, lng]);
    setSearchLocation(result.display_name.split(',')[0]);
    setShowResults(false);
    setFlyTarget([lat, lng]);
    setFlyZoom(12);
  };

  const handleMapClick = (lat: number, lng: number) => {
    setScanCenter([lat, lng]);
    setSearchLocation('Loading...');
    fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&accept-language=en`,
      { headers: { 'User-Agent': 'ClientOS-Map/1.0' } },
    )
      .then((r) => r.json())
      .then((data) => {
        const name = data.display_name?.split(',')?.[0] || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        setSearchLocation(name);
      })
      .catch(() => setSearchLocation(`${lat.toFixed(4)}, ${lng.toFixed(4)}`));
  };

  // ── Tab management ────────────────────────────

  const createTab = (query: string, location: string, source: string): string => {
    const id = `tab-${tabCounter}`;
    const newTab: BrowserTab = {
      id,
      title: query || 'New Search',
      query,
      location,
      source: source as BrowserTab['source'],
      results: [],
      loading: false,
      error: '',
      createdAt: Date.now(),
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(id);
    setTabCounter((c) => c + 1);
    setSidebarTab('results');
    return id;
  };

  const closeTab = (id: string) => {
    setTabs((prev) => {
      const filtered = prev.filter((t) => t.id !== id);
      if (activeTabId === id) {
        setActiveTabId(filtered.length > 0 ? filtered[filtered.length - 1].id : null);
      }
      return filtered;
    });
  };

  const updateTab = (id: string, updates: Partial<BrowserTab>) => {
    setTabs((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  };

  // ── Search execution ──────────────────────────

  const executeSearch = async (tabId: string, query: string, location: string, source: string) => {
    updateTab(tabId, { loading: true, error: '' });
    notify(`Searching for "${query}"...`, 'info');

    const payload: Record<string, unknown> = {
      query,
      location: location || undefined,
      lat: scanCenter?.[0],
      lon: scanCenter?.[1],
      radius: scanRadius,
      max_results: source === 'area' ? 500 : 50,
    };

    // For area search, compute bounding box from scan center and radius
    if (source === 'area' && scanCenter) {
      const [clat, clon] = scanCenter;
      const radiusKm = scanRadius / 1000;
      const latDelta = radiusKm / 111;
      const lonDelta = radiusKm / (111 * Math.cos((clat * Math.PI) / 180));
      payload.bbox_south = clat - latDelta;
      payload.bbox_west = clon - lonDelta;
      payload.bbox_north = clat + latDelta;
      payload.bbox_east = clon + lonDelta;
    }

    // Map source to correct endpoint
    let url: string;
    switch (source) {
      case 'maps': url = `${SCRAPER_URL}/api/maps/discover`; break;
      case 'web': url = `${SCRAPER_URL}/api/web/scrape`; break;
      case 'social': url = `${SCRAPER_URL}/api/social/search`; break;
      case 'local': url = `${SCRAPER_URL}/api/local/search`; break;
      case 'deep': url = `${SCRAPER_URL}/api/local/deep`; break;
      case 'yellowpages': url = `${SCRAPER_URL}/api/directories/yellowpages`; break;
      case 'yelp': url = `${SCRAPER_URL}/api/directories/yelp`; break;
      case 'directories': url = `${SCRAPER_URL}/api/directories/all`; break;
      case 'enrich': url = `${SCRAPER_URL}/api/directories/enrich`; break;
      case 'area': url = `${SCRAPER_URL}/api/maps/area`; break;
      default: url = `${SCRAPER_URL}/api/maps/discover`;
    }

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`Scraping failed (${res.status})`);
      const data = await res.json();
      const resultCount = (data.results || []).length;
      const withContacts = (data.results || []).filter((r: ScrapedBusiness) => r.phone || r.email || r.website).length;
      updateTab(tabId, {
        results: data.results || [],
        loading: false,
        title: `${query} (${resultCount})`,
      });
      notify(`Found ${resultCount} businesses${withContacts > 0 ? ` (${withContacts} with contact info)` : ''}`, 'success');
    } catch (e: any) {
      updateTab(tabId, { loading: false, error: e.message || 'Search failed' });
      notify(`Search failed: ${e.message || 'Unknown error'}`, 'error');
    }
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    const tabId = createTab(searchQuery, searchLocation, searchSource);
    executeSearch(tabId, searchQuery, searchLocation, searchSource);
  };

  const handleRefreshTab = (tabId: string) => {
    const tab = tabs.find((t) => t.id === tabId);
    if (!tab) return;
    executeSearch(tabId, tab.query, tab.location, tab.source);
  };

  // ── Save lead ─────────────────────────────────

  const handleSaveLead = async (business: ScrapedBusiness) => {
    if (!accessToken) return;
    const id = `${business.name}-${business.lat}-${business.lon}`;
    setSavingId(id);
    try {
      await api.post<Prospect>('/prospects', {
        companyName: business.name,
        phone: business.phone,
        website: business.website,
        email: business.email,
        address: business.address,
        latitude: business.lat,
        longitude: business.lon,
        status: 'NEW',
      }, accessToken);

      const res = await api.get<{ data: Prospect[] }>('/prospects?pageSize=200', accessToken);
      setProspects(res.data ?? []);
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2000);
      notify(`Saved "${business.name}" as prospect`, 'success');
    } catch (e: any) {
      console.error('Save failed:', e);
      notify(`Failed to save lead: ${e.message || 'Unknown error'}`, 'error');
    } finally {
      setSavingId(null);
    }
  };

  const handleSaveAll = async () => {
    if (!accessToken || !activeTab) return;
    const unsaved = activeTab.results;
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
      const res = await api.get<{ data: Prospect[] }>('/prospects?pageSize=200', accessToken);
      setProspects(res.data ?? []);
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2000);
      notify(`Saved ${unsaved.length} prospects`, 'success');
    } catch (e: any) {
      console.error('Bulk save failed:', e);
      notify(`Bulk save failed: ${e.message || 'Unknown error'}`, 'error');
    } finally {
      setSavingId(null);
    }
  };

  // ── CCTV toggle ───────────────────────────────

  const handleToggleCCTV = async () => {
    if (showCCTV) {
      setShowCCTV(false);
      return;
    }
    if (!scanCenter) return;
    setShowCCTV(true);
    setCctvLoading(true);
    try {
      const res = await fetch(`${SCRAPER_URL}/api/cctv/nearby`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'cameras',
          lat: scanCenter[0],
          lon: scanCenter[1],
          radius: scanRadius,
          max_results: 30,
        }),
      });
      const data = await res.json();
      const cctvData = (data.results || []).map((c: any, i: number) => ({
          id: `cctv-${i}`,
          name: c.name,
          lat: c.lat,
          lon: c.lon,
          operator: c.extra?.operator,
        }));
      setCctvMarkers(cctvData);
      notify(`Loaded ${cctvData.length} CCTV cameras`, 'success');
    } catch {
      setCctvMarkers([]);
      notify('Failed to load CCTV cameras', 'error');
    } finally {
      setCctvLoading(false);
    }
  };

  // ── Render ────────────────────────────────────

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] overflow-hidden">
      {/* Browser Top Bar */}
      <div className="shrink-0 border-b border-outline-variant bg-surface-container-low">
        {/* Tab bar */}
        <div className="flex items-center gap-1 px-2 pt-2 overflow-x-auto">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className={`group flex items-center gap-2 rounded-t-lg px-3 py-2 text-xs cursor-pointer transition-colors min-w-[120px] max-w-[200px] ${
                activeTabId === tab.id
                  ? 'bg-surface text-on-surface border border-b-0 border-outline-variant'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {tab.loading && <Loader2 className="h-3 w-3 shrink-0 animate-spin" />}
              <span className="truncate flex-1">{tab.title}</span>
              <button
                onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
                className="shrink-0 opacity-50 hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          <button
            onClick={() => { setActiveTabId(null); setSearchQuery(''); }}
            className="shrink-0 rounded p-1.5 text-on-surface-variant hover:bg-surface-container-high"
            title="New tab"
          >
            <PlusIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Address/Search bar */}
        <div className="flex items-center gap-2 p-2">
          <button
            onClick={() => activeTab && handleRefreshTab(activeTab.id)}
            disabled={!activeTab || activeTab.loading}
            className="shrink-0 rounded-lg p-2 text-on-surface-variant hover:bg-surface-container-high disabled:opacity-30"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>

          {/* Location input */}
          <div className="relative w-48 shrink-0">
            <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant/60" />
            <input
              type="text"
              value={searchLocation}
              onChange={(e) => handleLocationSearch(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowResults(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchResults.length > 0) {
                  e.preventDefault();
                  handleLocationSelect(searchResults[0]);
                }
              }}
              placeholder="Location..."
              className="w-full rounded-lg border border-outline-variant bg-surface py-2 pl-9 pr-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
            {showResults && searchResults.length > 0 && (
              <div className="absolute mt-1 w-full overflow-hidden rounded-lg border border-outline-variant bg-surface-container-low/95 backdrop-blur-sm max-h-40 overflow-y-auto z-10 shadow-2xl">
                {searchResults.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => handleLocationSelect(r)}
                    className="flex w-full items-start gap-2 border-b border-outline-variant/40 p-2 text-left text-xs text-on-surface-variant hover:bg-surface-container last:border-0"
                  >
                    <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-primary/60" />
                    <span className="line-clamp-2">{r.display_name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search query input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-on-surface-variant/60" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
              placeholder="Search for businesses, services, or anything..."
              className="w-full rounded-lg border border-outline-variant bg-surface py-2 pl-9 pr-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
            {searching && <Loader2 className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-on-surface-variant" />}
          </div>

          {/* Source selector */}
          <select
            value={searchSource}
            onChange={(e) => setSearchSource(e.target.value)}
            className="shrink-0 rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-on-surface focus:border-primary/60 focus:outline-none"
          >
            {SOURCE_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          {/* Search button */}
          <button
            onClick={handleSearch}
            disabled={!searchQuery.trim()}
            className="shrink-0 flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-on-primary transition-colors hover:bg-primary-fixed-dim disabled:cursor-not-allowed disabled:bg-surface-high disabled:text-on-surface-variant/50"
          >
            <Sparkles className="h-4 w-4" />
            Search
          </button>
        </div>

        {/* Quick queries */}
        {!activeTab && tabs.length === 0 && (
          <div className="flex items-center gap-2 px-2 pb-2 flex-wrap">
            <span className="text-xs text-on-surface-variant/60">Quick search:</span>
            {QUICK_QUERIES.map((q) => (
              <button
                key={q}
                onClick={() => { setSearchQuery(q); }}
                className="rounded-full border border-outline-variant px-3 py-1 text-xs text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
              >
                {q}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main content: Map + Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* 3D Globe */}
        <div className="relative flex-1 overflow-hidden">
          <CesiumGlobe
            center={mapCenter}
            markers={cesiumMarkers}
            prospects={cesiumProspects}
            cctvMarkers={cctvMarkers}
            showCCTV={showCCTV}
            scanCenter={scanCenter}
            scanRadius={scanRadius}
            flyTarget={flyTarget}
            flyZoom={flyZoom}
            onMapClick={handleMapClick}
            onMarkerClick={(m) => {
              const business: ScrapedBusiness = {
                name: m.name,
                category: m.category,
                source: m.source,
                phone: m.phone,
                website: m.website,
                email: m.email,
                address: m.address,
                description: m.description,
                lat: m.lat,
                lon: m.lon,
              };
              setSelectedBusiness(business);
              setFlyTarget([m.lat, m.lon]);
              setFlyZoom(16);
            }}
            onProspectClick={(p) => {
              setFlyTarget([p.lat, p.lon]);
              setFlyZoom(14);
            }}
          />

          {/* 3D Globe badge */}
          <div className="pointer-events-none absolute top-3 left-3 z-[500] rounded-lg border border-outline-variant/30 bg-surface-container-low/60 px-3 py-1.5 text-[10px] font-medium text-on-surface-variant backdrop-blur-md">
            🌐 3D Globe — Click anywhere to set scan center
          </div>

          {/* CCTV Toggle */}
          <button
            onClick={handleToggleCCTV}
            disabled={!scanCenter || cctvLoading}
            className={`absolute top-3 right-3 z-[500] flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium backdrop-blur-md transition-all ${
              showCCTV
                ? 'border-red-500/40 bg-red-500/15 text-red-400'
                : 'border-outline-variant/30 bg-surface-container-low/60 text-on-surface-variant hover:text-on-surface'
            } disabled:opacity-40 disabled:cursor-not-allowed`}
            title="Toggle public CCTV cameras near scan center"
          >
            {cctvLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Camera className="h-3.5 w-3.5" />
            )}
            CCTV {showCCTV ? 'ON' : 'OFF'}
            {showCCTV && cctvMarkers.length > 0 && (
              <span className="ml-1 rounded-full bg-red-500/20 px-1.5 text-[10px]">{cctvMarkers.length}</span>
            )}
          </button>

          {/* Map Controls */}
          <div className="absolute bottom-3 right-3 z-[500] flex flex-col gap-2">
            {/* Fit to Results */}
            {cesiumMarkers.length > 0 && (
              <button
                onClick={() => (window as any).__cesiumFitToResults?.()}
                className="flex items-center gap-2 rounded-lg border border-outline-variant/30 bg-surface-container-low/60 px-3 py-1.5 text-xs font-medium text-on-surface-variant backdrop-blur-md transition-all hover:text-on-surface"
                title="Zoom to show all results"
              >
                <Radar className="h-3.5 w-3.5" />
                Fit to Results ({cesiumMarkers.length})
              </button>
            )}

            {/* Scan Radius Control */}
            {scanCenter && (
              <div className="flex items-center gap-2 rounded-lg border border-outline-variant/30 bg-surface-container-low/60 px-3 py-1.5 backdrop-blur-md">
                <MapPin className="h-3.5 w-3.5 text-on-surface-variant" />
                <input
                  type="range"
                  min="1000"
                  max="50000"
                  step="1000"
                  value={scanRadius}
                  onChange={(e) => setScanRadius(Number(e.target.value))}
                  className="w-24 accent-primary"
                />
                <span className="text-[10px] text-on-surface-variant w-12">{(scanRadius / 1000).toFixed(0)}km</span>
              </div>
            )}
          </div>

          {/* Loading overlay for active tab */}
          {activeTab?.loading && (
            <div className="absolute inset-0 z-[999] flex items-center justify-center bg-surface/40 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-3 rounded-xl border border-outline-variant bg-surface-container-low/80 p-6 shadow-2xl backdrop-blur-md">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm font-medium text-on-surface">Scraping {activeTab.source} sources...</p>
                <p className="text-xs text-on-surface-variant">Query: "{activeTab.query}"</p>
                {activeTab.location && <p className="text-xs text-on-surface-variant">Location: {activeTab.location}</p>}
              </div>
            </div>
          )}

          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-surface/50 backdrop-blur-sm">
              <p className="text-sm text-on-surface-variant">Loading leads...</p>
            </div>
          )}

          {/* Saved toast */}
          {showSaved && (
            <div className="absolute top-4 right-4 z-[1000] rounded-lg bg-secondary px-4 py-2 text-sm font-medium text-white shadow-2xl">
              ✓ Saved to Prospects
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="hidden w-96 shrink-0 flex-col overflow-hidden border-l border-outline-variant bg-surface-container-low lg:flex">
          {/* Tab header */}
          <div className="flex border-b border-outline-variant">
            <button
              onClick={() => setSidebarTab('results')}
              className={`flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                sidebarTab === 'results' ? 'border-b-2 border-primary text-on-surface' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Radar className="h-4 w-4" />
              Results
              {allScrapedResults.length > 0 && (
                <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-on-primary">
                  {allScrapedResults.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setSidebarTab('prospects')}
              className={`flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                sidebarTab === 'prospects' ? 'border-b-2 border-primary text-on-surface' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <Users className="h-4 w-4" />
              Prospects
              {geoProspects.length > 0 && (
                <span className="ml-1 rounded-full bg-surface-high px-1.5 py-0.5 text-[10px] font-bold text-on-surface-variant">
                  {geoProspects.length}
                </span>
              )}
            </button>
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto">
            {/* Results tab */}
            {sidebarTab === 'results' && (
              <>
                {!activeTab && tabs.length === 0 ? (
                  <div className="p-6 text-center">
                    <Globe2 className="mx-auto mb-3 h-12 w-12 text-on-surface-variant/40" />
                    <p className="text-sm font-medium text-on-surface">Browser-Style Lead Discovery</p>
                    <p className="mt-2 text-xs text-on-surface-variant">
                      Enter a location and search query above to discover businesses across web, maps, and social media.
                    </p>
                    <div className="mt-4 space-y-2 text-left">
                      {SOURCE_OPTIONS.map((s) => (
                        <div key={s.value} className="flex items-center gap-2 rounded-lg border border-outline-variant/40 p-2">
                          <s.icon className="h-4 w-4 text-primary/60" />
                          <div>
                            <p className="text-xs font-medium text-on-surface">{s.label}</p>
                            <p className="text-[10px] text-on-surface-variant">{s.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : activeTab?.loading ? (
                  <div className="p-4 text-center">
                    <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin text-primary" />
                    <p className="text-sm text-on-surface-variant">Scraping in progress...</p>
                  </div>
                ) : activeTab?.error ? (
                  <div className="p-4 text-center">
                    <p className="text-sm text-error">{activeTab.error}</p>
                    <button
                      onClick={() => handleRefreshTab(activeTab.id)}
                      className="mt-2 rounded-lg border border-outline-variant px-3 py-1.5 text-xs text-on-surface-variant hover:bg-surface-container"
                    >
                      Retry
                    </button>
                  </div>
                ) : allScrapedResults.length === 0 ? (
                  <div className="p-4 text-center">
                    <p className="text-sm text-on-surface-variant">No results found. Try a different query or source.</p>
                  </div>
                ) : (
                  <>
                    {/* Save all bar */}
                    {allScrapedResults.length > 0 && (
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
                    {/* Results list */}
                    <div className="space-y-1 p-2">
                      {allScrapedResults.map((b, i) => (
                        <div
                          key={`${b.name}-${i}`}
                          onClick={() => {
                            setSelectedBusiness(b);
                            if (b.lat && b.lon) {
                              setFlyTarget([b.lat, b.lon]);
                              setFlyZoom(15);
                            }
                          }}
                          className={`flex cursor-pointer items-start gap-3 rounded-lg p-3 transition-colors ${
                            selectedBusiness?.name === b.name ? 'bg-surface-container ring-1 ring-primary' : 'hover:bg-surface-container'
                          }`}
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                            <Store className="h-4 w-4 text-primary/70" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="truncate text-sm font-medium text-on-surface">{b.name}</p>
                              <SourceBadge source={b.source || activeTab?.source || ''} />
                            </div>
                            {b.category && <p className="truncate text-xs text-on-surface-variant capitalize">{b.category}</p>}
                            {b.address && <p className="truncate text-xs text-on-surface-variant/70">{b.address}</p>}
                            <div className="mt-1 flex items-center gap-2">
                              {b.phone && <Phone className="h-3 w-3 text-on-surface-variant/50" />}
                              {b.website && <Globe className="h-3 w-3 text-on-surface-variant/50" />}
                              {b.email && <Mail className="h-3 w-3 text-on-surface-variant/50" />}
                              {b.social_links && b.social_links.length > 0 && (
                                <div className="flex items-center gap-1">
                                  {b.social_links.slice(0, 3).map((link, j) => (
                                    <SocialIcon key={j} url={link} />
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleSaveLead(b); }}
                            disabled={savingId === `${b.name}-${b.lat}-${b.lon}`}
                            className="shrink-0 rounded-lg bg-primary px-2 py-1 text-xs font-medium text-on-primary transition-colors hover:bg-primary-fixed-dim disabled:bg-surface-high disabled:text-on-surface-variant/50"
                          >
                            {savingId === `${b.name}-${b.lat}-${b.lon}` ? '...' : 'Save'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}

            {/* Prospects tab */}
            {sidebarTab === 'prospects' && (
              <>
                {geoProspects.length === 0 && !loading ? (
                  <div className="p-4 text-center">
                    <MapPin className="mx-auto mb-2 h-8 w-8 text-on-surface-variant" />
                    <p className="text-sm text-on-surface-variant">
                      No prospects with location data yet. Use the browser to discover and save new leads!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1 p-2">
                    {geoProspects.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setFlyTarget([p.latitude!, p.longitude!]);
                          setFlyZoom(14);
                        }}
                        className="flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors hover:bg-surface-container"
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
          </div>
        </aside>
      </div>

      {/* Selected Business Detail Card */}
      {selectedBusiness && (
        <Card className="fixed bottom-6 left-1/2 z-[1000] w-[28rem] max-w-[calc(100%-2rem)] -translate-x-1/2 lg:left-[calc(50%+12rem)]">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Store className="h-5 w-5 text-primary/70" />
                </div>
                <div>
                  <h3 className="font-semibold text-on-surface">{selectedBusiness.name}</h3>
                  <div className="flex items-center gap-2">
                    {selectedBusiness.category && (
                      <p className="text-xs text-on-surface-variant capitalize">{selectedBusiness.category}</p>
                    )}
                    <SourceBadge source={selectedBusiness.source || activeTab?.source || ''} />
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedBusiness(null)} className="text-on-surface-variant transition-colors hover:text-on-surface">
                <X className="h-4 w-4" />
              </button>
            </div>

            {selectedBusiness.lat && selectedBusiness.lon && (
              <div className="mt-2 flex items-center gap-2 text-[10px] text-on-surface-variant/50">
                <MapPin className="h-3 w-3" />
                {selectedBusiness.lat.toFixed(5)}, {selectedBusiness.lon.toFixed(5)}
              </div>
            )}

            <div className="mt-3 max-h-48 overflow-y-auto border-t border-outline-variant/40 pt-2">
              {selectedBusiness.address && <DetailRow icon={MapPin} label="Address" value={selectedBusiness.address} />}
              {selectedBusiness.phone && <DetailRow icon={Phone} label="Phone" value={selectedBusiness.phone} />}
              {selectedBusiness.website && (
                <div className="flex items-start gap-2 py-1">
                  <Globe className="mt-0.5 h-3.5 w-3.5 shrink-0 text-on-surface-variant" />
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] uppercase tracking-wide text-on-surface-variant/60">Website</span>
                    <a href={selectedBusiness.website} target="_blank" rel="noopener noreferrer" className="block text-xs text-primary break-words hover:underline">
                      {selectedBusiness.website}
                    </a>
                  </div>
                </div>
              )}
              {selectedBusiness.email && <DetailRow icon={Mail} label="Email" value={selectedBusiness.email} />}
              {selectedBusiness.opening_hours && <DetailRow icon={Clock} label="Opening Hours" value={selectedBusiness.opening_hours} />}
              {selectedBusiness.description && <DetailRow icon={Info} label="Description" value={selectedBusiness.description} />}

              {/* Social links */}
              {selectedBusiness.social_links && selectedBusiness.social_links.length > 0 && (
                <div className="mt-2 border-t border-outline-variant/40 pt-2">
                  <span className="text-[10px] uppercase tracking-wide text-on-surface-variant/60">Social Media</span>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {selectedBusiness.social_links.map((link, i) => (
                      <a
                        key={i}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 rounded-lg border border-outline-variant px-2 py-1 text-xs text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface"
                      >
                        <SocialIcon url={link} />
                        <span className="truncate max-w-[120px]">{link.split('//')[1]?.split('/')[0] || link}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Extra data */}
              {selectedBusiness.extra && Object.keys(selectedBusiness.extra).length > 0 && (
                <div className="mt-2 border-t border-outline-variant/40 pt-2">
                  <span className="text-[10px] uppercase tracking-wide text-on-surface-variant/60">Additional Data</span>
                  <div className="mt-1 space-y-0.5">
                    {Object.entries(selectedBusiness.extra).slice(0, 10).map(([key, value]) => (
                      <div key={key} className="flex items-start gap-2 text-xs">
                        <span className="text-on-surface-variant/60">{key.replace(/_/g, ' ')}:</span>
                        <span className="text-on-surface-variant break-words">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick contact actions */}
            <div className="mt-3 flex gap-2">
              {selectedBusiness.phone && (
                <a
                  href={`tel:${selectedBusiness.phone}`}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary/10 px-3 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                >
                  <Phone className="h-3.5 w-3.5" /> Call
                </a>
              )}
              {selectedBusiness.email && (
                <a
                  href={`mailto:${selectedBusiness.email}`}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary/10 px-3 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                >
                  <Mail className="h-3.5 w-3.5" /> Email
                </a>
              )}
              {selectedBusiness.website && (
                <a
                  href={selectedBusiness.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary/10 px-3 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Visit
                </a>
              )}
            </div>

            <div className="mt-2 flex gap-2">
              <Button
                onClick={() => handleSaveLead(selectedBusiness)}
                disabled={savingId === `${selectedBusiness.name}-${selectedBusiness.lat}-${selectedBusiness.lon}`}
                className="flex-1"
                size="sm"
              >
                {savingId === `${selectedBusiness.name}-${selectedBusiness.lat}-${selectedBusiness.lon}` ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</>
                ) : (
                  <><Plus className="h-4 w-4" /> Save as Prospect</>
                )}
              </Button>
              <Button
                onClick={() => {
                  handleSaveLead(selectedBusiness);
                  setTimeout(() => {
                    window.location.href = '/dashboard/outreach';
                  }, 500);
                }}
                disabled={savingId === `${selectedBusiness.name}-${selectedBusiness.lat}-${selectedBusiness.lon}`}
                variant="outline"
                className="flex-1"
                size="sm"
              >
                <Sparkles className="h-4 w-4" /> Start Outreach
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notification toasts */}
      <div className="fixed right-4 top-4 z-[2000] flex flex-col gap-2">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium shadow-lg transition-all ${
              n.type === 'success'
                ? 'bg-green-600 text-white'
                : n.type === 'error'
                ? 'bg-red-600 text-white'
                : 'bg-surface-high text-on-surface'
            }`}
          >
            {n.type === 'success' && <Plus className="h-4 w-4" />}
            {n.type === 'error' && <X className="h-4 w-4" />}
            {n.type === 'info' && <Radar className="h-4 w-4" />}
            {n.message}
          </div>
        ))}
      </div>
    </div>
  );
}
