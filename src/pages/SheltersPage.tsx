// ============================================
// KOKORO EOC - Shelters Page
// ============================================

import React, { useState, useMemo } from 'react';
import { Building2, Plus, Search, Users, MapPin, RefreshCw, WifiOff, AlertTriangle, CheckCircle } from 'lucide-react';
import { useDashboardData } from '../hooks/useQueries';
import { useMapStore } from '../stores';
import clsx from 'clsx';

const SheltersPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { locations, isLoading, refetch } = useDashboardData();
  const { flyTo } = useMapStore();

  const shelters = useMemo(() => {
    if (!locations) return [];
    return locations.filter(loc => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!loc.name?.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [locations, searchQuery]);

  // Stats
  const stats = {
    total: shelters.length,
    open: shelters.filter(s => s.x_1821654_kokoro_0_site_status === 'open').length,
    full: shelters.filter(s => s.x_1821654_kokoro_0_site_status === 'full').length,
    closed: shelters.filter(s => s.x_1821654_kokoro_0_site_status === 'closed').length,
  };

  const totalCapacity = shelters.reduce((sum, s) => sum + (parseInt(s.x_1821654_kokoro_0_capacity || '0')), 0);
  const totalOccupancy = shelters.reduce((sum, s) => sum + (parseInt(s.x_1821654_kokoro_0_current_occupancy || '0')), 0);

  const getStatusConfig = (status: string | undefined) => {
    const configs: Record<string, { label: string; className: string; icon: React.ElementType }> = {
      open: { label: '開設中', className: 'bg-kokoro-success/20 text-kokoro-success', icon: CheckCircle },
      full: { label: '満員', className: 'bg-kokoro-warning/20 text-kokoro-warning', icon: AlertTriangle },
      closed: { label: '閉鎖', className: 'bg-kokoro-muted/20 text-kokoro-muted', icon: WifiOff },
    };
    return configs[status || 'closed'] || configs.closed;
  };

  // Helper to get address - Fixed TS2352 with double assertion
  const getAddress = (shelter: (typeof shelters)[number]): string => {
    const shelterAny = (shelter as any) as Record<string, unknown>;
    return (
      (typeof shelterAny.street === 'string' ? shelterAny.street : '') ||
      (typeof shelterAny.address === 'string' ? shelterAny.address : '') ||
      (typeof shelterAny.city === 'string' ? shelterAny.city : '') ||
      '住所未登録'
    );
  };

  return (
    <div className="h-full flex flex-col bg-kokoro-dark">
      {/* Header */}
      <div className="shrink-0 px-6 py-4 border-b border-kokoro-border bg-kokoro-panel">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Building2 className="w-6 h-6 text-kokoro-accent" />
            <h1 className="text-xl font-display font-bold text-white">避難所管理</h1>
            <span className="px-3 py-1 text-sm font-mono bg-kokoro-darker rounded text-kokoro-muted">
              {stats.total} 施設
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => refetch()}
              className="p-2 text-kokoro-muted hover:text-kokoro-accent rounded-lg hover:bg-kokoro-darker"
            >
              <RefreshCw className={clsx('w-5 h-5', isLoading && 'animate-spin')} />
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-kokoro-accent text-kokoro-dark rounded-lg hover:bg-kokoro-accent/80">
              <Plus className="w-4 h-4" />
              新規登録
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-6 mb-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-kokoro-success" />
            <span className="text-sm text-kokoro-muted">開設中: <span className="text-white font-bold">{stats.open}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-kokoro-warning" />
            <span className="text-sm text-kokoro-muted">満員: <span className="text-white font-bold">{stats.full}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-kokoro-muted" />
            <span className="text-sm text-kokoro-muted">閉鎖: <span className="text-white font-bold">{stats.closed}</span></span>
          </div>
          <div className="w-px h-4 bg-kokoro-border" />
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-kokoro-info" />
            <span className="text-sm text-kokoro-muted">
              避難者: <span className="text-white font-bold">{totalOccupancy.toLocaleString()}</span> / {totalCapacity.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-kokoro-muted" />
          <input
            type="text"
            placeholder="避難所を検索..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-kokoro-darker border border-kokoro-border rounded-lg text-white placeholder-kokoro-muted focus:outline-none focus:border-kokoro-accent"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-4 border-kokoro-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-kokoro-muted">読み込み中...</p>
          </div>
        ) : shelters.length === 0 ? (
          <div className="text-center py-12 text-kokoro-muted">
            <Building2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>避難所データが見つかりません</p>
            <p className="text-sm mt-2">cmn_location テーブルにデータを追加してください</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {shelters.map(shelter => {
              const statusConfig = getStatusConfig(shelter.x_1821654_kokoro_0_site_status);
              const StatusIcon = statusConfig.icon;
              const capacity = parseInt(shelter.x_1821654_kokoro_0_capacity || '0');
              const occupancy = parseInt(shelter.x_1821654_kokoro_0_current_occupancy || '0');
              const occupancyPercent = capacity > 0 ? Math.round((occupancy / capacity) * 100) : 0;

              return (
                <div key={shelter.sys_id} className="p-4 bg-kokoro-panel rounded-lg border border-kokoro-border hover:border-kokoro-accent/50 transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-medium text-white line-clamp-1">{shelter.name}</h3>
                    <span className={clsx('px-2 py-0.5 text-xs font-medium rounded-full flex items-center gap-1', statusConfig.className)}>
                      <StatusIcon className="w-3 h-3" />
                      {statusConfig.label}
                    </span>
                  </div>

                  {/* Capacity Bar */}
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-kokoro-muted">収容状況</span>
                      <span className="text-white font-mono">{occupancy} / {capacity}</span>
                    </div>
                    <div className="h-2 bg-kokoro-darker rounded-full overflow-hidden">
                      <div
                        className={clsx(
                          'h-full rounded-full transition-all',
                          occupancyPercent >= 90 ? 'bg-status-critical' :
                          occupancyPercent >= 70 ? 'bg-kokoro-warning' : 'bg-kokoro-success'
                        )}
                        style={{ width: `${occupancyPercent}%` }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-kokoro-muted">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span className="line-clamp-1">{getAddress(shelter)}</span>
                    </div>
                    {shelter.x_1821654_kokoro_0_eoc_site_type && (
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        <span>{shelter.x_1821654_kokoro_0_eoc_site_type}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => {
                        if (shelter.latitude && shelter.longitude) {
                          flyTo(parseFloat(shelter.latitude), parseFloat(shelter.longitude), 15);
                        }
                      }}
                      className="flex-1 px-3 py-1.5 text-xs bg-kokoro-darker text-white rounded hover:bg-kokoro-border flex items-center justify-center gap-1"
                    >
                      <MapPin className="w-3 h-3" />
                      地図
                    </button>
                    <button className="flex-1 px-3 py-1.5 text-xs bg-kokoro-accent text-kokoro-dark rounded hover:bg-kokoro-accent/80">
                      詳細
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SheltersPage;