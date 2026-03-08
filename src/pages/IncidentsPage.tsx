// ============================================
// KOKORO EOC - Incidents Page
// ============================================
// インシデント管理ページ（フルスクリーン）

import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  AlertTriangle,
  Search,
  Filter,
  Plus,
  RefreshCw,
  ChevronRight,
  Clock,
  MapPin,
  User,
  Grid,
  List,
} from 'lucide-react';
import { useDashboardData } from '../hooks/useQueries';
import { useMapStore } from '../stores';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import clsx from 'clsx';
import IncidentDetailModal from '../components/incidents/IncidentDetailModal';

// ============================================
// Types
// ============================================
interface UnifiedIncident {
  sys_id: string;
  number: string;
  short_description: string;
  description?: string;
  priority: string;
  state: string;
  locationName: string;
  assigned_to?: string;
  assignment_group?: string;
  opened_at: string;
  updated_at?: string;
  u_latitude?: number;
  u_longitude?: number;
  u_affected_population?: number;
  contact_info?: string;
  wish_content?: string;
  shelter_zone?: string;
  urgency?: string;
  isSOS?: boolean;
}

// ============================================
// Priority Badge
// ============================================
const PriorityBadge: React.FC<{ priority: string }> = ({ priority }) => {
  const config: Record<string, { label: string; className: string }> = {
    '1': { label: 'P1 緊急', className: 'bg-status-critical text-white' },
    '2': { label: 'P2 高', className: 'bg-status-high text-white' },
    '3': { label: 'P3 中', className: 'bg-status-medium text-kokoro-dark' },
    '4': { label: 'P4 低', className: 'bg-status-low text-kokoro-dark' },
    '5': { label: 'P5', className: 'bg-kokoro-muted text-white' },
  };
  const { label, className } = config[priority] || config['5'];
  return <span className={clsx('px-2 py-1 text-xs font-bold rounded', className)}>{label}</span>;
};

// ============================================
// State Badge
// ============================================
const StateBadge: React.FC<{ state: string }> = ({ state }) => {
  const config: Record<string, { label: string; className: string }> = {
    new: { label: '新規', className: 'bg-kokoro-info/20 text-kokoro-info' },
    '提出済み': { label: '提出済み', className: 'bg-kokoro-info/20 text-kokoro-info' },
    '担当者決定': { label: '担当者決定', className: 'bg-kokoro-warning/20 text-kokoro-warning' },
    '配送中': { label: '配送中', className: 'bg-kokoro-accent/20 text-kokoro-accent' },
    '完了': { label: '完了', className: 'bg-kokoro-success/20 text-kokoro-success' },
  };
  const { label, className } = config[state] || config['new'];
  return <span className={clsx('px-2 py-1 text-xs font-medium rounded-full', className)}>{label}</span>;
};

