// ============================================
// KOKORO EOC - Map Panel Component
// ============================================

import React, { useState, useMemo } from 'react';
import {
  Map as MapIcon,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Navigation,
  AlertTriangle,
  Package,
  Building2,
  Truck,
  Target,
} from 'lucide-react';
import { useMapStore, useAppStore } from '../../stores';
import { useDashboardData } from '../../hooks/useQueries';
import clsx from 'clsx';
import MapboxMap, { NavigationControl, Marker as MapGLMarker, Source, Layer, CircleLayer } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// ============================================
// Types
// ============================================
interface MapPanelProps {
  earthquakes?: any[];
}
interface MapMarker {
  id: string;
  type: 'incident' | 'resource' | 'shelter' | 'hospital' | 'command_post' | 'vehicle';
  latitude: number;
  longitude: number;
  label: string;
  priority?: 1 | 2 | 3 | 4 | 5;
}

// ============================================
// Marker Component
// ============================================
const Marker: React.FC<{
  marker: MapMarker;
  isSelected: boolean;
  onClick: () => void;
}> = ({ marker, isSelected, onClick }) => {
  const getIcon = () => {
    switch (marker.type) {
      case 'incident':
        return AlertTriangle;
      case 'resource':
        return Package;
      case 'shelter':
      case 'hospital':
      case 'command_post':
        return Building2;
      case 'vehicle':
        return Truck;
      default:
        return Target;
    }
  };

  const getColor = () => {
    if (marker.type === 'incident') {
      switch (marker.priority) {
        case 1:
          return 'bg-status-critical text-white';
        case 2:
          return 'bg-status-high text-white';
        case 3:
          return 'bg-status-medium text-kokoro-dark';
        default:
          return 'bg-status-low text-kokoro-dark';
      }
    }
    switch (marker.type) {
      case 'shelter':
        return 'bg-kokoro-success text-white';
      case 'hospital':
        return 'bg-status-high text-white';
      case 'command_post':
        return 'bg-kokoro-accent text-kokoro-dark';
      case 'resource':
        return 'bg-kokoro-info text-white';
      case 'vehicle':
        return 'bg-kokoro-accent text-kokoro-dark';
      default:
        return 'bg-kokoro-muted text-white';
    }
  };

  const Icon = getIcon();

  return (
    <MapGLMarker longitude={marker.longitude} latitude={marker.latitude} anchor="center">
      <button
        onClick={onClick}
        className={clsx(
          'relative transition-all duration-200',
          'group'
        )}
      >
        <div
          className={clsx(
            'w-8 h-8 rounded-full flex items-center justify-center shadow-lg',
            getColor(),
            isSelected && 'ring-2 ring-white ring-offset-2 ring-offset-kokoro-dark',
            marker.type === 'incident' && marker.priority === 1 && 'animate-pulse'
          )}
        >
          <Icon className="w-4 h-4" />
        </div>
        
        {/* Tooltip */}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <div className="bg-kokoro-panel border border-kokoro-border rounded px-2 py-1 whitespace-nowrap">
            <span className="text-xs text-white">{marker.label}</span>
          </div>
        </div>

        {/* Ripple Effect for Critical */}
        {marker.type === 'incident' && marker.priority === 1 && (
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 rounded-full bg-status-critical animate-ping opacity-25" />
          </div>
        )}
      </button>
    </MapGLMarker>
  );
};

// ============================================
// Layer Toggle Button
// ============================================
const LayerToggle: React.FC<{
  icon: React.ElementType;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon: Icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={clsx(
      'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs transition-colors',
      isActive
        ? 'bg-kokoro-accent text-kokoro-dark'
        : 'bg-kokoro-darker text-kokoro-muted hover:text-white'
    )}
  >
    <Icon className="w-3.5 h-3.5" />
    <span>{label}</span>
  </button>
);

// ============================================
// Main Map Panel Component
// ============================================

// [前置抽离] WebGL 地震图层样式定义
// 必须放置在组件外部，防止 React 每次渲染时改变对象引用导致 Mapbox 闪烁或丢弃图层
const earthquakeLayer: CircleLayer = {
  id: 'earthquakes-point',
  type: 'circle',
  source: 'earthquakes', // 强制添加此行以满足底层 TS 接口规范
  paint: {
    // 震级越大，渲染半径越大 (M2.5 -> 4px, M7.0 -> 20px)
    'circle-radius': [
      'interpolate',
      ['linear'],
      ['get', 'mag'],
      2.5, 4,
      5.0, 10,
      7.0, 20
    ],
    // 根据震级动态填充警戒色
    'circle-color': [
      'step',
      ['get', 'mag'],
      '#3b82f6',      // M < 3.0: Info
      3.0, '#eab308', // M >= 3.0: Warning
      5.0, '#f97316', // M >= 5.0: High
      6.0, '#ef4444'  // M >= 6.0: Critical
    ],
    'circle-opacity': 0.7,
    'circle-stroke-width': 1,
    'circle-stroke-color': '#1e1e2d'
  }
};

