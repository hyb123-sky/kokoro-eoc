// ============================================
// KOKORO EOC - Weather Panel Component
// ============================================

import React from 'react';
import {
  Cloud,
  Sun,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Wind,
  Droplets,
  Thermometer,
  Eye,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { useWeather } from '../../hooks/useQueries';
import clsx from 'clsx';

// ============================================
// Weather Icon Component
// ============================================
const WeatherIcon: React.FC<{ icon: string; size?: number }> = ({ icon, size = 32 }) => {
  const iconMap: Record<string, React.ElementType> = {
    'sun': Sun,
    'cloud-sun': Cloud,
    'cloud-fog': Cloud,
    'cloud-rain': CloudRain,
    'cloud-drizzle': CloudRain,
    'cloud-snow': CloudSnow,
    'snowflake': CloudSnow,
    'cloud-lightning': CloudLightning,
  };

  const Icon = iconMap[icon] || Cloud;
  return <Icon style={{ width: size, height: size }} />;
};

// ============================================
// Main Weather Panel Component
// ============================================
const WeatherPanel: React.FC = () => {
  // 東京の座標をデフォルトに
  const { data: weather, isLoading, error, refetch } = useWeather(35.6762, 139.6503, true);

  const getAlertColor = (level: string) => {
    switch (level) {
      case 'emergency': return 'text-status-critical bg-status-critical/10';
      case 'warning': return 'text-kokoro-warning bg-kokoro-warning/10';
      case 'advisory': return 'text-kokoro-info bg-kokoro-info/10';
      default: return 'text-kokoro-success bg-kokoro-success/10';
    }
  };

  // 警報レベルを計算
  const getAlertLevel = () => {
    if (!weather) return 'none';
    if (weather.wind_speed >= 30 || weather.precipitation >= 50) return 'emergency';
    if (weather.wind_speed >= 20 || weather.precipitation >= 30) return 'warning';
    if (weather.wind_speed >= 15 || weather.precipitation >= 10) return 'advisory';
    return 'none';
  };

  const alertLevel = getAlertLevel();

  return (
    <div className="panel flex flex-col overflow-hidden">
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <Cloud className="w-4 h-4 text-kokoro-info" />
          <span className="panel-title">天気情報</span>
        </div>
        <button
          onClick={() => refetch()}
          className="btn-icon text-kokoro-muted hover:text-kokoro-accent p-1"
          disabled={isLoading}
        >
          <RefreshCw className={clsx('w-4 h-4', isLoading && 'animate-spin')} />
        </button>
      </div>

      <div className="panel-content flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <RefreshCw className="w-6 h-6 text-kokoro-accent animate-spin" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-32 text-kokoro-muted">
            <AlertTriangle className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm">天気データを取得できません</p>
            <button
              onClick={() => refetch()}
              className="mt-2 px-3 py-1 text-xs bg-kokoro-accent text-kokoro-dark rounded"
            >
              再試行
            </button>
          </div>
        ) : weather ? (
          <div className="space-y-4">
            {/* Alert Banner */}
            {alertLevel !== 'none' && (
              <div className={clsx('p-3 rounded-lg flex items-center gap-2', getAlertColor(alertLevel))}>
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {alertLevel === 'emergency' ? '緊急警報' : 
                   alertLevel === 'warning' ? '警報発令中' : '注意報発令中'}
                </span>
              </div>
            )}

            {/* Current Weather */}
            <div className="bg-kokoro-darker rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-kokoro-accent">
                    <WeatherIcon icon={weather.icon} size={48} />
                  </div>
                  <div>
                    <p className="text-3xl font-display font-bold text-white">
                      {Math.round(weather.temperature)}°C
                    </p>
                    <p className="text-sm text-kokoro-muted">{weather.condition}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-kokoro-muted">体感温度</p>
                  <p className="text-lg font-semibold text-white">
                    {Math.round(weather.feels_like)}°C
                  </p>
                </div>
              </div>
            </div>

            {/* Weather Details */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-kokoro-darker rounded-lg p-3">
                <div className="flex items-center gap-2 text-kokoro-muted mb-1">
                  <Droplets className="w-3 h-3" />
                  <span className="text-xs">湿度</span>
                </div>
                <p className="text-lg font-semibold text-white">{weather.humidity}%</p>
              </div>

              <div className="bg-kokoro-darker rounded-lg p-3">
                <div className="flex items-center gap-2 text-kokoro-muted mb-1">
                  <Wind className="w-3 h-3" />
                  <span className="text-xs">風速</span>
                </div>
                <p className="text-lg font-semibold text-white">{weather.wind_speed} m/s</p>
              </div>

              <div className="bg-kokoro-darker rounded-lg p-3">
                <div className="flex items-center gap-2 text-kokoro-muted mb-1">
                  <CloudRain className="w-3 h-3" />
                  <span className="text-xs">降水量</span>
                </div>
                <p className="text-lg font-semibold text-white">{weather.precipitation} mm</p>
              </div>

              <div className="bg-kokoro-darker rounded-lg p-3">
                <div className="flex items-center gap-2 text-kokoro-muted mb-1">
                  <Eye className="w-3 h-3" />
                  <span className="text-xs">視程</span>
                </div>
                <p className="text-lg font-semibold text-white">
                  {(weather.visibility / 1000).toFixed(1)} km
                </p>
              </div>
            </div>

            {/* Last Updated */}
            <div className="text-center">
              <p className="text-[10px] text-kokoro-muted">
                最終更新: {new Date(weather.updated_at).toLocaleTimeString('ja-JP')}
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default WeatherPanel;
