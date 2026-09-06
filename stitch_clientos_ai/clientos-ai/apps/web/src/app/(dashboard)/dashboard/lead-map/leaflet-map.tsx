'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { BusinessMarker, ProspectMarker, CCTVMarker } from './cesium-globe';

interface LeafletMapProps {
  center: [number, number];
  markers: BusinessMarker[];
  prospects: ProspectMarker[];
  cctvMarkers: CCTVMarker[];
  showCCTV: boolean;
  scanCenter: [number, number] | null;
  scanRadius: number;
  flyTarget: [number, number] | null;
  flyZoom: number;
  onMapClick: (lat: number, lng: number) => void;
  onMarkerClick: (marker: BusinessMarker) => void;
  onProspectClick: (prospect: ProspectMarker) => void;
}

const SOURCE_COLORS: Record<string, string> = {
  maps: '#3b82f6',
  web: '#8b5cf6',
  social: '#ec4899',
  local: '#f59e0b',
  deep: '#10b981',
  overpass: '#3b82f6',
  overpass_area: '#3b82f6',
  nominatim: '#6366f1',
};

function markerColor(source?: string | null): string {
  if (!source) return '#3b82f6';
  const key = Object.keys(SOURCE_COLORS).find((k) => source.includes(k));
  return key ? SOURCE_COLORS[key] : '#3b82f6';
}

export default function LeafletMap({
  center,
  markers,
  prospects,
  cctvMarkers,
  showCCTV,
  scanCenter,
  scanRadius,
  flyTarget,
  flyZoom,
  onMapClick,
  onMarkerClick,
  onProspectClick,
}: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerLayerRef = useRef<L.LayerGroup | null>(null);
  const prospectLayerRef = useRef<L.LayerGroup | null>(null);
  const cctvLayerRef = useRef<L.LayerGroup | null>(null);
  const scanLayerRef = useRef<L.LayerGroup | null>(null);

  const clickRef = useRef(onMapClick);
  const markerClickRef = useRef(onMarkerClick);
  const prospectClickRef = useRef(onProspectClick);
  clickRef.current = onMapClick;
  markerClickRef.current = onMarkerClick;
  prospectClickRef.current = onProspectClick;

  // ── Init map ──────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [center[0], center[1]],
      zoom: 3,
      zoomControl: true,
      attributionControl: false,
      worldCopyJump: true,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    map.on('click', (e: L.LeafletMouseEvent) => {
      clickRef.current(e.latlng.lat, e.latlng.lng);
    });

    markerLayerRef.current = L.layerGroup().addTo(map);
    prospectLayerRef.current = L.layerGroup().addTo(map);
    cctvLayerRef.current = L.layerGroup().addTo(map);
    scanLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Business markers ──────────────────────────
  useEffect(() => {
    const layer = markerLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    for (const m of markers) {
      const cm = L.circleMarker([m.lat, m.lon], {
        radius: 7,
        fillColor: markerColor(m.source),
        color: '#fff',
        weight: 1.5,
        fillOpacity: 0.9,
      });
      cm.bindTooltip(m.name, { direction: 'top', offset: [0, -8] });
      cm.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        markerClickRef.current(m);
      });
      cm.addTo(layer);
    }
  }, [markers]);

  // ── Prospect markers ──────────────────────────
  useEffect(() => {
    const layer = prospectLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    for (const p of prospects) {
      const cm = L.circleMarker([p.lat, p.lon], {
        radius: 8,
        fillColor: '#22c55e',
        color: '#fff',
        weight: 2,
        fillOpacity: 0.95,
      });
      cm.bindTooltip(`${p.name}${p.score != null ? ` (${p.score})` : ''}`, {
        direction: 'top',
        offset: [0, -8],
      });
      cm.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        prospectClickRef.current(p);
      });
      cm.addTo(layer);
    }
  }, [prospects]);

  // ── CCTV markers ──────────────────────────────
  useEffect(() => {
    const layer = cctvLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    if (!showCCTV) return;
    for (const c of cctvMarkers) {
      const cm = L.circleMarker([c.lat, c.lon], {
        radius: 4,
        fillColor: '#ef4444',
        color: '#fff',
        weight: 1,
        fillOpacity: 0.8,
      });
      cm.bindTooltip(`📹 ${c.name}`, { direction: 'top', offset: [0, -4] });
      cm.addTo(layer);
    }
  }, [cctvMarkers, showCCTV]);

  // ── Scan radius circle ────────────────────────
  useEffect(() => {
    const layer = scanLayerRef.current;
    if (!layer) return;
    layer.clearLayers();
    if (!scanCenter) return;
    L.circle([scanCenter[0], scanCenter[1]], {
      radius: scanRadius,
      color: '#3b82f6',
      weight: 2,
      dashArray: '6 4',
      fillColor: '#3b82f6',
      fillOpacity: 0.08,
    }).addTo(layer);
    L.circleMarker([scanCenter[0], scanCenter[1]], {
      radius: 5,
      fillColor: '#3b82f6',
      color: '#fff',
      weight: 2,
      fillOpacity: 1,
    }).addTo(layer);
  }, [scanCenter, scanRadius]);

  // ── Fly to target ─────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !flyTarget) return;
    mapRef.current.flyTo([flyTarget[0], flyTarget[1]], flyZoom || 12, { duration: 1.5 });
  }, [flyTarget, flyZoom]);

  // ── Fit to results (exposed for parent button) ─
  useEffect(() => {
    (window as any).__cesiumFitToResults = () => {
      const map = mapRef.current;
      if (!map || markers.length === 0) return;
      const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lon] as [number, number]));
      map.flyToBounds(bounds, { padding: [50, 50], duration: 1.5 });
    };
    return () => {
      delete (window as any).__cesiumFitToResults;
    };
  }, [markers]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        background: '#0a0e1a',
      }}
    />
  );
}
