// ============================================
// KOKORO EOC - Incident Panel Component (FIXED)
// ============================================
// 修正点:
// 1. Priority 映射修复: API 返回 "1"/"2"/"3"(数字字符串), 直接映射到 P1/P2/P3
// 2. 支持无GPS的工单也显示在列表中
// 3. 修复 debug log

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
import { useAppStore, useMapStore } from '../../stores';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import clsx from 'clsx';
import IncidentDetailModal from './IncidentDetailModal';

// ============================================
// Priority Mapper (FIXED)
// ============================================
// silent_wish 表的 priority choice field:
//   Value "1" = High (限界/今すぐ)
//   Value "2" = Medium (普通)
//   Value "3" = Low (急ぎません)
// 因为 displayValue: false, API 返回的是 "1"/"2"/"3"
// 映射到 EOC 的 5 级系统: 1→P1, 2→P3, 3→P5
const getPriorityLevel = (priority: string | number | undefined): string => {
  if (!priority) return '5';
  
  const p = String(priority).trim();
  
  // 直接匹配数字值
  switch (p) {
    case '1': return '1'; // High → P1 (緊急/赤色)
    case '2': return '3'; // Medium → P3 (中/黄色)
    case '3': return '5'; // Low → P5 (計画/灰色)
    default: break;
  }
  
  // Fallback: 尝试解析为数字
  const num = parseInt(p);
  if (!isNaN(num)) {
    if (num <= 1) return '1';
    if (num <= 2) return '2';
    if (num <= 3) return '3';
    if (num <= 4) return '4';
    return '5';
  }
  
  // Fallback: 日文文本匹配 (以防 displayValue 被改回 true)
  if (p.includes('限界') || p.includes('今すぐ') || p.includes('High') || p.includes('高')) return '1';
  if (p.includes('普通') || p.includes('Medium') || p.includes('中')) return '3';
  if (p.includes('急ぎません') || p.includes('Low') || p.includes('低')) return '5';
  
  return '5';
};

// ============================================
// Priority Badge
// ============================================
const PriorityBadge: React.FC<{ priority: string | number | undefined }> = ({ priority }) => {
  const level = getPriorityLevel(priority);
  
  const config: Record<string, { label: string; className: string }> = {
    '1': { label: 'P1', className: 'bg-status-critical text-white animate-pulse' },
    '2': { label: 'P2', className: 'bg-status-high text-white' },
    '3': { label: 'P3', className: 'bg-status-medium text-kokoro-dark' },
    '4': { label: 'P4', className: 'bg-status-low text-kokoro-dark' },
    '5': { label: 'P5', className: 'bg-kokoro-muted text-white' },
  };
  
  const { label, className } = config[level] || config['5'];
  
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
    priority?: string | number;
    state?: string;
    sys_created_on?: string;
    latitude?: string;
    longitude?: string;
  };
  isSelected: boolean;
  onClick: () => void;
}

const IncidentCard: React.FC<IncidentCardProps> = ({ incident, isSelected, onClick }) => {
  const title = incident.wish_content?.substring(0, 30) || '緊急SOS要請';
  const hasGPS = incident.latitude && incident.longitude;

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
        <PriorityBadge priority={incident.priority} />
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
                : '時間不明'}
            </span>
            {hasGPS ? (
              <span className="flex items-center gap-1 text-kokoro-success">
                <MapPin className="w-3 h-3" />
                GPS
              </span>
            ) : (
              <span className="flex items-center gap-1 text-kokoro-muted/50">
                <MapPin className="w-3 h-3" />
                GPS無
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
  const { flyTo } = useMapStore();
  const [filterPriority, setFilterPriority] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<any>(null);

  const incidents = React.useMemo(() => {
    if (!silentWishes) return [];
    let filtered = [...silentWishes];

    if (filterPriority) {
      filtered = filtered.filter(w => {
        const level = getPriorityLevel(w.priority);
        return level === filterPriority;
      });
    }

    // Sort by priority (lower = more urgent)
    return filtered.sort((a, b) => {
      const pA = parseInt(getPriorityLevel(a.priority));
      const pB = parseInt(getPriorityLevel(b.priority));
      return pA - pB;
    });
  }, [silentWishes, filterPriority]);

  const stats = {
    total: silentWishes?.length || 0,
    critical: silentWishes?.filter(w => getPriorityLevel(w.priority) === '1').length || 0,
    withGPS: silentWishes?.filter(w => w.latitude && w.longitude).length || 0,
  };

  const handleIncidentClick = (incident: any) => {
    selectIncident(incident.sys_id);
    
    const modalData = {
      sys_id: incident.sys_id,
      number: incident.number || `SOS-${incident.sys_id.slice(-6).toUpperCase()}`,
      short_description: incident.wish_content?.substring(0, 50) || '緊急SOS要請',
      description: incident.wish_content,
      priority: getPriorityLevel(incident.priority),
      state: incident.state || 'new',
      locationName: incident.latitude && incident.longitude
        ? `${parseFloat(incident.latitude).toFixed(4)}, ${parseFloat(incident.longitude).toFixed(4)}`
        : '位置未定',
      assigned_to: typeof incident.assigned_to === 'object' 
        ? incident.assigned_to?.display_value 
        : incident.assigned_to,
      assignment_group: typeof incident.assignment_group === 'object'
        ? incident.assignment_group?.display_value
        : incident.assignment_group,
      opened_at: incident.sys_created_on || new Date().toISOString(),
      updated_at: incident.sys_updated_on,
      u_latitude: incident.latitude ? parseFloat(incident.latitude) : undefined,
      u_longitude: incident.longitude ? parseFloat(incident.longitude) : undefined,
      wish_content: incident.wish_content,
      shelter_zone: incident.shelter_zone,
      contact_info: incident.contact_info,
      isSOS: true,
    };
    
    setSelectedIncident(modalData);
    setIsModalOpen(true);

    // Fly to location if GPS available
    if (incident.latitude && incident.longitude) {
      flyTo(parseFloat(incident.latitude), parseFloat(incident.longitude), 15);
    }
  };

  return (
    <>
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
          {['1', '2', '3', '4', '5'].map(p => (
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

        {/* Stats Bar */}
        <div className="px-3 py-1.5 border-b border-kokoro-border bg-kokoro-darker/50 flex items-center gap-4 text-[10px]">
          <span className="text-kokoro-muted">
            GPS有効: <span className="text-kokoro-success font-medium">{stats.withGPS}</span>
          </span>
          <span className="text-kokoro-muted">
            P1緊急: <span className="text-status-critical font-medium">{stats.critical}</span>
          </span>
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
                  onClick={() => handleIncidentClick(incident)}
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

      {/* Incident Detail Modal */}
      <IncidentDetailModal
        incident={selectedIncident}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedIncident(null);
        }}
        onUpdate={refetch}
      />
    </>
  );
};

export default IncidentPanel;
