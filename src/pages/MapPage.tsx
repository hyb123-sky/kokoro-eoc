// ============================================
// KOKORO EOC - Full Screen Map Page
// ============================================
// フルスクリーンマップページ

import React, { useState, useCallback, useRef, useEffect } from 'react';
import Map, { Marker, Popup, NavigationControl, ScaleControl, GeolocateControl } from 'react-map-gl';
import {
  Layers,
  AlertTriangle,
  Building2,
  Activity,
  Users,
  Eye,
  EyeOff,
  Target,
  Filter,
  RefreshCw,
  ChevronRight,
} from 'lucide-react';
import { useDashboardData, useEarthquakes } from '../hooks/useQueries';
import clsx from 'clsx';
import 'mapbox-gl/dist/mapbox-gl.css';

// ============================================
// Types
// ============================================
interface MapMarker {
  id: string;
  type: 'incident' | 'shelter' | 'earthquake' | 'volunteer';
  latitude: number;
  longitude: number;
  title: string;
  subtitle?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  data?: any;
}

// ============================================
// Marker Icons
// ============================================
const MarkerIcon: React.FC<{ type: MapMarker['type']; severity?: MapMarker['severity'] }> = ({ type, severity }) => {
  const baseClass = 'w-8 h-8 rounded-full flex items-center justify-center shadow-lg';
  
  const config = {
    incident: {
      icon: AlertTriangle,
      colors: {
        critical: 'bg-status-critical text-white animate-pulse',
        high: 'bg-status-high text-white',
        medium: 'bg-status-medium text-kokoro-dark',
        low: 'bg-status-low text-kokoro-dark',
      },
    },
    shelter: {
      icon: Building2,
      colors: { default: 'bg-kokoro-info text-white' },
    },
    earthquake: {
      icon: Activity,
      colors: {
        critical: 'bg-status-critical text-white animate-pulse',
        high: 'bg-status-high text-white',
        medium: 'bg-status-medium text-kokoro-dark',
        low: 'bg-kokoro-success text-white',
      },
    },
    volunteer: {
      icon: Users,
      colors: { default: 'bg-kokoro-success text-white' },
    },
  };

  const { icon: Icon, colors } = config[type];
  const colorClass = (colors as any)[severity || 'default'] || Object.values(colors)[0];

  return (
    <div className={clsx(baseClass, colorClass)}>
      <Icon className="w-4 h-4" />
    </div>
  );
};

// ============================================
// Layer Toggle Component
// ============================================
interface LayerToggle {
  id: string;
  label: string;
  icon: React.ElementType;
  enabled: boolean;
  count: number;
}

