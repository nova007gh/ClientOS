'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';

const LeafletMap = dynamic(() => import('./leaflet-map'), { ssr: false });

// Point Cesium at the static assets copied into /public/cesium
if (typeof window !== 'undefined') {
  (window as any).CESIUM_BASE_URL = '/cesium/';
}

// Force Cesium canvas to fill its container
const cesiumStyle = document.createElement('style');
cesiumStyle.textContent = `
  .cesium-container { width: 100% !important; height: 100% !important; }
  .cesium-viewer { width: 100% !important; height: 100% !important; }
  .cesium-widget { width: 100% !important; height: 100% !important; }
  .cesium-widget canvas { width: 100% !important; height: 100% !important; }
  .cesium-viewer-bottom { display: none !important; }
`;
if (typeof document !== 'undefined' && !document.getElementById('cesium-fill-style')) {
  cesiumStyle.id = 'cesium-fill-style';
  document.head.appendChild(cesiumStyle);
}

export interface BusinessMarker {
  id: string;
  name: string;
  lat: number;
  lon: number;
  category?: string | null;
  source?: string | null;
  phone?: string | null;
  website?: string | null;
  email?: string | null;
  address?: string | null;
  description?: string | null;
}

export interface ProspectMarker {
  id: string;
  name: string;
  lat: number;
  lon: number;
  score?: number | null;
  status?: string | null;
}

export interface CCTVMarker {
  id: string;
  name: string;
  lat: number;
  lon: number;
  operator?: string | null;
}

