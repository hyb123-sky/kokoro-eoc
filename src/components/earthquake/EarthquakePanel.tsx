// ============================================
// KOKORO EOC - Earthquake Panel (Self-contained)
// ============================================

import React from 'react';
import {
  Activity,
  AlertTriangle,
  Clock,
  RefreshCw,
  Waves,
  ExternalLink,
} from 'lucide-react';
import { useEarthquakes } from '../../hooks/useQueries';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import clsx from 'clsx';

// ============================================
// Magnitude Badge Component
// ============================================
const MagnitudeBadge: React.FC<{ magnitude: number }> = ({ magnitude }) => {
  const getConfig = () => {
    if (magnitude >= 6.0) return { bg: 'bg-status-critical', text: 'text-white', pulse: true };
    if (magnitude >= 5.0) return { bg: 'bg-status-high', text: 'text-white', pulse: false };
    if (magnitude >= 4.0) return { bg: 'bg-kokoro-warning', text: 'text-kokoro-dark', pulse: false };
    if (magnitude >= 3.0) return { bg: 'bg-kokoro-info', text: 'text-white', pulse: false };
    return { bg: 'bg-kokoro-muted', text: 'text-white', pulse: false };
  };

  const config = getConfig();

  return (
    <span className={clsx(
      'px-2.5 py-1 text-sm font-bold rounded-lg font-mono',
      config.bg,
      config.text,
      config.pulse && 'animate-pulse'
    )}>
      M{magnitude.toFixed(1)}
    </span>
  );
};

// ============================================
// Earthquake Card Component
// ============================================
interface EarthquakeData {
  id: string;
  properties: {
    mag: number;
    place: string;
    time: number;
    url: string;
    tsunami: number;
  };
  geometry: {
    coordinates: [number, number, number];
  };
}

const EarthquakeCard: React.FC<{ quake: EarthquakeData }> = ({ quake }) => {
  const { mag, place, time, url, tsunami } = quake.properties;
  const depth = quake.geometry.coordinates[2];
  
  const isRecent = Date.now() - time < 3600000;
  const isMajor = mag >= 5.0;

  const getSeverityIndicator = () => {
    if (mag >= 6.0) return 'bg-status-critical';
    if (mag >= 5.0) return 'bg-status-high';
    if (mag >= 4.0) return 'bg-kokoro-warning';
    return 'bg-kokoro-info';
  };

  return (
    <div 
      className={clsx(
        'p-3 rounded-lg border transition-all duration-200',
        'hover:border-kokoro-accent/50 cursor-pointer',
        isMajor 
          ? 'bg-status-critical/5 border-status-critical/30' 
          : 'bg-kokoro-darker border-kokoro-border',
        isRecent && !isMajor && 'border-kokoro-warning/30'
      )}
      onClick={() => window.open(url, '_blank')}
    >
      <div className="flex items-start gap-3">
        <MagnitudeBadge magnitude={mag} />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="text-sm font-medium text-white line-clamp-1 flex-1">
              {place || '不明な場所'}
            </h4>
            {isRecent && (
              <span className="px-1.5 py-0.5 text-[9px] bg-kokoro-warning text-kokoro-dark rounded font-bold shrink-0">
                NEW
              </span>
            )}
          </div>
          
          {tsunami === 1 && (
            <div className="flex items-center gap-1 mb-2">
              <span className="px-2 py-0.5 text-[10px] font-bold bg-status-critical text-white rounded animate-pulse">
                ⚠️ 津波注意
              </span>
            </div>
          )}
          
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-kokoro-muted">
            <div className="flex items-center gap-1">
              <Waves className="w-3 h-3" />
              <span>深さ {Math.round(depth)}km</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>
                {formatDistanceToNow(new Date(time), {
                  addSuffix: true,
                  locale: ja,
                })}
              </span>
            </div>
          </div>
        </div>

        <div className={clsx(
          'w-2 h-2 rounded-full shrink-0 mt-1',
          getSeverityIndicator()
        )} />
      </div>
    </div>
  );
};