const LayerControl: React.FC<{
  layers: LayerToggle[];
  onToggle: (id: string) => void;
}> = ({ layers, onToggle }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="absolute top-4 left-4 z-10 bg-kokoro-panel rounded-lg border border-kokoro-border shadow-lg">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium text-white hover:bg-kokoro-darker rounded-t-lg"
      >
        <Layers className="w-4 h-4 text-kokoro-accent" />
        <span>レイヤー</span>
        <ChevronRight className={clsx('w-4 h-4 ml-auto transition-transform', isOpen && 'rotate-90')} />
      </button>
      
      {isOpen && (
        <div className="p-2 border-t border-kokoro-border">
          {layers.map(layer => (
            <button
              key={layer.id}
              onClick={() => onToggle(layer.id)}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-kokoro-darker transition-colors"
            >
              <layer.icon className={clsx('w-4 h-4', layer.enabled ? 'text-kokoro-accent' : 'text-kokoro-muted')} />
              <span className={clsx('text-sm flex-1 text-left', layer.enabled ? 'text-white' : 'text-kokoro-muted')}>
                {layer.label}
              </span>
              <span className="text-xs text-kokoro-muted">{layer.count}</span>
              {layer.enabled ? (
                <Eye className="w-4 h-4 text-kokoro-success" />
              ) : (
                <EyeOff className="w-4 h-4 text-kokoro-muted" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================
// Main Map Page
// ============================================
const MapPage: React.FC = () => {
  const mapRef = useRef<any>(null);
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  
  const [layerVisibility, setLayerVisibility] = useState({
    incidents: true,
    shelters: true,
    earthquakes: true,
    volunteers: false,
  });

  const { silentWishes, locations, isLoading, refetch } = useDashboardData();
  const { data: earthquakes } = useEarthquakes({ timeRange: 'day', minMagnitude: '2.5' });

  // Transform data to markers
  const markers = React.useMemo<MapMarker[]>(() => {
    const result: MapMarker[] = [];

    // Silent Wishes (Incidents)
    if (layerVisibility.incidents) {
      (silentWishes || []).forEach(wish => {
        if (wish.latitude && wish.longitude) {
          const priority = parseInt(wish.priority || '20');
          let severity: MapMarker['severity'] = 'low';
          if (priority <= 10) severity = 'critical';
          else if (priority <= 20) severity = 'high';
          else if (priority <= 30) severity = 'medium';

          result.push({
            id: `incident-${wish.sys_id}`,
            type: 'incident',
            latitude: parseFloat(wish.latitude),
            longitude: parseFloat(wish.longitude),
            title: wish.wish_content?.substring(0, 30) || '緊急SOS',
            subtitle: wish.state || 'new',
            severity,
            data: wish,
          });
        }
      });
    }

    // Locations (Shelters)
    if (layerVisibility.shelters) {
      (locations || []).forEach(loc => {
        if (loc.latitude && loc.longitude) {
          result.push({
            id: `shelter-${loc.sys_id}`,
            type: 'shelter',
            latitude: parseFloat(loc.latitude),
            longitude: parseFloat(loc.longitude),
            title: loc.name || '避難所',
            subtitle: loc.x_1821654_kokoro_0_site_status,
            data: loc,
          });
        }
      });
    }

    // Earthquakes
    if (layerVisibility.earthquakes) {
      (earthquakes || []).forEach(eq => {
        const [lng, lat] = eq.geometry.coordinates;
        const mag = eq.properties.mag;
        let severity: MapMarker['severity'] = 'low';
        if (mag >= 6) severity = 'critical';
        else if (mag >= 5) severity = 'high';
        else if (mag >= 4) severity = 'medium';

        result.push({
          id: `eq-${eq.id}`,
          type: 'earthquake',
          latitude: lat,
          longitude: lng,
          title: `M${mag.toFixed(1)} ${eq.properties.place}`,
          subtitle: `深さ ${eq.geometry.coordinates[2].toFixed(0)}km`,
          severity,
          data: eq,
        });
      });
    }

    return result;
  }, [silentWishes, locations, earthquakes, layerVisibility]);

  // Layer controls
  const layers: LayerToggle[] = [
    { id: 'incidents', label: 'インシデント', icon: AlertTriangle, enabled: layerVisibility.incidents, count: silentWishes?.length || 0 },
    { id: 'shelters', label: '避難所', icon: Building2, enabled: layerVisibility.shelters, count: locations?.length || 0 },
    { id: 'earthquakes', label: '地震', icon: Activity, enabled: layerVisibility.earthquakes, count: earthquakes?.length || 0 },
    { id: 'volunteers', label: 'ボランティア', icon: Users, enabled: layerVisibility.volunteers, count: 0 },
  ];

  const handleLayerToggle = (id: string) => {
    setLayerVisibility(prev => ({ ...prev, [id]: !prev[id as keyof typeof prev] }));
  };

  const handleFlyTo = (lat: number, lng: number, zoom = 14) => {
    mapRef.current?.flyTo({
      center: [lng, lat],
      zoom,
      duration: 1500,
    });
  };

  const mapboxToken = (import.meta as any).env.VITE_MAPBOX_ACCESS_TOKEN;

  return (
    <div className="h-full relative">
      <Map
        ref={mapRef}
        mapboxAccessToken={mapboxToken}
        initialViewState={{
          latitude: 35.6762,
          longitude: 139.6503,
          zoom: 10,
        }}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/dark-v11"
      >
        {/* Controls */}
        <NavigationControl position="top-right" />
        <ScaleControl position="bottom-right" />
        <GeolocateControl position="top-right" />

        {/* Markers */}
        {markers.map(marker => (
          <Marker
            key={marker.id}
            latitude={marker.latitude}
            longitude={marker.longitude}
            anchor="center"
            onClick={e => {
              e.originalEvent.stopPropagation();
              setSelectedMarker(marker);
            }}
          >
            <MarkerIcon type={marker.type} severity={marker.severity} />
          </Marker>
        ))}

        {/* Popup */}
        {selectedMarker && (
          <Popup
            latitude={selectedMarker.latitude}
            longitude={selectedMarker.longitude}
            anchor="bottom"
            onClose={() => setSelectedMarker(null)}
            closeButton={true}
            closeOnClick={false}
            className="kokoro-popup"
          >
            <div className="p-2 min-w-[200px]">
              <h3 className="font-medium text-kokoro-dark text-sm mb-1">{selectedMarker.title}</h3>
              {selectedMarker.subtitle && (
                <p className="text-xs text-gray-600">{selectedMarker.subtitle}</p>
              )}
              {selectedMarker.type === 'incident' && (
                <button className="mt-2 w-full px-3 py-1.5 bg-kokoro-accent text-kokoro-dark text-xs rounded hover:bg-kokoro-accent/80">
                  詳細を表示
                </button>
              )}
            </div>
          </Popup>
        )}
      </Map>

      {/* Layer Control */}
      <LayerControl layers={layers} onToggle={handleLayerToggle} />

      {/* Action Buttons */}
      <div className="absolute bottom-4 left-4 flex items-center gap-2">
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 bg-kokoro-panel border border-kokoro-border rounded-lg text-white hover:bg-kokoro-darker"
        >
          <RefreshCw className={clsx('w-4 h-4', isLoading && 'animate-spin')} />
          更新
        </button>
        <button
          onClick={() => handleFlyTo(35.6762, 139.6503, 10)}
          className="flex items-center gap-2 px-4 py-2 bg-kokoro-panel border border-kokoro-border rounded-lg text-white hover:bg-kokoro-darker"
        >
          <Target className="w-4 h-4" />
          東京に移動
        </button>
      </div>

      {/* Stats Overlay */}
      <div className="absolute bottom-4 right-4 bg-kokoro-panel/90 backdrop-blur-sm border border-kokoro-border rounded-lg p-3">
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-status-critical" />
            <span className="text-white">{silentWishes?.length || 0}</span>
          </div>
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-kokoro-info" />
            <span className="text-white">{locations?.length || 0}</span>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-kokoro-warning" />
            <span className="text-white">{earthquakes?.length || 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapPage;