interface CesiumGlobeProps {
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

const SOURCE_COLORS: Record<string, Cesium.Color> = {
  maps: Cesium.Color.fromBytes(59, 130, 246),
  web: Cesium.Color.fromBytes(139, 92, 246),
  social: Cesium.Color.fromBytes(236, 72, 153),
  local: Cesium.Color.fromBytes(245, 158, 11),
  deep: Cesium.Color.fromBytes(16, 185, 129),
  overpass: Cesium.Color.fromBytes(59, 130, 246),
  nominatim: Cesium.Color.fromBytes(99, 102, 241),
};

export default function CesiumGlobe({
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
}: CesiumGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const markerEntitiesRef = useRef<Cesium.Entity[]>([]);
  const prospectEntitiesRef = useRef<Cesium.Entity[]>([]);
  const cctvEntitiesRef = useRef<Cesium.Entity[]>([]);
  const scanEntityRef = useRef<Cesium.Entity | null>(null);
  const clickHandlerRef = useRef(onMapClick);
  const markerClickRef = useRef(onMarkerClick);
  const prospectClickRef = useRef(onProspectClick);
  const autoRotateRef = useRef<number | null>(null);
  const lastInteractionRef = useRef(Date.now());

  clickHandlerRef.current = onMapClick;
  markerClickRef.current = onMarkerClick;
  prospectClickRef.current = onProspectClick;

  // ── Initialize Cesium viewer ──────────────────
  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return;

    const cesiumToken = process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN || '';

    if (cesiumToken) {
      Cesium.Ion.defaultAccessToken = cesiumToken;
    }

    let viewer: Cesium.Viewer;
    try {
      // Pre-check: can this browser create a WebGL context at all?
      const testCanvas = document.createElement('canvas');
      const testGl = testCanvas.getContext('webgl2')
        || testCanvas.getContext('webgl')
        || (testCanvas.getContext('experimental-webgl') as WebGLRenderingContext | null);
      if (!testGl) {
        console.warn('WebGL unavailable — falling back to 2D map');
        setInitError('webgl-unavailable');
        return;
      }
      const loseExt = testGl.getExtension('WEBGL_lose_context');
      loseExt?.loseContext();

      // Provide non-Ion imagery and terrain directly in constructor to prevent
      // Cesium from attempting Ion API calls that fail without a token
      const darkImagery = new Cesium.UrlTemplateImageryProvider({
        url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        subdomains: 'abcd',
        maximumLevel: 19,
        credit: '© OpenStreetMap, © CARTO',
      });

      viewer = new Cesium.Viewer(containerRef.current, {
        timeline: false,
        animation: false,
        baseLayerPicker: false,
        geocoder: false,
        homeButton: false,
        sceneModePicker: false,
        navigationHelpButton: false,
        fullscreenButton: false,
        vrButton: false,
        selectionIndicator: false,
        infoBox: false,
        baseLayer: new Cesium.ImageryLayer(darkImagery),
        terrainProvider: new Cesium.EllipsoidTerrainProvider(),
        showRenderLoopErrors: false,
        contextOptions: {
          webgl: {
            alpha: false,
            depth: true,
            stencil: false,
            antialias: false,
            premultipliedAlpha: true,
            preserveDrawingBuffer: false,
            failIfMajorPerformanceCaveat: false,
          },
          requestWebgl1: true,
          allowTextureFilterAnisotropic: false,
        },
      });
    } catch (err) {
      console.error('Cesium Viewer init failed:', err);
      setInitError(err instanceof Error ? err.message : String(err));
      return;
    }
    viewerRef.current = viewer;

    // ── God's Eye View: atmospheric effects ──
    try {
      // Enable sky atmosphere for realistic look
      viewer.scene.skyAtmosphere = new Cesium.SkyAtmosphere();
      viewer.scene.skyAtmosphere.show = true;

      // Enable fog for depth perception
      viewer.scene.fog.enabled = true;
      viewer.scene.fog.density = 0.0002;
      viewer.scene.fog.minimumBrightness = 0.1;

      // Enable lighting based on sun position
      viewer.scene.globe.enableLighting = true;
      viewer.scene.globe.dynamicAtmosphereLighting = true;
      viewer.scene.globe.dynamicAtmosphereLightingFromSun = true;

      // Enhance globe appearance
      viewer.scene.globe.baseColor = Cesium.Color.fromCssColorString('#0a0e1a');
      viewer.scene.globe.showGroundAtmosphere = true;
      viewer.scene.globe.atmosphereBrightnessShift = 0.1;
      viewer.scene.globe.atmosphereSaturationShift = 0.1;
      viewer.scene.globe.atmosphereHueShift = 0.0;

      // Enable HDR for better contrast
      viewer.scene.highDynamicRange = true;
      viewer.scene.postProcessStages.fxaa.enabled = true;

      // Add subtle bloom for glowing markers
      if (viewer.scene.postProcessStages.bloom) {
        viewer.scene.postProcessStages.bloom.enabled = true;
        viewer.scene.postProcessStages.bloom.uniforms.contrast = 119;
        viewer.scene.postProcessStages.bloom.uniforms.brightness = -0.4;
        viewer.scene.postProcessStages.bloom.uniforms.delta = 0.9;
        viewer.scene.postProcessStages.bloom.uniforms.sigma = 3.78;
        viewer.scene.postProcessStages.bloom.uniforms.stepSize = 5.0;
      }
    } catch {}

    // Hide credit display
    try {
      const creditContainer = (viewer as any).creditDisplay?.container;
      if (creditContainer) creditContainer.style.display = 'none';
    } catch {}

    // Handle scene render errors silently
    try {
      viewer.scene.renderError.addEventListener((err: any) => {
        console.warn('Cesium render error (non-fatal):', err);
      });
    } catch {}

    // Terrain: only if we have a real Ion token
    if (cesiumToken) {
      Cesium.createWorldTerrainAsync()
        .then((tp) => { if (viewerRef.current) viewerRef.current.terrainProvider = tp; })
        .catch(() => {});
    }

    // Google 3D Tiles not available in Cesium 1.144 — use standard imagery
    // If upgraded to Cesium 1.145+, GoogleMaps API can be used with a Google API key

    // Initial camera position — start with a global view
    try {
      viewer.camera.setView({
        destination: Cesium.Cartesian3.fromDegrees(center[1], center[0], 20000000),
        orientation: {
          heading: Cesium.Math.toRadians(0),
          pitch: Cesium.Math.toRadians(-90),
          roll: 0,
        },
      });
      // Then fly to the target location
      setTimeout(() => {
        if (viewerRef.current) {
          viewerRef.current.camera.flyTo({
            destination: Cesium.Cartesian3.fromDegrees(center[1], center[0], 500000),
            orientation: {
              heading: Cesium.Math.toRadians(0),
              pitch: Cesium.Math.toRadians(-45),
              roll: 0,
            },
            duration: 3,
            easingFunction: Cesium.EasingFunction.CUBIC_IN_OUT,
          });
        }
      }, 500);
    } catch {}

    // Click handler — pick map position
    const screenSpaceEventHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    screenSpaceEventHandler.setInputAction((event: any) => {
      lastInteractionRef.current = Date.now();
      try {
        const ray = viewer.camera.getPickRay(event.position);
        if (ray) {
          const cart = viewer.scene.globe.pick(ray, viewer.scene);
          if (cart) {
            const c = Cesium.Cartographic.fromCartesian(cart);
            clickHandlerRef.current(
              Cesium.Math.toDegrees(c.latitude),
              Cesium.Math.toDegrees(c.longitude)
            );
          }
        }
      } catch {}
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    // Entity click handler
    screenSpaceEventHandler.setInputAction((event: any) => {
      lastInteractionRef.current = Date.now();
      try {
        const picked = viewer.scene.pick(event.position);
        const pickedEntity = picked?.id;
        if (pickedEntity && (pickedEntity as any)._businessData) {
          markerClickRef.current((pickedEntity as any)._businessData);
        } else if (pickedEntity && (pickedEntity as any)._prospectData) {
          prospectClickRef.current((pickedEntity as any)._prospectData);
        }
      } catch {}
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    // Track camera interactions to pause auto-rotation
    viewer.camera.changed.addEventListener(() => {
      lastInteractionRef.current = Date.now();
    });
    viewer.camera.moveStart.addEventListener(() => {
      lastInteractionRef.current = Date.now();
    });

    // Auto-rotation: slowly rotate the globe when idle for 10+ seconds
    const autoRotate = () => {
      const now = Date.now();
      const idleTime = now - lastInteractionRef.current;
      if (idleTime > 10000 && viewerRef.current) {
        // Rotate slowly — 0.05 degrees per frame
        viewerRef.current.camera.rotate(Cesium.Cartesian3.UNIT_Z, Cesium.Math.toRadians(-0.05));
      }
      autoRotateRef.current = requestAnimationFrame(autoRotate);
    };
    autoRotateRef.current = requestAnimationFrame(autoRotate);

    // Cleanup
    return () => {
      try {
        if (autoRotateRef.current) {
          cancelAnimationFrame(autoRotateRef.current);
          autoRotateRef.current = null;
        }
        screenSpaceEventHandler.destroy();
        viewer.destroy();
      } catch {}
      viewerRef.current = null;
    };
  }, []);

  // ── Update business markers ───────────────────
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    // Remove old markers
    markerEntitiesRef.current.forEach((e) => viewer.entities.remove(e));
    markerEntitiesRef.current = [];

    // Add new markers
    markers.forEach((m) => {
      const color = SOURCE_COLORS[m.source || 'maps'] || Cesium.Color.fromBytes(99, 102, 241);
      const entity = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(m.lon, m.lat, 0),
        point: {
          pixelSize: 14,
          color: color,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: m.name.length > 25 ? m.name.substring(0, 25) + '...' : m.name,
          font: '12px sans-serif',
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(0, -20),
          showBackground: true,
          backgroundColor: new Cesium.Color(0.1, 0.1, 0.15, 0.8),
          backgroundPadding: new Cesium.Cartesian2(8, 4),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          scaleByDistance: new Cesium.NearFarScalar(1e3, 1.0, 5e5, 0.5),
          translucencyByDistance: new Cesium.NearFarScalar(1e3, 1.0, 1e6, 0.0),
        },
      });
      (entity as any)._businessData = m;
      markerEntitiesRef.current.push(entity);
    });
  }, [markers]);

  // ── Update prospect markers ───────────────────
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    // Remove old prospect markers
    prospectEntitiesRef.current.forEach((e) => viewer.entities.remove(e));
    prospectEntitiesRef.current = [];

    // Add new prospect markers
    prospects.forEach((p) => {
      const score = p.score ?? 0;
      const color = score >= 80
        ? Cesium.Color.fromBytes(22, 163, 74)
        : score >= 60
        ? Cesium.Color.fromBytes(234, 179, 8)
        : score >= 40
        ? Cesium.Color.fromBytes(249, 115, 22)
        : Cesium.Color.fromBytes(148, 163, 184);

      const entity = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(p.lon, p.lat, 0),
        point: {
          pixelSize: 16,
          color: color,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: p.name.length > 20 ? p.name.substring(0, 20) + '...' : p.name,
          font: '11px sans-serif',
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(0, -22),
          showBackground: true,
          backgroundColor: new Cesium.Color(0.1, 0.1, 0.15, 0.7),
          backgroundPadding: new Cesium.Cartesian2(6, 3),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          scaleByDistance: new Cesium.NearFarScalar(1e3, 1.0, 5e5, 0.4),
          translucencyByDistance: new Cesium.NearFarScalar(1e3, 1.0, 8e5, 0.0),
        },
      });
      (entity as any)._prospectData = p;
      prospectEntitiesRef.current.push(entity);
    });
  }, [prospects]);

  // ── Update CCTV markers ───────────────────────
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    // Remove old CCTV markers
    cctvEntitiesRef.current.forEach((e) => viewer.entities.remove(e));
    cctvEntitiesRef.current = [];

    if (!showCCTV) return;

    // Add CCTV markers
    cctvMarkers.forEach((c) => {
      const entity = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(c.lon, c.lat, 0),
        point: {
          pixelSize: 10,
          color: Cesium.Color.fromBytes(239, 68, 68),
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 1,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: '📷',
          font: '14px sans-serif',
          pixelOffset: new Cesium.Cartesian2(0, -12),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          scaleByDistance: new Cesium.NearFarScalar(1e3, 1.0, 2e5, 0.0),
        },
      });
      cctvEntitiesRef.current.push(entity);
    });
  }, [cctvMarkers, showCCTV]);

  // ── Update scan circle ────────────────────────
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    // Remove old scan entity
    if (scanEntityRef.current) {
      viewer.entities.remove(scanEntityRef.current);
      scanEntityRef.current = null;
    }

    if (scanCenter) {
      scanEntityRef.current = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(scanCenter[1], scanCenter[0], 0),
        ellipse: {
          semiMajorAxis: scanRadius,
          semiMinorAxis: scanRadius,
          material: new Cesium.Color(0.68, 0.78, 1.0, 0.08),
          outline: true,
          outlineColor: new Cesium.Color(0.68, 0.78, 1.0, 0.6),
          outlineWidth: 2,
        },
      });
    }
  }, [scanCenter, scanRadius]);

  // ── Fly to target ─────────────────────────────
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || !flyTarget) return;

    // Convert zoom level to height (approximate)
    const heightMap: Record<number, number> = {
      8: 500000, 10: 200000, 12: 50000, 14: 10000, 15: 5000, 16: 2000, 18: 500,
    };
    const height = heightMap[flyZoom] || 50000;

    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(flyTarget[1], flyTarget[0], height),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-45),
        roll: 0,
      },
      duration: 1.5,
      easingFunction: Cesium.EasingFunction.CUBIC_IN_OUT,
    });
  }, [flyTarget, flyZoom]);

  // ── Fit to results ────────────────────────────
  const fitToResults = useCallback(() => {
    const viewer = viewerRef.current;
    if (!viewer || markers.length === 0) return;

    // Calculate bounding box of all markers
    let minLat = Infinity, maxLat = -Infinity, minLon = Infinity, maxLon = -Infinity;
    markers.forEach((m) => {
      minLat = Math.min(minLat, m.lat);
      maxLat = Math.max(maxLat, m.lat);
      minLon = Math.min(minLon, m.lon);
      maxLon = Math.max(maxLon, m.lon);
    });

    // Add padding
    const latPad = (maxLat - minLat) * 0.1 || 0.01;
    const lonPad = (maxLon - minLon) * 0.1 || 0.01;
    minLat -= latPad;
    maxLat += latPad;
    minLon -= lonPad;
    maxLon += lonPad;

    // Calculate center and height
    const centerLat = (minLat + maxLat) / 2;
    const centerLon = (minLon + maxLon) / 2;
    const latRange = maxLat - minLat;
    const lonRange = maxLon - minLon;
    const maxRange = Math.max(latRange, lonRange);

    // Convert range to height (approximate)
    const height = Math.max(maxRange * 111000 * 1.5, 5000); // 111km per degree, min 5km

    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(centerLon, centerLat, height),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-45),
        roll: 0,
      },
      duration: 2,
      easingFunction: Cesium.EasingFunction.CUBIC_IN_OUT,
    });
  }, [markers]);

  // Expose fitToResults via ref
  useEffect(() => {
    (window as any).__cesiumFitToResults = fitToResults;
    return () => { delete (window as any).__cesiumFitToResults; };
  }, [fitToResults]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full cesium-container"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        background: 'radial-gradient(ellipse at center, #0a0e1a 0%, #050810 100%)',
      }}
    >
      {initError && initError !== 'webgl-unavailable' && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          zIndex: 1000, background: 'rgba(20,20,30,0.9)', border: '1px solid #f44',
          borderRadius: 8, padding: '16px 20px', color: '#faa', fontSize: 12,
          maxWidth: '80%', fontFamily: 'monospace', whiteSpace: 'pre-wrap',
        }}>
          Globe failed to initialize:
          {initError}
        </div>
      )}
      {initError === 'webgl-unavailable' && (
        <LeafletMap
          center={center}
          markers={markers}
          prospects={prospects}
          cctvMarkers={cctvMarkers}
          showCCTV={showCCTV}
          scanCenter={scanCenter}
          scanRadius={scanRadius}
          flyTarget={flyTarget}
          flyZoom={flyZoom}
          onMapClick={onMapClick}
          onMarkerClick={onMarkerClick}
          onProspectClick={onProspectClick}
        />
      )}
    </div>
  );
}