// ============================================
// Incident Table Row
// ============================================
const IncidentTableRow: React.FC<{
  incident: UnifiedIncident;
  onClick: () => void;
}> = ({ incident, onClick }) => {
  const { flyTo } = useMapStore();

  const handleLocationClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (incident.u_latitude && incident.u_longitude) {
      flyTo(incident.u_latitude, incident.u_longitude, 15);
    }
  };

  return (
    <tr
      onClick={onClick}
      className="border-b border-kokoro-border hover:bg-kokoro-border/30 cursor-pointer transition-colors"
    >
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <PriorityBadge priority={incident.priority} />
          {incident.isSOS && (
            <span className="px-1.5 py-0.5 text-[9px] bg-status-critical text-white rounded">SOS</span>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="font-mono text-sm text-kokoro-accent">{incident.number}</span>
      </td>
      <td className="px-4 py-3">
        <p className="text-sm text-white line-clamp-1">{incident.short_description}</p>
      </td>
      <td className="px-4 py-3">
        <StateBadge state={incident.state} />
      </td>
      <td className="px-4 py-3">
        <button
          onClick={handleLocationClick}
          className={clsx(
            'flex items-center gap-1 text-xs',
            incident.u_latitude ? 'text-kokoro-muted hover:text-kokoro-accent' : 'text-kokoro-muted/50'
          )}
        >
          <MapPin className="w-3 h-3" />
          <span className="truncate max-w-[100px]">{incident.locationName}</span>
        </button>
      </td>
      <td className="px-4 py-3">
        <span className="text-xs text-kokoro-muted">
          {incident.assigned_to || '未割当'}
        </span>
      </td>
      <td className="px-4 py-3">
        <span className="text-xs text-kokoro-muted">
          {formatDistanceToNow(new Date(incident.opened_at), { addSuffix: true, locale: ja })}
        </span>
      </td>
      <td className="px-4 py-3">
        <ChevronRight className="w-4 h-4 text-kokoro-muted" />
      </td>
    </tr>
  );
};

// ============================================
// Main Incidents Page
// ============================================
const IncidentsPage: React.FC = () => {
  const { id } = useParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<string | null>(null);
  const [filterState, setFilterState] = useState<string | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<UnifiedIncident | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  const { silentWishes, isLoading, refetch } = useDashboardData();

  // Transform data
  const incidents = useMemo<UnifiedIncident[]>(() => {
    return (silentWishes || []).map(wish => {
      const parseWishContent = (content: string | undefined) => {
        if (!content) return {};
        const result: Record<string, string> = {};
        const patterns = [
          { key: 'location', regex: /【詳細場所】[：:]\s*([^\n【]+)/ },
          { key: 'category', regex: /【支援種別】[：:]\s*([^\n【]+)/ },
          { key: 'urgency', regex: /【緊急度】[：:]\s*([^\n【]+)/ },
          { key: 'count', regex: /【対象人数】[：:]\s*([^\n【]+)/ },
        ];
        patterns.forEach(({ key, regex }) => {
          const match = content.match(regex);
          if (match) result[key] = match[1].trim();
        });
        return result;
      };

      const parsed = parseWishContent(wish.wish_content);
      
      const mapPriority = (p: string | undefined): string => {
        if (!p) return '2';
        const num = parseInt(p);
        if (!isNaN(num)) {
          if (num <= 10) return '1';
          if (num <= 20) return '2';
          if (num <= 30) return '3';
          if (num <= 40) return '4';
          return '5';
        }
        return '2';
      };

      return {
        sys_id: wish.sys_id,
        number: wish.number || `SIL-${wish.sys_id.slice(-6).toUpperCase()}`,
        short_description: parsed.category 
          ? `【${parsed.category}】${parsed.location || '場所未定'}`
          : wish.wish_content?.substring(0, 50) || '緊急SOS要請',
        description: wish.wish_content,
        priority: mapPriority(wish.priority),
        state: wish.state || 'new',
        locationName: parsed.location || (wish.latitude && wish.longitude 
          ? `${parseFloat(wish.latitude).toFixed(4)}, ${parseFloat(wish.longitude).toFixed(4)}`
          : '場所未定'),
        assigned_to: wish.assigned_to?.display_value,
        assignment_group: wish.assignment_group?.display_value,
        opened_at: wish.sys_created_on || new Date().toISOString(),
        updated_at: wish.sys_updated_on,
        u_latitude: wish.latitude ? parseFloat(wish.latitude) : undefined,
        u_longitude: wish.longitude ? parseFloat(wish.longitude) : undefined,
        wish_content: wish.wish_content,
        shelter_zone: wish.shelter_zone,
        isSOS: true,
      };
    }).sort((a, b) => parseInt(a.priority) - parseInt(b.priority));
  }, [silentWishes]);

  // Filter incidents
  const filteredIncidents = useMemo(() => {
    return incidents.filter(inc => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!inc.short_description.toLowerCase().includes(q) &&
            !inc.number.toLowerCase().includes(q)) return false;
      }
      if (filterPriority && inc.priority !== filterPriority) return false;
      if (filterState && inc.state !== filterState) return false;
      return true;
    });
  }, [incidents, searchQuery, filterPriority, filterState]);

  // Stats
  const stats = {
    total: incidents.length,
    critical: incidents.filter(i => i.priority === '1').length,
    active: incidents.filter(i => !['完了', 'closed'].includes(i.state)).length,
    resolved: incidents.filter(i => ['完了', 'closed'].includes(i.state)).length,
  };

  const handleIncidentClick = (incident: UnifiedIncident) => {
    setSelectedIncident(incident);
    setIsModalOpen(true);
  };

  return (
    <div className="h-full flex flex-col bg-kokoro-dark">
      {/* Header */}
      <div className="shrink-0 px-6 py-4 border-b border-kokoro-border bg-kokoro-panel">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-kokoro-accent" />
            <h1 className="text-xl font-display font-bold text-white">インシデント管理</h1>
            <span className="px-3 py-1 text-sm font-mono bg-kokoro-darker rounded text-kokoro-muted">
              {stats.total} 件
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
              新規作成
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="flex items-center gap-6 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-status-critical" />
            <span className="text-sm text-kokoro-muted">緊急: <span className="text-white font-bold">{stats.critical}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-kokoro-warning" />
            <span className="text-sm text-kokoro-muted">対応中: <span className="text-white font-bold">{stats.active}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-kokoro-success" />
            <span className="text-sm text-kokoro-muted">解決済: <span className="text-white font-bold">{stats.resolved}</span></span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-kokoro-muted" />
            <input
              type="text"
              placeholder="インシデントを検索..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-kokoro-darker border border-kokoro-border rounded-lg text-white placeholder-kokoro-muted focus:outline-none focus:border-kokoro-accent"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-kokoro-muted" />
            {['1', '2', '3'].map(p => (
              <button
                key={p}
                onClick={() => setFilterPriority(filterPriority === p ? null : p)}
                className={clsx(
                  'px-3 py-1.5 text-xs rounded-lg transition-colors',
                  filterPriority === p
                    ? 'bg-kokoro-accent text-kokoro-dark'
                    : 'bg-kokoro-darker text-kokoro-muted hover:text-white'
                )}
              >
                P{p}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 ml-auto">
            <button
              onClick={() => setViewMode('table')}
              className={clsx(
                'p-2 rounded-lg',
                viewMode === 'table' ? 'bg-kokoro-accent text-kokoro-dark' : 'text-kokoro-muted hover:text-white'
              )}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={clsx(
                'p-2 rounded-lg',
                viewMode === 'grid' ? 'bg-kokoro-accent text-kokoro-dark' : 'text-kokoro-muted hover:text-white'
              )}
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-4 border-kokoro-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-kokoro-muted">読み込み中...</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-kokoro-darker sticky top-0">
              <tr className="text-left text-xs text-kokoro-muted uppercase">
                <th className="px-4 py-3">優先度</th>
                <th className="px-4 py-3">番号</th>
                <th className="px-4 py-3">説明</th>
                <th className="px-4 py-3">ステータス</th>
                <th className="px-4 py-3">場所</th>
                <th className="px-4 py-3">担当者</th>
                <th className="px-4 py-3">作成日時</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filteredIncidents.map(incident => (
                <IncidentTableRow
                  key={incident.sys_id}
                  incident={incident}
                  onClick={() => handleIncidentClick(incident)}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail Modal */}
      <IncidentDetailModal
        incident={selectedIncident}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpdate={refetch}
      />
    </div>
  );
};

export default IncidentsPage;
