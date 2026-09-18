'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import { VISUAL_STYLES, type VisualMode } from './gods-eye-styles';

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

// ── Types ──────────────────────────────────────

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

interface GodsEyeGlobeProps {
  center: [number, number];
  markers: BusinessMarker[];
  prospects: ProspectMarker[];
  cctvMarkers: CCTVMarker[];
  showCCTV: boolean;
  scanCenter: [number, number] | null;
  scanRadius: number;
  flyTarget: [number, number] | null;
  flyZoom: number;
  visualMode?: VisualMode;
  onMapClick: (lat: number, lng: number) => void;
  onMarkerClick: (marker: BusinessMarker) => void;
  onProspectClick: (prospect: ProspectMarker) => void;
}

// ── Map Stack (adapted from GEV's MapStackController) ──

const ESRI_WORLD_IMAGERY_URL =
  'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer';
const ESRI_CREDIT = 'Powered by Esri — Source: Esri, Maxar, Earthstar Geographics';
const OSM_CREDIT = '© OpenStreetMap contributors';
const REEARTH_TERRAIN_URL = 'https://terrain.reearth.land/cesium-mesh/ellipsoid';

type MapStackId = 'esri-imagery' | 'osm' | 'dark';

const MAP_STACKS: { id: MapStackId; label: string }[] = [
  { id: 'esri-imagery', label: 'Esri Satellite' },
  { id: 'osm', label: 'OSM' },
  { id: 'dark', label: 'Dark' },
];

async function createImageryProvider(stackId: MapStackId): Promise<Cesium.ImageryProvider> {
  if (stackId === 'esri-imagery') {
    try {
      return await Cesium.ArcGisMapServerImageryProvider.fromUrl(ESRI_WORLD_IMAGERY_URL, {
        credit: ESRI_CREDIT,
        enablePickFeatures: false,
      });
    } catch {
      // Fallback to OSM if Esri is unreachable
      return new Cesium.OpenStreetMapImageryProvider({ url: 'https://tile.openstreetmap.org/', credit: OSM_CREDIT });
    }
  }
  if (stackId === 'osm') {
    return new Cesium.OpenStreetMapImageryProvider({ url: 'https://tile.openstreetmap.org/', credit: OSM_CREDIT });
  }
  // Dark theme (CARTO dark basemaps — matches ClientOS dark UI)
  return new Cesium.UrlTemplateImageryProvider({
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
    subdomains: 'abcd',
    maximumLevel: 19,
    credit: '© OpenStreetMap, © CARTO',
  });
}

async function createKeylessTerrain(): Promise<Cesium.TerrainProvider> {
  try {
    return await Cesium.CesiumTerrainProvider.fromUrl(REEARTH_TERRAIN_URL);
  } catch {
    return new Cesium.EllipsoidTerrainProvider();
  }
}

// ── Camera presets (adapted from GEV's camera.js) ──

function cinematicFlyTo(viewer: Cesium.Viewer, lat: number, lon: number, height: number) {
  // Start from high altitude looking straight down
  viewer.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(lon, lat, height * 50),
    orientation: {
      heading: Cesium.Math.toRadians(0),
      pitch: Cesium.Math.toRadians(-90),
      roll: 0,
    },
  });
  // Cinematic fly-in after a brief pause
  setTimeout(() => {
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(lon, lat, height),
      orientation: {
        heading: Cesium.Math.toRadians(15),
        pitch: Cesium.Math.toRadians(-35),
        roll: 0,
      },
      duration: 3.5,
      easingFunction: Cesium.EasingFunction.CUBIC_IN_OUT,
    });
  }, 400);
}

// ── Source colors for markers ──────────────────

const SOURCE_COLORS: Record<string, Cesium.Color> = {
  maps: Cesium.Color.fromBytes(59, 130, 246),
  web: Cesium.Color.fromBytes(139, 92, 246),
  social: Cesium.Color.fromBytes(236, 72, 153),
  local: Cesium.Color.fromBytes(245, 158, 11),
  deep: Cesium.Color.fromBytes(16, 185, 129),
  overpass: Cesium.Color.fromBytes(59, 130, 246),
  nominatim: Cesium.Color.fromBytes(99, 102, 241),
  bing: Cesium.Color.fromBytes(0, 174, 240),
  google: Cesium.Color.fromBytes(66, 133, 244),
  enriched: Cesium.Color.fromBytes(16, 185, 129),
};

// ── Component ──────────────────────────────────

