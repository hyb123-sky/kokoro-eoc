// ============================================
// KOKORO EOC - Map Panel Component (FIXED)
// ============================================
// 修正点:
// 1. Priority 映射修复: 与 IncidentPanel 保持一致
// 2. 地图标记颜色正确反映优先级
// 3. 无GPS的工单不渲染标记但不报错

import React, { useRef, useCallback, useState } from 'react';
import Map, { Marker, Popup, NavigationControl, ScaleControl } from 'react-map-gl';
import {
  Layers,
  AlertTriangle,
  Building2,
  Activity,
  Maximize2,
  RefreshCw,
  MapPin,
  Clock,
  Users,
} from 'lucide-react';
import { useDashboardData, useEarthquakes } from '../../hooks/useQueries';
import { useMapStore, useAppStore } from '../../stores';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import clsx from 'clsx';
import 'mapbox-gl/dist/mapbox-gl.css';

// ============================================
// Types
// ============================================
interface PopupInfo {
  type: 'incident' | 'shelter' | 'earthquake';
  latitude: number;
  longitude: number;
  data: any;
}

// ============================================
// Priority to P-Level Mapper (FIXED - 与 IncidentPanel 保持一致)
// ============================================
const getPriorityLevel = (priority: string | number | undefined): string => {
  if (!priority) return '5';
  
  const p = String(priority).trim();
  
  // 直接匹配数字值 (displayValue: false 返回 "1"/"2"/"3")
  switch (p) {
    case '1': return '1'; // High → P1
    case '2': return '3'; // Medium → P3
    case '3': return '5'; // Low → P5
    default: break;
  }
  
  const num = parseInt(p);
  if (!isNaN(num)) {
    if (num <= 1) return '1';
    if (num <= 2) return '2';
    if (num <= 3) return '3';
    if (num <= 4) return '4';
    return '5';
  }
  
  // Fallback: 日文文本匹配
  if (p.includes('限界') || p.includes('今すぐ') || p.includes('High')) return '1';
  if (p.includes('普通') || p.includes('Medium')) return '3';
  if (p.includes('急ぎません') || p.includes('Low')) return '5';
  
  return '5';
};

// ============================================
// Marker Component with Color
// ============================================
interface MapMarkerProps {
  type: 'incident' | 'shelter' | 'earthquake';
  priority?: string | number;
  magnitude?: number;
  isSelected?: boolean;
  onClick?: () => void;
}

const MapMarkerIcon: React.FC<MapMarkerProps> = ({ type, priority, magnitude, isSelected, onClick }) => {
  const getIncidentColor = () => {
    const level = getPriorityLevel(priority);
    switch (level) {
      case '1': return 'bg-status-critical animate-pulse shadow-[0_0_15px_rgba(255,0,110,0.7)]';
      case '2': return 'bg-status-high shadow-[0_0_10px_rgba(255,107,53,0.5)]';
      case '3': return 'bg-status-medium shadow-[0_0_8px_rgba(255,214,10,0.4)]';
      case '4': return 'bg-status-low';
      default: return 'bg-kokoro-info'; // P5 用蓝色代替灰色，在深色地图上更可见
    }
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
        'w-8 h-8 rounded-full flex items-center justify-center shadow-lg cursor-pointer transition-transform hover:scale-110',
        color,
        isSelected && 'ring-2 ring-white ring-offset-2 ring-offset-kokoro-dark scale-125'
      )}
    >
      <Icon className="w-4 h-4 text-white" />
    </button>
  );
};