// ============================================
// Stats Summary Component
// ============================================
const StatsSummary: React.FC<{ earthquakes: EarthquakeData[] }> = ({ earthquakes }) => {
  const last24h = earthquakes.filter(eq => Date.now() - eq.properties.time < 86400000);
  const major = last24h.filter(eq => eq.properties.mag >= 5.0).length;
  const moderate = last24h.filter(eq => eq.properties.mag >= 4.0 && eq.properties.mag < 5.0).length;
  const minor = last24h.filter(eq => eq.properties.mag < 4.0).length;

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-kokoro-darker rounded-lg border border-kokoro-border/50 mb-3">
      <Activity className="w-4 h-4 text-kokoro-accent shrink-0" />
      <div className="flex-1 flex items-center justify-around text-center">
        <div>
          <p className="text-lg font-display font-bold text-status-critical">{major}</p>
          <p className="text-[9px] text-kokoro-muted">M5.0+</p>
        </div>
        <div className="w-px h-6 bg-kokoro-border" />
        <div>
          <p className="text-lg font-display font-bold text-kokoro-warning">{moderate}</p>
          <p className="text-[9px] text-kokoro-muted">M4.0-4.9</p>
        </div>
        <div className="w-px h-6 bg-kokoro-border" />
        <div>
          <p className="text-lg font-display font-bold text-kokoro-info">{minor}</p>
          <p className="text-[9px] text-kokoro-muted">M3.0未満</p>
        </div>
      </div>
    </div>
  );
};

// ============================================
// Main Earthquake Panel Component
// ============================================
const EarthquakePanel: React.FC = () => {
  const {
    data: earthquakes,
    isLoading,
    error,
    refetch,
  } = useEarthquakes({ timeRange: 'day', minMagnitude: '2.5' });

  const japanEarthquakes = React.useMemo(() => {
    if (!earthquakes || !Array.isArray(earthquakes)) return [];
    return earthquakes.slice(0, 10);
  }, [earthquakes]);

  const totalCount = earthquakes?.length || 0;

  return (
    <div className="panel flex-1 flex flex-col overflow-hidden">
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-kokoro-accent" />
          <span className="panel-title">地震活動</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-kokoro-muted">
            過去24時間: {totalCount}件
          </span>
          <button
            onClick={() => refetch()}
            className="btn-icon text-kokoro-muted hover:text-kokoro-accent p-1"
            disabled={isLoading}
            title="データを更新"
          >
            <RefreshCw className={clsx('w-4 h-4', isLoading && 'animate-spin')} />
          </button>
        </div>
      </div>

      <div className="panel-content flex-1 overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="space-y-3 p-1">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton h-20 rounded-lg" />
            ))}
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center text-kokoro-muted p-4">
            <AlertTriangle className="w-10 h-10 mb-3 text-status-medium" />
            <p className="text-sm font-medium mb-1">データ取得エラー</p>
            <p className="text-xs text-center mb-3">USGS API に接続できませんでした</p>
            <button
              onClick={() => refetch()}
              className="px-3 py-1.5 text-xs bg-kokoro-accent text-kokoro-dark rounded-lg hover:bg-kokoro-accent/80"
            >
              再試行
            </button>
          </div>
        ) : japanEarthquakes.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-kokoro-muted p-4">
            <Activity className="w-10 h-10 mb-3 opacity-50" />
            <p className="text-sm font-medium">現在地震活動なし</p>
            <p className="text-xs mt-1">過去24時間に日本周辺でM2.5以上の地震は観測されていません</p>
          </div>
        ) : (
          <>
            <StatsSummary earthquakes={earthquakes || []} />
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {japanEarthquakes.map((quake) => (
                <EarthquakeCard key={quake.id} quake={quake} />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="px-3 py-2 border-t border-kokoro-border flex items-center justify-between">
        <span className="text-[10px] text-kokoro-muted">
          データソース: USGS
        </span>
        <a
          href="https://earthquake.usgs.gov/earthquakes/map/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[10px] text-kokoro-accent hover:underline flex items-center gap-1"
        >
          詳細マップ
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};

export default EarthquakePanel;