export default function GodsEyeGlobe({
  center,
  markers,
  prospects,
  cctvMarkers,
  showCCTV,
  scanCenter,
  scanRadius,
  flyTarget,
  flyZoom,
  visualMode = 'normal',
  onMapClick,
  onMarkerClick,
  onProspectClick,
}: GodsEyeGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const [initError, setInitError] = useState<string | null>(null);
  const [activeStack, setActiveStack] = useState<MapStackId>('esri-imagery');
  const [showStackMenu, setShowStackMenu] = useState(false);
  const markerEntitiesRef = useRef<Cesium.Entity[]>([]);
  const prospectEntitiesRef = useRef<Cesium.Entity[]>([]);
  const cctvEntitiesRef = useRef<Cesium.Entity[]>([]);
  const scanEntityRef = useRef<Cesium.Entity | null>(null);
  const clickHandlerRef = useRef(onMapClick);
  const markerClickRef = useRef(onMarkerClick);
  const prospectClickRef = useRef(onProspectClick);
  const autoRotateRef = useRef<number | null>(null);
  const lastInteractionRef = useRef(Date.now());
  const imageryLayerRef = useRef<Cesium.ImageryLayer | null>(null);
  const styleStagesRef = useRef<Partial<Record<VisualMode, Cesium.PostProcessStage>>>({});
  const styleStartTimeRef = useRef<number>(performance.now());

  clickHandlerRef.current = onMapClick;
  markerClickRef.current = onMarkerClick;
  prospectClickRef.current = onProspectClick;

  // ── Initialize Cesium viewer (GEV-style) ────────
  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return;

    let viewer: Cesium.Viewer;
    try {
      // Absolute simplest init — no contextOptions, let Cesium use its defaults
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
      });
    } catch (err) {
      console.error('GodsEyeGlobe init failed:', err);
      setInitError(err instanceof Error ? err.message : String(err));
      return;
    }
    viewerRef.current = viewer;

    // ── GEV-style atmosphere ──
    try {
      if (viewer.scene.skyAtmosphere) {
        viewer.scene.skyAtmosphere.show = true;
        viewer.scene.skyAtmosphere.atmosphereLightIntensity = 18;
        viewer.scene.skyAtmosphere.saturationShift = -0.12;
        viewer.scene.skyAtmosphere.brightnessShift = -0.08;
      }

      viewer.scene.fog.enabled = true;
      viewer.scene.fog.density = 0.0002;
      viewer.scene.fog.minimumBrightness = 0.1;

      viewer.scene.globe.enableLighting = true;
      viewer.scene.globe.dynamicAtmosphereLighting = true;
      viewer.scene.globe.dynamicAtmosphereLightingFromSun = true;
      viewer.scene.globe.showGroundAtmosphere = true;
      viewer.scene.globe.atmosphereBrightnessShift = 0.1;
      viewer.scene.globe.atmosphereSaturationShift = 0.1;

      viewer.scene.highDynamicRange = true;
      viewer.scene.postProcessStages.fxaa.enabled = true;

      if (viewer.scene.postProcessStages.bloom) {
        viewer.scene.postProcessStages.bloom.enabled = true;
        viewer.scene.postProcessStages.bloom.uniforms.contrast = 119;
        viewer.scene.postProcessStages.bloom.uniforms.brightness = -0.4;
        viewer.scene.postProcessStages.bloom.uniforms.delta = 0.9;
        viewer.scene.postProcessStages.bloom.uniforms.sigma = 3.78;
        viewer.scene.postProcessStages.bloom.uniforms.stepSize = 5.0;
      }
    } catch {}

    // ── Load initial map stack (Esri satellite — keyless) ──
    (async () => {
      try {
        const provider = await createImageryProvider('esri-imagery');
        if (!viewerRef.current) return;
        // Remove the initial dark CARTO layer and replace with Esri satellite
        const layers = viewerRef.current.imageryLayers;
        layers.removeAll();
        const layer = new Cesium.ImageryLayer(provider);
        layers.add(layer, 0);
        imageryLayerRef.current = layer;

        // Keyless terrain (Re:Earth or flat ellipsoid fallback)
        const terrain = await createKeylessTerrain();
        if (viewerRef.current) viewerRef.current.terrainProvider = terrain;
      } catch (err) {
        console.warn('Map stack init failed, using dark globe:', err);
      }
    })();

    // ── God's Eye View: visual style post-process stages ──
    try {
      for (const [name, shader] of Object.entries(VISUAL_STYLES)) {
        const uniforms: Record<string, number> = { intensity: 0.0 };
        if (shader.fragmentShader.includes('uniform float time')) {
          uniforms.time = 0.0;
        }
        if (shader.uniforms) {
          for (const [uName, uMeta] of Object.entries(shader.uniforms)) {
            uniforms[uName] = uMeta.default;
          }
        }
        const stage = new Cesium.PostProcessStage({
          name: `godsEyeView_${name}`,
          fragmentShader: shader.fragmentShader,
          uniforms,
        });
        stage.enabled = false;
        viewer.scene.postProcessStages.add(stage);
        styleStagesRef.current[name as VisualMode] = stage;
      }
    } catch (err) {
      console.warn('Failed to init visual style stages:', err);
    }

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

    // ── Cinematic camera fly-to ──
    try {
      cinematicFlyTo(viewer, center[0], center[1], 800);
    } catch {}

    // ── Click handler — pick map position ──
    const clickHandler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    clickHandler.setInputAction((event: any) => {
      lastInteractionRef.current = Date.now();
      try {
        const ray = viewer.camera.getPickRay(event.position);
        if (ray) {
          const cart = viewer.scene.globe.pick(ray, viewer.scene);
          if (cart) {
            const c = Cesium.Cartographic.fromCartesian(cart);
            clickHandlerRef.current(
              Cesium.Math.toDegrees(c.latitude),
              Cesium.Math.toDegrees(c.longitude),
            );
          }
        }
      } catch {}
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    // ── Entity click handler ──
    clickHandler.setInputAction((event: any) => {
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
    viewer.camera.changed.addEventListener(() => { lastInteractionRef.current = Date.now(); });
    viewer.camera.moveStart.addEventListener(() => { lastInteractionRef.current = Date.now(); });

    // ── Auto-rotation + style time uniform updates ──
    const autoRotate = () => {
      const now = Date.now();
      const idleTime = now - lastInteractionRef.current;
      if (idleTime > 10000 && viewerRef.current) {
        viewerRef.current.camera.rotate(Cesium.Cartesian3.UNIT_Z, Cesium.Math.toRadians(-0.03));
      }
      // Drive `time` uniform for animated style stages
      const elapsed = (performance.now() - styleStartTimeRef.current) / 1000;
      for (const stage of Object.values(styleStagesRef.current)) {
        if (stage?.enabled && stage.uniforms.time !== undefined) {
          stage.uniforms.time = elapsed;
        }
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
        clickHandler.destroy();
        viewer.destroy();
      } catch {}
      styleStagesRef.current = {};
      viewerRef.current = null;
    };
  }, []);

  // ── Map stack switching ──
  const switchMapStack = useCallback(async (stackId: MapStackId) => {
    const viewer = viewerRef.current;
    if (!viewer) return;
    setShowStackMenu(false);

    try {
      const provider = await createImageryProvider(stackId);
      if (!viewerRef.current) return;
      // Replace all imagery layers with the new one
      viewerRef.current.imageryLayers.removeAll();
      const layer = new Cesium.ImageryLayer(provider);
      viewerRef.current.imageryLayers.add(layer, 0);
      imageryLayerRef.current = layer;
      setActiveStack(stackId);
    } catch (err) {
      console.warn('Failed to switch map stack:', err);
    }
  }, []);

  // ── Apply selected visual mode ──
  useEffect(() => {
    const stages = styleStagesRef.current;
    for (const [name, stage] of Object.entries(stages)) {
      if (!stage) continue;
      const active = name === visualMode;
      stage.uniforms.intensity = active ? 1.0 : 0.0;
      stage.enabled = active;
    }
  }, [visualMode]);

  // ── Update business markers ──
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    markerEntitiesRef.current.forEach((e) => viewer.entities.remove(e));
    markerEntitiesRef.current = [];

    markers.forEach((m) => {
      const color = SOURCE_COLORS[m.source || 'maps'] || Cesium.Color.fromBytes(99, 102, 241);
      const entity = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(m.lon, m.lat, 0),
        point: {
          pixelSize: 12,
          color,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
          scaleByDistance: new Cesium.NearFarScalar(1e5, 1.5, 2e7, 0.5),
          translucencyByDistance: new Cesium.NearFarScalar(1e5, 1.0, 2e7, 0.6),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: m.name,
          font: '12px Inter, sans-serif',
          fillColor: Cesium.Color.WHITE,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 3,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -14),
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 5e6),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      });
      (entity as any)._businessData = m;
      markerEntitiesRef.current.push(entity);
    });
  }, [markers]);

  // ── Update prospect markers ──
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    prospectEntitiesRef.current.forEach((e) => viewer.entities.remove(e));
    prospectEntitiesRef.current = [];

    prospects.forEach((p) => {
      const entity = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(p.lon, p.lat, 0),
        point: {
          pixelSize: 14,
          color: Cesium.Color.fromBytes(34, 197, 94),
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 3,
          scaleByDistance: new Cesium.NearFarScalar(1e5, 1.5, 2e7, 0.5),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: `${p.name}${p.score != null ? ` (${p.score})` : ''}`,
          font: 'bold 12px Inter, sans-serif',
          fillColor: Cesium.Color.fromBytes(34, 197, 94),
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 3,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -16),
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 5e6),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      });
      (entity as any)._prospectData = p;
      prospectEntitiesRef.current.push(entity);
    });
  }, [prospects]);

  // ── Update CCTV markers ──
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    cctvEntitiesRef.current.forEach((e) => viewer.entities.remove(e));
    cctvEntitiesRef.current = [];

    if (!showCCTV) return;

    cctvMarkers.forEach((c) => {
      const entity = viewer.entities.add({
        position: Cesium.Cartesian3.fromDegrees(c.lon, c.lat, 0),
        point: {
          pixelSize: 8,
          color: Cesium.Color.fromBytes(239, 68, 68),
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 1,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
        label: {
          text: `📹 ${c.name}`,
          font: '10px Inter, sans-serif',
          fillColor: Cesium.Color.fromBytes(239, 68, 68),
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -10),
          distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0, 2e6),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      });
      cctvEntitiesRef.current.push(entity);
    });
  }, [cctvMarkers, showCCTV]);

  // ── Scan radius circle ──
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    if (scanEntityRef.current) {
      viewer.entities.remove(scanEntityRef.current);
      scanEntityRef.current = null;
    }

    if (!scanCenter) return;

    scanEntityRef.current = viewer.entities.add({
      position: Cesium.Cartesian3.fromDegrees(scanCenter[1], scanCenter[0], 0),
      ellipse: {
        semiMajorAxis: scanRadius,
        semiMinorAxis: scanRadius,
        material: Cesium.Color.fromBytes(59, 130, 246, 20),
        outline: true,
        outlineColor: Cesium.Color.fromBytes(59, 130, 246, 180),
        outlineWidth: 2,
      },
      point: {
        pixelSize: 10,
        color: Cesium.Color.fromBytes(59, 130, 246, 255),
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    });
  }, [scanCenter, scanRadius]);

  // ── Fly to target ──
  useEffect(() => {
    if (!viewerRef.current || !flyTarget) return;
    const height = flyZoom > 15 ? 500 : flyZoom > 12 ? 2000 : flyZoom > 8 ? 10000 : 50000;
    viewerRef.current.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(flyTarget[1], flyTarget[0], height),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-45),
        roll: 0,
      },
      duration: 2.0,
      easingFunction: Cesium.EasingFunction.CUBIC_IN_OUT,
    });
  }, [flyTarget, flyZoom]);

  // ── Fit to results (exposed for parent button) ──
  useEffect(() => {
    (window as any).__cesiumFitToResults = () => {
      const viewer = viewerRef.current;
      if (!viewer || markers.length === 0) return;
      const positions = markers.map((m) => Cesium.Cartesian3.fromDegrees(m.lon, m.lat));
      try {
        const boundingSphere = Cesium.BoundingSphere.fromPoints(positions);
        viewer.camera.flyToBoundingSphere(boundingSphere, { duration: 1.5 });
      } catch {}
    };
    return () => { delete (window as any).__cesiumFitToResults; };
  }, [markers]);

  if (initError) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-[#0a0e1a] text-on-surface-variant">
        <div className="text-center">
          <p className="text-sm font-medium">Map failed to load</p>
          <p className="mt-1 text-xs">{initError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />

      {/* Map stack selector (bottom-left, GEV-style) */}
      <div className="absolute bottom-3 left-3 z-[500]">
        <button
          onClick={() => setShowStackMenu((v) => !v)}
          className="flex items-center gap-2 rounded-lg border border-outline-variant/30 bg-surface-container-low/80 px-3 py-1.5 text-xs font-medium text-on-surface-variant backdrop-blur-md transition-all hover:text-on-surface"
          title="Switch map imagery"
        >
          🗺️ {MAP_STACKS.find((s) => s.id === activeStack)?.label || 'Satellite'}
        </button>
        {showStackMenu && (
          <div className="absolute bottom-full left-0 mb-1 flex flex-col overflow-hidden rounded-lg border border-outline-variant/30 bg-surface-container-low/95 backdrop-blur-md">
            {MAP_STACKS.map((stack) => (
              <button
                key={stack.id}
                onClick={() => switchMapStack(stack.id)}
                className={`flex items-center gap-2 whitespace-nowrap px-3 py-1.5 text-left text-xs font-medium transition-colors ${
                  activeStack === stack.id
                    ? 'bg-sky-500/15 text-sky-400'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                }`}
              >
                {stack.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