const MapPanel: React.FC<MapPanelProps> = ({ earthquakes = [] }) => {
  const { viewport, layers, toggleLayer, setViewport } = useMapStore();
  const { selectMarker } = useAppStore();

  // 构造符合 Mapbox 规范的 GeoJSON
  const earthquakeGeoJSON = useMemo(() => {
    return {
      type: 'FeatureCollection',
      features: earthquakes
    };
  }, [earthquakes]);
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);
  
  // 接入全局数据流，同时获取位置库、标准工单库与 SOS 请求库
  const { locations, incidents, silentWishes } = useDashboardData();

  const handleMarkerClick = (markerId: string) => {
    setSelectedMarker(markerId === selectedMarker ? null : markerId);
    selectMarker(markerId === selectedMarker ? null : markerId);
  };

  const handleZoomIn = () => {
    setViewport({ zoom: Math.min(viewport.zoom + 1, 18) });
  };

  const handleZoomOut = () => {
    setViewport({ zoom: Math.max(viewport.zoom - 1, 5) });
  };

  const locationCoordsMap = useMemo(() => {
    const map = new Map<string, { lat: number; lng: number }>();
    locations.forEach(loc => {
      if (loc.latitude && loc.longitude && loc.sys_id) {
        map.set(loc.sys_id, { lat: parseFloat(loc.latitude), lng: parseFloat(loc.longitude) });
      }
    });
    return map;
  }, [locations]);

  const locationMarkers: MapMarker[] = locations
    .filter(loc => loc.latitude && loc.longitude)
    .map(loc => {
      let type: MapMarker['type'] = 'shelter';
      if (loc.x_1821654_kokoro_0_eoc_site_type === 'hospital') type = 'hospital';
      if (loc.x_1821654_kokoro_0_eoc_site_type === 'command_post') type = 'command_post';
      return { id: loc.sys_id, type: type, latitude: parseFloat(loc.latitude), longitude: parseFloat(loc.longitude), label: loc.name };
    });

  // 安全解析 ServiceNow 的 priority 字段（兼容 {value, display_value} 对象或纯字符串形式）
  const parsePriority = (p: any, defaultPrio: 1 | 2 | 3 | 4 | 5 = 1): 1 | 2 | 3 | 4 | 5 => {
    if (!p) return defaultPrio;
    const val = typeof p === 'object' ? p.value : p;
    const parsed = parseInt(val, 10);
    return isNaN(parsed) ? defaultPrio : (parsed as 1 | 2 | 3 | 4 | 5);
  };

  const incidentMarkers: MapMarker[] = incidents
    .filter(inc => {
      const locSysId = inc.location?.value || (typeof inc.location === 'string' ? inc.location : null);
      return locSysId && locationCoordsMap.has(locSysId);
    })
    .map(inc => {
      const locSysId = inc.location?.value || inc.location;
      const coords = locationCoordsMap.get(locSysId)!;
      return { 
        id: inc.sys_id, 
        type: 'incident', 
        latitude: coords.lat, 
        longitude: coords.lng, 
        label: inc.number, 
        priority: parsePriority(inc.priority, 3) 
      };
    });

  // 映射流 3：一键 SOS (Silent Wishes) - 基于绝对坐标，无视关系映射
  const silentWishMarkers: MapMarker[] = (silentWishes || [])
    .filter(wish => wish.latitude && wish.longitude)
    .map(wish => ({
      id: wish.sys_id,
      type: 'incident', // 复用 incident 样式体系
      latitude: parseFloat(wish.latitude),
      longitude: parseFloat(wish.longitude),
      label: `SOS: ${wish.number || '紧急请求'}`,
      priority: parsePriority(wish.priority, 1) // SOS 数据默认强制给予 1 级 (Critical/Red)
    }));

  // 聚合三大数据源并基于前端图层开关进行渲染过滤
  const visibleMarkers = [...locationMarkers, ...incidentMarkers, ...silentWishMarkers].filter((marker) => {
    if (marker.type === 'incident' && !layers.incidents) return false;
    if (marker.type === 'resource' && !layers.resources) return false;
    if ((marker.type === 'shelter' || marker.type === 'hospital' || marker.type === 'command_post') && !layers.shelters) return false;
    return true;
  });

  return (
    <div className="panel h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <MapIcon className="w-4 h-4 text-kokoro-accent" />
          <span className="panel-title">オペレーションマップ</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-kokoro-muted">
            {viewport.latitude.toFixed(4)}, {viewport.longitude.toFixed(4)}
          </span>
          <span className="text-xs font-mono text-kokoro-accent">
            Z{viewport.zoom.toFixed(1)}
          </span>
        </div>
      </div>

      {/* Layer Controls */}
      <div className="px-4 py-2 border-b border-kokoro-border flex items-center gap-2 overflow-x-auto">
        <Layers className="w-4 h-4 text-kokoro-muted shrink-0" />
        <LayerToggle
          icon={AlertTriangle}
          label="インシデント"
          isActive={layers.incidents}
          onClick={() => toggleLayer('incidents')}
        />
        <LayerToggle
          icon={Package}
          label="リソース"
          isActive={layers.resources}
          onClick={() => toggleLayer('resources')}
        />
        <LayerToggle
          icon={Building2}
          label="避難所"
          isActive={layers.shelters}
          onClick={() => toggleLayer('shelters')}
        />
        <LayerToggle
          icon={Navigation}
          label="ヒートマップ"
          isActive={layers.heatmap}
          onClick={() => toggleLayer('heatmap')}
        />
      </div>

      {/* Map Container */}
      <div className="flex-1 relative bg-kokoro-darker overflow-hidden">
        {/* Grid Background */}
        <div
          className="absolute inset-0 bg-grid opacity-30"
          style={{
            backgroundSize: `${50 * (viewport.zoom / 10)}px ${50 * (viewport.zoom / 10)}px`,
          }}
        />

        {/* Real Mapbox Visualization */}
        <MapboxMap
          mapboxAccessToken={import.meta.env.VITE_MAPBOX_ACCESS_TOKEN}
          {...viewport}
          onMove={evt => setViewport(evt.viewState)}
          style={{ width: '100%', height: '100%' }}
          mapStyle="mapbox://styles/mapbox/dark-v11"
        >
          <NavigationControl position="bottom-right" />

          {/* WebGL 渲染地震数据源 (在 Marker 之下渲染，避免遮挡交互) */}
          <Source id="earthquakes" type="geojson" data={earthquakeGeoJSON as any}>
            <Layer {...earthquakeLayer} />
          </Source>
          
          {/* 渲染 ServiceNow 真实坐标锚点 */}
          {visibleMarkers.map((marker) => (
            <Marker
              key={marker.id}
              marker={marker}
              isSelected={marker.id === selectedMarker}
              onClick={() => handleMarkerClick(marker.id)}
            />
          ))}
        </MapboxMap>

        {/* Map Controls */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <button
            onClick={handleZoomIn}
            className="w-8 h-8 bg-kokoro-panel border border-kokoro-border rounded-lg flex items-center justify-center text-kokoro-muted hover:text-white hover:bg-kokoro-border transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="w-8 h-8 bg-kokoro-panel border border-kokoro-border rounded-lg flex items-center justify-center text-kokoro-muted hover:text-white hover:bg-kokoro-border transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button className="w-8 h-8 bg-kokoro-panel border border-kokoro-border rounded-lg flex items-center justify-center text-kokoro-muted hover:text-white hover:bg-kokoro-border transition-colors">
            <Maximize2 className="w-4 h-4" />
          </button>
          <button className="w-8 h-8 bg-kokoro-panel border border-kokoro-border rounded-lg flex items-center justify-center text-kokoro-muted hover:text-white hover:bg-kokoro-border transition-colors">
            <Navigation className="w-4 h-4" />
          </button>
        </div>

        {/* Compass */}
        <div className="absolute top-4 left-4 w-12 h-12">
          <div className="relative w-full h-full">
            <div className="absolute inset-0 rounded-full border border-kokoro-border bg-kokoro-panel/80" />
            <div
              className="absolute inset-2 flex items-center justify-center"
              style={{ transform: `rotate(${viewport.bearing}deg)` }}
            >
              <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-b-[12px] border-l-transparent border-r-transparent border-b-status-critical" />
            </div>
            <span className="absolute top-1 left-1/2 -translate-x-1/2 text-[8px] font-bold text-kokoro-muted">
              N
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-kokoro-panel/90 border border-kokoro-border rounded-lg p-3">
          <h4 className="text-xs font-semibold text-kokoro-muted mb-2">凡例</h4>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-status-critical" />
              <span className="text-xs text-kokoro-muted">紧急</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-status-high" />
              <span className="text-xs text-kokoro-muted">高優先度</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-kokoro-success" />
              <span className="text-xs text-kokoro-muted">避難所</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-kokoro-info" />
              <span className="text-xs text-kokoro-muted">リソース</span>
            </div>
          </div>
        </div>

        {/* Info Note */}
        <div className="absolute bottom-4 right-4 bg-kokoro-panel/90 border border-kokoro-border rounded-lg px-3 py-2">
          <p className="text-[10px] text-kokoro-muted">
            💡 Mapbox + ServiceNow Live Data Integrated
          </p>
        </div>
      </div>
    </div>
  );
};

export default MapPanel;