// ============================================
// Layer Toggle
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
// Incident Popup Content
// ============================================
const IncidentPopupContent: React.FC<{ data: any; onNavigate: () => void }> = ({ data, onNavigate }) => {
  const level = getPriorityLevel(data.priority);
  const priorityLabels: Record<string, { label: string; color: string }> = {
    '1': { label: 'P1 - 緊急', color: 'bg-status-critical' },
    '2': { label: 'P2 - 高', color: 'bg-status-high' },
    '3': { label: 'P3 - 中', color: 'bg-status-medium' },
    '4': { label: 'P4 - 低', color: 'bg-status-low' },
    '5': { label: 'P5 - 計画', color: 'bg-kokoro-muted' },
  };

  const { label, color } = priorityLabels[level] || priorityLabels['5'];
  const title = data.wish_content?.substring(0, 50) || '緊急SOS要請';

  return (
    <div className="min-w-[220px]">
      <div className="flex items-center gap-2 mb-2">
        <span className={clsx('px-2 py-0.5 text-[10px] font-bold rounded text-white', color)}>
          {label}
        </span>
        <span className="px-2 py-0.5 text-[10px] font-bold bg-status-critical text-white rounded animate-pulse">
          🆘 SOS
        </span>
      </div>
      <h4 className="font-medium text-gray-900 text-sm mb-2 line-clamp-2">{title}</h4>
      <div className="space-y-1 text-xs text-gray-600 mb-3">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>
            {data.sys_created_on
              ? formatDistanceToNow(new Date(data.sys_created_on), { addSuffix: true, locale: ja })
              : '時間不明'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          <span>
            {data.latitude && data.longitude
              ? `${parseFloat(data.latitude).toFixed(4)}, ${parseFloat(data.longitude).toFixed(4)}`
              : '位置不明'}
          </span>
        </div>
      </div>
      <button
        onClick={onNavigate}
        className="w-full px-3 py-1.5 text-xs bg-kokoro-accent text-kokoro-dark rounded hover:bg-kokoro-accent/80 font-medium"
      >
        詳細を表示
      </button>
    </div>
  );
};

// ============================================
// Shelter Popup Content
// ============================================
const ShelterPopupContent: React.FC<{ data: any }> = ({ data }) => {
  const capacity = parseInt(data.x_1821654_kokoro_0_capacity || '0');
  const occupancy = parseInt(data.x_1821654_kokoro_0_current_occupancy || '0');
  const occupancyPercent = capacity > 0 ? Math.round((occupancy / capacity) * 100) : 0;

  const statusLabels: Record<string, { label: string; color: string }> = {
    'open': { label: '開設中', color: 'text-kokoro-success' },
    'full': { label: '満員', color: 'text-kokoro-warning' },
    'closed': { label: '閉鎖', color: 'text-kokoro-muted' },
  };

  const status = statusLabels[data.x_1821654_kokoro_0_site_status || 'closed'] || statusLabels['closed'];

  return (
    <div className="min-w-[200px]">
      <div className="flex items-center gap-2 mb-2">
        <Building2 className="w-4 h-4 text-kokoro-info" />
        <span className={clsx('text-xs font-medium', status.color)}>{status.label}</span>
      </div>
      <h4 className="font-medium text-gray-900 text-sm mb-2">{data.name || '避難所'}</h4>
      <div className="mb-2">
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>収容状況</span>
          <span>{occupancy} / {capacity}</span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={clsx(
              'h-full rounded-full',
              occupancyPercent >= 90 ? 'bg-status-critical' :
              occupancyPercent >= 70 ? 'bg-kokoro-warning' : 'bg-kokoro-success'
            )}
            style={{ width: `${occupancyPercent}%` }}
          />
        </div>
      </div>
      {data.x_1821654_kokoro_0_eoc_site_type && (
        <p className="text-xs text-gray-500">タイプ: {data.x_1821654_kokoro_0_eoc_site_type}</p>
      )}
    </div>
  );
};

// ============================================
// Earthquake Popup Content
// ============================================
const EarthquakePopupContent: React.FC<{ data: any }> = ({ data }) => {
  const magnitude = data.properties.mag;
  const depth = data.geometry.coordinates[2];

  return (
    <div className="min-w-[200px]">
      <div className="flex items-center gap-2 mb-2">
        <Activity className="w-4 h-4 text-kokoro-warning" />
        <span className={clsx(
          'px-2 py-0.5 text-xs font-bold rounded text-white',
          magnitude >= 6 ? 'bg-status-critical' :
          magnitude >= 5 ? 'bg-status-high' :
          magnitude >= 4 ? 'bg-status-medium' : 'bg-kokoro-info'
        )}>
          M{magnitude.toFixed(1)}
        </span>
        {data.properties.tsunami === 1 && (
          <span className="px-2 py-0.5 text-[10px] font-bold bg-status-critical text-white rounded animate-pulse">
            津波注意
          </span>
        )}
      </div>
      <h4 className="font-medium text-gray-900 text-sm mb-2">{data.properties.place}</h4>
      <div className="space-y-1 text-xs text-gray-600">
        <p>深さ: {Math.round(depth)} km</p>
        <p>
          発生: {formatDistanceToNow(new Date(data.properties.time), { addSuffix: true, locale: ja })}
        </p>
      </div>
      <a
        href={data.properties.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block mt-2 text-center px-3 py-1.5 text-xs bg-kokoro-info text-white rounded hover:bg-kokoro-info/80"
      >
        USGS で詳細を見る
      </a>
    </div>
  );
};

// ============================================
// Main Map Panel
// ============================================
const MapPanel: React.FC = () => {
  const mapRef = useRef<any>(null);
  const [popupInfo, setPopupInfo] = useState<PopupInfo | null>(null);
  
  const { viewport, setViewport, layers, toggleLayer, selectMarker, selectedMarkerId } = useMapStore();
  const { selectIncident } = useAppStore();
  const { silentWishes, locations, isLoading, refetch } = useDashboardData();
  const { data: earthquakes } = useEarthquakes({ timeRange: 'day', minMagnitude: '2.5' });

  const mapboxToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

  const handleViewportChange = useCallback((evt: { viewState: typeof viewport }) => {
    setViewport(evt.viewState);
  }, [setViewport]);

  const handleIncidentClick = (wish: any) => {
    selectMarker(wish.sys_id);
    selectIncident(wish.sys_id);
    setPopupInfo({
      type: 'incident',
      latitude: parseFloat(wish.latitude),
      longitude: parseFloat(wish.longitude),
      data: wish,
    });
  };

  const handleShelterClick = (loc: any) => {
    setPopupInfo({
      type: 'shelter',
      latitude: parseFloat(loc.latitude),
      longitude: parseFloat(loc.longitude),
      data: loc,
    });
  };

  const handleEarthquakeClick = (eq: any) => {
    const [lng, lat] = eq.geometry.coordinates;
    setPopupInfo({
      type: 'earthquake',
      latitude: lat,
      longitude: lng,
      data: eq,
    });
  };

  // Count markers - only count those with valid coordinates
  const wishesWithGPS = silentWishes?.filter(w => {
    if (!w.latitude || !w.longitude) return false;
    const lat = parseFloat(w.latitude);
    const lng = parseFloat(w.longitude);
    return !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0;
  }) || [];
  
  const incidentCount = wishesWithGPS.length;
  const shelterCount = locations?.filter(l => l.latitude && l.longitude).length || 0;
  const earthquakeCount = earthquakes?.length || 0;

  // Debug log
  console.log('[MapPanel] silentWishes:', silentWishes?.length, 'with GPS:', incidentCount);
  if (wishesWithGPS.length > 0) {
    console.log('[MapPanel] Sample wish:', wishesWithGPS[0], 'priority:', wishesWithGPS[0].priority, '→ P-level:', getPriorityLevel(wishesWithGPS[0].priority));
  }

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
            wishesWithGPS.map(wish => {
              const lat = parseFloat(wish.latitude);
              const lng = parseFloat(wish.longitude);
              
              return (
                <Marker
                  key={`incident-${wish.sys_id}`}
                  latitude={lat}
                  longitude={lng}
                  anchor="center"
                >
                  <MapMarkerIcon
                    type="incident"
                    priority={wish.priority}
                    isSelected={selectedMarkerId === wish.sys_id}
                    onClick={() => handleIncidentClick(wish)}
                  />
                </Marker>
              );
            })}

          {/* Shelter Markers */}
          {layers.shelters &&
            locations?.map(loc => {
              if (!loc.latitude || !loc.longitude) return null;
              const lat = parseFloat(loc.latitude);
              const lng = parseFloat(loc.longitude);
              if (isNaN(lat) || isNaN(lng)) return null;
              
              return (
                <Marker
                  key={`shelter-${loc.sys_id}`}
                  latitude={lat}
                  longitude={lng}
                  anchor="center"
                >
                  <MapMarkerIcon 
                    type="shelter" 
                    onClick={() => handleShelterClick(loc)}
                  />
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
                    onClick={() => handleEarthquakeClick(eq)}
                  />
                </Marker>
              );
            })}

          {/* Popup */}
          {popupInfo && (
            <Popup
              latitude={popupInfo.latitude}
              longitude={popupInfo.longitude}
              anchor="bottom"
              onClose={() => setPopupInfo(null)}
              closeButton={true}
              closeOnClick={false}
              className="kokoro-map-popup"
            >
              {popupInfo.type === 'incident' && (
                <IncidentPopupContent 
                  data={popupInfo.data} 
                  onNavigate={() => {
                    selectIncident(popupInfo.data.sys_id);
                    setPopupInfo(null);
                  }}
                />
              )}
              {popupInfo.type === 'shelter' && (
                <ShelterPopupContent data={popupInfo.data} />
              )}
              {popupInfo.type === 'earthquake' && (
                <EarthquakePopupContent data={popupInfo.data} />
              )}
            </Popup>
          )}
        </Map>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-kokoro-dark/50 flex items-center justify-center">
            <RefreshCw className="w-8 h-8 text-kokoro-accent animate-spin" />
          </div>
        )}

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-kokoro-panel/90 backdrop-blur-sm border border-kokoro-border rounded-lg p-2">
          <p className="text-[10px] text-kokoro-muted mb-1">凡例</p>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[10px]">
              <div className="w-3 h-3 rounded-full bg-status-critical" />
              <span className="text-white">P1 緊急 (限界/今すぐ)</span>
            </div>
            <div className="flex items-center gap-2 text-[10px]">
              <div className="w-3 h-3 rounded-full bg-status-medium" />
              <span className="text-white">P3 中 (普通)</span>
            </div>
            <div className="flex items-center gap-2 text-[10px]">
              <div className="w-3 h-3 rounded-full bg-kokoro-info" />
              <span className="text-white">P5 低 / 避難所</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapPanel;
