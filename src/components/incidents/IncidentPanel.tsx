// ============================================
// KOKORO EOC - Incident Panel Component
// ============================================

import React, { useState } from 'react';
import {
  AlertTriangle,
  Clock,
  MapPin,
  ChevronRight,
  RefreshCw,
  Filter,
} from 'lucide-react';
import { useDashboardData } from '../../hooks/useQueries';
import { useAppStore } from '../../stores';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import clsx from 'clsx';

// ============================================
// Priority Badge
// ============================================
const PriorityBadge: React.FC<{ priority: string }> = ({ priority }) => {
  const config: Record<string, { label: string; className: string }> = {
    '1': { label: 'P1', className: 'bg-status-critical text-white' },
    '2': { label: 'P2', className: 'bg-status-high text-white' },
    '3': { label: 'P3', className: 'bg-status-medium text-kokoro-dark' },
    '4': { label: 'P4', className: 'bg-status-low text-kokoro-dark' },
    '5': { label: 'P5', className: 'bg-kokoro-muted text-white' },
  };
  const { label, className } = config[priority] || config['5'];
  return (
    <span className={clsx('px-2 py-0.5 text-[10px] font-bold rounded', className)}>
      {label}
    </span>
  );
};

// ============================================
// Incident Card
// ============================================
interface IncidentCardProps {
  incident: {
    sys_id: string;
    number?: string;
    wish_content?: string;
    priority?: string;
    state?: string;
    sys_created_on?: string;
    latitude?: string;
    longitude?: string;
  };
  isSelected: boolean;
  onClick: () => void;
}

const IncidentCard: React.FC<IncidentCardProps> = ({ incident, isSelected, onClick }) => {
  const priority = (() => {
    const p = parseInt(incident.priority || '20');
    if (p <= 10) return '1';
    if (p <= 20) return '2';
    if (p <= 30) return '3';
    if (p <= 40) return '4';
    return '5';
  })();

  const title = incident.wish_content?.substring(0, 30) || '緊急SOS要請';

  return (
    <div
      onClick={onClick}
      className={clsx(
        'p-3 rounded-lg border cursor-pointer transition-all',
        isSelected
          ? 'border-kokoro-accent bg-kokoro-accent/10'
          : 'border-kokoro-border hover:border-kokoro-accent/50 bg-kokoro-darker'
      )}
    >
      <div className="flex items-start gap-3">
        <PriorityBadge priority={priority} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white line-clamp-1">{title}</p>
          <div className="flex items-center gap-3 mt-1.5 text-xs text-kokoro-muted">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {incident.sys_created_on
                ? formatDistanceToNow(new Date(incident.sys_created_on), {
                    addSuffix: true,
                    locale: ja,
                  })
                : '不明'}
            </span>
            {incident.latitude && incident.longitude && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                GPS
              </span>
            )}
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-kokoro-muted shrink-0" />
      </div>
    </div>
  );
};

// ============================================
// Main Incident Panel
// ============================================
const IncidentPanel: React.FC = () => {
  const { silentWishes, isLoading, refetch } = useDashboardData();
  const { selectedIncidentId, selectIncident } = useAppStore();
  const [filterPriority, setFilterPriority] = useState<string | null>(null);

  const incidents = React.useMemo(() => {
    if (!silentWishes) return [];
    let filtered = [...silentWishes];
    
    if (filterPriority) {
      filtered = filtered.filter(w => {
        const p = parseInt(w.priority || '20');
        if (filterPriority === '1') return p <= 10;
        if (filterPriority === '2') return p > 10 && p <= 20;
        if (filterPriority === '3') return p > 20 && p <= 30;
        return true;
      });
    }

    return filtered.sort((a, b) => {
      const pA = parseInt(a.priority || '99');
      const pB = parseInt(b.priority || '99');
      return pA - pB;
    });
  }, [silentWishes, filterPriority]);

  const stats = {
    total: silentWishes?.length || 0,
    critical: silentWishes?.filter(w => parseInt(w.priority || '99') <= 10).length || 0,
  };

  return (
    <div className="panel flex-1 flex flex-col overflow-hidden">
      <div className="panel-header">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-status-critical" />
          <span className="panel-title">緊急対応</span>
          <span className="text-xs text-kokoro-muted">({stats.total})</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="btn-icon text-kokoro-muted hover:text-kokoro-accent p-1"
            disabled={isLoading}
          >
            <RefreshCw className={clsx('w-4 h-4', isLoading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="px-3 py-2 border-b border-kokoro-border flex items-center gap-2">
        <Filter className="w-3 h-3 text-kokoro-muted" />
        {['1', '2', '3'].map(p => (
          <button
            key={p}
            onClick={() => setFilterPriority(filterPriority === p ? null : p)}
            className={clsx(
              'px-2 py-0.5 text-[10px] rounded transition-colors',
              filterPriority === p
                ? 'bg-kokoro-accent text-kokoro-dark'
                : 'bg-kokoro-darker text-kokoro-muted hover:text-white'
            )}
          >
            P{p}
          </button>
        ))}
      </div>

      <div className="panel-content flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-2 p-1">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton h-16 rounded-lg" />
            ))}
          </div>
        ) : incidents.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-kokoro-muted p-4">
            <AlertTriangle className="w-10 h-10 mb-3 opacity-50" />
            <p className="text-sm">現在アクティブなインシデントはありません</p>
          </div>
        ) : (
          <div className="space-y-2 p-1">
            {incidents.map(incident => (
              <IncidentCard
                key={incident.sys_id}
                incident={incident}
                isSelected={selectedIncidentId === incident.sys_id}
                onClick={() => selectIncident(incident.sys_id)}
              />
            ))}
          </div>
        )}
      </div>

      {stats.critical > 0 && (
        <div className="px-3 py-2 border-t border-kokoro-border bg-status-critical/10">
          <p className="text-xs text-status-critical font-medium">
            ⚠️ {stats.critical}件のクリティカル案件があります
          </p>
        </div>
      )}
    </div>
  );
};

export default IncidentPanel;
