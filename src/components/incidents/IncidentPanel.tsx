// ============================================
// KOKORO EOC - Incident Panel Component (Live Data + Modal)
// ============================================

import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Search,
  Filter,
  Plus,
  ChevronRight,
  Clock,
  MapPin,
  User,
  RefreshCw,
} from 'lucide-react';
import { useDashboardData } from '../../hooks/useQueries';
import { useAppStore, useMapStore } from '../../stores';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import clsx from 'clsx';
import IncidentDetailModal from './IncidentDetailModal';

// ============================================
// Types (Unified for UI)
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
// Priority Badge Component
// ============================================
const PriorityBadge: React.FC<{ priority: string }> = ({ priority }) => {
  const config: Record<string, { label: string; className: string }> = {
    '1': { label: 'P1', className: 'bg-status-critical text-white animate-pulse' },
    '2': { label: 'P2', className: 'bg-status-high text-white' },
    '3': { label: 'P3', className: 'bg-status-medium text-kokoro-dark' },
    '4': { label: 'P4', className: 'bg-status-low text-kokoro-dark' },
    '5': { label: 'P5', className: 'bg-kokoro-muted text-white' },
  };

  const { label, className } = config[priority] || config['5'];

  return (
    <span className={clsx('px-1.5 py-0.5 text-[10px] font-bold rounded', className)}>
      {label}
    </span>
  );
};

// ============================================
// State Badge Component
// ============================================
const StateBadge: React.FC<{ state: string }> = ({ state }) => {
  const config: Record<string, { label: string; className: string }> = {
    new: { label: '新規', className: 'bg-kokoro-info/20 text-kokoro-info' },
    '提出済み': { label: '提出済み', className: 'bg-kokoro-info/20 text-kokoro-info' },
    work_in_progress: { label: '対応中', className: 'bg-kokoro-warning/20 text-kokoro-warning' },
    '担当者決定': { label: '担当者決定', className: 'bg-kokoro-warning/20 text-kokoro-warning' },
    '配送中': { label: '配送中', className: 'bg-kokoro-accent/20 text-kokoro-accent' },
    resolved: { label: '解決', className: 'bg-kokoro-success/20 text-kokoro-success' },
    '完了': { label: '完了', className: 'bg-kokoro-success/20 text-kokoro-success' },
    closed: { label: '完了', className: 'bg-kokoro-muted/20 text-kokoro-muted' },
  };

  const { label, className } = config[state] || config['new'];

  return (
    <span className={clsx('px-2 py-0.5 text-[10px] font-medium rounded-full', className)}>
      {label}
    </span>
  );
};

// ============================================
// Incident Card Component
// ============================================
const IncidentCard: React.FC<{
  incident: UnifiedIncident;
  isSelected: boolean;
  onClick: () => void;
  onLocationClick: (e: React.MouseEvent) => void;
}> = ({ incident, isSelected, onClick, onLocationClick }) => {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'p-3 border-b border-kokoro-border cursor-pointer transition-all duration-200',
        'hover:bg-kokoro-border/30',
        isSelected && 'bg-kokoro-accent/10 border-l-2 border-l-kokoro-accent',
        incident.isSOS && 'border-l-2 border-l-status-critical bg-status-critical/5'
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <PriorityBadge priority={incident.priority} />
          <span className="font-mono text-xs text-kokoro-muted">{incident.number}</span>
          {incident.isSOS && (
            <span className="px-1.5 py-0.5 text-[9px] bg-status-critical text-white rounded">SOS</span>
          )}
        </div>
        <StateBadge state={incident.state} />
      </div>

      {/* Title */}
      <h3 className="text-sm font-medium text-white mb-2 line-clamp-2">
        {incident.short_description}
      </h3>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-kokoro-muted">
        <button
          onClick={onLocationClick}
          className={clsx(
            'flex items-center gap-1 transition-colors',
            incident.u_latitude ? 'hover:text-kokoro-accent' : 'opacity-50 cursor-not-allowed'
          )}
          disabled={!incident.u_latitude}
        >
          <MapPin className="w-3 h-3" />
          <span className="truncate max-w-[120px]">{incident.locationName}</span>
        </button>
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          <span>
            {formatDistanceToNow(new Date(incident.opened_at), {
              addSuffix: true,
              locale: ja,
            })}
          </span>
        </div>
        {incident.assigned_to && (
          <div className="flex items-center gap-1">
            <User className="w-3 h-3" />
            <span className="truncate max-w-[80px]">{incident.assigned_to}</span>
          </div>
        )}
      </div>

      {/* Affected Population */}
      {incident.u_affected_population && (
        <div className="mt-2 text-xs">
          <span className="text-kokoro-warning">
            影響人数: {incident.u_affected_population.toLocaleString()}人
          </span>
        </div>
      )}
    </div>
  );
};

