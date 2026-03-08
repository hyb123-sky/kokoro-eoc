// ============================================
// KOKORO EOC - Stats Overview Bar
// ============================================

import React from 'react';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Truck,
  Users,
  Building2,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { useGlobalStats } from '../../hooks/useQueries';
import clsx from 'clsx';

// ============================================
// Types
// ============================================
interface StatItemProps {
  label: string;
  value: number | string;
  icon: React.ElementType;
  trend?: number;
  color?: string;
  bgColor?: string;
}

// ============================================
// Stat Item Component
// ============================================
const StatItem: React.FC<StatItemProps> = ({
  label,
  value,
  icon: Icon,
  trend,
  color = 'text-kokoro-accent',
  bgColor = 'bg-kokoro-accent/10',
}) => {
  const getTrendIcon = () => {
    if (trend === undefined) return null;
    if (trend > 0) return <TrendingUp className="w-3 h-3 text-status-critical" />;
    if (trend < 0) return <TrendingDown className="w-3 h-3 text-kokoro-success" />;
    return <Minus className="w-3 h-3 text-kokoro-muted" />;
  };

  return (
    <div className="flex items-center gap-3 px-4 py-2">
      <div className={clsx('w-10 h-10 rounded-lg flex items-center justify-center', bgColor)}>
        <Icon className={clsx('w-5 h-5', color)} />
      </div>
      <div>
        <div className="flex items-center gap-2">
          <span className={clsx('font-display font-bold text-xl', color)}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </span>
          {getTrendIcon()}
        </div>
        <span className="text-xs text-kokoro-muted">{label}</span>
      </div>
    </div>
  );
};

// ============================================
// Main Stats Overview Component
// ============================================
const StatsOverview: React.FC = () => {
  const { data: stats, isLoading, isError } = useGlobalStats();

  // 实时数据映射，提供加载期与容错默认值
  const currentStats = {
    active_incidents: stats?.active_incidents ?? 0,
    critical_incidents: stats?.critical_incidents ?? 0,
    resolved_today: stats?.resolved_today ?? 0,
    deployed_resources: stats?.deployed_resources ?? 0,
    active_personnel: stats?.active_personnel ?? 0,
    sheltered_population: stats?.sheltered_population ?? 0,
    response_time_avg: stats?.response_time_avg ?? 0,
  };

  return (
    <div className="h-16 bg-kokoro-panel border-b border-kokoro-border flex items-center justify-between px-2 shrink-0">
      <div className="flex items-center divide-x divide-kokoro-border">
        <StatItem
          label="アクティブ"
          value={currentStats.active_incidents}
          icon={AlertTriangle}
          trend={2}
          color="text-status-critical"
          bgColor="bg-status-critical/10"
        />
        <StatItem
          label="クリティカル"
          value={currentStats.critical_incidents}
          icon={AlertTriangle}
          color="text-status-high"
          bgColor="bg-status-high/10"
        />
        <StatItem
          label="本日解決"
          value={currentStats.resolved_today}
          icon={CheckCircle}
          trend={-3}
          color="text-kokoro-success"
          bgColor="bg-kokoro-success/10"
        />
        <StatItem
          label="派遣中"
          value={currentStats.deployed_resources}
          icon={Truck}
          color="text-kokoro-info"
          bgColor="bg-kokoro-info/10"
        />
        <StatItem
          label="活動中人員"
          value={currentStats.active_personnel}
          icon={Users}
          color="text-kokoro-accent"
          bgColor="bg-kokoro-accent/10"
        />
        <StatItem
          label="避難者数"
          value={currentStats.sheltered_population}
          icon={Building2}
          color="text-kokoro-warning"
          bgColor="bg-kokoro-warning/10"
        />
        <StatItem
          label="平均対応時間"
          value={`${currentStats.response_time_avg}分`}
          icon={Clock}
          color="text-kokoro-accent"
          bgColor="bg-kokoro-accent/10"
        />
      </div>

      {/* Last Updated */}
      <div className="text-xs text-kokoro-muted font-mono pr-4 flex items-center">
        <span className={clsx("inline-block w-2 h-2 rounded-full mr-2", isLoading ? "bg-kokoro-warning animate-pulse" : isError ? "bg-status-critical" : "bg-kokoro-success animate-pulse")} />
        {isLoading ? 'データ取得中...' : isError ? '接続エラー' : 'リアルタイム更新中'}
      </div>
    </div>
  );
};

export default StatsOverview;
