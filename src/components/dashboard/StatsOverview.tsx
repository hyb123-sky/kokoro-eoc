// ============================================
// KOKORO EOC - Stats Overview Component
// ============================================

import React from 'react';
import {
  AlertTriangle,
  Users,
  Building2,
  Package,
  TrendingUp,
  TrendingDown,
  Activity,
} from 'lucide-react';
import { useDashboardData } from '../../hooks/useQueries';
import clsx from 'clsx';

// ============================================
// Stat Card Component
// ============================================
interface StatCardProps {
  icon: React.ElementType;
  label: string;
  value: number | string;
  trend?: number;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, label, value, trend, color }) => {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-kokoro-panel rounded-lg border border-kokoro-border">
      <div className={clsx('w-10 h-10 rounded-lg flex items-center justify-center', `bg-${color}/10`)}>
        <Icon className={clsx('w-5 h-5', `text-${color}`)} />
      </div>
      <div className="flex-1">
        <p className="text-xs text-kokoro-muted">{label}</p>
        <div className="flex items-center gap-2">
          <span className="text-xl font-display font-bold text-white">{value}</span>
          {trend !== undefined && (
            <span className={clsx(
              'flex items-center text-xs',
              trend >= 0 ? 'text-kokoro-success' : 'text-status-critical'
            )}>
              {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {Math.abs(trend)}%
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================
// Stats Overview Component
// ============================================
const StatsOverview: React.FC = () => {
  const { silentWishes, locations, inventories, volunteers } = useDashboardData();

  // Calculate stats from actual data
  const activeIncidents = silentWishes?.filter(w => !['完了', 'closed'].includes(w.state || '')).length || 0;
  const criticalIncidents = silentWishes?.filter(w => {
    const priority = parseInt(w.priority || '99');
    return priority <= 10;
  }).length || 0;
  
  const totalShelters = locations?.length || 0;
  const totalResources = inventories?.length || 0;
  const deployedVolunteers = volunteers?.filter(v => v.status === 'deployed').length || 0;

  const stats = [
    {
      icon: AlertTriangle,
      label: 'アクティブインシデント',
      value: activeIncidents,
      color: 'status-critical',
    },
    {
      icon: Activity,
      label: 'クリティカル',
      value: criticalIncidents,
      color: 'kokoro-warning',
    },
    {
      icon: Building2,
      label: '避難所',
      value: totalShelters,
      color: 'kokoro-info',
    },
    {
      icon: Package,
      label: 'リソース品目',
      value: totalResources,
      color: 'kokoro-success',
    },
    {
      icon: Users,
      label: '派遣中',
      value: deployedVolunteers,
      color: 'kokoro-accent',
    },
  ];

  return (
    <div className="shrink-0 px-4 py-3 border-b border-kokoro-border bg-kokoro-darker">
      <div className="flex items-center gap-4 overflow-x-auto">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>
    </div>
  );
};

export default StatsOverview;
