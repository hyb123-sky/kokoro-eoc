// ============================================
// KOKORO EOC - Map Panel Component
// ============================================

import React, { useRef, useCallback } from 'react';
import Map, { Marker, NavigationControl, ScaleControl } from 'react-map-gl';
import {
  Layers,
  AlertTriangle,
  Building2,
  Activity,
  Maximize2,
  RefreshCw,
} from 'lucide-react';
import { useDashboardData, useEarthquakes } from '../../hooks/useQueries';
import { useMapStore, useAppStore } from '../../stores';
import clsx from 'clsx';
import 'mapbox-gl/dist/mapbox-gl.css';

// ============================================
// Marker Component
// ============================================
interface MapMarkerProps {
  type: 'incident' | 'shelter' | 'earthquake';
  priority?: string;
  magnitude?: number;
  onClick?: () => void;
}

const MapMarkerIcon: React.FC<MapMarkerProps> = ({ type, priority, magnitude, onClick }) => {
  const getIncidentColor = () => {
    const p = parseInt(priority || '20');
    if (p <= 10) return 'bg-status-critical animate-pulse';
    if (p <= 20) return 'bg-status-high';
    if (p <= 30) return 'bg-status-medium';
    return 'bg-status-low';
  };

  const getEarthquakeColor = () => {
    if (!magnitude) return 'bg-kokoro-success';
    if (magnitude >= 6) return 'bg-status-critical animate-pulse';
    if (magnitude >= 5) return 'bg-status-high';
    if (magnitude >= 4) return 'bg-status-medium';
    return 'bg-kokoro-info';
  };

  const config = {
    incident: {
      icon: AlertTriangle,
      color: getIncidentColor(),
    },
    shelter: {
      icon: Building2,
      color: 'bg-kokoro-info',
    },
    earthquake: {
      icon: Activity,
      color: getEarthquakeColor(),
    },
  };

  const { icon: Icon, color } = config[type];

  return (
    <button
      onClick={onClick}
      className={clsx(
        'w-8 h-8 rounded-full flex items-center justify-center shadow-lg cursor-pointer',
        color
      )}
    >
      <Icon className="w-4 h-4 text-white" />
    </button>
  );
};

// ============================================
// Layer Toggle (Removed unused 'id' destructuring)
// ============================================
const LayerToggle: React.FC<{
  id: string;
  label: string;
  icon: React.ElementType;
  enabled: boolean;
  count: number;
  onToggle: () => void;
}> = ({ label, icon: Icon, enabled, count, onToggle }) => (
  <button
    onClick={onToggle}
    className={clsx(
      'flex items-center gap-2 px-2 py-1 rounded text-xs transition-colors',
      enabled ? 'bg-kokoro-accent/20 text-kokoro-accent' : 'text-kokoro-muted hover:text-white'
    )}
  >
    <Icon className="w-3 h-3" />
    <span>{label}</span>
    <span className="text-[10px] opacity-70">({count})</span>
  </button>
);

// ============================================
// Main Map Panel
// ============================================
const MapPanel: React.FC = () => {
  const mapRef = useRef<any>(null);
  const { viewport, setViewport, layers, toggleLayer, selectMarker } = useMapStore();
  const { selectIncident } = useAppStore();
  const { silentWishes, locations, isLoading, refetch } = useDashboardData();
  const { data: earthquakes } = useEarthquakes({ timeRange: 'day', minMagnitude: '2.5' });

  const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

  const handleViewportChange = useCallback((evt: { viewState: typeof viewport }) => {
    setViewport(evt.viewState);
  }, [setViewport]);

  const handleIncidentClick = (id: string) => {
    selectMarker(id);
    selectIncident(id);
  };

  // Count markers
  const incidentCount = silentWishes?.filter(w => w.latitude && w.longitude).length || 0;
  const shelterCount = locations?.filter(l => l.latitude && l.longitude).length || 0;
  const earthquakeCount = earthquakes?.length || 0;

  return (
    <div className="panel h-full flex flex-col overflow-hidden">
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-kokoro-accent" />
          <span className="panel-title">マップ</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="btn-icon text-kokoro-muted hover:text-kokoro-accent p-1"
            disabled={isLoading}
          >
            <RefreshCw className={clsx('w-4 h-4', isLoading && 'animate-spin')} />
          </button>
          <button className="btn-icon text-kokoro-muted hover:text-kokoro-accent p-1">
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Layer Toggles */}
      <div className="px-3 py-2 border-b border-kokoro-border flex items-center gap-2 flex-wrap">
        <LayerToggle
          id="incidents"
          label="インシデント"
          icon={AlertTriangle}
          enabled={layers.incidents}
          count={incidentCount}
          onToggle={() => toggleLayer('incidents')}
        />
        <LayerToggle
          id="shelters"
          label="避難所"
          icon={Building2}
          enabled={layers.shelters}
          count={shelterCount}
          onToggle={() => toggleLayer('shelters')}
        />
        <LayerToggle
          id="earthquakes"
          label="地震"
          icon={Activity}
          enabled={layers.earthquakes}
          count={earthquakeCount}
          onToggle={() => toggleLayer('earthquakes')}
        />
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <Map
          ref={mapRef}
          mapboxAccessToken={mapboxToken}
          initialViewState={viewport}
          onMove={handleViewportChange}
          style={{ width: '100%', height: '100%' }}
          mapStyle="mapbox://styles/mapbox/dark-v11"
        >
          <NavigationControl position="top-right" />
          <ScaleControl position="bottom-right" />

          {/* Incident Markers */}
          {layers.incidents &&
            silentWishes?.map(wish => {
              if (!wish.latitude || !wish.longitude) return null;
              return (
                <Marker
                  key={`incident-${wish.sys_id}`}
                  latitude={parseFloat(wish.latitude)}
                  longitude={parseFloat(wish.longitude)}
                  anchor="center"
                >
                  <MapMarkerIcon
                    type="incident"
                    priority={wish.priority}
                    onClick={() => handleIncidentClick(wish.sys_id)}
                  />
                </Marker>
              );
            })}

          {/* Shelter Markers */}
          {layers.shelters &&
            locations?.map(loc => {
              if (!loc.latitude || !loc.longitude) return null;
              return (
                <Marker
                  key={`shelter-${loc.sys_id}`}
                  latitude={parseFloat(loc.latitude)}
                  longitude={parseFloat(loc.longitude)}
                  anchor="center"
                >
                  <MapMarkerIcon type="shelter" />
                </Marker>
              );
            })}

          {/* Earthquake Markers */}
          {layers.earthquakes &&
            earthquakes?.map(eq => {
              const [lng, lat] = eq.geometry.coordinates;
              return (
                <Marker
                  key={`eq-${eq.id}`}
                  latitude={lat}
                  longitude={lng}
                  anchor="center"
                >
                  <MapMarkerIcon
                    type="earthquake"
                    magnitude={eq.properties.mag}
                    onClick={() => window.open(eq.properties.url, '_blank')}
                  />
                </Marker>
              );
            })}
        </Map>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-kokoro-dark/50 flex items-center justify-center">
            <RefreshCw className="w-8 h-8 text-kokoro-accent animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
};

export default MapPanel;