// ============================================
// Main Incident Panel Component
// ============================================
const IncidentPanel: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<string | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<UnifiedIncident | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { selectIncident, selectedIncidentId } = useAppStore();
  const { flyTo } = useMapStore();
  
  // 接入真实的全局数据流
  const { silentWishes, isLoading, refetch } = useDashboardData();

  // 核心业务逻辑：纯净化 SOS 队列映射
  const unifiedIncidents = useMemo<UnifiedIncident[]>(() => {
    return (silentWishes || []).map(wish => {
      // 解析 wish_content 中的详细信息
      const parseWishContent = (content: string | undefined) => {
        if (!content) return {};
        const result: Record<string, string> = {};
        const patterns = [
          { key: 'location', regex: /【詳細場所】[：:]\s*([^\n【]+)/ },
          { key: 'category', regex: /【支援種別】[：:]\s*([^\n【]+)/ },
          { key: 'urgency', regex: /【緊急度】[：:]\s*([^\n【]+)/ },
          { key: 'count', regex: /【対象人数】[：:]\s*([^\n【]+)/ },
          { key: 'notes', regex: /【備考】[：:]\s*([^\n【]+)/ },
        ];
        patterns.forEach(({ key, regex }) => {
          const match = content.match(regex);
          if (match) result[key] = match[1].trim();
        });
        return result;
      };

      const parsed = parseWishContent(wish.wish_content);
      
      // 映射优先级
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
        u_affected_population: parsed.count ? parseInt(parsed.count) || undefined : undefined,
        contact_info: wish.contact_info,
        wish_content: wish.wish_content,
        shelter_zone: wish.shelter_zone,
        urgency: parsed.urgency,
        isSOS: true,
      };
    }).sort((a, b) => {
      // 未完了を優先
      const aCompleted = ['完了', 'resolved', 'closed'].includes(a.state);
      const bCompleted = ['完了', 'resolved', 'closed'].includes(b.state);
      if (aCompleted !== bCompleted) return aCompleted ? 1 : -1;
      
      // 優先度高い順
      return parseInt(a.priority) - parseInt(b.priority);
    });
  }, [silentWishes]);

  // Filter incidents
  const filteredIncidents = useMemo(() => {
    return unifiedIncidents.filter((incident) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          incident.short_description.toLowerCase().includes(query) ||
          incident.number.toLowerCase().includes(query) ||
          incident.locationName.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }
      
      // Priority filter
      if (filterPriority && incident.priority !== filterPriority) {
        return false;
      }
      
      return true;
    });
  }, [unifiedIncidents, searchQuery, filterPriority]);

  // Stats
  const stats = useMemo(() => {
    return {
      total: unifiedIncidents.length,
      critical: unifiedIncidents.filter((i) => i.priority === '1').length,
      active: unifiedIncidents.filter((i) => 
        !['完了', 'resolved', 'closed'].includes(i.state)
      ).length,
    };
  }, [unifiedIncidents]);

  // Handlers
  const handleIncidentClick = (incident: UnifiedIncident) => {
    setSelectedIncident(incident);
    setIsModalOpen(true);
    selectIncident(incident.sys_id);
  };

  const handleLocationClick = (e: React.MouseEvent, incident: UnifiedIncident) => {
    e.stopPropagation();
    if (incident.u_latitude && incident.u_longitude) {
      flyTo(incident.u_latitude, incident.u_longitude, 15);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedIncident(null);
  };

  const handleDataUpdate = () => {
    refetch();
  };

  return (
    <>
      <div className="panel flex-1 flex flex-col overflow-hidden min-h-0">
        {/* Header */}
        <div className="panel-header">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-kokoro-accent" />
            <span className="panel-title">インシデント</span>
            <span className="ml-2 px-2 py-0.5 text-xs font-mono bg-kokoro-darker rounded text-kokoro-muted">
              {stats.active}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {stats.critical > 0 && (
              <span className="px-2 py-0.5 text-xs font-bold bg-status-critical text-white rounded animate-pulse">
                {stats.critical} 緊急
              </span>
            )}
            <button 
              onClick={() => refetch()}
              className="btn-icon text-kokoro-muted hover:text-kokoro-accent p-1"
              title="データを更新"
            >
              <RefreshCw className={clsx('w-4 h-4', isLoading && 'animate-spin')} />
            </button>
            <button className="btn-icon text-kokoro-muted hover:text-kokoro-accent p-1">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="px-3 py-2 border-b border-kokoro-border space-y-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-kokoro-muted" />
            <input
              type="text"
              placeholder="検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input input-search text-sm py-1.5 pl-8"
            />
          </div>
          
          {/* Priority Filter Pills */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-kokoro-muted" />
            {['1', '2', '3'].map((p) => (
              <button
                key={p}
                onClick={() => setFilterPriority(filterPriority === p ? null : p)}
                className={clsx(
                  'px-2 py-0.5 text-xs rounded transition-colors',
                  filterPriority === p
                    ? 'bg-kokoro-accent text-kokoro-dark'
                    : 'bg-kokoro-darker text-kokoro-muted hover:text-white'
                )}
              >
                P{p}
              </button>
            ))}
            {filterPriority && (
              <button
                onClick={() => setFilterPriority(null)}
                className="text-xs text-kokoro-muted hover:text-white ml-1"
              >
                クリア
              </button>
            )}
          </div>
        </div>

        {/* Incident List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="skeleton h-24" />
              ))}
            </div>
          ) : filteredIncidents.length === 0 ? (
            <div className="p-8 text-center text-kokoro-muted">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">インシデントが見つかりません</p>
            </div>
          ) : (
            filteredIncidents.map((incident) => (
              <IncidentCard
                key={incident.sys_id}
                incident={incident}
                isSelected={incident.sys_id === selectedIncidentId}
                onClick={() => handleIncidentClick(incident)}
                onLocationClick={(e) => handleLocationClick(e, incident)}
              />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-3 py-2 border-t border-kokoro-border flex items-center justify-between">
          <span className="text-xs text-kokoro-muted">
            {filteredIncidents.length} / {stats.total} 件表示
          </span>
          <button className="text-xs text-kokoro-accent hover:underline flex items-center gap-1">
            すべて表示
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Detail Modal */}
      <IncidentDetailModal
        incident={selectedIncident}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onUpdate={handleDataUpdate}
      />
    </>
  );
};

export default IncidentPanel;
